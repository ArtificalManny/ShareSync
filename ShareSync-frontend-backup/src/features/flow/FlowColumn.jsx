// src/features/flow/FlowColumn.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Column container for Flow board.
// Handles drop events -> calls moveTaskOptimistic from hook.
// ✅ Item 3: Added inline task creation per column
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
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

function statusColor(status) {
  switch (status) {
    case "backlog":
      return "text-slate-400";
    case "todo":
      return "text-cyan-500";
    case "in_progress":
      return "text-violet-500";
    case "review":
      return "text-amber-500";
    case "done":
      return "text-emerald-500";
    default:
      return "text-slate-500";
  }
}

function statusDot(status) {
  switch (status) {
    case "backlog":
      return "bg-slate-300 dark:bg-slate-600";
    case "todo":
      return "bg-cyan-400";
    case "in_progress":
      return "bg-violet-500";
    case "review":
      return "bg-amber-400";
    case "done":
      return "bg-emerald-500";
    default:
      return "bg-slate-400";
  }
}

export default function FlowColumn({
  status,
  tasks = [],
  onMoveTask,
  onAddTask,
  isDisabled = false,
}) {
  const [isOver, setIsOver] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const title = useMemo(() => prettyStatus(status), [status]);
  const count = tasks?.length || 0;

  // Auto-focus input when adding
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddTask = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || !onAddTask) return;

    setSaving(true);
    try {
      await onAddTask({ title: trimmed, status });
      setNewTitle("");
      setIsAdding(false);
    } catch (err) {
      console.warn("[FlowColumn] add task failed:", err?.message || err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
    if (e.key === "Escape") {
      setNewTitle("");
      setIsAdding(false);
    }
  };

  return (
    <section
      className={`rounded-2xl border bg-white/60 dark:bg-slate-900/40 p-3 flex flex-col min-h-[240px] transition-all ${
        isOver
          ? "border-violet-300 dark:border-violet-500/40 bg-violet-50/30 dark:bg-violet-500/5"
          : "border-slate-200/70 dark:border-slate-800"
      }`}
      onDragOver={(e) => {
        if (isDisabled) return;
        e.preventDefault();
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
          console.warn("[FlowColumn] move failed:", err?.message || err);
        }
      }}
      aria-label={`${title} column`}
    >
      {/* Column header */}
      <header className="flex items-center justify-between gap-2 px-1 pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusDot(status)}`} />
          <div className={`text-sm font-semibold ${statusColor(status)}`}>
            {title}
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
            {count}
          </span>
        </div>

        {onAddTask && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-violet-500 transition-colors"
            title={`Add task to ${title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Task list */}
      <div className="flex-1 space-y-2">
        {/* Inline add form */}
        {isAdding && (
          <div className="rounded-xl border border-violet-300 dark:border-violet-500/30 bg-white dark:bg-[#111113] p-3 shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title..."
              disabled={saving}
              className="w-full text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 bg-transparent outline-none mb-2"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setNewTitle(""); setIsAdding(false); }}
                className="px-3 py-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!newTitle.trim() || saving}
                className="px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}

        {/* Task cards */}
        {tasks.map((t) => {
          const key = t?.id || t?._id || `${status}-${Math.random()}`;
          return <FlowTaskCard key={key} task={t} />;
        })}

        {/* Empty state */}
        {count === 0 && !isAdding && (
          <button
            type="button"
            onClick={() => onAddTask ? setIsAdding(true) : null}
            className="w-full mt-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/30 p-4 text-center transition-colors group"
          >
            <Plus className="w-5 h-5 mx-auto mb-1 text-slate-300 dark:text-zinc-600 group-hover:text-violet-400 transition-colors" />
            <span className="text-xs text-slate-400 dark:text-zinc-500 group-hover:text-violet-500 transition-colors">
              Add task
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
