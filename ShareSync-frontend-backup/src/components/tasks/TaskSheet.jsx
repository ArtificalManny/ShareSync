// /src/components/tasks/TaskSheet.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, PlusCircle, Save } from "lucide-react";
import { createTask as apiCreateTask, patchTask as apiPatchTask } from "../../api/tasks";

/**
 * TaskSheet
 * Right-side sheet for quick task creation and basic edit.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - projectId?: string                         // required for default API calls
 * - canEdit?: boolean                          // disables form if false
 * - onCreate?: (payload) => Promise<any> | void
 * - onUpdate?: (taskId, patch) => Promise<any> | void
 * - defaultStatus?: string
 * - initialTitle?: string
 * - initialLabels?: string[]
 * - afterCreate?: (createdTask) => void
 * - afterUpdate?: (updatedTask) => void
 * - existingTask?: { _id?: string, id?: string, ... }   // when present → edit mode
 */
export default function TaskSheet({
  open,
  onClose,
  projectId,
  canEdit = true,
  onCreate,
  onUpdate,
  defaultStatus = "Not Started",
  initialTitle = "",
  initialLabels = [],
  afterCreate,
  afterUpdate,
  existingTask = null,
}) {
  const isEdit = !!existingTask;
  const taskId = existingTask?._id || existingTask?.id || null;

  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState(existingTask?.status || defaultStatus);
  const [assignee, setAssignee] = useState(existingTask?.assignee || "");
  const [dueDate, setDueDate] = useState(existingTask?.dueDate ? existingTask.dueDate.slice(0, 10) : "");
  const [labels, setLabels] = useState(
    (Array.isArray(existingTask?.labels) ? existingTask.labels : initialLabels).join(", ")
  );
  const [notes, setNotes] = useState(existingTask?.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Reset when opened or when switching mode/task
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setTitle(existingTask?.title || "");
      setStatus(existingTask?.status || defaultStatus);
      setAssignee(existingTask?.assignee || "");
      setDueDate(existingTask?.dueDate ? existingTask.dueDate.slice(0, 10) : "");
      setLabels(Array.isArray(existingTask?.labels) ? existingTask.labels.join(", ") : "");
      setNotes(existingTask?.notes || "");
    } else {
      setTitle(initialTitle || "");
      setStatus(defaultStatus);
      setAssignee("");
      setDueDate("");
      setLabels(initialLabels.join(", "));
      setNotes("");
    }
    setError("");
    setTimeout(() => firstFieldRef.current?.focus(), 10);
  }, [open, isEdit, existingTask, initialTitle, initialLabels, defaultStatus]);

  // Esc / Cmd+Enter
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    const selectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const focusables = Array.from(el.querySelectorAll(selectors)).filter(
        (n) => !n.hasAttribute("disabled")
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const parsedLabels = useMemo(
    () =>
      labels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [labels]
  );

  const buildPayload = () => ({
    title: title.trim(),
    status,
    assignee: assignee.trim() || undefined,
    dueDate: dueDate || undefined,
    labels: parsedLabels,
    notes: notes.trim() || undefined,
  });

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (!canEdit) return;
    setError("");

    if (!title.trim()) {
      setError("Please enter a task title.");
      firstFieldRef.current?.focus();
      return;
    }

    const payload = buildPayload();

    try {
      setSubmitting(true);

      if (isEdit && taskId) {
        let updated = null;
        if (typeof onUpdate === "function") {
          updated = (await onUpdate(taskId, payload)) ?? null;
        } else {
          // Default API route (requires projectId for permission check on BE)
          updated = await apiPatchTask(projectId, taskId, payload);
        }
        afterUpdate?.(updated ?? { _id: taskId, ...payload });
      } else {
        let created = null;
        if (typeof onCreate === "function") {
          created = (await onCreate(payload)) ?? null;
        } else {
          created = await apiCreateTask(projectId, payload);
        }
        afterCreate?.(created ?? payload);
      }

      onClose?.();
    } catch (e) {
      setError(e?.message || "Failed to save task.");
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    canEdit,
    title,
    isEdit,
    taskId,
    onUpdate,
    onCreate,
    projectId,
    afterCreate,
    afterUpdate,
  ]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <aside
        ref={containerRef}
        className="fixed right-0 top-0 bottom-0 z-50 w-[min(520px,100%)] bg-white dark:bg-slate-900 border-l border-slate-200/70 dark:border-slate-800 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit task" : "Create task"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
          <div className="inline-flex items-center gap-2">
            {isEdit ? (
              <Save className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            ) : (
              <PlusCircle className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            )}
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {isEdit ? "Edit Task" : "New Task"}
            </h2>
          </div>
          <button
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
          {error ? (
            <div className="rounded-lg border border-rose-200/70 bg-rose-50 text-rose-800 text-sm px-3 py-2">
              {error}
            </div>
          ) : null}

          {!canEdit && (
            <div className="rounded-lg border border-amber-200/70 bg-amber-50 text-amber-900 text-sm px-3 py-2">
              You have read-only access to this project.
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              ref={firstFieldRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Outline API tests"
              disabled={!canEdit || submitting}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Press <kbd className="px-1 border rounded">⌘</kbd>/<kbd className="px-1 border rounded">Ctrl</kbd>+<kbd className="px-1 border rounded">Enter</kbd> to {isEdit ? "save" : "create"}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!canEdit || submitting}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Blocked</option>
                <option>Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!canEdit || submitting}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Assignee (optional)
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="email or name"
                disabled={!canEdit || submitting}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Labels (comma separated)
              </label>
              <input
                type="text"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="backend, api, urgent"
                disabled={!canEdit || submitting}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Any context for this task…"
              disabled={!canEdit || submitting}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !canEdit}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {isEdit ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {submitting ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create task"}
          </button>
        </div>
      </aside>
    </>
  );
}
