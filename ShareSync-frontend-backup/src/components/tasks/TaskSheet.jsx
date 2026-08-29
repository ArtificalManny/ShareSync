import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  X,
  PlusCircle,
  Save,
  Calendar as CalendarIcon,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";
import { createTask as apiCreateTask, patchTask as apiPatchTask } from "../../api/tasks";
import { getIcsUrl } from "../../api/calendar";
import { toast } from "../ui/toast";
import { track, trackScheduleCreated } from "../../utils/telemetry";
import { CALENDAR_ACCOUNTABILITY } from "../../config/flags";
import StateChip from "./StateChip";
import "../../styles/chips.css";

/**
 * TaskSheet
 * Right-side sheet for quick task creation and basic edit.
 */

// Backend status values with friendly labels
const STATUS_OPTIONS = [
  { value: "todo", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Completed" },
];

function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (v?._id) return String(v._id).trim();
  if (v?.id) return String(v.id).trim();
  return v?.toString?.()?.trim?.() || "";
}

function normalizeMemberOptions(list) {
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const normalized = [];

  for (const member of list) {
    const user = member?.userId || member?.user || member;
    const id = normalizeId(user?._id || user?.id || member?.id || member?._id);
    if (!id || seen.has(id)) continue;

    seen.add(id);

    const name =
      user?.name ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.username ||
      user?.email ||
      member?.name ||
      member?.email ||
      "Team member";

    normalized.push({
      id,
      name,
      email: user?.email || member?.email || "",
      role: member?.role || user?.role || "",
    });
  }

  return normalized;
}

function getExistingAssigneeId(task) {
  return (
    normalizeId(task?.assigneeId) ||
    normalizeId(task?.assignee?._id) ||
    normalizeId(task?.assignee?.id) ||
    normalizeId(task?.assignee) ||
    ""
  );
}

