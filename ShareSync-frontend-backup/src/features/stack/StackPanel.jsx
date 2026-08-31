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
import MoveTaskDetailDrawer from "./MoveTaskDetailDrawer";
import { useStackTasks } from "./useStackTasks";
import { completeTask, moveTask, updateTask, deleteTask } from "../../api/taskApi";
import { createTask, listTasks } from "../../api/tasks";
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

function getTaskActionErrorMessage(error) {
  const raw =
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    error;

  if (Array.isArray(raw)) {
    return raw.join(" • ");
  }

  if (typeof raw === "string" && raw.trim()) {
    return raw;
  }

  if (
    raw &&
    typeof raw === "object" &&
    typeof raw.message === "string"
  ) {
    return raw.message;
  }

  return "The task action could not be completed.";
}

function getTaskId(task) {
  return task?.id || task?._id || "";
}

function normalizeStatus(status) {
  return (status || "").toLowerCase();
}

function isInStack(task) {
  if (!task) return false;

  if (
    task?.completed === true ||
    task?.isCompleted === true ||
    Boolean(task?.completedAt)
  ) {
    return false;
  }

  const status = normalizeStatus(task?.status)
    .trim()
    .replace(/[\s-]+/g, "_");

  return ![
    "done",
    "completed",
    "complete",
    "cancelled",
    "canceled",
    "archived",
  ].includes(status);
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
  const status = normalizeStatus(task?.status)
    .trim()
    .replace(/[\s-]+/g, "_");

  const blockerCollections = [
    task?.blockers,
    task?.blockedBy,
    task?.blockingDependencies,
  ];

  return Boolean(
    task?.isBlocking ||
      task?.blocking ||
      task?.blocked ||
      task?.blockingReason ||
      task?.blockedReason ||
      status === "blocked" ||
      status === "blocking" ||
      blockerCollections.some(
        (value) =>
          Array.isArray(value) &&
          value.length > 0
      )
  );
}

function isCriticalTask(task) {
  return String(task?.priority || "").toLowerCase() === "critical";
}

function getMemberName(member) {
  const user =
    member?.userId && typeof member.userId === "object"
      ? member.userId
      : member?.user && typeof member.user === "object"
        ? member.user
        : member?.memberId && typeof member.memberId === "object"
          ? member.memberId
          : member?.member && typeof member.member === "object"
            ? member.member
            : member;

  const directName =
    member?.name ||
    member?.fullName ||
    member?.displayName ||
    [member?.firstName, member?.lastName].filter(Boolean).join(" ").trim();

  const userName =
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

  return (
    directName ||
    userName ||
    user?.username ||
    member?.username ||
    user?.email ||
    member?.email ||
    "Team member"
  );
}

