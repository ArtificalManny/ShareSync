// src/features/stack/StackTaskRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// StackTaskRow - single task row for StackPanel
// SURGICAL TASKS PASS
//
// WHAT CHANGED:
// - Makes ownership obvious
// - Makes urgency clearer (overdue / due soon)
// - Makes the next action obvious with a single visible primary CTA
// - Keeps completion via checkbox intact
// - Preserves existing props and parent contract
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState, useCallback } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Play,
  Send,
  User,
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

  if (v === "critical") {
    return {
      label: "CRITICAL",
      badge:
        "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
      border: "border-l-rose-500",
      dot: "bg-rose-500",
    };
  }

  if (v === "high") {
    return {
      label: "HIGH",
      badge:
        "bg-amber-100 dark:bg-orange-500/15 text-amber-700 dark:text-orange-300 border-amber-200 dark:border-orange-500/20",
      border: "border-l-amber-500",
      dot: "bg-amber-500",
    };
  }

  if (v === "medium") {
    return {
      label: "MED",
      badge:
        "bg-violet-100 dark:bg-purple-500/15 text-violet-700 dark:text-purple-300 border-violet-200 dark:border-purple-500/20",
      border: "border-l-violet-500",
      dot: "bg-violet-500",
    };
  }

  if (v === "low") {
    return {
      label: "LOW",
      badge:
        "bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10",
      border: "border-l-slate-300 dark:border-l-slate-500",
      dot: "bg-slate-400",
    };
  }

  return {
    label: p ? String(p).toUpperCase() : "—",
    badge:
      "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10",
    border: "border-l-slate-200 dark:border-l-white/10",
    dot: "bg-slate-300",
  };
}

function getStatusLabel(status) {
  const raw = (status || "").toString().toLowerCase();

  if (raw === "todo") return "TODO";
  if (raw === "in_progress") return "IN PROGRESS";
  if (raw === "review") return "REVIEW";
  if (raw === "done") return "DONE";

  return raw ? raw.replace(/_/g, " ").toUpperCase() : null;
}

function getAssigneeLabel(task) {
  const directName =
    task?.assigneeName ||
    task?.ownerName ||
    task?.assignedToName ||
    task?.userName ||
    null;

  if (directName) return String(directName);

  const candidates = [
    task?.assignee,
    task?.assigneeId,
    task?.owner,
    task?.ownerId,
    task?.assignedTo,
    task?.user,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === "string" || typeof candidate === "number") {
      return String(candidate);
    }

    const fullName = [candidate.firstName, candidate.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) return fullName;
    if (candidate.username) return candidate.username;
    if (candidate.email) return candidate.email;
    if (candidate.name) return candidate.name;
  }

  return "Unassigned";
}

function getDueMeta(dueDate) {
  if (!dueDate) {
    return {
      label: null,
      chip:
        "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10",
      isOverdue: false,
      isDueSoon: false,
    };
  }

  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) {
    return {
      label: null,
      chip:
        "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10",
      isOverdue: false,
      isDueSoon: false,
    };
  }

  const now = Date.now();
  const deltaMs = d.getTime() - now;
  const deltaHours = deltaMs / (1000 * 60 * 60);
  const formatted = fmtDue(dueDate);

  if (deltaMs < 0) {
    return {
      label: `Overdue · ${formatted}`,
      chip:
        "bg-rose-100 dark:bg-red-500/10 text-rose-700 dark:text-red-300 border-rose-200 dark:border-red-500/20",
      isOverdue: true,
      isDueSoon: false,
    };
  }

  if (deltaHours <= 48) {
    return {
      label: `Due soon · ${formatted}`,
      chip:
        "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
      isOverdue: false,
      isDueSoon: true,
    };
  }

  return {
    label: formatted,
    chip:
      "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10",
    isOverdue: false,
    isDueSoon: false,
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
  const pri = useMemo(() => priorityMeta(task?.priority), [task?.priority]);
  const assigneeLabel = useMemo(() => getAssigneeLabel(task), [task]);

  const isBlocking = Boolean(
    task?.isBlocking ||
    task?.blocked ||
    task?.hasBlocker ||
    task?.blockedBy ||
    (Array.isArray(task?.blockers) && task.blockers.length > 0)
  );

  const statusValue = (task?.status || "").toString().toLowerCase();
  const statusLabel = getStatusLabel(task?.status);
  const isInProgress = statusValue === "in_progress";
  const isReview = statusValue === "review";
  const dueMeta = useMemo(() => getDueMeta(task?.dueDate), [task?.dueDate]);

  const [completing, setCompleting] = useState(false);

  const handleCheckboxClick = useCallback(() => {
    if (disabled || completing) return;
    setCompleting(true);

    setTimeout(() => {
      onComplete?.(task);
    }, 150);
  }, [disabled, completing, onComplete, task]);

  const primaryAction = useMemo(() => {
    if (isInProgress) {
      return {
        label: "Review",
        title: "Move to review",
        icon: Send,
        onClick: () => onMoveToReview?.(task),
        classes:
          "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
      };
    }

    if (!isReview) {
      return {
        label: "Start",
        title: "Start working on this task",
        icon: Play,
        onClick: () => onStart?.(task),
        classes:
          "bg-violet-600 hover:bg-violet-700 text-white shadow-sm",
      };
    }

    return null;
  }, [isInProgress, isReview, onMoveToReview, onStart, task]);

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
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* ── Checkbox ───────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={disabled || completing}
            className={`mt-0.5 flex-shrink-0 rounded-full transition-colors
              ${
                completing
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

          {/* ── Main content ───────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium text-sm text-slate-800 dark:text-white truncate">
                    {title}
                  </div>

                  {isBlocking ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md
                        bg-amber-100 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-300
                        border border-amber-200 dark:border-yellow-500/20"
                    >
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Blocking
                    </span>
                  ) : null}

                  {dueMeta.isOverdue ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md
                        bg-rose-100 dark:bg-red-500/10 text-rose-700 dark:text-red-300
                        border border-rose-200 dark:border-red-500/20"
                    >
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Urgent
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {/* Priority badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${pri.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${pri.dot}`} />
                    {pri.label}
                  </span>

                  {/* Due date */}
                  {dueMeta.label ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${dueMeta.chip}`}
                    >
                      <Calendar className="h-2.5 w-2.5" />
                      {dueMeta.label}
                    </span>
                  ) : null}

                  {/* Owner */}
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border
                      bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300
                      border-teal-200 dark:border-teal-500/20"
                  >
                    <User className="h-2.5 w-2.5" />
                    {assigneeLabel}
                  </span>

                  {/* Status */}
                  {statusLabel ? (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border
                        ${
                          isInProgress
                            ? "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20"
                            : isReview
                              ? "bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20"
                              : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10"
                        }`}
                    >
                      {statusLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* ── Primary action ─────────────────────────────────────── */}
              {primaryAction ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={primaryAction.onClick}
                  className={`inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg
                    disabled:opacity-50 transition-colors flex-shrink-0 ${primaryAction.classes}`}
                  title={primaryAction.title}
                >
                  <primaryAction.icon className="h-3.5 w-3.5" />
                  {primaryAction.label}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