export default function TaskSheet({
  open,
  onClose,
  projectId,
  canEdit = true,
  onCreate,
  onUpdate,
  defaultStatus = "todo",
  initialTitle = "",
  initialLabels,
  afterCreate,
  afterUpdate,
  existingTask = null,
  teamMembers = [],
}) {
  const isEdit = !!existingTask;
  const taskId = existingTask?._id || existingTask?.id || null;

  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState(existingTask?.status || defaultStatus);
  const [assigneeId, setAssigneeId] = useState(getExistingAssigneeId(existingTask));
  const [dueDate, setDueDate] = useState(
    existingTask?.dueDate ? toDateInput(existingTask.dueDate) : ""
  );
  const [labels, setLabels] = useState(
    Array.isArray(existingTask?.labels)
      ? existingTask.labels.join(", ")
      : Array.isArray(initialLabels)
        ? initialLabels.join(", ")
        : ""
  );
  const [notes, setNotes] = useState(existingTask?.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const scheduleState = existingTask?.scheduleState || null;
  const completedAtStr = useMemo(
    () => toDateInput(existingTask?.completedAt),
    [existingTask?.completedAt]
  );

  const memberOptions = useMemo(() => normalizeMemberOptions(teamMembers), [teamMembers]);

  const containerRef = useRef(null);
  const firstFieldRef = useRef(null);
  const prevFocusRef = useRef(null);

  const initialLabelsKey = useMemo(
    () => (Array.isArray(initialLabels) ? initialLabels.join("|") : ""),
    [initialLabels]
  );

  useEffect(() => {
    if (!open) {
      setTimeout(() => prevFocusRef.current?.focus?.(), 0);
      return;
    }

    prevFocusRef.current = document.activeElement;

    if (isEdit) {
      setTitle(existingTask?.title || "");
      setStatus(existingTask?.status || defaultStatus);
      setAssigneeId(getExistingAssigneeId(existingTask));
      setDueDate(existingTask?.dueDate ? toDateInput(existingTask?.dueDate) : "");
      setLabels(Array.isArray(existingTask?.labels) ? existingTask.labels.join(", ") : "");
      setNotes(existingTask?.notes || "");
    } else {
      setTitle(initialTitle || "");
      setStatus(defaultStatus);
      setAssigneeId("");
      setDueDate("");
      setLabels(Array.isArray(initialLabels) ? initialLabels.join(", ") : "");
      setNotes("");
    }

    setError("");
    setTimeout(() => firstFieldRef.current?.focus(), 10);
  }, [open, isEdit, existingTask, initialTitle, defaultStatus, initialLabelsKey]);

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
  }, [open, onClose, handleSubmit]);

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

  const stopBubble = (e) => e.stopPropagation();

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
    assigneeId: assigneeId.trim() || undefined,
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
          updated = await apiPatchTask(projectId, taskId, payload);
          try {
            track("task_updated", { projectId, taskId: updated?.id || taskId });
          } catch {}
        }

        toast({ title: "Task updated", variant: "success" });

        try {
          if (payload.dueDate) {
            trackScheduleCreated({
              projectId,
              taskId: updated?.id || taskId,
              dueDate: payload.dueDate,
              mode: "edit",
            });
          }
        } catch {}

        afterUpdate?.(updated ?? { _id: taskId, ...payload });
      } else {
        let created = null;

        if (typeof onCreate === "function") {
          created = (await onCreate(payload)) ?? null;
        } else {
          created = await apiCreateTask(projectId, payload);
          try {
            track("task_created", { projectId, taskId: created?.id || created?._id });
          } catch {}
        }

        toast({ title: "Task created", variant: "success" });

        if (payload.dueDate) {
          try {
            trackScheduleCreated({
              projectId,
              taskId: created?.id || created?._id,
              dueDate: payload.dueDate,
              mode: "create",
            });
          } catch {}
        }

        afterCreate?.(created ?? payload);
      }

      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save task.";
      setError(msg);
      toast({ title: msg, variant: "error" });
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
    status,
    assigneeId,
    dueDate,
    labels,
    notes,
    onClose,
  ]);

  if (!open) return null;

  const icsUrl = projectId ? getIcsUrl(projectId) : null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={containerRef}
        className="fixed right-0 top-0 bottom-0 z-50 w-[min(520px,100%)] bg-white dark:bg-slate-900 border-l border-slate-200/70 dark:border-slate-800 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-sheet-title"
        aria-describedby="task-sheet-desc"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
          <div className="inline-flex items-center gap-2">
            {isEdit ? (
              <Save className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            ) : (
              <PlusCircle className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            )}
            <h2 id="task-sheet-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
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

        <p id="task-sheet-desc" className="sr-only">
          {isEdit ? "Edit the selected task." : "Create a new task."} Press Escape to close. Use Tab to move between fields.
        </p>

        <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
          {error ? (
            <div
              className="rounded-lg border border-rose-200/70 bg-rose-50 text-rose-800 text-sm px-3 py-2"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          ) : null}

          {!canEdit && (
            <div className="rounded-lg border border-amber-200/70 bg-amber-50 text-amber-900 text-sm px-3 py-2">
              You have read-only access to this project.
            </div>
          )}

          {CALENDAR_ACCOUNTABILITY && icsUrl ? (
            <div className="rounded-lg border border-slate-200/70 dark:border-slate-700 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span className="inline-flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Add project tasks to your calendar
              </span>
              <a
                href={icsUrl}
                download
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Download .ics
              </a>
            </div>
          ) : null}

          <div>
            <label htmlFor="task-title" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title"
              ref={firstFieldRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={stopBubble}
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
              <label htmlFor="task-status" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                onKeyDown={stopBubble}
                disabled={!canEdit || submitting}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-due" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Due date
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onKeyDown={stopBubble}
                disabled={!canEdit || submitting}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>
          </div>

          {isEdit && (scheduleState || completedAtStr) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Schedule state
                </div>
                {scheduleState ? <StateChip state={scheduleState} /> : <div className="text-xs text-slate-400">—</div>}
              </div>
              <div>
                <div className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Completed at
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  {completedAtStr || "—"}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-assignee" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Assignee
              </label>

              {memberOptions.length > 0 ? (
                <div className="relative">
                  <select
                    id="task-assignee"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    onKeyDown={stopBubble}
                    disabled={!canEdit || submitting}
                    className="w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    <option value="">Unassigned</option>
                    {memberOptions.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}{member.role ? ` · ${member.role}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <input
                  id="task-assignee"
                  type="text"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  onKeyDown={stopBubble}
                  placeholder="user id"
                  disabled={!canEdit || submitting}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                />
              )}
            </div>

            <div>
              <label htmlFor="task-labels" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Labels (comma separated)
              </label>
              <input
                id="task-labels"
                type="text"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                onKeyDown={stopBubble}
                placeholder="backend, api, urgent"
                disabled={!canEdit || submitting}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label htmlFor="task-notes" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={stopBubble}
              rows={4}
              placeholder="Any context for this task…"
              disabled={!canEdit || submitting}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>
        </div>

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

/** Helpers */
function toDateInput(d) {
  try {
    if (!d) return "";
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
