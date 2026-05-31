// src/features/stack/StackPanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// StackPanel - Tasks view for ProjectHome
// - Fetches via useStackTasks (GET /tasks/stack)
// - Quick actions: Start, Move to review, Complete
// - ✅ Inline task creation with optimistic insert
// - Optional realtime updates via socket taskUpdated
// - Safe defaults + minimal assumptions
//
// SURGICAL TASKS COPY PASS:
// - Keep existing logic intact
// - Align user-facing copy with the new "Tasks" tab language
// - Make the panel feel more like a decisive work queue, less like legacy "stack" wording
//
// ✅ SAFE ADD:
// - milestoneIdFilter prop (frontend-only filter). Does NOT affect backend.
// - Inline task creation via createTask API (proven endpoint).
// - Proper light/dark mode using ShareSync design tokens.
//
// VISUAL POLISH PASS:
// - More striking Tasks shell
// - Gradient live rail
// - Command-center header
// - Task signal summary cards
// - Stronger empty state
// - Better add-task composer
//
// ASSIGNMENT PASS:
// - Preserves optional assigneeId in inline add flow
// - Uses a real member picker when teamMembers are provided
// - Falls back to raw ID input only when no member list is available
// - Preserves milestoneId when a milestone filter is active
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import StackTaskRow from "./StackTaskRow";
import { useStackTasks } from "./useStackTasks";
import { completeTask, moveTask } from "../../api/taskApi";
import { createTask } from "../../api/tasks";
import {
  Layers,
  RefreshCw,
  Plus,
  X,
  User,
  ChevronDown,
  Sparkles,
  RadioTower,
  ListChecks,
  Flame,
  ShieldAlert,
  CircleDot,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (v?._id) return String(v._id).trim();
  if (v?.id) return String(v.id).trim();
  return v?.toString?.()?.trim?.() || "";
}

function getTaskAssigneeId(task) {
  return normalizeId(
    task?.assigneeId ||
      task?.assignee?._id ||
      task?.assignee?.id ||
      task?.assignedTo?._id ||
      task?.assignedTo?.id ||
      task?.ownerId ||
      ""
  );
}

function isBlockingTask(task) {
  return Boolean(task?.isBlocking || task?.blocking || task?.blocked);
}

function isCriticalTask(task) {
  return String(task?.priority || "").toLowerCase() === "critical";
}

