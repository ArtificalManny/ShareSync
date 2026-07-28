import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlignLeft,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Flag,
  Loader2,
  Save,
  UserRound,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "review", label: "Review" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function normalizeId(value) {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return String(
    value?._id ||
      value?.id ||
      value?.userId?._id ||
      value?.userId?.id ||
      value?.userId ||
      ""
  );
}

function getTaskAssigneeId(task) {
  return normalizeId(
    task?.assigneeId ||
      task?.assignee ||
      task?.assignedToId ||
      task?.assignedTo
  );
}

function toDateInputValue(value) {
  if (!value) return "";

  const raw = String(value);
  const directMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);

  if (directMatch) return directMatch[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000
  );

  return localDate.toISOString().slice(0, 10);
}

export default function MoveTaskDetailDrawer({
  open = false,
  task = null,
  members = [],
  disabled = false,
  onClose,
  onSave,
  onComplete,
} = {}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [actionError, setActionError] = useState("");

  const safeMembers = useMemo(
    () => (Array.isArray(members) ? members : []),
    [members]
  );

  useEffect(() => {
    if (!open || !task) return;

    setTitle(String(task?.title || task?.name || ""));
    setDescription(String(task?.description || ""));
    setStatus(String(task?.status || "todo").toLowerCase());
    setPriority(String(task?.priority || "medium").toLowerCase());
    setAssigneeId(getTaskAssigneeId(task));
    setDueDate(toDateInputValue(task?.dueDate));
    setActionError("");
  }, [open, task]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !saving &&
        !completing &&
        !disabled
      ) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving, completing, disabled, onClose]);

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();

    if (
      !trimmedTitle ||
      disabled ||
      saving ||
      completing ||
      !task
    ) {
      return;
    }

    setSaving(true);
    setActionError("");

    try {
      const savedTask = await onSave?.(task, {
        title: trimmedTitle,
        description,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate
          ? `${dueDate}T12:00:00.000Z`
          : null,
      });

      if (!savedTask) {
        setActionError(
          "The move could not be saved. Review the fields and try again."
        );
        return;
      }

      onClose?.();
    } catch (error) {
      setActionError(
        error?.response?.data?.message ||
          error?.message ||
          "The move could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }, [
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    disabled,
    saving,
    completing,
    task,
    onSave,
    onClose,
  ]);

  const handleComplete = useCallback(async () => {
    const trimmedTitle = title.trim();

    if (
      !trimmedTitle ||
      disabled ||
      saving ||
      completing ||
      !task
    ) {
      if (!trimmedTitle) {
        setActionError("A move title is required.");
      }
      return;
    }

    setCompleting(true);
    setActionError("");

    try {
      const savedTask = await onSave?.(task, {
        title: trimmedTitle,
        description,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate
          ? `${dueDate}T12:00:00.000Z`
          : null,
      });

      if (!savedTask) {
        setActionError(
          "The move could not be saved before completion. Try again."
        );
        return;
      }

      const completed = await onComplete?.(savedTask);

      if (!completed) {
        setActionError(
          "The move was saved but could not be completed. Try again."
        );
        return;
      }

      onClose?.();
    } catch (error) {
      setActionError(
        error?.response?.data?.message ||
          error?.message ||
          "The move could not be completed."
      );
    } finally {
      setCompleting(false);
    }
  }, [
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    disabled,
    saving,
    completing,
    task,
    onSave,
    onComplete,
    onClose,
  ]);

  if (!open || !task) return null;

  const isBusy = disabled || saving || completing;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] bg-slate-950/45 backdrop-blur-[2px]"
        onClick={() => {
          if (!isBusy) onClose?.();
        }}
        aria-hidden="true"
      />

      <aside
        className="fixed right-0 top-0 z-[10001] flex h-full w-full max-w-[680px] flex-col border-l border-slate-200 bg-white shadow-[-24px_0_80px_rgba(15,23,42,0.20)] dark:border-white/10 dark:bg-[#111116] dark:shadow-[-24px_0_90px_rgba(0,0,0,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-detail-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 dark:border-white/10 sm:px-7">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
              Move detail
            </div>

            <h2
              id="move-detail-title"
              className="mt-1 truncate text-xl font-black text-slate-950 dark:text-white"
            >
              {task?.title || task?.name || "Untitled move"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Update the work without losing your place in the queue.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close move detail"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          className="flex-1 overflow-y-auto px-5 py-6 sm:px-7"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey)
            ) {
              event.preventDefault();
              handleSave();
            }
          }}
        >
          <div className="space-y-6">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                <CircleDot className="h-4 w-4 text-violet-500" />
                Title
              </span>

              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={500}
                disabled={isBusy}
                autoFocus
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                <AlignLeft className="h-4 w-4 text-violet-500" />
                Description
              </span>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                maxLength={10000}
                rows={8}
                disabled={isBusy}
                placeholder="Add context, acceptance criteria, links, or handoff notes…"
                className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:placeholder:text-zinc-600"
              />

              <div className="mt-1 text-right text-[11px] text-slate-400 dark:text-zinc-600">
                {description.length.toLocaleString()} / 10,000
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  <CircleDot className="h-4 w-4 text-cyan-500" />
                  Status
                </span>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  disabled={isBusy}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  <Flag className="h-4 w-4 text-rose-500" />
                  Priority
                </span>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                  disabled={isBusy}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  <UserRound className="h-4 w-4 text-emerald-500" />
                  Assignee
                </span>

                <select
                  value={assigneeId}
                  onChange={(event) =>
                    setAssigneeId(event.target.value)
                  }
                  disabled={isBusy}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
                >
                  <option value="">Unassigned</option>

                  {safeMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {member.role ? ` · ${member.role}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  <CalendarDays className="h-4 w-4 text-amber-500" />
                  Due date
                </span>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  disabled={isBusy}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
                />
              </label>
            </div>

            {actionError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
                {actionError}
              </div>
            ) : null}
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-white/10 dark:bg-black/20 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <button
            type="button"
            onClick={handleComplete}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15"
          >
            {completing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {completing ? "Completing…" : "Complete move"}
          </button>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy || !title.trim()}
              className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:hover:bg-violet-400"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save move"}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
