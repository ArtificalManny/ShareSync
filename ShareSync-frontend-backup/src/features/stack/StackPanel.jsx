// src/features/stack/StackPanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// StackPanel - "Top tasks to do next" (Priority Stack)
// - Fetches via useStackTasks (GET /tasks/stack)
// - Quick actions: Start, Move to review, Complete
// - Optional realtime updates via socket taskUpdated
// - Safe defaults + minimal assumptions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useMemo, useState } from "react";
import StackTaskRow from "./StackTaskRow";
import { useStackTasks } from "./useStackTasks";
import { completeTask, moveTask } from "../../api/taskApi";
import { Layers, RefreshCw } from "lucide-react";

function getTaskId(task) {
  return task?.id || task?._id || "";
}

function normalizeStatus(status) {
  return (status || "").toLowerCase();
}

function isInStack(task) {
  const s = normalizeStatus(task?.status);
  return s === "todo" || s === "in_progress";
}

function sortLikeBackend(list) {
  // Keep consistent with hook sorting, but local utility here too
  const priRank = (p) => {
    const v = (p || "").toLowerCase();
    if (v === "critical") return 4;
    if (v === "high") return 3;
    if (v === "medium") return 2;
    if (v === "low") return 1;
    if (typeof p === "number") return p;
    return 0;
  };

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

export default function StackPanel({
  projectId,
  assigneeId,
  limit = 10,
  socket = null,
  title = "Top tasks to do next",
} = {}) {
  const { tasks, loading, error, refresh, setTasks } = useStackTasks({
    projectId,
    assigneeId,
    limit,
    socket,
    enabled: true,
  });

  const [actionError, setActionError] = useState(null);
  const [actionBusyId, setActionBusyId] = useState(null);

  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks : [], [tasks]);

  const optimisticUpdate = useCallback((updater) => {
    setTasks((prev) => sortLikeBackend(updater(Array.isArray(prev) ? prev : [])));
  }, [setTasks]);

  const handleStart = useCallback(async (task) => {
    setActionError(null);
    const id = getTaskId(task);
    if (!id) return;

    setActionBusyId(id);

    // optimistic: move status => in_progress (keep in list)
    optimisticUpdate((prev) =>
      prev.map((t) => (getTaskId(t) === id ? { ...t, status: "in_progress" } : t))
    );

    try {
      await moveTask(id, { status: "in_progress" });
      // no hard refresh needed; socket may patch; but safe to keep state
    } catch (e) {
      setActionError(e);
      // rollback by refetch to be safe
      await refresh();
    } finally {
      setActionBusyId(null);
    }
  }, [optimisticUpdate, refresh]);

  const handleMoveToReview = useCallback(async (task) => {
    setActionError(null);
    const id = getTaskId(task);
    if (!id) return;

    setActionBusyId(id);

    // optimistic: review is NOT in stack => remove immediately
    optimisticUpdate((prev) => prev.filter((t) => getTaskId(t) !== id));

    try {
      await moveTask(id, { status: "review" });
    } catch (e) {
      setActionError(e);
      await refresh();
    } finally {
      setActionBusyId(null);
    }
  }, [optimisticUpdate, refresh]);

  const handleComplete = useCallback(async (task) => {
    setActionError(null);
    const id = getTaskId(task);
    if (!id) return;

    setActionBusyId(id);

    // optimistic: done is NOT in stack => remove immediately
    optimisticUpdate((prev) => prev.filter((t) => getTaskId(t) !== id));

    try {
      await completeTask(id, {});
    } catch (e) {
      setActionError(e);
      await refresh();
    } finally {
      setActionBusyId(null);
    }
  }, [optimisticUpdate, refresh]);

  const visibleCount = safeTasks.filter(isInStack).length;

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-white/10 flex items-center justify-center">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs opacity-70">
              {projectId ? `${visibleCount} in stack` : "Select a project"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={!projectId || loading}
          className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-50"
          title="Refresh stack"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-3 text-xs rounded-2xl border border-red-500/30 bg-red-500/10 p-3">
          <div className="font-semibold">Couldn’t load stack</div>
          <div className="opacity-80 mt-1">{String(error?.message || error)}</div>
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-3 text-xs rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="font-semibold">Action failed</div>
          <div className="opacity-80 mt-1">{String(actionError?.message || actionError)}</div>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {loading && safeTasks.length === 0 ? (
          <div className="text-xs opacity-70 p-3">Loading stack…</div>
        ) : null}

        {!loading && safeTasks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            <div className="font-semibold">No tasks in your stack</div>
            <div className="text-xs opacity-70 mt-1">
              Add a task or set it to <span className="font-semibold">TODO</span> /{" "}
              <span className="font-semibold">IN PROGRESS</span>.
            </div>
          </div>
        ) : null}

        {safeTasks.map((t) => {
          const id = getTaskId(t);
          const rowDisabled = !projectId || actionBusyId === id;

          return (
            <StackTaskRow
              key={id || Math.random()}
              task={t}
              disabled={rowDisabled}
              onStart={handleStart}
              onMoveToReview={handleMoveToReview}
              onComplete={handleComplete}
            />
          );
        })}
      </div>
    </div>
  );
}