function getMemberName(member) {
  const user = member?.userId || member?.user || member;
  return (
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    user?.email ||
    member?.name ||
    member?.email ||
    "Team member"
  );
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
    normalized.push({
      id,
      name: getMemberName(member),
      email: user?.email || member?.email || "",
      role: member?.role || user?.role || "",
    });
  }

  return normalized;
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
  teamMembers = [],
  limit = 10,
  socket = null,
  title = "Top tasks to do next",
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const addInputRef = useRef(null);

  const safeTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);
  const memberOptions = useMemo(() => normalizeMemberOptions(teamMembers), [teamMembers]);

  const normalizedPanelAssigneeId = useMemo(() => normalizeId(assigneeId), [assigneeId]);
  const normalizedMilestoneId = useMemo(() => normalizeId(milestoneIdFilter), [milestoneIdFilter]);

  const filteredTasks = useMemo(() => {
    const mid = normalizedMilestoneId;
    if (!mid) return safeTasks;

    return safeTasks.filter((t) => normalizeId(t?.milestoneId) === mid);
  }, [safeTasks, normalizedMilestoneId]);

  const optimisticUpdate = useCallback(
    (updater) => {
      setTasks((prev) => sortLikeBackend(updater(Array.isArray(prev) ? prev : [])));
    },
    [setTasks]
  );

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

  useEffect(() => {
    if (showAddForm && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddForm]);

  const handleOpenAddForm = useCallback(() => {
    setShowAddForm(true);
    setNewTitle("");
    setNewPriority("medium");
    setNewAssigneeId(normalizedPanelAssigneeId || "");
    setActionError(null);
  }, [normalizedPanelAssigneeId]);

  const handleCloseAddForm = useCallback(() => {
    setShowAddForm(false);
    setNewTitle("");
    setNewPriority("medium");
    setNewAssigneeId("");
  }, []);

  const handleAddTask = useCallback(
    async () => {
      const trimmed = newTitle.trim();
      if (!trimmed || !projectId || addingTask) return;

      setAddingTask(true);
      setActionError(null);

      const effectiveAssigneeId = normalizeId(newAssigneeId) || normalizedPanelAssigneeId || "";
      const effectiveMilestoneId = normalizedMilestoneId || "";

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimisticTask = {
        _id: tempId,
        title: trimmed,
        status: "todo",
        priority: newPriority,
        projectId,
        ...(effectiveAssigneeId ? { assigneeId: effectiveAssigneeId } : {}),
        ...(effectiveMilestoneId ? { milestoneId: effectiveMilestoneId } : {}),
      };

      optimisticUpdate((prev) => [optimisticTask, ...prev]);
      setNewTitle("");

      try {
        const created = await createTask(projectId, {
          title: trimmed,
          status: "todo",
          priority: newPriority,
          ...(effectiveAssigneeId ? { assigneeId: effectiveAssigneeId } : {}),
          ...(effectiveMilestoneId ? { milestoneId: effectiveMilestoneId } : {}),
        });

        setTasks((prev) =>
          sortLikeBackend(
            (Array.isArray(prev) ? prev : []).map((t) =>
              getTaskId(t) === tempId ? { ...optimisticTask, ...created } : t
            )
          )
        );
      } catch (e) {
        setActionError(e);
        setTasks((prev) =>
          (Array.isArray(prev) ? prev : []).filter((t) => getTaskId(t) !== tempId)
        );
      } finally {
        setAddingTask(false);
        if (addInputRef.current) {
          addInputRef.current.focus();
        }
      }
    },
    [
      newTitle,
      newPriority,
      newAssigneeId,
      projectId,
      addingTask,
      normalizedPanelAssigneeId,
      normalizedMilestoneId,
      optimisticUpdate,
      setTasks,
    ]
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

  const visibleCount = filteredTasks.filter(isInStack).length;
  const hasFilter = !!normalizedMilestoneId;

  const taskSignals = useMemo(() => {
    const stackTasks = filteredTasks.filter(isInStack);

    return {
      ready: stackTasks.length,
      blocking: stackTasks.filter(isBlockingTask).length,
      critical: stackTasks.filter(isCriticalTask).length,
      assigned: stackTasks.filter((task) => Boolean(getTaskAssigneeId(task))).length,
    };
  }, [filteredTasks]);

  return (
    <section className="relative w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#141418]/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
      <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute -right-20 top-10 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-white dark:ring-[#141418]" />
              <div className="h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-400/20 flex items-center justify-center shadow-sm">
                <Layers className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-950 dark:text-white">
                  {title}
                </h2>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-400/20 bg-violet-50 dark:bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-200">
                  <Sparkles className="h-3 w-3" />
                  Tasks
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-400/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">
                  <RadioTower className="h-3 w-3" />
                  Live
                </span>
              </div>

              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                {projectId
                  ? `${visibleCount} task${visibleCount === 1 ? "" : "s"} ready${hasFilter ? " in this milestone" : " across this project"}`
                  : "Select a project to build the next execution queue."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {projectId && !showAddForm ? (
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/30 active:translate-y-0"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
            ) : null}

            <button
              type="button"
              onClick={refresh}
              disabled={!projectId || loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-white/70 transition-all hover:bg-slate-200 dark:hover:bg-white/15 disabled:opacity-50"
              title="Refresh tasks"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
              <ListChecks className="h-3.5 w-3.5 text-violet-500" />
              Ready
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {taskSignals.ready}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-400/20 bg-amber-50/60 dark:bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              Blocking
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {taskSignals.blocking}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-400/20 bg-rose-50/60 dark:bg-rose-500/10 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              Critical
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {taskSignals.critical}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-200/80 dark:border-cyan-400/20 bg-cyan-50/60 dark:bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
              <User className="h-3.5 w-3.5" />
              Assigned
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {taskSignals.assigned}
            </div>
          </div>
        </div>

        {showAddForm ? (
          <div className="mt-5 rounded-3xl border border-violet-200 dark:border-violet-400/20 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-violet-500/10 dark:via-white/[0.04] dark:to-cyan-500/10 p-4 shadow-inner">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-white dark:bg-white/10 border border-violet-200 dark:border-violet-400/20 flex items-center justify-center">
                  <CircleDot className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Create execution task
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">
                    Add the next concrete move for this project.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseAddForm}
                className="p-2 rounded-xl text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              ref={addInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Task title…"
              disabled={addingTask}
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-50"
            />

            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[auto_1fr_auto] xl:items-center">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-white/40">
                  Priority
                </span>
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewPriority(opt.value)}
                    disabled={addingTask}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                      newPriority === opt.value ? opt.active : opt.idle
                    } disabled:opacity-50`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-0">
                {memberOptions.length > 0 ? (
                  <>
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-white/35 pointer-events-none" />
                    <select
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                      disabled={addingTask}
                      className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 py-3 pl-9 pr-9 text-xs text-slate-900 dark:text-white outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {memberOptions.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                          {member.role ? ` · ${member.role}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-white/35 pointer-events-none" />
                  </>
                ) : (
                  <>
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-white/35" />
                    <input
                      type="text"
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                      onKeyDown={handleAddKeyDown}
                      placeholder="Optional assignee ID"
                      disabled={addingTask}
                      className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-9 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-50"
                    />
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddTask}
                disabled={addingTask || !newTitle.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700 disabled:translate-y-0 disabled:opacity-40 disabled:hover:bg-violet-600"
              >
                {addingTask ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {addingTask ? "Adding…" : "Add Task"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-xs">
            <div className="font-bold text-red-700 dark:text-red-200">
              Couldn't load tasks
            </div>
            <div className="mt-1 text-red-600/80 dark:text-red-200/70">
              {String(error?.message || error)}
            </div>
          </div>
        ) : null}

        {actionError ? (
          <div className="mt-4 rounded-2xl border border-amber-200 dark:border-yellow-500/30 bg-amber-50 dark:bg-yellow-500/10 p-4 text-xs">
            <div className="font-bold text-amber-700 dark:text-yellow-200">
              Action failed
            </div>
            <div className="mt-1 text-amber-600/80 dark:text-yellow-200/70">
              {String(actionError?.message || actionError)}
            </div>
          </div>
        ) : null}

        <div className="mt-5 min-h-[140px] rounded-3xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-black/10 p-3 sm:p-4">
          {loading && filteredTasks.length === 0 ? (
            <div className="flex items-center gap-2 p-4 text-xs text-slate-400 dark:text-white/40">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Loading tasks…
            </div>
          ) : null}

          {!loading && filteredTasks.length === 0 ? (
            <div
              onClick={!showAddForm ? handleOpenAddForm : undefined}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-slate-300 dark:border-white/[0.10] bg-white/70 dark:bg-white/[0.03] px-6 py-14 text-center transition-all duration-300 hover:border-violet-300 dark:hover:border-violet-400/30 hover:bg-white dark:hover:bg-white/[0.05]"
            >
              <div className="relative mb-5 h-20 w-20">
                <div className="absolute inset-0 rounded-3xl bg-violet-500/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex h-full w-full items-center justify-center rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/10 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                  <Layers className="h-9 w-9 text-violet-600 dark:text-violet-300" />
                </div>
              </div>

              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                {hasFilter ? "No tasks in this milestone" : "No tasks ready right now."}
              </h3>

              <p className="mx-auto mb-6 max-w-[340px] text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {hasFilter
                  ? "Try another milestone, or assign tasks to this milestone."
                  : "Add the next task your team should act on so this queue becomes your clear next-step view."}
              </p>

              {!hasFilter && projectId && !showAddForm ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all group-hover:-translate-y-0.5 group-hover:bg-violet-700 active:translate-y-0"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Task
                </button>
              ) : null}
            </div>
          ) : null}

          {filteredTasks.length > 0 ? (
            <div className="space-y-2">
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
          ) : null}
        </div>
      </div>
    </section>
  );
}
