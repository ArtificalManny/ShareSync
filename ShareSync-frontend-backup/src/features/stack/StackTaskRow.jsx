// src/features/stack/StackTaskRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// StackTaskRow - single task row for StackPanel
// Shows: title, priority, due date, blocking indicator
// Actions: Start, Move to review, Complete
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Play,
  Send,
  ShieldAlert,
} from "lucide-react";

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
  if (v === "critical") return { label: "CRITICAL", cls: "bg-red-500/15 text-red-200 border-red-500/20" };
  if (v === "high") return { label: "HIGH", cls: "bg-orange-500/15 text-orange-200 border-orange-500/20" };
  if (v === "medium") return { label: "MED", cls: "bg-purple-500/15 text-purple-200 border-purple-500/20" };
  if (v === "low") return { label: "LOW", cls: "bg-slate-500/15 text-slate-200 border-white/10" };
  // numeric or unknown
  return { label: (p ? String(p).toUpperCase() : "—"), cls: "bg-white/10 text-white/80 border-white/10" };
}

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

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/7 transition-colors p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-9 w-9 rounded-2xl bg-white/10 flex items-center justify-center">
          {isBlocking ? (
            <ShieldAlert className="h-4 w-4 text-yellow-200" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-white/70" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm truncate">{title}</div>

            {isBlocking ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-200 border border-yellow-500/20">
                <AlertTriangle className="h-3 w-3" />
                Blocking
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${pri.cls}`}>
              {pri.label}
            </span>

            {due ? (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                  isOverdue
                    ? "bg-red-500/10 text-red-200 border-red-500/20"
                    : "bg-white/10 text-white/75 border-white/10"
                }`}
              >
                <Calendar className="h-3 w-3" />
                {due}
              </span>
            ) : null}

            {task?.status ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/65 border border-white/10">
                {(task.status || "").toString().replace(/_/g, " ").toUpperCase()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            <Send className="h-4 w-4" />
            Review
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onComplete?.(task)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-200 border border-emerald-500/20 disabled:opacity-50"
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

