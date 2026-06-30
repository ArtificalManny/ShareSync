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
  onEdit,
  onDelete,
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
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editPriority, setEditPriority] = useState(String(task?.priority || "medium").toLowerCase());

  const beginEdit = useCallback(() => {
    if (disabled || completing) return;
    setEditTitle(title);
    setEditPriority(String(task?.priority || "medium").toLowerCase());
    setEditing(true);
  }, [disabled, completing, title, task?.priority]);

  const cancelEdit = useCallback(() => {
    setEditTitle(title);
    setEditPriority(String(task?.priority || "medium").toLowerCase());
    setEditing(false);
  }, [title, task?.priority]);

  const saveEdit = useCallback(async () => {
    const trimmed = String(editTitle || "").trim();
    if (!trimmed || disabled || completing) return;

    await onEdit?.(task, {
      title: trimmed,
      priority: editPriority || "medium",
    });

    setEditing(false);
  }, [editTitle, editPriority, disabled, completing, onEdit, task]);

  const handleDeleteClick = useCallback(() => {
    if (disabled || completing) return;
    onDelete?.(task);
  }, [disabled, completing, onDelete, task]);

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
          "bg-sky-600 hover:bg-sky-700 text-white border border-sky-500/80 shadow-[0_12px_28px_rgba(2,132,199,0.30)] ring-1 ring-sky-200/60 disabled:!opacity-100 disabled:!bg-sky-600 disabled:!text-white disabled:!border-sky-500 dark:bg-blue-500 dark:hover:bg-blue-400 dark:text-white dark:border-blue-300/40 dark:disabled:!bg-blue-500/25 dark:disabled:!text-blue-100 dark:disabled:!border-blue-300/30",
      };
    }

    if (!isReview) {
      return {
        label: "Start",
        title: "Start working on this task",
        icon: Play,
        onClick: () => onStart?.(task),
        classes:
          "stack-start-action bg-violet-700 hover:bg-violet-800 text-white border border-violet-400/80 shadow-[0_14px_30px_rgba(124,58,237,0.35)] ring-1 ring-violet-200/70 disabled:!opacity-100 disabled:!bg-violet-700 disabled:!text-white disabled:!border-violet-400 dark:bg-violet-500 dark:hover:bg-violet-400 dark:text-white dark:border-violet-300/40 dark:disabled:!bg-violet-500/25 dark:disabled:!text-violet-100 dark:disabled:!border-violet-300/30",
      };
    }

    return null;
  }, [isInProgress, isReview, onMoveToReview, onStart, task]);

  return (
    <div
      className={`stack-task-row group relative rounded-xl border-l-[3px] border border-slate-200 dark:border-white/10
        bg-white dark:bg-white/[0.03]
        hover:bg-slate-50 dark:hover:bg-white/[0.06]
        transition-all duration-200
        ${pri.border}
        ${completing ? "opacity-50 scale-[0.98]" : "opacity-100 scale-100"}
        ${disabled && !completing ? "opacity-60" : ""}
      `}
    >
      <div className="stack-task-row-inner p-3">
        <div className="flex items-start gap-3">
          {/* ── Checkbox ───────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={disabled || completing}
            className={`stack-task-complete-button mt-0.5 flex-shrink-0 rounded-full transition-colors
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
                  {editing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEdit();
                        }
                      }}
                      className="min-w-[220px] flex-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent transition focus:border-violet-400 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-violet-300/50 dark:focus:ring-violet-400/10"
                      autoFocus
                    />
                  ) : (
                    <div className="stack-task-title font-bold text-sm text-slate-900 dark:text-white truncate">
                      {title}
                    </div>
                  )}

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

                {editing ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Med</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>

                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={disabled || completing || !String(editTitle || "").trim()}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={disabled || completing}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/[0.06]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}

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

              {/* ── Row actions ─────────────────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {!editing ? (
                  <button
                    type="button"
                    disabled={disabled || completing}
                    onClick={beginEdit}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-[11px] font-black text-slate-600 transition hover:bg-slate-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-violet-200"
                    title="Edit task"
                  >
                    Edit
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={disabled || completing}
                  onClick={handleDeleteClick}
                  className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
                  title="Delete task"
                >
                  Delete
                </button>

                {primaryAction ? (
                  <button
                    type="button"
                    disabled={disabled || editing}
                    onClick={primaryAction.onClick}
                    style={
                      primaryAction.label === "Start"
                        ? {
                            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 55%, #6d28d9 100%)",
                            color: "#ffffff",
                            opacity: 1,
                            border: "1px solid rgba(124, 58, 237, 0.55)",
                            boxShadow: "0 12px 28px rgba(124, 58, 237, 0.28)",
                            WebkitTextFillColor: "#ffffff",
                          }
                        : undefined
                    }
                    className={`stack-task-action inline-flex items-center justify-center gap-1.5 text-[11px] font-black px-3 py-2 rounded-lg
                      disabled:cursor-not-allowed transition-colors flex-shrink-0 ${primaryAction.classes}`}
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
    </div>
  );
}
