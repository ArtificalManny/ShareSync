// /src/components/tasks/TaskSheet.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, PlusCircle } from "lucide-react";
import { createTask as apiCreateTask } from "../../api/projects";

/**
 * TaskSheet
 * Right-side sheet for quick task creation.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - projectId?: string               // if provided and no onCreate, will call API
 * - onCreate?: (payload) => Promise<any> | void
 *   (If provided, this is called on submit. Return created task or nothing.)
 * - defaultStatus?: string           // "Not Started" | "In Progress" | "Blocked" | "Done"
 * - initialTitle?: string
 * - initialLabels?: string[]         // optional prefilled labels
 * - afterCreate?: (createdTask) => void
 *
 * Behavior:
 * - Enter (Cmd/Ctrl + Enter) submits.
 * - Esc closes.
 * - Focus trap within the sheet.
 * - Minimal validation (title required).
 */
export default function TaskSheet({
  open,
  onClose,
  projectId,
  onCreate,
  defaultStatus = "Not Started",
  initialTitle = "",
  initialLabels = [],
  afterCreate,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState(defaultStatus);
  const [assignee, setAssignee] = useState(""); // freeform for now (email or name)
  const [dueDate, setDueDate] = useState("");   // yyyy-mm-dd
  const [labels, setLabels] = useState(initialLabels.join(", "));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const firstFieldRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setTitle(initialTitle || "");
      setStatus(defaultStatus);
      setAssignee("");
      setDueDate("");
      setLabels(initialLabels.join(", "));
      setNotes("");
      setError("");
      // Focus title after mount
      setTimeout(() => firstFieldRef.current?.focus(), 10);
    }
  }, [open, initialTitle, initialLabels, defaultStatus]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
      // Cmd/Ctrl + Enter → submit
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Simple focus trap inside the sheet
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

  const parsedLabels = useMemo(() => {
    return labels
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [labels]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setError("");
    if (!title.trim()) {
      setError("Please enter a task title.");
      firstFieldRef.current?.focus();
      return;
    }
    const payload = {
      title: title.trim(),
      status,
      assignee: assignee.trim() || undefined,
      dueDate: dueDate || undefined,
      labels: parsedLabels,
      notes: notes.trim() || undefined,
    };

    try {
      setSubmitting(true);

      let created = null;
      if (typeof onCreate === "function") {
        created = (await onCreate(payload)) ?? null;
      } else if (projectId) {
        // default API path if parent didn't override
        created = await apiCreateTask(projectId, payload);
      }

      afterCreate?.(created ?? payload);
      onClose?.();
    } catch (e) {
      setError(e?.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  }, [title, status, assignee, dueDate, parsedLabels, notes, onCreate, projectId, afterCreate, onClose, submitting]);

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
        aria-label="Create task"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
          <div className="inline-flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              New Task
            </h2>
          </div>
          <button
            ref={closeBtnRef}
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
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Press <kbd className="px-1 border rounded">⌘</kbd>/<kbd className="px-1 border rounded">Ctrl</kbd>+<kbd className="px-1 border rounded">Enter</kbd> to create.
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            <PlusCircle className="w-4 h-4" />
            {submitting ? "Creating…" : "Create task"}
          </button>
        </div>
      </aside>
    </>
  );
}