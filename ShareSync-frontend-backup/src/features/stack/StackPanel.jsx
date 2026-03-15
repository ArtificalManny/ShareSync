// src/features/stack/StackPanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// StackPanel - "Top tasks to do next" (Priority Stack)
// - Fetches via useStackTasks (GET /tasks/stack)
// - Quick actions: Start, Move to review, Complete
// - ✅ Inline task creation with optimistic insert
// - Optional realtime updates via socket taskUpdated
// - Safe defaults + minimal assumptions
//
// ✅ SAFE ADD:
// - milestoneIdFilter prop (frontend-only filter). Does NOT affect backend.
// - Inline task creation via createTask API (proven endpoint).
// - Proper light/dark mode using ShareSync design tokens.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import StackTaskRow from "./StackTaskRow";
import { useStackTasks } from "./useStackTasks";
import { completeTask, moveTask, createTask } from "../../api/taskApi";
import { Layers, RefreshCw, Plus, X } from "lucide-react";

// ─── Helpers (unchanged) ────────────────────────────────────────────────────

function getTaskId(task) {
  return task?.id || task?._id || "";
}

function normalizeStatus(status) {
  return (status || "").toLowerCase();
}

function isInStack(task) {
  const s = normalizeStatus(task?.status);
  return s === "todo" || s === "in_progress";
}

function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return v?.toString?.() || "";
}

function sortLikeBackend(list) {
  const priRank = (p) => {
    const v = (p || "").toLowerCase();
    if (v === "critical") return 4;
    if (v === "high") return 3;
    if (v === "medium") return 2;
    if (v === "low") return 1;
    if (typeof p === "number") return p;
    return 0;
  };

  return [...(list || [])].sort((a, b) => {
    const pa = priRank(a?.priority);
    const pb = priRank(b?.priority);
    if (pb !== pa) return pb - pa;

    const ba = a?.isBlocking ? 1 : 0;
    const bb = b?.isBlocking ? 1 : 0;
    if (bb !== ba) return bb - ba;

    const sa = typeof a?.stackOrder === "number" ? a.stackOrder : 999999;
    const sb = typeof b?.stackOrder === "number" ? b.stackOrder : 999999;
    if (sa !== sb) return sa - sb;

    const da = a?.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
    const db = b?.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
    return da - db;
  });
}

