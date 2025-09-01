// /src/components/tasks/TaskRow.jsx
import React from "react";
import { CheckCircle2, Circle, Link as LinkIcon, Pin, PinOff } from "lucide-react";
import AnchorLinkButton from "../common/AnchorLinkButton";
import { makeAnchorId } from "../../utils/anchor";

/**
 * TaskRow
 * Props:
 *  - task: { _id, title, status?, projectTitle? }
 *  - onPatch?: (id, patch) => void     // e.g., toggle status
 *  - onPin?: (task) => void            // caller decides pin/unpin
 *  - isPinned?: boolean
 *  - className?: string
 */
export default function TaskRow({
  task,
  onPatch,
  onPin,
  isPinned = false,
  className = "",
}) {
  if (!task) return null;

  const rowId = `task-${task._id ?? ""}` || makeAnchorId("task", task?.title || "");

  const isDone = (task.status || "").toLowerCase() === "done";

  const toggleDone = () => {
    if (!onPatch || !task?._id) return;
    onPatch(task._id, { status: isDone ? "Not Started" : "Done" });
  };

  const handlePin = () => {
    if (onPin) onPin(task);
  };

  return (
    <div
      id={rowId}
      className={`group flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 ${className}`}
    >
      {/* Left: status toggle + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleDone}
          className="shrink-0 rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={isDone ? "Mark as not done" : "Mark as done"}
          title={isDone ? "Mark as not done" : "Mark as done"}
        >
          {isDone ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          ) : (
            <Circle className="h-5 w-5 text-slate-400" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0">
          <div className={`truncate text-sm ${isDone ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
            {task.title || "Untitled task"}
          </div>
          {task.projectTitle ? (
            <div className="text-[11px] text-slate-500 truncate">{task.projectTitle}</div>
          ) : null}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Copy deep link */}
        <AnchorLinkButton
          anchorId={rowId}
          className="opacity-60 hover:opacity-100"
          label="Copy link to this task"
          size="md"
        />

        {/* Pin / Unpin */}
        <button
          type="button"
          onClick={handlePin}
          className="rounded-md p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={isPinned ? "Unpin task" : "Pin task"}
          title={isPinned ? "Unpin task" : "Pin task"}
        >
          {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