function normalizeMemberOptions(list) {
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const normalized = [];

  for (const member of list) {
    const user =
      member?.userId && typeof member.userId === "object"
        ? member.userId
        : member?.user && typeof member.user === "object"
          ? member.user
          : member?.memberId && typeof member.memberId === "object"
            ? member.memberId
            : member?.member && typeof member.member === "object"
              ? member.member
              : member;

    const id = normalizeId(
      member?.userId ||
        member?.memberId ||
        member?.user ||
        member?.member ||
        user?._id ||
        user?.id ||
        member?.id ||
        member?._id
    );

    if (!id || seen.has(id)) continue;

    seen.add(id);
    normalized.push({
      id,
      name: getMemberName(member),
      email: user?.email || member?.email || "",
      role: member?.displayRole || member?.role || user?.role || "",
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
  finishLineFilter = null,
  readOnly = false,
} = {}) {
  // historical-board-stack-readonly-v1
  const { tasks, loading, error, refresh, setTasks } = useStackTasks({
    projectId,
    assigneeId,
    limit,
    socket,
    enabled: true,
  });

  const [actionError, setActionError] = useState(null);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [dependenciesLoading, setDependenciesLoading] = useState(false);
  const [dependenciesError, setDependenciesError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const addInputRef = useRef(null);

  const safeTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);
  const [fallbackTeamMembers, setFallbackTeamMembers] = useState([]);
  const selectedTaskId = getTaskId(selectedTask);

  useEffect(() => {
    if (!projectId || !selectedTaskId) {
      setProjectTasks([]);
      setDependenciesError("");
      setDependenciesLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function loadProjectTasksForDependencies() {
      setDependenciesLoading(true);
      setDependenciesError("");

      try {
        const loadedTasks = await listTasks(projectId);

        if (!cancelled) {
          setProjectTasks(
            Array.isArray(loadedTasks)
              ? loadedTasks
              : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setProjectTasks([]);
          setDependenciesError(
            getTaskActionErrorMessage(error)
          );
        }
      } finally {
        if (!cancelled) {
          setDependenciesLoading(false);
        }
      }
    }

    loadProjectTasksForDependencies();

    return () => {
      cancelled = true;
    };
  }, [projectId, selectedTaskId]);

  useEffect(() => {
    if (!projectId) {
      setFallbackTeamMembers([]);
      return;
    }

    let cancelled = false;

    async function loadProjectMembersForPicker() {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken") ||
          JSON.parse(localStorage.getItem("auth") || "{}")?.token ||
          JSON.parse(localStorage.getItem("user") || "{}")?.token;

        const apiBase = (
          import.meta.env.VITE_API_URL ||
          import.meta.env.VITE_BACKEND_URL ||
          "https://openshare-backend.onrender.com/api"
        ).replace(/\/$/, "");

        const res = await fetch(`${apiBase}/projects/${projectId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) return;

        const body = await res.json();
        const projectPayload = body?.data || body?.project || body;

        const members = Array.isArray(projectPayload?.members) ? projectPayload.members : [];
        const owners = [
          projectPayload?.owner,
          projectPayload?.ownerId,
          projectPayload?.createdBy,
          projectPayload?.createdById,
        ].filter(Boolean);

        if (!cancelled) {
          setFallbackTeamMembers([...members, ...owners]);
        }
      } catch {
        if (!cancelled) setFallbackTeamMembers([]);
      }
    }

    loadProjectMembersForPicker();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const effectiveTeamMembers = useMemo(
    () => [
      ...(Array.isArray(teamMembers) ? teamMembers : []),
      ...fallbackTeamMembers,
    ],
    [teamMembers, fallbackTeamMembers]
  );

  const memberOptions = useMemo(
    () => normalizeMemberOptions(effectiveTeamMembers),
    [effectiveTeamMembers]
  );

  const normalizedPanelAssigneeId = useMemo(() => normalizeId(assigneeId), [assigneeId]);
  const normalizedMilestoneId = useMemo(() => normalizeId(milestoneIdFilter), [milestoneIdFilter]);

  // finish-line-moves-filter-v1
  const normalizedFinishLineFilter = useMemo(
    () =>
      String(finishLineFilter || "")
        .trim()
        .toLowerCase(),
    [finishLineFilter]
  );

  const filteredTasks = useMemo(() => {
    let nextTasks = safeTasks;

    if (normalizedMilestoneId) {
      nextTasks = nextTasks.filter(
        (task) =>
          normalizeId(task?.milestoneId) ===
          normalizedMilestoneId
      );
    }

    if (normalizedFinishLineFilter === "remaining") {
      return nextTasks.filter(isInStack);
    }

    if (normalizedFinishLineFilter === "blocked") {
      return nextTasks.filter(
        (task) =>
          isInStack(task) &&
          isBlockingTask(task)
      );
    }

    return nextTasks;
  }, [
    safeTasks,
    normalizedMilestoneId,
    normalizedFinishLineFilter,
  ]);

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
      if (!id) return false;

      setActionBusyId(id);

      optimisticUpdate((prev) =>
        prev.filter((t) => getTaskId(t) !== id)
      );

      try {
        await completeTask(id, {});

        try {
          const loadedTasks = await listTasks(projectId);

          setProjectTasks(
            Array.isArray(loadedTasks)
              ? loadedTasks
              : []
          );
        } catch {}

        return true;
      } catch (e) {
        setActionError(e);
        await refresh();
        return false;
      } finally {
        setActionBusyId(null);
      }
    },
    [optimisticUpdate, projectId, refresh]
  );

  const handleOpenTaskDetail = useCallback((task) => {
    if (!task) return;

    setActionError(null);
    setSelectedTask(task);
  }, []);

  const handleCloseTaskDetail = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleEditTask = useCallback(
    async (task, updates = {}) => {
      setActionError(null);

      const id = getTaskId(task);
      if (!id) return null;

      const cleanUpdates = {};

      for (const [key, value] of Object.entries(updates || {})) {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      }

      if (!Object.keys(cleanUpdates).length) {
        return task;
      }

      setActionBusyId(id);

      // Text updates are rendered only after backend moderation succeeds.
      try {
        const updated = await updateTask(id, cleanUpdates);
        const nextTask = {
          ...task,
          ...cleanUpdates,
          ...(updated || {}),
        };

        optimisticUpdate((prev) =>
          prev.map((currentTask) =>
            getTaskId(currentTask) === id
              ? { ...currentTask, ...nextTask }
              : currentTask
          )
        );

        setProjectTasks((previousTasks) =>
          (Array.isArray(previousTasks) ? previousTasks : []).map(
            (currentTask) =>
              getTaskId(currentTask) === id
                ? { ...currentTask, ...nextTask }
                : currentTask
          )
        );

        setSelectedTask((currentTask) =>
          getTaskId(currentTask) === id
            ? { ...currentTask, ...nextTask }
            : currentTask
        );

        return nextTask;
      } catch (e) {
        setActionError(e);
        await refresh();
        return null;
      } finally {
        setActionBusyId(null);
      }
    },
    [optimisticUpdate, refresh]
  );

  const handleDeleteTask = useCallback(
    async (task) => {
      setActionError(null);
      const id = getTaskId(task);
      if (!id) return;

      const taskTitle = task?.title || task?.name || "this task";
      const confirmed = window.confirm(`Delete "${taskTitle}"? This cannot be undone.`);
      if (!confirmed) return;

      setActionBusyId(id);

      optimisticUpdate((prev) => prev.filter((t) => getTaskId(t) !== id));

      try {
        await deleteTask(id);

        setProjectTasks((previousTasks) =>
          (Array.isArray(previousTasks) ? previousTasks : []).filter(
            (currentTask) =>
              getTaskId(currentTask) !== id
          )
        );
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

      const rawAssigneeValue = String(newAssigneeId || "").trim();
      const normalizedRawAssigneeId = normalizeId(rawAssigneeValue);
      const rawAssigneeLookup = rawAssigneeValue.toLowerCase();

      const matchedAssignee = rawAssigneeValue
        ? memberOptions.find((member) => {
            const memberId = normalizeId(member?.id);
            const memberName = String(member?.name || "").trim().toLowerCase();
            const memberEmail = String(member?.email || "").trim().toLowerCase();

            return (
              memberId === normalizedRawAssigneeId ||
              memberName === rawAssigneeLookup ||
              memberEmail === rawAssigneeLookup
            );
          })
        : null;

      const effectiveAssigneeId =
        normalizeId(matchedAssignee?.id || normalizedRawAssigneeId) ||
        normalizedPanelAssigneeId ||
        "";
      const effectiveMilestoneId = normalizedMilestoneId || "";

      // Do not render user text until backend moderation accepts it.
      try {
        const created = await createTask(projectId, {
          title: trimmed,
          status: "todo",
          priority: newPriority,
          ...(effectiveAssigneeId
            ? { assigneeId: effectiveAssigneeId }
            : {}),
          ...(effectiveMilestoneId
            ? { milestoneId: effectiveMilestoneId }
            : {}),
        });

        const createdId = getTaskId(created);

        setTasks((prev) =>
          sortLikeBackend([
            created,
            ...(Array.isArray(prev) ? prev : []).filter(
              (task) =>
                !createdId ||
                getTaskId(task) !== createdId
            ),
          ])
        );

        setNewTitle("");
      } catch (e) {
        setActionError(e);
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
      memberOptions,
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

  const hasFilter = Boolean(
    normalizedMilestoneId ||
      normalizedFinishLineFilter
  );

  const emptyStateTitle =
    normalizedFinishLineFilter === "blocked"
      ? "No blocked moves"
      : normalizedFinishLineFilter === "remaining"
        ? "No moves remaining"
        : normalizedMilestoneId
          ? "No tasks in this milestone"
          : "No tasks ready right now.";

  const emptyStateCopy =
    normalizedFinishLineFilter === "blocked"
      ? "Nothing in the current execution queue is blocked."
      : normalizedFinishLineFilter === "remaining"
        ? "Every move in this project is complete."
        : normalizedMilestoneId
          ? "Try another milestone, or assign tasks to this milestone."
          : "Add the next task your team should act on so this queue becomes your clear next-step view.";

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
    <>
      <style className="stack-command-style">
        {`
          .stack-command-panel {
            isolation: isolate;
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 84% 4%, rgba(34, 211, 238, 0.14), transparent 32%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.86)) !important;
            border-color: rgba(124, 58, 237, 0.22) !important;
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.14),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .stack-command-panel {
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 84% 4%, rgba(34, 211, 238, 0.13), transparent 32%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.92)) !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
            box-shadow:
              0 30px 100px rgba(0, 0, 0, 0.48),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .stack-command-rail {
            height: 5px !important;
            background: linear-gradient(90deg, #8b5cf6 0%, #38bdf8 42%, #34d399 100%) !important;
            box-shadow:
              0 0 22px rgba(139, 92, 246, 0.42),
              0 0 26px rgba(34, 211, 238, 0.30);
          }

          .stack-command-header {
            border-radius: 24px;
            padding: 14px;
            background: rgba(255, 255, 255, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.58);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.70);
          }

          .dark .stack-command-header {
            background: rgba(15, 23, 42, 0.40);
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .stack-command-icon {
            background:
              radial-gradient(circle at 30% 18%, rgba(255,255,255,0.92), transparent 34%),
              linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(34, 211, 238, 0.12)) !important;
            box-shadow:
              0 16px 34px rgba(124, 58, 237, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
          }

          .dark .stack-command-icon {
            background:
              radial-gradient(circle at 30% 18%, rgba(255,255,255,0.18), transparent 34%),
              linear-gradient(135deg, rgba(139, 92, 246, 0.24), rgba(34, 211, 238, 0.14)) !important;
            box-shadow:
              0 16px 38px rgba(124, 58, 237, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .stack-command-title {
            letter-spacing: -0.02em;
          }

          .stack-primary-button,
          .stack-composer-add-button,
          .stack-first-task-button {
            color: #ffffff !important;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            border: 1px solid rgba(221, 214, 254, 0.78) !important;
            box-shadow:
              0 16px 34px rgba(109, 40, 217, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
          }

          .stack-primary-button:hover,
          .stack-composer-add-button:hover,
          .stack-first-task-button:hover {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%) !important;
            box-shadow:
              0 20px 44px rgba(109, 40, 217, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
          }

          .stack-primary-button svg,
          .stack-composer-add-button svg,
          .stack-first-task-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }


          /* FORCE VISIBLE EMPTY-STATE CTA */
          .stack-first-task-button-force-purple {
            min-width: 210px !important;
            min-height: 52px !important;
            color: #ffffff !important;
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 32%, #7c3aed 66%, #6d28d9 100%) !important;
            border: 1px solid rgba(221, 214, 254, 0.95) !important;
            box-shadow:
              0 18px 42px rgba(109, 40, 217, 0.42),
              0 0 0 1px rgba(255, 255, 255, 0.18) inset,
              inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
            opacity: 1 !important;
            text-shadow: 0 1px 2px rgba(49, 17, 101, 0.42) !important;
          }

          .stack-first-task-button-force-purple:hover {
            color: #ffffff !important;
            background: linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 34%, #7c3aed 68%, #5b21b6 100%) !important;
            border-color: rgba(237, 233, 254, 1) !important;
            box-shadow:
              0 24px 54px rgba(109, 40, 217, 0.52),
              0 0 0 1px rgba(255, 255, 255, 0.22) inset,
              inset 0 1px 0 rgba(255, 255, 255, 0.36) !important;
          }

          .dark .stack-first-task-button-force-purple {
            color: #ffffff !important;
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 35%, #7c3aed 70%, #6d28d9 100%) !important;
            border-color: rgba(196, 181, 253, 0.92) !important;
            box-shadow:
              0 20px 56px rgba(139, 92, 246, 0.42),
              0 0 28px rgba(139, 92, 246, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
          }

          .stack-first-task-button-force-purple span,
          .stack-first-task-button-force-purple svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
            fill: none !important;
            opacity: 1 !important;
          }

          .stack-refresh-button {
            background: rgba(255, 255, 255, 0.82) !important;
            border: 1px solid rgba(148, 163, 184, 0.30) !important;
            box-shadow:
              0 12px 26px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
          }

          .dark .stack-refresh-button {
            background: rgba(255, 255, 255, 0.08) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 14px 30px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .stack-signal-card {
            position: relative;
            overflow: hidden;
            min-height: 94px;
            backdrop-filter: blur(18px);
            box-shadow:
              0 14px 34px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72);
            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              border-color 180ms ease;
          }

          .stack-signal-card::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.36), transparent 62%);
            opacity: 0.85;
          }

          .dark .stack-signal-card {
            box-shadow:
              0 16px 38px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .dark .stack-signal-card::before {
            background:
              radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.12), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.04), transparent 62%);
            opacity: 1;
          }

          .stack-signal-card:hover {
            transform: translateY(-2px);
            box-shadow:
              0 20px 46px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.76);
          }

          .dark .stack-signal-card:hover {
            box-shadow:
              0 22px 52px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .stack-signal-card > * {
            position: relative;
            z-index: 1;
          }

          .stack-signal-ready {
            border-top: 3px solid rgba(139, 92, 246, 0.82) !important;
          }

          .stack-signal-blocking {
            border-top: 3px solid rgba(245, 158, 11, 0.82) !important;
          }

          .stack-signal-critical {
            border-top: 3px solid rgba(244, 63, 94, 0.82) !important;
          }

          .stack-signal-assigned {
            border-top: 3px solid rgba(6, 182, 212, 0.82) !important;
          }

          .stack-task-composer {
            box-shadow:
              0 18px 46px rgba(124, 58, 237, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.76);
          }

          .dark .stack-task-composer {
            box-shadow:
              0 20px 50px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .stack-task-list-shell {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(248, 250, 252, 0.48)) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.72),
              0 16px 42px rgba(15, 23, 42, 0.06);
          }

          .dark .stack-task-list-shell {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.42), rgba(2, 6, 23, 0.24)) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.06),
              0 18px 46px rgba(0, 0, 0, 0.30);
          }

          .stack-task-row {
            overflow: hidden;
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.08), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.90)) !important;
            box-shadow:
              0 10px 26px rgba(15, 23, 42, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.78);
          }

          .dark .stack-task-row {
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.13), transparent 34%),
              linear-gradient(135deg, rgba(30, 41, 59, 0.66), rgba(15, 23, 42, 0.48)) !important;
            box-shadow:
              0 12px 30px rgba(0, 0, 0, 0.32),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .stack-task-row::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(90deg, rgba(139, 92, 246, 0.10), transparent 26%);
            opacity: 0;
            transition: opacity 180ms ease;
          }

          .stack-task-row:hover {
            transform: translateY(-1px);
            border-color: rgba(139, 92, 246, 0.28) !important;
            box-shadow:
              0 16px 38px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.82);
          }

          .dark .stack-task-row:hover {
            border-color: rgba(139, 92, 246, 0.34) !important;
            box-shadow:
              0 18px 44px rgba(0, 0, 0, 0.44),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .stack-task-row:hover::before {
            opacity: 1;
          }

          .stack-task-row-inner {
            position: relative;
            z-index: 1;
          }

          .stack-task-title {
            letter-spacing: -0.01em;
          }

          .stack-task-complete-button {
            padding: 2px;
            border-radius: 999px;
          }

          .stack-task-action {
            min-width: 82px;
            min-height: 38px;
            border-radius: 14px !important;
            border: 1px solid rgba(221, 214, 254, 0.70) !important;
            box-shadow:
              0 12px 28px rgba(109, 40, 217, 0.26),
              inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              background 180ms ease;
          }

          .stack-task-action:hover {
            transform: translateY(-1px);
            box-shadow:
              0 16px 34px rgba(109, 40, 217, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
          }

          .stack-start-action {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
          }

          .stack-review-action {
            background: linear-gradient(135deg, #38bdf8 0%, #2563eb 52%, #1d4ed8 100%) !important;
          }

          .stack-task-action,
          .stack-task-action span,
          .stack-task-action svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }

          /* moves-ios-form-focus-v1
             Prevent iOS/WKWebView viewport zoom when a Moves composer
             form control receives focus. Keep this scoped to the inline
             composer so desktop and unrelated forms remain untouched. */
          @media (max-width: 767px) {
            .stack-task-composer input,
            .stack-task-composer select,
            .stack-task-composer textarea {
              font-size: 16px !important;
            }
          }
        `}
      </style>

      <section className="stack-command-panel relative w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#141418]/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="stack-command-rail absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
      <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute -right-20 top-10 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative p-5 sm:p-6">
        <div className="stack-command-header flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-white dark:ring-[#141418]" />
              <div className="stack-command-icon h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-400/20 flex items-center justify-center shadow-sm">
                <Layers className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="stack-command-title text-base font-black text-slate-950 dark:text-white">
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
            {projectId && !showAddForm && !readOnly ? (
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="stack-primary-button relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-xs font-black text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.28), 0 16px 36px rgba(109,40,217,0.38)',
                  }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/80"
                />
                <Plus className="relative z-10 h-4 w-4 text-white drop-shadow-sm" />
                <span className="relative z-10 text-white drop-shadow-sm">
                  Add Task
                </span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={refresh}
              disabled={!projectId || loading}
              className="stack-refresh-button inline-flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-white/80 transition-all hover:-translate-y-0.5 hover:bg-slate-200 dark:hover:bg-white/15 disabled:translate-y-0 disabled:opacity-50"
              title="Refresh tasks"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="stack-signal-card stack-signal-ready rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
              <ListChecks className="h-3.5 w-3.5 text-violet-500" />
              Ready
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {taskSignals.ready}
            </div>
          </div>

          <div className="stack-signal-card stack-signal-blocking rounded-2xl border border-amber-200/80 dark:border-amber-400/20 bg-amber-50/60 dark:bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              Blocking
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {taskSignals.blocking}
            </div>
          </div>

          <div className="stack-signal-card stack-signal-critical rounded-2xl border border-rose-200/80 dark:border-rose-400/20 bg-rose-50/60 dark:bg-rose-500/10 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              Critical
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {taskSignals.critical}
            </div>
          </div>

          <div className="stack-signal-card stack-signal-assigned rounded-2xl border border-cyan-200/80 dark:border-cyan-400/20 bg-cyan-50/60 dark:bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
              <User className="h-3.5 w-3.5" />
              Assigned
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {taskSignals.assigned}
            </div>
          </div>
        </div>

        {!readOnly && showAddForm ? (
          <div className="stack-task-composer mt-5 rounded-3xl border border-violet-200 dark:border-violet-400/20 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-violet-500/10 dark:via-white/[0.04] dark:to-cyan-500/10 p-4 shadow-inner">
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
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-50"
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
                      className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 py-3 pl-9 pr-9 text-base md:text-xs text-slate-900 dark:text-white outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-50"
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
                      className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-9 py-3 text-base md:text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-50"
                    />
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddTask}
                disabled={addingTask || !newTitle.trim()}
                className="stack-composer-add-button relative isolate inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3 text-xs font-black text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      addingTask || !newTitle.trim()
                        ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                    boxShadow:
                      addingTask || !newTitle.trim()
                        ? 'inset 0 1px 0 rgba(255,255,255,0.24), 0 10px 24px rgba(109,40,217,0.20)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.28), 0 16px 36px rgba(109,40,217,0.38)',
                    opacity: addingTask || !newTitle.trim() ? 0.76 : 1,
                  }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/80"
                />

                {addingTask ? (
                  <RefreshCw className="relative z-10 h-4 w-4 animate-spin text-white drop-shadow-sm" />
                ) : (
                  <Plus className="relative z-10 h-4 w-4 text-white drop-shadow-sm" />
                )}

                <span className="relative z-10 whitespace-nowrap text-white drop-shadow-sm">
                  {addingTask ? "Adding…" : "Add Task"}
                </span>
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
              {getTaskActionErrorMessage(actionError)}
            </div>
          </div>
        ) : null}

        <div className="stack-task-list-shell mt-5 min-h-[140px] rounded-3xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-black/10 p-3 sm:p-4">
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
                {emptyStateTitle}
              </h3>

              <p className="mx-auto mb-6 max-w-[340px] text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {emptyStateCopy}
              </p>

              {!hasFilter && projectId && !showAddForm && !readOnly ? (
                <button
                  type="button"
                  data-openshare-empty-cta="moves-first-task-v3"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAddForm();
                  }}
                  className="inline-flex min-h-[52px] min-w-[220px] items-center justify-center gap-2 rounded-2xl border !border-violet-500 !bg-violet-600 px-7 py-3.5 text-sm font-black !text-white shadow-xl shadow-violet-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:!bg-violet-700 hover:shadow-violet-500/55 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:!border-violet-300 dark:!bg-violet-500 dark:!text-white dark:shadow-violet-500/45 dark:hover:!bg-violet-400 dark:focus-visible:ring-offset-slate-950"
                  style={{
                    backgroundColor: "#7c3aed",
                    backgroundImage:
                      "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 34%, #7c3aed 68%, #6d28d9 100%)",
                    color: "#ffffff",
                    borderColor: "#8b5cf6",
                    boxShadow:
                      "0 20px 48px rgba(109,40,217,0.46), inset 0 1px 0 rgba(255,255,255,0.34)",
                  }}
                >
                  <Plus className="h-4 w-4 text-white" />
                  <span className="whitespace-nowrap text-white">
                    Add Your First Task
                  </span>
                </button>
              ) : null}
            </div>
          ) : null}

          {filteredTasks.length > 0 ? (
            <div className="space-y-2">
              {filteredTasks.map((t) => {
                const id = getTaskId(t);
                const rowDisabled = !projectId || actionBusyId === id;
                const taskAssigneeId = getTaskAssigneeId(t);
                const matchedAssigneeOption = taskAssigneeId
                  ? memberOptions.find((member) => normalizeId(member?.id) === taskAssigneeId)
                  : null;

                const displayTask = matchedAssigneeOption?.name
                  ? {
                      ...t,
                      assigneeName: matchedAssigneeOption.name,
                      assigneeEmail: matchedAssigneeOption.email || t?.assigneeEmail,
                    }
                  : t;

                return (
                  <StackTaskRow
                    key={id || Math.random()}
                    task={displayTask}
                    disabled={rowDisabled}
                    readOnly={readOnly}
                    onStart={readOnly ? undefined : handleStart}
                    onMoveToReview={
                      readOnly
                        ? undefined
                        : handleMoveToReview
                    }
                    onComplete={
                      readOnly
                        ? undefined
                        : handleComplete
                    }
                    onEdit={
                      readOnly
                        ? undefined
                        : handleEditTask
                    }
                    onOpenDetail={handleOpenTaskDetail}
                    onDelete={
                      readOnly
                        ? undefined
                        : handleDeleteTask
                    }
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      </section>

      <MoveTaskDetailDrawer
        open={Boolean(selectedTask)}
        task={selectedTask}
        members={memberOptions}
        projectTasks={projectTasks}
        dependenciesLoading={dependenciesLoading}
        dependenciesError={dependenciesError}
        disabled={
          Boolean(selectedTask) &&
          actionBusyId === getTaskId(selectedTask)
        }
        readOnly={readOnly}
        onClose={handleCloseTaskDetail}
        onSave={readOnly ? undefined : handleEditTask}
        onComplete={readOnly ? undefined : handleComplete}
      />
    </>
  );
}
