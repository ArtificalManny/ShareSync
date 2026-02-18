// src/features/stack/useStackTasks.js
// ═══════════════════════════════════════════════════════════════════════════════
// useStackTasks
// - Fetches top "stack" tasks for a project (GET /tasks/stack)
// - Optional realtime patching if a socket with .on/.off is provided
// - Returns { tasks, loading, error, refresh, setTasks }
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchStackTasks } from "../../api/taskApi";

function getTaskId(task) {
  return task?.id || task?._id || "";
}

function normalizeStatus(status) {
  const s = String(status || "").toLowerCase();
  // handle common variants
  if (s === "inprogress") return "in_progress";
  if (s === "in-progress") return "in_progress";
  return s;
}

function priRank(p) {
  const v = (p || "").toString().toLowerCase();
  if (v === "critical") return 4;
  if (v === "high") return 3;
  if (v === "medium") return 2;
  if (v === "low") return 1;
  if (typeof p === "number") return p;
  return 0;
}

function sortLikeBackend(list) {
  return [...(list || [])].sort((a, b) => {
    const pa = priRank(a?.priority);
    const pb = priRank(b?.priority);
    if (pb !== pa) return pb - pa;

    const ba = a?.isBlocking ? 1 : 0;
    const bb = b?.isBlocking ? 1 : 0;
    if (bb !== ba) return bb - ba;

    const sa = typeof a?.stackOrder === "number" ? a.stackOrder : 999999;
    const sb = typeof b?.stackOrder === "number" ? b.stackOrder : 999999;
    if (sa !== sb) return sa - sb;

    const da = a?.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
    const db = b?.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
    return da - db;
  });
}

function isInStack(task) {
  const s = normalizeStatus(task?.status);
  return s === "todo" || s === "in_progress";
}

export function useStackTasks({
  projectId,
  assigneeId,
  limit = 10,
  socket = null,
  enabled = true,
} = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);

  const paramsKey = useMemo(() => {
    return JSON.stringify({
      projectId: projectId || "",
      assigneeId: assigneeId || "",
      limit: Number(limit) || 10,
      enabled: !!enabled,
    });
  }, [projectId, assigneeId, limit, enabled]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (!projectId) {
      setTasks([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchStackTasks({ projectId, assigneeId, limit });

      const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const filtered = list.filter(isInStack);
      const sorted = sortLikeBackend(filtered);

      if (mountedRef.current) setTasks(sorted);
    } catch (e) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled, projectId, assigneeId, limit]);

  // Initial fetch (and when params change)
  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Optional socket patching: expects socket.on / socket.off
  useEffect(() => {
    if (!socket || !socket.on || !socket.off) return;
    if (!enabled) return;

    const onTaskUpdated = (payload) => {
      // If payload includes projectId, ignore other projects
      const payloadProjectId = payload?.projectId?.toString?.() || payload?.projectId;
      if (payloadProjectId && projectId && payloadProjectId !== projectId) return;

      const incoming = payload?.task || payload?.data || payload;
      const incomingId = getTaskId(incoming);
      if (!incomingId) return;

      setTasks((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        const idx = list.findIndex((t) => getTaskId(t) === incomingId);

        // If task no longer in stack -> remove if exists
        if (!isInStack(incoming)) {
          if (idx >= 0) list.splice(idx, 1);
          return sortLikeBackend(list);
        }

        // If in stack -> upsert
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...incoming };
        } else {
          list.push(incoming);
        }
        return sortLikeBackend(list);
      });
    };

    socket.on("taskUpdated", onTaskUpdated);
    socket.on("task:update", onTaskUpdated);

    return () => {
      socket.off("taskUpdated", onTaskUpdated);
      socket.off("task:update", onTaskUpdated);
    };
  }, [socket, enabled, projectId]);

  return { tasks, loading, error, refresh, setTasks };
}
