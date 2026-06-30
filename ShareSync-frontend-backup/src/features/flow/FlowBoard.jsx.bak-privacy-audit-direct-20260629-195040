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
              Flow
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
    <section className={`flow-command-board relative ${className}`} aria-label="Project flow">
      <style className="flow-board-visual-style">
        {`
          .flow-board-shell {
            isolation: isolate;
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 88% 4%, rgba(34, 211, 238, 0.15), transparent 32%),
              radial-gradient(circle at 72% 100%, rgba(52, 211, 153, 0.12), transparent 28%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.84)) !important;
            border-color: rgba(124, 58, 237, 0.22) !important;
            box-shadow:
              0 28px 92px rgba(15, 23, 42, 0.14),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .flow-board-shell {
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 88% 4%, rgba(34, 211, 238, 0.13), transparent 32%),
              radial-gradient(circle at 72% 100%, rgba(52, 211, 153, 0.10), transparent 28%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.92)) !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
            box-shadow:
              0 30px 105px rgba(0, 0, 0, 0.50),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .flow-board-rail {
            height: 5px !important;
            background: linear-gradient(90deg, #8b5cf6 0%, #38bdf8 44%, #34d399 100%) !important;
            box-shadow:
              0 0 24px rgba(139, 92, 246, 0.42),
              0 0 28px rgba(34, 211, 238, 0.30);
          }

          .flow-board-header {
            border-radius: 26px;
            padding: 14px;
            background: rgba(255, 255, 255, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.62);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
          }

          .dark .flow-board-header {
            background: rgba(15, 23, 42, 0.42);
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .flow-board-icon {
            background:
              radial-gradient(circle at 30% 18%, rgba(255,255,255,0.92), transparent 34%),
              linear-gradient(135deg, rgba(139, 92, 246, 0.20), rgba(34, 211, 238, 0.14)) !important;
            box-shadow:
              0 18px 36px rgba(124, 58, 237, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.74) !important;
          }

          .dark .flow-board-icon {
            background:
              radial-gradient(circle at 30% 18%, rgba(255,255,255,0.18), transparent 34%),
              linear-gradient(135deg, rgba(139, 92, 246, 0.24), rgba(34, 211, 238, 0.14)) !important;
            box-shadow:
              0 18px 40px rgba(124, 58, 237, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .flow-live-pill,
          .flow-refresh-button {
            backdrop-filter: blur(18px);
            background: rgba(255, 255, 255, 0.84) !important;
            border-color: rgba(148, 163, 184, 0.28) !important;
            box-shadow:
              0 12px 26px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
          }

          .dark .flow-live-pill,
          .dark .flow-refresh-button {
            background: rgba(255, 255, 255, 0.08) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 14px 30px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .flow-refresh-button:hover {
            color: #6d28d9 !important;
            border-color: rgba(139, 92, 246, 0.34) !important;
            box-shadow:
              0 18px 38px rgba(124, 58, 237, 0.16),
              inset 0 1px 0 rgba(255, 255, 255, 0.74) !important;
          }

          .flow-stat-card {
            position: relative;
            overflow: hidden;
            min-height: 96px;
            backdrop-filter: blur(18px);
            box-shadow:
              0 14px 34px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              border-color 180ms ease;
          }

          .flow-stat-card::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.36), transparent 62%);
            opacity: 0.90;
          }

          .dark .flow-stat-card {
            box-shadow:
              0 16px 38px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .dark .flow-stat-card::before {
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.12), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.04), transparent 62%);
          }

          .flow-stat-card:hover {
            transform: translateY(-2px);
            box-shadow:
              0 20px 46px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.76) !important;
          }

          .flow-stat-card > * {
            position: relative;
            z-index: 1;
          }

          .flow-stat-total { border-top: 3px solid rgba(100, 116, 139, 0.72) !important; }
          .flow-stat-motion { border-top: 3px solid rgba(139, 92, 246, 0.86) !important; }
          .flow-stat-review { border-top: 3px solid rgba(245, 158, 11, 0.86) !important; }
          .flow-stat-blocked { border-top: 3px solid rgba(244, 63, 94, 0.86) !important; }
          .flow-stat-done { border-top: 3px solid rgba(16, 185, 129, 0.86) !important; }


          /* =========================================================
             FLOWBOARD DARK STAT SIGNAL CARDS v1
             Makes Board stat cards readable in dark mode:
             In Motion / Review / Blocked / Done.
             ========================================================= */

          .dark .flow-stat-motion {
            background:
              radial-gradient(circle at 15% 0%, rgba(139, 92, 246, 0.40), transparent 44%),
              linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.94)) !important;
            border-color: rgba(167, 139, 250, 0.82) !important;
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
          }

          .dark .flow-stat-review {
            background:
              radial-gradient(circle at 15% 0%, rgba(245, 158, 11, 0.42), transparent 44%),
              linear-gradient(135deg, rgba(69, 46, 5, 0.98), rgba(15, 23, 42, 0.94)) !important;
            border-color: rgba(251, 191, 36, 0.90) !important;
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
          }

          .dark .flow-stat-blocked {
            background:
              radial-gradient(circle at 15% 0%, rgba(244, 63, 94, 0.42), transparent 44%),
              linear-gradient(135deg, rgba(76, 5, 25, 0.98), rgba(15, 23, 42, 0.94)) !important;
            border-color: rgba(251, 113, 133, 0.92) !important;
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
          }

          .dark .flow-stat-done {
            background:
              radial-gradient(circle at 15% 0%, rgba(16, 185, 129, 0.38), transparent 44%),
              linear-gradient(135deg, rgba(6, 78, 59, 0.98), rgba(15, 23, 42, 0.94)) !important;
            border-color: rgba(52, 211, 153, 0.90) !important;
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
          }

          .dark .flow-stat-motion::before,
          .dark .flow-stat-review::before,
          .dark .flow-stat-blocked::before,
          .dark .flow-stat-done::before {
            opacity: 0.45 !important;
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.18), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent 62%) !important;
          }

          .dark .flow-stat-motion div:first-child {
            color: #c4b5fd !important;
            text-shadow: 0 0 18px rgba(139, 92, 246, 0.42);
          }

          .dark .flow-stat-review div:first-child {
            color: #fbbf24 !important;
            text-shadow: 0 0 18px rgba(245, 158, 11, 0.42);
          }

          .dark .flow-stat-blocked div:first-child {
            color: #fb7185 !important;
            text-shadow: 0 0 18px rgba(244, 63, 94, 0.42);
          }

          .dark .flow-stat-done div:first-child {
            color: #34d399 !important;
            text-shadow: 0 0 18px rgba(16, 185, 129, 0.42);
          }

          .dark .flow-stat-motion div:last-child,
          .dark .flow-stat-review div:last-child,
          .dark .flow-stat-blocked div:last-child,
          .dark .flow-stat-done div:last-child {
            color: #ffffff !important;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.16);
          }

          /* END FLOWBOARD DARK STAT SIGNAL CARDS v1 */

          .flow-stage-chip {
            box-shadow:
              0 10px 22px rgba(15, 23, 42, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.68);
            backdrop-filter: blur(14px);
          }

          .dark .flow-stage-chip {
            box-shadow:
              0 10px 24px rgba(0, 0, 0, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          .flow-column-grid {
            align-items: stretch;
          }

          .flow-lane {
            position: relative;
            backdrop-filter: blur(18px);
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.84), rgba(248, 250, 252, 0.64)) !important;
            box-shadow:
              0 16px 38px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72);
          }

          .dark .flow-lane {
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.10), transparent 34%),
              linear-gradient(135deg, rgba(30, 41, 59, 0.62), rgba(15, 23, 42, 0.46)) !important;
            box-shadow:
              0 18px 44px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .flow-lane-backlog { border-top: 3px solid rgba(148, 163, 184, 0.78) !important; }
          .flow-lane-todo { border-top: 3px solid rgba(34, 211, 238, 0.86) !important; }
          .flow-lane-in_progress { border-top: 3px solid rgba(139, 92, 246, 0.86) !important; }
          .flow-lane-review { border-top: 3px solid rgba(245, 158, 11, 0.86) !important; }
          .flow-lane-done { border-top: 3px solid rgba(16, 185, 129, 0.86) !important; }

          .flow-lane-header {
            border-radius: 18px;
            padding: 10px 10px 9px;
            background: rgba(255, 255, 255, 0.46);
            border: 1px solid rgba(255, 255, 255, 0.56);
          }

          .dark .flow-lane-header {
            background: rgba(255, 255, 255, 0.045);
            border-color: rgba(255, 255, 255, 0.07);
          }

          .flow-lane-count {
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.64);
          }

          .flow-lane-add-button {
            background: rgba(255, 255, 255, 0.68) !important;
            border: 1px solid rgba(148, 163, 184, 0.22);
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
          }

          .flow-lane-add-button:hover {
            color: #7c3aed !important;
            background: rgba(245, 243, 255, 0.92) !important;
            border-color: rgba(139, 92, 246, 0.28);
          }

          .dark .flow-lane-add-button {
            background: rgba(255, 255, 255, 0.06) !important;
            border-color: rgba(255, 255, 255, 0.08);
          }

          .flow-lane-scroll {
            scrollbar-width: thin;
          }

          .flow-lane-composer {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.12), transparent 38%),
              rgba(255, 255, 255, 0.92) !important;
            box-shadow:
              0 14px 30px rgba(124, 58, 237, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.70);
          }

          .dark .flow-lane-composer {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.15), transparent 38%),
              rgba(15, 23, 42, 0.88) !important;
            box-shadow:
              0 16px 34px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .flow-lane-submit-button {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            color: #ffffff !important;
            box-shadow:
              0 10px 22px rgba(109, 40, 217, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.24);
          }

          .flow-lane-empty {
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.08), transparent 46%),
              rgba(255, 255, 255, 0.35) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.54);
          }

          .dark .flow-lane-empty {
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.12), transparent 46%),
              rgba(255, 255, 255, 0.025) !important;
          }

          .flow-task-card {
            position: relative;
            overflow: hidden;
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.08), transparent 38%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.90)) !important;
            box-shadow:
              0 12px 28px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.78);
            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              border-color 180ms ease;
          }

          .dark .flow-task-card {
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.13), transparent 38%),
              linear-gradient(135deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.62)) !important;
            box-shadow:
              0 14px 34px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .flow-task-card::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(90deg, rgba(139, 92, 246, 0.10), transparent 32%);
            opacity: 0;
            transition: opacity 180ms ease;
          }

          .flow-task-card:hover {
            transform: translateY(-2px);
            border-color: rgba(139, 92, 246, 0.30) !important;
            box-shadow:
              0 18px 40px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.82);
          }

          .dark .flow-task-card:hover {
            border-color: rgba(139, 92, 246, 0.36) !important;
            box-shadow:
              0 20px 46px rgba(0, 0, 0, 0.44),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .flow-task-card:hover::before {
            opacity: 1;
          }

          .flow-task-card > * {
            position: relative;
            z-index: 1;
          }

          .flow-task-grip {
            border-radius: 10px;
            padding: 2px;
            background: rgba(148, 163, 184, 0.10);
          }

          .flow-task-title {
            letter-spacing: -0.01em;
          }

          .flow-task-priority,
          .flow-task-blocked-chip,
          .flow-task-due-chip {
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.58);
          }

          .flow-task-footer {
            border-top: 1px solid rgba(148, 163, 184, 0.14);
            padding-top: 8px;
          }

          .dark .flow-task-footer {
            border-top-color: rgba(255, 255, 255, 0.07);
          }
        `}
      </style>

      <div className="flow-board-shell relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/82 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/30">
        <div className="flow-board-rail absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-400/10" />
        <div className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-300/10" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-72 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-300/10" />

        <div className="relative p-5 sm:p-6 lg:p-7">
          <header className="flow-board-header mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flow-board-icon relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:from-violet-500/15 dark:via-white/[0.04] dark:to-cyan-500/10 dark:text-violet-300">
                <LayoutDashboard className="h-6 w-6" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-950" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                    Flow
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
              <div className="flow-live-pill inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Live Flow
                </span>
              </div>

              <button
                type="button"
                onClick={reload}
                className="flow-refresh-button inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-lg hover:shadow-violet-500/10 active:translate-y-0 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-violet-400/20 dark:hover:bg-violet-500/10 dark:hover:text-violet-200"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="flow-stat-card flow-stat-total rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Total
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {totalTasks}
              </div>
            </div>

            <div className="flow-stat-card flow-stat-motion rounded-2xl border border-violet-100 bg-violet-50/60 p-4 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500 dark:text-violet-300">
                In Motion
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {boardStats.inProgress}
              </div>
            </div>

            <div className="flow-stat-card flow-stat-review rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">
                Review
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {boardStats.review}
              </div>
            </div>

            <div className="flow-stat-card flow-stat-blocked rounded-2xl border border-rose-100 bg-rose-50/60 p-4 shadow-sm dark:border-rose-400/20 dark:bg-rose-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-500 dark:text-rose-300">
                Blocked
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {boardStats.blocked}
              </div>
            </div>

            <div className="flow-stat-card flow-stat-done rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
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
                  className={`flow-stage-chip inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${meta.chip}`}
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
                    Flow failed to load
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
                Your flow is empty.
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

              <div className="flow-column-grid relative grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-5 [&>*]:min-w-0">
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
