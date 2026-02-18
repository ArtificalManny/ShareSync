// src/features/stack/useStackTasks.js
// ═══════════════════════════════════════════════════════════════════════════════
// useStackTasks
// - Fetches priority stack tasks for a project
// - Uses fetchStackTasks (GET /tasks/stack)
// - Optional realtime patching if a socket with .on/.off is provided
// - Safe defaults, minimal assumptions
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchStackTasks } from "../../api/taskApi";

function getTaskId(task) {
  return task?.id || task?._id || "";
}

function normalizePriority(p) {
  const v = (p || "").toString().toLowerCase();
  if (v === "critical") return 4;
  if (v === "high") return 3;
  if (v === "medium") return 2;
  if (v === "low") return 1;
  const n = Number(p);
  return Number.isFinite(n) ? n : 0;
}

function sortLikeBackend(list) {
  return [...(list || [])].sort((a, b) => {
    const pa = normalizePriority(a?.priority);
    const pb = normalizePriority(b?.priority);
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

function applyTaskPatch(prev, patch) {
  const id = getTaskId(patch);
  if (!id) return prev;

  const idx = prev.findIndex((t) => getTaskId(t) === id);
  if (idx === -1) {
    // If it's a new/updated task and looks stack-eligible, let it join.
    return sortLikeBackend([patch, ...prev]);
  }
  const next = [...prev];
  next[idx] = { ...next[idx], ...patch };
  return sortLikeBackend(next);
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

  const inFlightRef = useRef(false);

  const canRun = useMemo(() => {
    return Boolean(enabled && projectId);
  }, [enabled, projectId]);

  const load = useCallback(async () => {
    if (!canRun) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchStackTasks({ projectId, limit, assigneeId });
      const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      setTasks(sortLikeBackend(list));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [canRun, projectId, limit, assigneeId]);

  // initial + param changes
  useEffect(() => {
    if (!canRun) {
      setTasks([]);
      return;
    }
    load();
  }, [canRun, load]);

  // optional realtime
  useEffect(() => {
    if (!socket || !canRun) return;
    if (typeof socket.on !== "function" || typeof socket.off !== "function") return;

    const handler = (payload) => {
      const payloadProjectId = payload?.projectId?.toString?.() || payload?.projectId;
      if (payloadProjectId && payloadProjectId !== projectId) return;

      setTasks((prev) => applyTaskPatch(Array.isArray(prev) ? prev : [], payload));
    };

    socket.on("taskUpdated", handler);
    socket.on("task:update", handler);

    return () => {
      socket.off("taskUpdated", handler);
      socket.off("task:update", handler);
    };
  }, [socket, canRun, projectId]);

  return {
    tasks,
    setTasks,
    loading,
    error,
    refresh: load,
  };
}