// ─── Priority pill config ───────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
    idle: "bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10",
    active: "bg-slate-200 dark:bg-slate-500/30 text-slate-800 dark:text-white border-slate-400 dark:border-slate-400/40 ring-1 ring-slate-400/30 dark:ring-slate-400/20",
  },
  {
    value: "medium",
    label: "Med",
    idle: "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-500/20",
    active: "bg-violet-100 dark:bg-violet-500/30 text-violet-800 dark:text-white border-violet-400 dark:border-violet-400/40 ring-1 ring-violet-400/30 dark:ring-violet-400/20",
  },
  {
    value: "high",
    label: "High",
    idle: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
    active: "bg-amber-100 dark:bg-amber-500/30 text-amber-800 dark:text-white border-amber-400 dark:border-amber-400/40 ring-1 ring-amber-400/30 dark:ring-amber-400/20",
  },
  {
    value: "critical",
    label: "Critical",
    idle: "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
    active: "bg-rose-100 dark:bg-rose-500/30 text-rose-800 dark:text-white border-rose-400 dark:border-rose-400/40 ring-1 ring-rose-400/30 dark:ring-rose-400/20",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════

export default function StackPanel({
  projectId,
  assigneeId,
  limit = 10,
  socket = null,
  title = "Top tasks to do next",

  // ✅ SAFE: frontend-only filter
  milestoneIdFilter = null,
} = {}) {
  const { tasks, loading, error, refresh, setTasks } = useStackTasks({
    projectId,
    assigneeId,
    limit,
    socket,
    enabled: true,
  });

  const [actionError, setActionError] = useState(null);
  const [actionBusyId, setActionBusyId] = useState(null);

  // ✅ NEW: inline task creation state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [addingTask, setAddingTask] = useState(false);
  const addInputRef = useRef(null);

  const safeTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);

  // ✅ Apply milestone filter locally (only if filter is set)
  const filteredTasks = useMemo(() => {
    const mid = normalizeId(milestoneIdFilter);
    if (!mid) return safeTasks;

    return safeTasks.filter((t) => normalizeId(t?.milestoneId) === mid);
  }, [safeTasks, milestoneIdFilter]);

  const optimisticUpdate = useCallback(
    (updater) => {
      setTasks((prev) => sortLikeBackend(updater(Array.isArray(prev) ? prev : [])));
    },
    [setTasks]
  );

  // ─── Existing action handlers (unchanged) ─────────────────────────────────

  const handleStart = useCallback(
    async (task) => {
      setActionError(null);
      const id = getTaskId(task);
      if (!id) return;

      setActionBusyId(id);

      optimisticUpdate((prev) =>
        prev.map((t) => (getTaskId(t) === id ? { ...t, status: "in_progress" } : t))
      );

      try {
        await moveTask(id, { status: "in_progress" });
      } catch (e) {
        setActionError(e);
        await refresh();
      } finally {
        setActionBusyId(null);
      }
    },
    [optimisticUpdate, refresh]
  );

  const handleMoveToReview = useCallback(
    async (task) => {
      setActionError(null);
      const id = getTaskId(task);
      if (!id) return;

      setActionBusyId(id);

      optimisticUpdate((prev) => prev.filter((t) => getTaskId(t) !== id));

      try {
        await moveTask(id, { status: "review" });
      } catch (e) {
        setActionError(e);
        await refresh();
      } finally {
        setActionBusyId(null);
      }
    },
    [optimisticUpdate, refresh]
  );

  const handleComplete = useCallback(
    async (task) => {
      setActionError(null);
      const id = getTaskId(task);
      if (!id) return;

      setActionBusyId(id);

      optimisticUpdate((prev) => prev.filter((t) => getTaskId(t) !== id));

      try {
        await completeTask(id, {});
      } catch (e) {
        setActionError(e);
        await refresh();
      } finally {
        setActionBusyId(null);
      }
    },
    [optimisticUpdate, refresh]
  );

  // ─── NEW: inline task creation handler ────────────────────────────────────

  // Focus the input when the add form opens
  useEffect(() => {
    if (showAddForm && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddForm]);

  const handleOpenAddForm = useCallback(() => {
    setShowAddForm(true);
    setNewTitle("");
    setNewPriority("medium");
    setActionError(null);
  }, []);

  const handleCloseAddForm = useCallback(() => {
    setShowAddForm(false);
    setNewTitle("");
    setNewPriority("medium");
  }, []);

  const handleAddTask = useCallback(
    async () => {
      const trimmed = newTitle.trim();
      if (!trimmed || !projectId || addingTask) return;

      setAddingTask(true);
      setActionError(null);

      // Optimistic insert with temp ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimisticTask = {
        _id: tempId,
        title: trimmed,
        status: "todo",
        priority: newPriority,
        projectId,
      };

      optimisticUpdate((prev) => [optimisticTask, ...prev]);
      setNewTitle("");

      try {
        const created = await createTask(projectId, {
          title: trimmed,
          status: "todo",
          priority: newPriority,
        });

        // Replace temp task with real task from server
        setTasks((prev) =>
          sortLikeBackend(
            (Array.isArray(prev) ? prev : []).map((t) =>
              getTaskId(t) === tempId ? { ...optimisticTask, ...created } : t
            )
          )
        );
      } catch (e) {
        setActionError(e);
        // Roll back optimistic insert
        setTasks((prev) =>
          (Array.isArray(prev) ? prev : []).filter((t) => getTaskId(t) !== tempId)
        );
      } finally {
        setAddingTask(false);
        // Re-focus input for rapid sequential adds
        if (addInputRef.current) {
          addInputRef.current.focus();
        }
      }
    },
    [newTitle, newPriority, projectId, addingTask, optimisticUpdate, setTasks]
  );

  const handleAddKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAddTask();
      }
      if (e.key === "Escape") {
        handleCloseAddForm();
      }
    },
    [handleAddTask, handleCloseAddForm]
  );

  // ─── Computed values ──────────────────────────────────────────────────────

  const visibleCount = filteredTasks.filter(isInStack).length;
  const hasFilter = !!normalizeId(milestoneIdFilter);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f1f23] shadow-sm">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 p-4 pb-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
            <Layers className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {title}
            </div>
            <div className="text-xs text-slate-500 dark:text-white/50">
              {projectId
                ? `${visibleCount} in stack${hasFilter ? " (filtered)" : ""}`
                : "Select a project"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ NEW: Add Task toggle */}
          {projectId && !showAddForm ? (
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg
                bg-violet-600 hover:bg-violet-700 text-white
                transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </button>
          ) : null}

          <button
            type="button"
            onClick={refresh}
            disabled={!projectId || loading}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg
              bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15
              text-slate-600 dark:text-white/70
              disabled:opacity-50 transition-colors"
            title="Refresh stack"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Inline Add Form ────────────────────────────────────────────── */}
      {showAddForm ? (
        <div className="mx-4 mt-3 p-3 rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5">
          <div className="flex items-center gap-2">
            <input
              ref={addInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Task title…"
              disabled={addingTask}
              className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg
                bg-white dark:bg-white/10
                border border-slate-200 dark:border-white/10
                text-slate-900 dark:text-white
                placeholder-slate-400 dark:placeholder-white/40
                focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400
                disabled:opacity-50
                transition-shadow"
            />
            <button
              type="button"
              onClick={handleCloseAddForm}
              className="p-2 rounded-lg text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Priority pills */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-white/40 mr-1">
              Priority:
            </span>
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNewPriority(opt.value)}
                disabled={addingTask}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-all
                  ${newPriority === opt.value ? opt.active : opt.idle}
                  disabled:opacity-50`}
              >
                {opt.label}
              </button>
            ))}

            <div className="flex-1" />

            {/* Submit button */}
            <button
              type="button"
              onClick={handleAddTask}
              disabled={addingTask || !newTitle.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                bg-violet-600 hover:bg-violet-700 text-white
                disabled:opacity-40 disabled:hover:bg-violet-600
                transition-colors shadow-sm"
            >
              {addingTask ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              {addingTask ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Error banners (unchanged logic) ────────────────────────────── */}
      {error ? (
        <div className="mx-4 mt-3 text-xs rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3">
          <div className="font-semibold text-red-700 dark:text-red-200">
            Couldn't load stack
          </div>
          <div className="text-red-600/80 dark:text-red-200/70 mt-1">
            {String(error?.message || error)}
          </div>
        </div>
      ) : null}

      {actionError ? (
        <div className="mx-4 mt-3 text-xs rounded-xl border border-amber-200 dark:border-yellow-500/30 bg-amber-50 dark:bg-yellow-500/10 p-3">
          <div className="font-semibold text-amber-700 dark:text-yellow-200">
            Action failed
          </div>
          <div className="text-amber-600/80 dark:text-yellow-200/70 mt-1">
            {String(actionError?.message || actionError)}
          </div>
        </div>
      ) : null}

      {/* ── Task list ──────────────────────────────────────────────────── */}
      <div className="p-4 pt-3 space-y-1.5">
        {loading && filteredTasks.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/40 p-3">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Loading stack…
          </div>
        ) : null}

        {!loading && filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-6 text-center">
            <div className="inline-flex h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 items-center justify-center mb-3">
              <Layers className="h-5 w-5 text-violet-500 dark:text-violet-400" />
            </div>
            <div className="font-semibold text-sm text-slate-700 dark:text-white/80">
              {hasFilter ? "No tasks in this milestone" : "No tasks in your stack"}
            </div>
            <div className="text-xs text-slate-500 dark:text-white/40 mt-1">
              {hasFilter
                ? "Try another milestone, or assign tasks to this milestone."
                : "Create a task above, or set existing tasks to TODO / IN PROGRESS."}
            </div>
            {/* CTA in empty state if add form isn't open */}
            {!hasFilter && !showAddForm && projectId ? (
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 mt-4 rounded-lg
                  bg-violet-600 hover:bg-violet-700 text-white
                  transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Your First Task
              </button>
            ) : null}
          </div>
        ) : null}

        {filteredTasks.map((t) => {
          const id = getTaskId(t);
          const rowDisabled = !projectId || actionBusyId === id;

          return (
            <StackTaskRow
              key={id || Math.random()}
              task={t}
              disabled={rowDisabled}
              onStart={handleStart}
              onMoveToReview={handleMoveToReview}
              onComplete={handleComplete}
            />
          );
        })}
      </div>
    </div>
  );
}
