// src/features/flow/FlowTaskCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Minimal draggable task card for Flow (Kanban).
// Uses HTML5 drag events (no new libraries).
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";

function getId(task) {
  return task?.id || task?._id || "";
}

function priorityPill(priority) {
  const p = (priority || "").toLowerCase();
  if (!p) return null;
  const label = p === "critical" ? "CRIT" : p.toUpperCase();
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300">
      {label}
    </span>
  );
}

export default function FlowTaskCard({ task }) {
  const taskId = useMemo(() => getId(task), [task]);

  return (
    <div
      draggable
      onDragStart={(e) => {
        // Standardized payload for our board
        e.dataTransfer.setData(
          "application/x-openshare-task",
          JSON.stringify({ taskId })
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      className="group rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 p-3 shadow-sm hover:shadow transition cursor-grab active:cursor-grabbing"
      role="article"
      aria-label={task?.title || "Task"}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">
            {task?.title || "Untitled task"}
          </div>
          {task?.description ? (
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              {task.description}
            </div>
          ) : null}
        </div>

        <div className="shrink-0">{priorityPill(task?.priority)}</div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span className="truncate">
          {task?.assigneeName || task?.assignee?.username || ""}
        </span>
        <span className="opacity-60">
          {taskId ? `#${String(taskId).slice(-4)}` : ""}
        </span>
      </div>
    </div>
  );
}
