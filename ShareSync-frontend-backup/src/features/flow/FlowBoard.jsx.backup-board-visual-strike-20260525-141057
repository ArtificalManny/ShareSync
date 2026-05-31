// src/features/flow/FlowBoard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FlowBoard - Board view for a project
// - Loads /tasks/board?projectId=...
// - Drag/drop -> PATCH /tasks/:id/move
// - Listens to "taskUpdated" via useFlowTasks hook (socket event listener)
// NOTE: ProjectHome.jsx already joins the project room. We DO NOT join here.
//
// VISUAL BOARD POLISH PASS:
// - Keeps existing board logic intact
// - Keeps useFlowTasks, reload, addTask, moveTaskOptimistic untouched
// - Keeps FlowColumn rendering untouched
// - Improves board shell, header, stats, loading, error, and empty states
//
// ✅ SAFE ADD:
// - milestoneIdFilter prop (frontend-only). Does NOT affect backend or hooks.
// - Filters the already-loaded board tasks by task.milestoneId before rendering.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import FlowColumn from "./FlowColumn";
import useFlowTasks, { FLOW_STATUSES } from "./useFlowTasks";
import {
  Activity,
  AlertTriangle,
  Columns3,
  Filter,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return v?.toString?.() || "";
}

function formatStatusLabel(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTaskId(task) {
  return task?.id || task?._id || "";
}

function isBlockedTask(task) {
  const status = String(task?.status || "").toLowerCase();

  return Boolean(
    task?.isBlocked ||
      task?.blocked ||
      task?.hasBlocker ||
      task?.blockedBy ||
      status.includes("block") ||
      (Array.isArray(task?.blockers) && task.blockers.length > 0)
  );
}

function getStatusMeta(status) {
  const key = String(status || "").toLowerCase();

  const map = {
    backlog: {
      label: "Backlog",
      dot: "bg-slate-400",
      chip: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:border-white/[0.08]",
    },
    todo: {
      label: "To Do",
      dot: "bg-cyan-400",
      chip: "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-400/20",
    },
    in_progress: {
      label: "In Progress",
      dot: "bg-violet-500",
      chip: "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-400/20",
    },
    review: {
      label: "Review",
      dot: "bg-amber-400",
      chip: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20",
    },
    done: {
      label: "Done",
      dot: "bg-emerald-500",
      chip: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20",
    },
  };

  return (
    map[key] || {
      label: formatStatusLabel(status),
      dot: "bg-slate-400",
      chip: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:border-white/[0.08]",
    }
  );
}

export default function FlowBoard({
  projectId,
  sprintId = undefined,
  className = "",

  // ✅ SAFE: frontend-only filter
  milestoneIdFilter = null,
}) {
  const { board, loading, error, reload, moveTaskOptimistic, addTask } = useFlowTasks({
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

  const allTasks = useMemo(() => {
    return FLOW_STATUSES.flatMap((status) =>
      Array.isArray(filteredBoard?.[status]) ? filteredBoard[status] : []
    );
  }, [filteredBoard]);

  const totalTasks = useMemo(() => {
    return FLOW_STATUSES.reduce(
      (acc, status) => acc + (filteredBoard?.[status]?.length || 0),
      0
    );
  }, [filteredBoard]);

  const boardStats = useMemo(() => {
    const inProgress = filteredBoard?.in_progress?.length || 0;
    const review = filteredBoard?.review?.length || 0;
    const done = filteredBoard?.done?.length || 0;
    const blocked = allTasks.filter(isBlockedTask).length;
    const activeColumns = FLOW_STATUSES.filter(
      (status) => (filteredBoard?.[status]?.length || 0) > 0
    ).length;

    return {
      inProgress,
      review,
      done,
      blocked,
      activeColumns,
    };
  }, [allTasks, filteredBoard]);

  if (!projectId) {
    return (
      <div
        className={`relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-black/20 ${className}`}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
            <Columns3 className="h-5 w-5" />
          </div>

          <div>
            <div className="text-sm font-black text-slate-950 dark:text-white">
              Board
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              No project selected.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={`relative ${className}`} aria-label="Project board">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/82 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-400/10" />
        <div className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-300/10" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-72 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-300/10" />

        <div className="relative p-5 sm:p-6 lg:p-7">
          <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:from-violet-500/15 dark:via-white/[0.04] dark:to-cyan-500/10 dark:text-violet-300">
                <LayoutDashboard className="h-6 w-6" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-950" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                    Board
                  </h2>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
                    <Activity className="h-3 w-3" />
                    Flow Map
                  </span>

                  {normalizeId(milestoneIdFilter) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                      <Filter className="h-3 w-3" />
                      Milestone Filter
                    </span>
                  ) : null}
                </div>

                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Move tasks across stages to reflect real work.
                  {normalizeId(milestoneIdFilter) ? " Filtered by milestone." : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Live Board
                </span>
              </div>

              <button
                type="button"
                onClick={reload}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-black text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-lg hover:shadow-violet-500/10 active:translate-y-0 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-violet-400/20 dark:hover:bg-violet-500/10 dark:hover:text-violet-200"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Total
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {totalTasks}
              </div>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500 dark:text-violet-300">
                In Motion
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {boardStats.inProgress}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">
                Review
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {boardStats.review}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 shadow-sm dark:border-rose-400/20 dark:bg-rose-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-500 dark:text-rose-300">
                Blocked
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {boardStats.blocked}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
                Done
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {boardStats.done}
              </div>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            {FLOW_STATUSES.map((status) => {
              const meta = getStatusMeta(status);
              const count = filteredBoard?.[status]?.length || 0;

              return (
                <span
                  key={status}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${meta.chip}`}
                >
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-slate-500 shadow-sm dark:bg-white/[0.08] dark:text-slate-300">
                    {count}
                  </span>
                </span>
              );
            })}
          </div>

          {loading ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/70 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div>
                  <div className="h-4 w-36 rounded-full bg-slate-200/80 dark:bg-white/[0.08]" />
                  <div className="mt-2 h-3 w-56 rounded-full bg-slate-100 dark:bg-white/[0.05]" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-[1.5rem] border border-slate-200 bg-slate-50/80 dark:border-white/[0.06] dark:bg-white/[0.04]"
                  />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50/60 p-6 shadow-sm dark:border-rose-400/20 dark:bg-rose-500/10">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-500 shadow-sm dark:border-rose-400/20 dark:bg-white/[0.06]">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-black text-rose-600 dark:text-rose-300">
                    Board failed to load
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {error}
                  </div>

                  <button
                    type="button"
                    onClick={reload}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white/80 px-4 py-2 text-xs font-black text-rose-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg dark:border-rose-400/20 dark:bg-white/[0.06] dark:text-rose-300"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : totalTasks === 0 ? (
            <div
              onClick={() => addTask("todo")}
              className="group relative mt-2 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50/70 via-white to-cyan-50/60 px-6 py-24 text-center shadow-inner transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-2xl hover:shadow-violet-500/10 dark:border-violet-400/20 dark:from-violet-500/10 dark:via-white/[0.03] dark:to-cyan-500/10"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />

              <div className="relative mb-6 h-24 w-24">
                <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl transition-all duration-300 group-hover:scale-125 group-hover:animate-pulse" />
                <div className="relative flex h-full w-full items-center justify-center rounded-[2rem] border border-violet-100 bg-white text-violet-600 shadow-2xl shadow-violet-500/20 transition-all duration-300 group-hover:-translate-y-1 dark:border-violet-400/20 dark:bg-slate-950 dark:text-violet-300">
                  <LayoutDashboard className="h-10 w-10" />
                </div>
              </div>

              <div className="relative mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                <Sparkles className="h-3 w-3" />
                Ready to build
              </div>

              <h3 className="relative text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Your board is empty.
              </h3>

              <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Add your first task to start moving work across the board.
              </p>

              <button
                className="pointer-events-none relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all group-hover:shadow-violet-500/40 active:scale-95"
              >
                <Plus className="h-5 w-5" />
                Add your first task
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-r from-violet-500/5 via-cyan-400/5 to-emerald-400/5 blur-2xl" />

              <div className="relative grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-5 [&>*]:min-w-0">
                {FLOW_STATUSES.map((status) => (
                  <FlowColumn
                    key={status}
                    status={status}
                    tasks={filteredBoard?.[status] || []}
                    onMoveTask={moveTaskOptimistic}
                    onAddTask={addTask}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
