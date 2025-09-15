import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, X, Loader2, CalendarDays, Pencil } from "lucide-react";
import { patchTask as apiPatchTask } from "../../api/tasks";

/**
 * InlineTaskRow
 *
 * Props:
 * - task:           {_id, title, status, dueDate, labels?, notes?, assigneeId?}
 * - projectId:      string (required for API)
 * - canEdit:        boolean (default: true)
 * - onPatched?:     (updatedTask) => void
 * - onError?:       (errMessage) => void
 *
 * Backend status enum: 'Not Started' | 'In Progress' | 'Completed'
 */
export default function InlineTaskRow({
  task,
  projectId,
  canEdit = true,
  onPatched,
  onError,
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(task?.title || "");
  const [status, setStatus] = useState(task?.status || "Not Started");
  const [due, setDue] = useState(task?.dueDate ? toDateInput(task.dueDate) : "");
  const [error, setError] = useState("");

  const inputRef = useRef(null);

  // keep local state in sync if parent task changes
  useEffect(() => {
    setTitle(task?.title || "");
    setStatus(task?.status || "Not Started");
    setDue(task?.dueDate ? toDateInput(task.dueDate) : "");
    setError("");
  }, [task?._id, task?.title, task?.status, task?.dueDate]);

  useEffect(() => {
    if (editing) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [editing]);

  const dirty = useMemo(() => {
    return (
      (title || "") !== (task?.title || "") ||
      (status || "") !== (task?.status || "") ||
      (due || "") !== (task?.dueDate ? toDateInput(task.dueDate) : "")
    );
  }, [title, status, due, task]);

  function toPayload() {
    return {
      title: title.trim(),
      status,
      dueDate: due || null,
    };
  }

  async function save() {
    if (!canEdit) return;
    if (!dirty) {
      setEditing(false);
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      inputRef.current?.focus();
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await apiPatchTask(projectId, task._id || task.id, toPayload());
      onPatched?.(updated);
      setEditing(false);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save task.";
      setError(msg);
      onError?.(msg);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    // revert
    setTitle(task?.title || "");
    setStatus(task?.status || "Not Started");
    setDue(task?.dueDate ? toDateInput(task.dueDate) : "");
    setError("");
    setEditing(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
      return;
    }
    if (e.key === "Enter" && e.target?.id === "title") {
      e.preventDefault();
      save();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 ${
        saving ? "opacity-70" : ""
      }`}
    >
      {/* Status */}
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setEditing(true);
        }}
        disabled={!canEdit || saving}
        className="shrink-0 rounded-md border border-border bg-transparent px-2 py-1 text-xs"
        title="Change status"
      >
        <option>Not Started</option>
        <option>In Progress</option>
        <option>Completed</option>
      </select>

      {/* Title (inline editable) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <input
            id="title"
            ref={inputRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setEditing(true);
            }}
            onKeyDown={handleKey}
            readOnly={!canEdit}
            placeholder="Task title"
            className={`w-full bg-transparent outline-none text-sm ${
              canEdit ? "cursor-text" : "cursor-default"
            }`}
          />
          {canEdit && !editing && (
            <Pencil className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {/* Due + error line */}
        <div className="mt-1 flex items-center gap-3">
          <label className="inline-flex items-center gap-1 text-[11px] text-muted">
            <CalendarDays className="w-3 h-3" />
            Due:
          </label>
          <input
            type="date"
            value={due}
            onChange={(e) => {
              setDue(e.target.value);
              setEditing(true);
            }}
            onKeyDown={handleKey}
            disabled={!canEdit || saving}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-xs"
          />

          {error ? (
            <span className="ml-auto text-[11px] text-rose-600">{error}</span>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center gap-1">
          {saving ? (
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
              title="Saving…"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </span>
          ) : editing && dirty ? (
            <>
              <button
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs border border-border hover:bg-surface"
                onClick={cancel}
                title="Cancel"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={save}
                title="Save (Enter)"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Helpers */
function toDateInput(d) {
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    if (!dt || isNaN(dt.getTime())) return "";
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}
