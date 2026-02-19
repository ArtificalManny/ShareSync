// src/features/flow/FlowBoard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FlowBoard - Kanban board for a project.
// - Loads /tasks/board?projectId=...
// - Drag/drop -> PATCH /tasks/:id/move
// - Listens to "taskUpdated" via useFlowTasks hook (socket event listener)
// NOTE: ProjectHome.jsx already joins the project room. We DO NOT join here.
//
// ✅ SAFE ADD:
// - milestoneIdFilter prop (frontend-only). Does NOT affect backend or hooks.
// - Filters the already-loaded board tasks by task.milestoneId before rendering.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import FlowColumn from "./FlowColumn";
import useFlowTasks, { FLOW_STATUSES } from "./useFlowTasks";

function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return v?.toString?.() || "";
}

export default function FlowBoard({
  projectId,
  sprintId = undefined,
  className = "",

  // ✅ SAFE: frontend-only filter
  milestoneIdFilter = null,
}) {
  const { board, loading, error, reload, moveTaskOptimistic } = useFlowTasks({
    projectId,
    sprintId,
  });

  const filteredBoard = useMemo(() => {
    const mid = normalizeId(milestoneIdFilter);
    if (!mid) return board;

    const next = {};
    for (const status of FLOW_STATUSES) {
      const list = Array.isArray(board?.[status]) ? board[status] : [];
      next[status] = list.filter((t) => normalizeId(t?.milestoneId) === mid);
    }
    return next;
  }, [board, milestoneIdFilter]);

  if (!projectId) {
    return (
      <div
        className={`rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 p-4 ${className}`}
      >
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Flow
        </div>
        <div className="mt-1 text-xs text-slate-500">No project selected.</div>
      </div>
    );
  }

  return (
    <section className={className} aria-label="Flow board">
      <header className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Flow
          </div>
          <div className="text-xs text-slate-500">
            Drag tasks across stages to reflect real work.
            {normalizeId(milestoneIdFilter) ? " (filtered by milestone)" : ""}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reload}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900"
          >
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 p-6 animate-pulse">
          <div className="h-5 w-40 rounded bg-slate-200/70 dark:bg-slate-800 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-slate-200/70 dark:bg-slate-800"
              />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200/70 bg-white/80 dark:bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-rose-600">
            Flow failed to load
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {error}
          </div>
          <button
            type="button"
            onClick={reload}
            className="mt-3 text-xs px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {FLOW_STATUSES.map((status) => (
            <FlowColumn
              key={status}
              status={status}
              tasks={filteredBoard?.[status] || []}
              onMoveTask={moveTaskOptimistic}
            />
          ))}
        </div>
      )}
    </section>
  );
}
