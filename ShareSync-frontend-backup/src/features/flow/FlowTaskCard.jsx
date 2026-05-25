// src/features/flow/FlowTaskCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Draggable task card for Board view.
// Uses HTML5 drag events (no new libraries).
//
// SURGICAL BOARD CARD PASS:
// - Keep existing drag/drop contract intact
// - Make owner, urgency, and blocker state clearer
// - Keep the card compact enough for board lanes
// - No backend changes
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { AlertTriangle, Calendar, GripVertical, User } from "lucide-react";

function getId(task) {
  return task?.id || task?._id || "";
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

function getAssigneeInitial(task) {
  const label = getAssigneeLabel(task);
  if (!label || label === "Unassigned") return "?";
  return label.trim().charAt(0).toUpperCase();
}

function getPriorityMeta(priority) {
  const p = (priority || "").toLowerCase();

  if (p === "critical") {
    return {
      label: "CRIT",
      className:
        "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
    };
  }

  if (p === "high") {
    return {
      label: "HIGH",
      className:
        "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
    };
  }

  if (p === "medium") {
    return {
      label: "MED",
      className:
        "bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20",
    };
  }

  if (p === "low") {
    return {
      label: "LOW",
      className:
        "bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10",
    };
  }

  if (!p) return null;

  return {
    label: p.toUpperCase(),
    className:
      "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10",
  };
}

function getDueMeta(dueDate) {
  if (!dueDate) return null;

  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;

  const now = Date.now();
  const deltaMs = d.getTime() - now;
  const deltaHours = deltaMs / (1000 * 60 * 60);
  const formatted = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (deltaMs < 0) {
    return {
      label: `Overdue · ${formatted}`,
      className:
        "bg-rose-100 dark:bg-red-500/10 text-rose-700 dark:text-red-300 border-rose-200 dark:border-red-500/20",
      isUrgent: true,
    };
  }

  if (deltaHours <= 48) {
    return {
      label: `Due soon · ${formatted}`,
      className:
        "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
      isUrgent: true,
    };
  }

  return {
    label: formatted,
    className:
      "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10",
      isUrgent: false,
    };
}

function isBlockedTask(task) {
  const statusValue = String(task?.status || task?.state || task?.lane || "").toLowerCase();

  return Boolean(
    task?.isBlocked ||
      task?.blocked ||
      task?.hasBlocker ||
      task?.blockedBy ||
      statusValue.includes("block") ||
      (Array.isArray(task?.blockers) && task.blockers.length > 0)
  );
}

export default function FlowTaskCard({ task }) {
  const taskId = useMemo(() => getId(task), [task]);
  const priority = useMemo(() => getPriorityMeta(task?.priority), [task?.priority]);
  const dueMeta = useMemo(() => getDueMeta(task?.dueDate), [task?.dueDate]);
  const blocked = useMemo(() => isBlockedTask(task), [task]);
  const assigneeLabel = useMemo(() => getAssigneeLabel(task), [task]);
  const assigneeInitial = useMemo(() => getAssigneeInitial(task), [task]);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "application/x-openshare-task",
          JSON.stringify({ taskId })
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      className="
        flow-task-card group rounded-[1rem] border border-slate-200/70 dark:border-slate-800
        bg-white/90 dark:bg-slate-900/70
        p-2.5 shadow-sm hover:shadow-md
        transition cursor-grab active:cursor-grabbing
      "
      role="article"
      aria-label={task?.title || "Task"}
      title={task?.title || "Task"}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="flow-task-grip mt-0.5 text-slate-300 dark:text-slate-500 group-hover:text-violet-400 transition-colors">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flow-task-title text-[13px] font-black text-slate-950 dark:text-slate-100 break-words leading-snug">
                {task?.title || "Untitled task"}
              </div>

              {task?.description ? (
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {task.description}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {priority ? (
          <div className="shrink-0">
            <span
              className={`flow-task-priority text-[10px] px-2 py-0.5 rounded-full border font-black ${priority.className}`}
            >
              {priority.label}
            </span>
          </div>
        ) : null}
      </div>

      {/* Signal chips */}
      {(blocked || dueMeta) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {blocked ? (
            <span
              className="
                flow-task-blocked-chip inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md
                bg-amber-100 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-300
                border border-amber-200 dark:border-yellow-500/20
              "
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              Blocked
            </span>
          ) : null}

          {dueMeta ? (
            <span
              className={`flow-task-due-chip inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border ${dueMeta.className}`}
            >
              <Calendar className="w-2.5 h-2.5" />
              {dueMeta.label}
            </span>
          ) : null}
        </div>
      )}

      {/* Footer */}
      <div className="flow-task-footer mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
        <div className="min-w-0 flex items-center gap-2">
          <div
            className="
              w-5 h-5 rounded-full
              bg-teal-50 dark:bg-teal-500/10
              border border-teal-200 dark:border-teal-500/20
              text-teal-700 dark:text-teal-300
              flex items-center justify-center
              font-semibold text-[9px] flex-shrink-0
            "
            aria-hidden="true"
          >
            {assigneeInitial}
          </div>

          <span className="inline-flex items-center gap-1 min-w-0 truncate">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{assigneeLabel}</span>
          </span>
        </div>

        <span className="opacity-60 flex-shrink-0">
          {taskId ? `#${String(taskId).slice(-4)}` : ""}
        </span>
      </div>
    </div>
  );
}
