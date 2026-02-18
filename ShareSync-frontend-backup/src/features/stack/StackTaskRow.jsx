// src/features/stack/StackTaskRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// StackTaskRow - row UI for a single task in StackPanel
// - Shows title, priority, due date, blocking badge
// - Actions: Start, Move to Review, Complete
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { Play, CheckCircle2, ArrowRightCircle, AlertTriangle, Clock } from "lucide-react";

function getTaskId(task) {
  return task?.id || task?._id || "";
}

function fmtDate(dueDate) {
  try {
    const d = new Date(dueDate);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function priMeta(priority) {
  const p = (priority || "").toString().toLowerCase();
  if (p === "critical") return { label: "Critical", cls: "bg-red-500/15 text-red-300 border-red-500/25" };
  if (p === "high") return { label: "High", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25" };
  if (p === "medium") return { label: "Medium", cls: "bg-purple-500/15 text-purple-300 border-purple-500/25" };
  if (p === "low") return { label: "Low", cls: "bg-white/10 text-white/70 border-white/15" };
  if (p) return { label: priority, cls: "bg-white/10 text-white/70 border-white/15" };
  return null;
}

export default function StackTaskRow({
  task,
  disabled = false,
  onStart,
  onMoveToReview,
  onComplete,
}) {
  const id = getTaskId(task);

  const meta = useMemo(() => {
    return {
      title: task?.title || task?.name || "Untitled task",
      priority: priMeta(task?.priority),
      due: task?.dueDate ? fmtDate(task.dueDate) : "",
      isBlocking: !!task?.isBlocking,
      status: (task?.status || "").toString(),
    };
  }, [task]);

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-sm font-semibold truncate">
              {meta.title}
            </div>

            {meta.isBlocking ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-yellow-500/25 bg-yellow-500/10 text-yellow-300 flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5" />
                Blocking
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {meta.priority ? (
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${meta.priority.cls}`}>
                {meta.priority.label}
              </span>
            ) : null}

            {meta.due ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/70">
                <Clock className="h-3.5 w-3.5" />
                Due {meta.due}
              </span>
            ) : null}

            {meta.status ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/60">
                {meta.status}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onStart?.(task)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-50"
            title="Start"
          >
            <Play className="h-4 w-4" />
            Start
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onMoveToReview?.(task)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-50"
            title="Move to review"
          >
            <ArrowRightCircle className="h-4 w-4" />
            Review
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onComplete?.(task)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-50"
            title="Complete"
          >
            <CheckCircle2 className="h-4 w-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
