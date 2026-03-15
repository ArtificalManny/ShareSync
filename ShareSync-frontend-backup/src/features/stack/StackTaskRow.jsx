// src/features/stack/StackTaskRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// StackTaskRow - single task row for StackPanel
// Shows: checkbox, title, priority, due date, blocking indicator, status
// Actions: Complete (checkbox), Start, Move to review
// ✅ Proper light/dark mode using ShareSync design tokens
// ✅ Checkbox completion with teal accent feedback
// ✅ Hover-revealed action buttons for cleaner resting state
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState, useCallback } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Play,
  Send,
  ShieldAlert,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTaskId(task) {
  return task?.id || task?._id || "";
}

function fmtDue(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function priorityMeta(p) {
  const v = (p || "").toString().toLowerCase();
  if (v === "critical")
    return {
      label: "CRITICAL",
      badge: "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
      border: "border-l-rose-500",
      dot: "bg-rose-500",
    };
  if (v === "high")
    return {
      label: "HIGH",
      badge: "bg-amber-100 dark:bg-orange-500/15 text-amber-700 dark:text-orange-300 border-amber-200 dark:border-orange-500/20",
      border: "border-l-amber-500",
      dot: "bg-amber-500",
    };
  if (v === "medium")
    return {
      label: "MED",
      badge: "bg-violet-100 dark:bg-purple-500/15 text-violet-700 dark:text-purple-300 border-violet-200 dark:border-purple-500/20",
      border: "border-l-violet-500",
      dot: "bg-violet-500",
    };
  if (v === "low")
    return {
      label: "LOW",
      badge: "bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10",
      border: "border-l-slate-300 dark:border-l-slate-500",
      dot: "bg-slate-400",
    };
  // numeric or unknown
  return {
    label: p ? String(p).toUpperCase() : "—",
    badge: "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10",
    border: "border-l-slate-200 dark:border-l-white/10",
    dot: "bg-slate-300",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════

export default function StackTaskRow({
  task,
  disabled = false,
  onStart,
  onMoveToReview,
  onComplete,
} = {}) {
  const id = getTaskId(task);

  const title = task?.title || task?.name || "Untitled task";
  const due = useMemo(() => fmtDue(task?.dueDate), [task?.dueDate]);
  const pri = useMemo(() => priorityMeta(task?.priority), [task?.priority]);

  const isBlocking = Boolean(task?.isBlocking);
  const isOverdue = useMemo(() => {
    if (!task?.dueDate) return false;
    const d = new Date(task.dueDate);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  }, [task?.dueDate]);

  // ✅ NEW: completing animation state
  const [completing, setCompleting] = useState(false);

  const handleCheckboxClick = useCallback(() => {
    if (disabled || completing) return;
    setCompleting(true);
    // Brief visual feedback before optimistic removal in parent
    setTimeout(() => {
      onComplete?.(task);
    }, 150);
  }, [disabled, completing, onComplete, task]);

  const statusLabel = (task?.status || "").toString().replace(/_/g, " ");
  const isInProgress = (task?.status || "").toLowerCase() === "in_progress";

  return (
    <div
      className={`group relative rounded-xl border-l-[3px] border border-slate-200 dark:border-white/10
        bg-white dark:bg-white/[0.03]
        hover:bg-slate-50 dark:hover:bg-white/[0.06]
        transition-all duration-200
        ${pri.border}
        ${completing ? "opacity-50 scale-[0.98]" : "opacity-100 scale-100"}
        ${disabled && !completing ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-start gap-3 p-3">
        {/* ── Checkbox ───────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          disabled={disabled || completing}
          className={`mt-0.5 flex-shrink-0 rounded-full transition-colors
            ${completing
              ? "text-teal-500 dark:text-teal-400"
              : "text-slate-300 dark:text-white/20 hover:text-teal-500 dark:hover:text-teal-400"
            }
            disabled:cursor-not-allowed`}
          title="Complete task"
          aria-label="Complete task"
        >
          {completing ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        {/* ── Task info ──────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium text-sm text-slate-800 dark:text-white truncate">
              {title}
            </div>

            {isBlocking ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md
                bg-amber-100 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-300
                border border-amber-200 dark:border-yellow-500/20">
                <AlertTriangle className="h-2.5 w-2.5" />
                Blocking
              </span>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {/* Priority badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${pri.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${pri.dot}`} />
              {pri.label}
            </span>

            {/* Due date */}
            {due ? (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border
                  ${isOverdue
                    ? "bg-rose-100 dark:bg-red-500/10 text-rose-700 dark:text-red-300 border-rose-200 dark:border-red-500/20"
                    : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10"
                  }`}
              >
                <Calendar className="h-2.5 w-2.5" />
                {due}
              </span>
            ) : null}

            {/* Status badge */}
            {task?.status ? (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border
                  ${isInProgress
                    ? "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20"
                    : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10"
                  }`}
              >
                {statusLabel.toUpperCase()}
              </span>
            ) : null}
          </div>
        </div>

        {/* ── Action buttons (visible on hover) ──────────────────────── */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {!isInProgress ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onStart?.(task)}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg
                bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15
                text-slate-600 dark:text-white/70
                disabled:opacity-50 transition-colors"
              title="Start working on this task"
            >
              <Play className="h-3 w-3" />
              Start
            </button>
          ) : null}

          <button
            type="button"
            disabled={disabled}
            onClick={() => onMoveToReview?.(task)}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg
              bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15
              text-slate-600 dark:text-white/70
              disabled:opacity-50 transition-colors"
            title="Move to review"
          >
            <Send className="h-3 w-3" />
            Review
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onComplete?.(task)}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg
              bg-teal-100 dark:bg-teal-500/15 hover:bg-teal-200 dark:hover:bg-teal-500/25
              text-teal-700 dark:text-teal-300
              border border-teal-200 dark:border-teal-500/20
              disabled:opacity-50 transition-colors"
            title="Complete task"
          >
            <CheckCircle2 className="h-3 w-3" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
