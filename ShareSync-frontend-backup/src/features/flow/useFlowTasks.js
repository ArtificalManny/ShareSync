// src/features/flow/useFlowTasks.js
// ═══════════════════════════════════════════════════════════════════════════════
// useFlowTasks - data + realtime sync + optimistic move w/ rollback
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchKanbanBoard, moveTask as moveTaskApi } from "../../api/taskApi";
import { useSocketEvent } from "../../context/SocketContext";

// Canonical statuses used by backend schema
export const FLOW_STATUSES = ["backlog", "todo", "in_progress", "review", "done"];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeBoard(board) {
  const safe = {};
  for (const s of FLOW_STATUSES) safe[s] = Array.isArray(board?.[s]) ? board[s] : [];
  return safe;
}

function upsertTaskInBoard(board, task) {
  if (!task) return board;
  const taskId = task.id || task._id;
  if (!taskId) return board;

  const status = task.status;
  const next = deepClone(board);

  // Remove from all columns
  for (const s of FLOW_STATUSES) {
    next[s] = (next[s] || []).filter((t) => (t.id || t._id) !== taskId);
  }

  // Insert into its status column
  if (FLOW_STATUSES.includes(status)) {
    next[status] = [...(next[status] || []), task];
    // Sort by order if present
    next[status].sort((a, b) => {
      const ao = typeof a.order === "number" ? a.order : 999999;
      const bo = typeof b.order === "number" ? b.order : 999999;
      return ao - bo;
    });
  }

  return next;
}

function removeTaskFromBoard(board, tombstone) {
  const id = tombstone?.id || tombstone?._id;
  if (!id) return board;
  const next = deepClone(board);
  for (const s of FLOW_STATUSES) {
    next[s] = (next[s] || []).filter((t) => (t.id || t._id) !== id);
  }
  return next;
}

/**
 * Compute an "order" value for drop.
 * v1: place at end (safest). You can upgrade later to index-based ordering.
 */
function computeDropOrder(columnTasks) {
  if (!Array.isArray(columnTasks) || columnTasks.length === 0) return 0;
  const max = Math.max(
    ...columnTasks.map((t) => (typeof t.order === "number" ? t.order : 0))
  );
  return max + 1;
}

export default function useFlowTasks({ projectId, sprintId } = {}) {
  const [board, setBoard] = useState(() => normalizeBoard({}));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // keep last "good" snapshot for rollback
  const rollbackRef = useRef(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchKanbanBoard({ projectId, sprintId });
      setBoard(normalizeBoard(data));
    } catch (e) {
      setError(e?.message || "Failed to load Flow board.");
    } finally {
      setLoading(false);
    }
  }, [projectId, sprintId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime sync: backend emits taskUpdated in project room
  useSocketEvent("taskUpdated", (payload) => {
    // payload may be snapshot or tombstone
    if (!payload) return;

    // Ignore updates from other projects if we can
    const pid = payload.projectId || payload.project?.id || payload.project?._id;
    if (projectId && pid && String(pid) !== String(projectId)) return;

    if (payload.deleted) {
      setBoard((prev) => removeTaskFromBoard(prev, payload));
      return;
    }

    setBoard((prev) => upsertTaskInBoard(prev, payload));
  });

  const moveTaskOptimistic = useCallback(
    async ({ taskId, toStatus } = {}) => {
      if (!taskId || !toStatus) return;

      // find current task in board
      const current = (() => {
        for (const s of FLOW_STATUSES) {
          const found = (board[s] || []).find((t) => (t.id || t._id) === taskId);
          if (found) return found;
        }
        return null;
      })();

      if (!current) return;

      const fromStatus = current.status;
      if (fromStatus === toStatus) return;

      // Snapshot for rollback
      rollbackRef.current = deepClone(board);

      // Optimistic update: move to end of target column
      const nextOrder = computeDropOrder(board[toStatus] || []);
      const optimisticTask = { ...current, status: toStatus, order: nextOrder };

      setBoard((prev) => {
        const removed = removeTaskFromBoard(prev, { id: taskId });
        return upsertTaskInBoard(removed, optimisticTask);
      });

      try {
        // server is source of truth; it will emit taskUpdated too
        await moveTaskApi(taskId, { status: toStatus, order: nextOrder, sprintId });
      } catch (e) {
        // Rollback hard if failure
        const snap = rollbackRef.current;
        if (snap) setBoard(normalizeBoard(snap));
        rollbackRef.current = null;
        throw e;
      }
    },
    [board, sprintId]
  );

  const tasksFlat = useMemo(() => {
    const all = [];
    for (const s of FLOW_STATUSES) all.push(...(board[s] || []));
    return all;
  }, [board]);

  return {
    board,
    tasksFlat,
    loading,
    error,
    reload: load,
    moveTaskOptimistic,
  };
}
