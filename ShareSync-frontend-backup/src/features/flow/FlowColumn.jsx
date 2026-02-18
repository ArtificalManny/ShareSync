// src/features/flow/FlowColumn.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Column container for Flow board.
// Handles drop events -> calls moveTaskOptimistic from hook.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import FlowTaskCard from "./FlowTaskCard";

function safeParseDragPayload(e) {
  try {
    const raw = e.dataTransfer.getData("application/x-openshare-task");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function prettyStatus(status) {
  switch (status) {
    case "backlog":
      return "Backlog";
    case "todo":
      return "Todo";
    case "in_progress":
      return "In Progress";
    case "review":
      return "Review";
    case "done":
      return "Done";
    default:
      return status;
  }
}

export default function FlowColumn({
  status,
  tasks = [],
  onMoveTask,
  isDisabled = false,
}) {
  const [isOver, setIsOver] = useState(false);

  const title = useMemo(() => prettyStatus(status), [status]);
  const count = tasks?.length || 0;

  return (
    <section
      className={`rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-3 flex flex-col min-h-[240px] ${
        isOver ? "ring-2 ring-slate-300/70 dark:ring-slate-700" : ""
      }`}
      onDragOver={(e) => {
        if (isDisabled) return;
        e.preventDefault(); // allow drop
        e.dataTransfer.dropEffect = "move";
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={async (e) => {
        if (isDisabled) return;
        e.preventDefault();
        setIsOver(false);

        const payload = safeParseDragPayload(e);
        const taskId = payload?.taskId;
        if (!taskId) return;

        try {
          await onMoveTask?.({ taskId, toStatus: status });
        } catch (err) {
          // keep UI quiet; parent can surface toast later
          console.warn("[FlowColumn] move failed:", err?.message || err);
        }
      }}
      aria-label={`${title} column`}
    >
      <header className="flex items-center justify-between gap-2 px-1 pb-2">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </div>
        <div className="text-xs text-slate-500">{count}</div>
      </header>

      <div className="flex-1 space-y-2">
        {tasks.map((t) => {
          const key = t?.id || t?._id || `${status}-${Math.random()}`;
          return <FlowTaskCard key={key} task={t} />;
        })}

        {count === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-500">
            Drop tasks here.
          </div>
        ) : null}
      </div>
    </section>
  );
}
