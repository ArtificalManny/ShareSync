// src/hooks/useProjectOverview.js
// ═══════════════════════════════════════════════════════════════════════════════
// Hook: Main Data Hook for ProjectHome
//
// OVERVIEW SYSTEM PASS:
// - Builds one normalized `overview` snapshot for ProjectHome
// - Keeps /projects/:id/overview as the primary source when available
// - Keeps /projects/:id as the richer fallback envelope
// - Keeps /pulse as supplemental heartbeat data only
// - Preserves existing return fields for compatibility
// - Adds `refreshSilently()` for realtime/concurrent-user updates
//
// NO BACKEND CHANGES IN THIS PASS
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getProjectPulse } from "../api/projectOverview";
import { apiRequest } from "../utils/api";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getTaskStatus(task) {
  return String(task?.status || task?.state || task?.lane || "").toLowerCase();
}

function isTaskDone(task) {
  const status = getTaskStatus(task);
  return status === "done" || status === "completed" || status === "archived";
}

function isTaskInMotion(task) {
  const status = getTaskStatus(task);
  return (
    status === "in_progress" ||
    status === "doing" ||
    status === "active" ||
    status === "review"
  );
}

function isTaskReady(task) {
  const status = getTaskStatus(task);
  return (
    status === "todo" ||
    status === "to_do" ||
    status === "backlog" ||
    status === "planned" ||
    status === "ready" ||
    status === "queued"
  );
}

function isTaskBlocked(task) {
  const statusValue = getTaskStatus(task);

  return Boolean(
    task?.isBlocked ||
      task?.blocked ||
      task?.hasBlocker ||
      task?.blockedBy ||
      statusValue.includes("block") ||
      (Array.isArray(task?.blockers) && task.blockers.length > 0)
  );
}

function getDueTime(task) {
  if (!task?.dueDate) return Number.POSITIVE_INFINITY;
  const value = new Date(task.dueDate).getTime();
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function isSameCalendarDay(dateLikeA, dateLikeB = new Date()) {
  if (!dateLikeA) return false;

  const a = new Date(dateLikeA);
  const b = new Date(dateLikeB);

  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function countTodayCompleted(tasks = []) {
  return tasks.reduce((count, task) => {
    if (!isTaskDone(task)) return count;

    const completedAt =
      task?.completedAt ||
      task?.doneAt ||
      task?.updatedAt ||
      task?.finishedAt ||
      null;

    return count + (isSameCalendarDay(completedAt) ? 1 : 0);
  }, 0);
}

function countCompletedThisWeek(tasks = []) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return tasks.reduce((count, task) => {
    if (!isTaskDone(task)) return count;

    const completedAt =
      task?.completedAt ||
      task?.doneAt ||
      task?.updatedAt ||
      task?.finishedAt ||
      null;

    if (!completedAt) return count;

    const completedDate = new Date(completedAt);
    if (Number.isNaN(completedDate.getTime())) return count;

    return count + (completedDate >= sevenDaysAgo ? 1 : 0);
  }, 0);
}

function normalizePerson(personLike, fallbackRole = "member") {
  if (!personLike) return null;

  const user = personLike?.user || personLike?.userId || personLike;
  const id = String(user?._id || user?.id || user || "");

  if (!id) return null;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

  return {
    id,
    role: personLike?.role || fallbackRole,
    name:
      user?.name ||
      fullName ||
      user?.username ||
      user?.email ||
      "Member",
    email: user?.email || personLike?.email || "",
    avatarUrl:
      user?.avatarUrl ||
      user?.profilePicture ||
      user?.avatar ||
      user?.photoUrl ||
      "",
  };
}

function normalizeProjectMembers(project) {
  if (!project) return [];

  const owner = project.owner || project.ownerId || null;
  const members = Array.isArray(project.members) ? project.members : [];

  const normalized = [];
  const ownerUser = normalizePerson(owner, "owner");

  if (ownerUser) {
    normalized.push(ownerUser);
  } else if (owner) {
    const ownerId = String(owner?._id || owner?.id || owner || "");
    if (ownerId) {
      normalized.push({
        id: ownerId,
        role: "owner",
        name: "Project Owner",
        email: "",
        avatarUrl: "",
      });
    }
  }

  members.forEach((member) => {
    const normalizedMember = normalizePerson(member, member?.role || "member");
    if (!normalizedMember) return;

    if (ownerUser && normalizedMember.id === ownerUser.id) return;

    normalized.push(normalizedMember);
  });

  const seen = new Set();
  return normalized.filter((member) => {
    if (!member?.id) return false;
    if (seen.has(member.id)) return false;
    seen.add(member.id);
    return true;
  });
}

function priorityRank(priority) {
  const value = String(priority || "").toLowerCase();

  if (value === "critical") return 4;
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

function deriveCriticalMoves(tasks = [], backendCriticalMoves = []) {
  if (Array.isArray(backendCriticalMoves) && backendCriticalMoves.length > 0) {
    return backendCriticalMoves;
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  const actionable = tasks.filter((task) => !isTaskDone(task));

  return [...actionable]
    .sort((a, b) => {
      const blockedDelta = Number(isTaskBlocked(b)) - Number(isTaskBlocked(a));
      if (blockedDelta !== 0) return blockedDelta;

      const priorityDelta = priorityRank(b?.priority) - priorityRank(a?.priority);
      if (priorityDelta !== 0) return priorityDelta;

      const aInProgress = Number(isTaskInMotion(a));
      const bInProgress = Number(isTaskInMotion(b));
      if (bInProgress !== aInProgress) return bInProgress - aInProgress;

      const dueDelta = getDueTime(a) - getDueTime(b);
      if (dueDelta !== 0) return dueDelta;

      return String(a?.title || a?.name || "").localeCompare(
        String(b?.title || b?.name || "")
      );
    })
    .slice(0, 5)
    .map((task) => ({
      ...task,
      title: task?.title || task?.name || task?.label || "Priority task",
    }));
}

function firstNonEmptyArray(...candidates) {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }
  return [];
}

function firstArray(...candidates) {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
}

function normalizeProjectEnvelope(overviewPayload, rawProjectPayload) {
  const rawProject =
    rawProjectPayload?.project ||
    rawProjectPayload ||
    {};

  const overviewProject =
    overviewPayload?.project ||
    {};

  const mergedProject = {
    ...rawProject,
    ...overviewProject,
    owner:
      rawProject?.owner ||
      rawProject?.ownerId ||
      overviewProject?.owner ||
      overviewProject?.ownerId ||
      null,
    ownerId:
      rawProject?.ownerId ||
      rawProject?.owner ||
      overviewProject?.ownerId ||
      overviewProject?.owner ||
      null,
    members: Array.isArray(rawProject?.members)
      ? rawProject.members
      : Array.isArray(overviewProject?.members)
        ? overviewProject.members
        : [],
  };

  return {
    ...overviewPayload,
    project: mergedProject,
    tasks: firstNonEmptyArray(
      overviewPayload?.tasks,
      rawProject?.tasks,
      overviewProject?.tasks
    ),
    activity: firstArray(
      overviewPayload?.activity,
      overviewPayload?.recentActivity,
      rawProject?.activity,
      rawProject?.recentActivity
    ),
    milestones: firstArray(
      overviewPayload?.milestones,
      rawProject?.milestones
    ),
    events: firstArray(
      overviewPayload?.events,
      rawProject?.events
    ),
    threads: firstArray(
      overviewPayload?.threads,
      rawProject?.threads
    ),
    files: firstArray(
      overviewPayload?.files,
      rawProject?.files
    ),
    objectives: firstArray(
      overviewPayload?.objectives,
      rawProject?.objectives
    ),
    announcements: firstArray(
      overviewPayload?.announcements,
      rawProject?.announcements
    ),
    pinnedAnnouncement:
      overviewPayload?.pinnedAnnouncement ||
      overviewPayload?.announcement ||
      rawProject?.pinnedAnnouncement ||
      rawProject?.announcement ||
      null,
  };
}

function getOwnerDisplayName(project) {
  const owner = project?.owner || project?.ownerId || null;

  if (!owner) return "Owner not set";
  if (typeof owner === "string") return owner;

  const fullName = [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim();

  return (
    owner?.name ||
    fullName ||
    owner?.username ||
    owner?.email ||
    "Project Owner"
  );
}

function getTaskOwner(task) {
  const assignee =
    task?.assignee ||
    task?.assigneeUser ||
    task?.owner ||
    task?.ownerId ||
    task?.user ||
    null;

  if (!assignee) return null;

  if (typeof assignee === "string") {
    return {
      ownerId: assignee,
      ownerName: assignee,
    };
  }

  const fullName = [assignee?.firstName, assignee?.lastName].filter(Boolean).join(" ").trim();

  return {
    ownerId: String(assignee?._id || assignee?.id || ""),
    ownerName:
      assignee?.name ||
      fullName ||
      assignee?.username ||
      assignee?.email ||
      "Assigned owner",
  };
}

function buildNextAction(backendNextAction, criticalMoves = [], tasks = []) {
  if (backendNextAction?.title || backendNextAction?.label || backendNextAction?.text) {
    return {
      ...backendNextAction,
      id: backendNextAction?.id || backendNextAction?._id || "",
      title:
        backendNextAction?.title ||
        backendNextAction?.label ||
        backendNextAction?.text ||
        "Priority task",
      ownerId: backendNextAction?.ownerId || backendNextAction?.assigneeId || "",
      ownerName:
        backendNextAction?.ownerName ||
        backendNextAction?.assigneeName ||
        "Owner not set",
    };
  }

  const topMove = Array.isArray(criticalMoves) && criticalMoves.length > 0 ? criticalMoves[0] : null;
  if (topMove) {
    const owner = getTaskOwner(topMove);
    return {
      ...topMove,
      id: topMove?._id || topMove?.id || "",
      title: topMove?.title || topMove?.label || topMove?.text || "Priority task",
      ownerId: owner?.ownerId || "",
      ownerName: owner?.ownerName || "Owner not set",
    };
  }

  const firstActionable = Array.isArray(tasks)
    ? tasks.find((task) => !isTaskDone(task))
    : null;

  if (firstActionable) {
    const owner = getTaskOwner(firstActionable);
    return {
      ...firstActionable,
      id: firstActionable?._id || firstActionable?.id || "",
      title:
        firstActionable?.title ||
        firstActionable?.name ||
        firstActionable?.label ||
        "Priority task",
      ownerId: owner?.ownerId || "",
      ownerName: owner?.ownerName || "Owner not set",
    };
  }

  return null;
}

function getMomentumLabel(score) {
  if (score >= 80) return "On Fire";
  if (score >= 60) return "Flowing";
  if (score >= 30) return "Building";
  if (score > 0) return "Warming Up";
  return "Planning";
}

function deriveTeamCapacity(members = [], tasks = [], backendTeamCapacity) {
  if (Array.isArray(backendTeamCapacity) && backendTeamCapacity.length > 0) {
    return backendTeamCapacity;
  }

  if (!Array.isArray(members) || members.length === 0) {
    return [];
  }

  return members.map((member) => {
    const assignedTasks = tasks.filter((task) => {
      const assignee =
        task?.assignee ||
        task?.assigneeUser ||
        task?.owner ||
        task?.ownerId ||
        task?.user ||
        null;

      const assigneeId = String(assignee?._id || assignee?.id || assignee || "");
      return assigneeId && assigneeId === String(member.id);
    });

    const openAssigned = assignedTasks.filter((task) => !isTaskDone(task));
    const blockedAssigned = assignedTasks.filter((task) => isTaskBlocked(task));

    const load = clamp(openAssigned.length * 20 + blockedAssigned.length * 10, 0, 100);

    return {
      userId: member.id,
      name: member.name,
      capacity: 100,
      load,
      assignedCount: openAssigned.length,
      blockedCount: blockedAssigned.length,
    };
  });
}

function buildForesight(data, activityCount) {
  if (data?.foresight && typeof data.foresight === "object") {
    return {
      enabled: Boolean(data.foresight.enabled),
      message:
        data.foresight.message ||
        (Boolean(data.foresight.enabled)
          ? "Prediction signals available."
          : "AI predictions are warming up."),
      ...data.foresight,
    };
  }

  if (activityCount >= 7) {
    return {
      enabled: true,
      message: "Prediction signals are forming from recent activity.",
    };
  }

  return {
    enabled: false,
    message: "AI predictions unlock after 7 days of activity.",
  };
}

export function useProjectOverview(projectId, options = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    includePulse = true,
  } = options;

  const [data, setData] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pulseIntervalRef = useRef(null);

  const fetchOverview = useCallback(async () => {
    if (!projectId) return;

    try {
      setError(null);

      let overviewPayload = {};
      try {
        const overviewRes = await apiRequest(`/projects/${projectId}/overview`);
        overviewPayload = overviewRes?.data ?? overviewRes ?? {};
      } catch (overviewErr) {
        const status = overviewErr?.response?.status;
        if (status !== 404) {
          console.warn(
            "[useProjectOverview] /overview fetch issue, continuing with /projects/:id fallback:",
            overviewErr?.message || overviewErr
          );
        }
      }

      const projectRes = await apiRequest(`/projects/${projectId}`);
      const rawProjectPayload = projectRes?.data ?? projectRes ?? {};

      const merged = normalizeProjectEnvelope(overviewPayload, rawProjectPayload);
      setData(merged);
    } catch (err) {
      console.warn(
        "[useProjectOverview] Overview fetch failed:",
        err?.message || err
      );
      setError(err?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchPulse = useCallback(async () => {
    if (!projectId || !includePulse) return;

    try {
      const pulseData = await getProjectPulse(projectId);
      setPulse(pulseData);
    } catch (err) {
      console.warn("[useProjectOverview] Pulse fetch error:", err?.message || err);
    }
  }, [projectId, includePulse]);

  useEffect(() => {
    fetchOverview();
    if (includePulse) fetchPulse();
  }, [fetchOverview, fetchPulse, includePulse]);

  useEffect(() => {
    if (!autoRefresh || !projectId) return;

    const overviewInterval = setInterval(fetchOverview, refreshInterval);

    if (includePulse) {
      pulseIntervalRef.current = setInterval(fetchPulse, 10000);
    }

    return () => {
      clearInterval(overviewInterval);
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
    };
  }, [autoRefresh, projectId, refreshInterval, fetchOverview, fetchPulse, includePulse]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      includePulse ? fetchPulse() : Promise.resolve(),
    ]);
  }, [fetchOverview, fetchPulse, includePulse]);

  const refreshSilently = useCallback(async () => {
    await Promise.all([
      fetchOverview(),
      includePulse ? fetchPulse() : Promise.resolve(),
    ]);
  }, [fetchOverview, fetchPulse, includePulse]);

  const project = useMemo(() => data?.project || null, [data]);

  const activity = useMemo(() => {
    return data?.activity || data?.recentActivity || [];
  }, [data]);

  const tasks = useMemo(() => {
    if (Array.isArray(data?.tasks)) return data.tasks;
    if (Array.isArray(data?.project?.tasks)) return data.project.tasks;
    return [];
  }, [data]);

  const milestones = useMemo(() => data?.milestones || [], [data]);
  const events = useMemo(() => data?.events || [], [data]);
  const threads = useMemo(() => data?.threads || [], [data]);
  const files = useMemo(() => data?.files || [], [data]);
  const objectives = useMemo(() => data?.objectives || [], [data]);

  const overviewMembers = useMemo(() => normalizeProjectMembers(project), [project]);
  const overviewMemberCount = overviewMembers.length;

  const derivedCompletedToday = useMemo(() => countTodayCompleted(tasks), [tasks]);
  const derivedCompletedThisWeek = useMemo(() => countCompletedThisWeek(tasks), [tasks]);
  const derivedInProgress = useMemo(() => tasks.filter((task) => isTaskInMotion(task)).length, [tasks]);
  const derivedBlocked = useMemo(() => tasks.filter((task) => isTaskBlocked(task)).length, [tasks]);
  const derivedCompletedTasks = useMemo(() => tasks.filter((task) => isTaskDone(task)).length, [tasks]);
  const derivedReady = useMemo(() => tasks.filter((task) => isTaskReady(task) && !isTaskDone(task) && !isTaskBlocked(task)).length, [tasks]);

  const pulseData = useMemo(() => {
    const top = data || {};
    const live = pulse || {};
    const topPulse = top?.pulse || {};

    const pickNumber = (...values) => {
      for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
      }
      return undefined;
    };

    return {
      completedToday: pickNumber(
        topPulse?.todayCompleted,
        top?.completedToday,
        live?.completedToday,
        derivedCompletedToday
      ),
      completedThisWeek: pickNumber(
        topPulse?.completedThisWeek,
        top?.completedThisWeek,
        live?.completedThisWeek,
        derivedCompletedThisWeek
      ),
      inProgress: pickNumber(
        topPulse?.inProgress,
        topPulse?.inMotion,
        top?.inProgress,
        live?.inProgress,
        derivedInProgress
      ),
      blocked: pickNumber(
        topPulse?.blocked,
        top?.blocked,
        live?.blocked,
        derivedBlocked
      ),
      ready: pickNumber(
        topPulse?.ready,
        top?.ready,
        live?.ready,
        derivedReady
      ),
      totalTasks: pickNumber(
        topPulse?.totalTasks,
        top?.totalTasks,
        live?.totalTasks,
        tasks.length
      ),
      completedTasks: pickNumber(
        topPulse?.completedTasks,
        top?.completedTasks,
        live?.completedTasks,
        derivedCompletedTasks
      ),
      activeUsers: pickNumber(
        topPulse?.activeUsers,
        top?.activeUsers,
        live?.activeUsers,
        data?.summary?.ownerSummary?.onlineCount,
        0
      ),
      lastShipAt:
        topPulse?.lastShipAt ||
        top?.lastShipAt ||
        live?.lastShipAt ||
        null,
    };
  }, [
    data,
    pulse,
    derivedCompletedToday,
    derivedCompletedThisWeek,
    derivedInProgress,
    derivedBlocked,
    derivedReady,
    tasks.length,
    derivedCompletedTasks,
  ]);

  const criticalMoves = useMemo(() => {
    return deriveCriticalMoves(tasks, data?.criticalMoves || []);
  }, [tasks, data]);

  const metrics = useMemo(() => {
    const existingMomentum =
      typeof data?.metrics?.momentum === "number"
        ? data.metrics.momentum
        : typeof data?.momentum?.score === "number"
          ? data.momentum.score
          : typeof data?.momentum?.percentage === "number"
            ? data.momentum.percentage
            : typeof data?.momentum === "number"
              ? data.momentum
              : null;

    const completedThisWeek =
      typeof pulseData?.completedThisWeek === "number"
        ? pulseData.completedThisWeek
        : 0;

    const inProgressCount =
      typeof pulseData?.inProgress === "number"
        ? pulseData.inProgress
        : derivedInProgress;

    const completedCount =
      typeof pulseData?.completedTasks === "number"
        ? pulseData.completedTasks
        : derivedCompletedTasks;

    const blockedCount =
      typeof pulseData?.blocked === "number"
        ? pulseData.blocked
        : derivedBlocked;

    const readyCount =
      typeof pulseData?.ready === "number"
        ? pulseData.ready
        : derivedReady;

    const totalTasksCount =
      typeof pulseData?.totalTasks === "number"
        ? pulseData.totalTasks
        : tasks.length;

    const weeklyShips =
      typeof data?.metrics?.weeklyShips === "number"
        ? data.metrics.weeklyShips
        : typeof data?.momentum?.weeklyShips === "number"
          ? data.momentum.weeklyShips
          : typeof data?.heartbeat?.shipsPerWeek === "number"
            ? data.heartbeat.shipsPerWeek
            : completedThisWeek;

    const completionForecast =
      typeof data?.metrics?.completionForecast === "number"
        ? data.metrics.completionForecast
        : totalTasksCount > 0
          ? Math.round((completedCount / totalTasksCount) * 100)
          : 0;

    const momentumTrend =
      typeof data?.metrics?.momentumTrend === "number"
        ? data.metrics.momentumTrend
        : typeof data?.momentum?.trend === "number"
          ? data.momentum.trend
          : weeklyShips > 0
            ? Math.min(weeklyShips, 5)
            : inProgressCount > 0
              ? 1
              : 0;

    let derivedMomentum = 0;

    if (totalTasksCount > 0) {
      derivedMomentum += Math.min(10, totalTasksCount * 2);
      derivedMomentum += Math.round((completedCount / Math.max(totalTasksCount, 1)) * 35);
      derivedMomentum += Math.min(25, weeklyShips * 5);
      derivedMomentum += Math.min(20, inProgressCount * 5);
      derivedMomentum += Math.min(10, readyCount * 2);
      derivedMomentum -= Math.min(15, blockedCount * 5);

      if (derivedMomentum <= 0) {
        derivedMomentum = 10;
      }
    } else if (Array.isArray(activity) && activity.length > 0) {
      derivedMomentum = Math.min(15, activity.length * 3);
    }

    const momentum = clamp(
      existingMomentum == null ? derivedMomentum : existingMomentum,
      0,
      100
    );

    return {
      momentum,
      momentumLabel:
        data?.momentum?.label ||
        data?.metrics?.momentumLabel ||
        getMomentumLabel(momentum),
      weeklyShips,
      momentumTrend,
      completionForecast,
      risks: data?.metrics?.risks || data?.risks || [],
      suggestions: data?.metrics?.suggestions || data?.suggestions || [],
      teamCapacity:
        data?.metrics?.teamCapacity ||
        data?.teamCapacity ||
        [],
      inProgress: inProgressCount,
      blocked: blockedCount,
      ready: readyCount,
      totalTasks: totalTasksCount,
      completedTasks: completedCount,
    };
  }, [
    activity,
    data,
    pulseData,
    derivedInProgress,
    derivedCompletedTasks,
    derivedBlocked,
    derivedReady,
    tasks.length,
  ]);

  const overview = useMemo(() => {
    const backendSummary = data?.summary || {};
    const onlineCount = safeNumber(
      backendSummary?.ownerSummary?.onlineCount,
      safeNumber(pulseData?.activeUsers, 0)
    );

    const ownerSummary = {
      ...backendSummary?.ownerSummary,
      primaryOwnerId:
        backendSummary?.ownerSummary?.primaryOwnerId ||
        String(project?.owner?._id || project?.owner?.id || project?.ownerId || ""),
      primaryOwnerName:
        backendSummary?.ownerSummary?.primaryOwnerName ||
        getOwnerDisplayName(project),
      memberCount:
        safeNumber(backendSummary?.ownerSummary?.memberCount, overviewMemberCount),
      onlineCount,
    };

    const nextAction = buildNextAction(
      backendSummary?.nextAction,
      criticalMoves,
      tasks
    );

    const blockedCount = safeNumber(
      backendSummary?.blockedCount,
      metrics?.blocked || 0
    );

    const teamCapacity =
      Array.isArray(data?.teamCapacity?.members)
        ? data.teamCapacity.members
        : Array.isArray(data?.teamCapacity)
          ? data.teamCapacity
          : Array.isArray(data?.metrics?.teamCapacity)
            ? data.metrics.teamCapacity
            : deriveTeamCapacity(overviewMembers, tasks, null);

    const sprintSnapshot =
      data?.sprint && typeof data.sprint === "object"
        ? data.sprint
        : {
            active: false,
            goal: null,
            startDate: null,
            endDate: null,
          };

    const foresight = buildForesight(data, Array.isArray(activity) ? activity.length : 0);

    return {
      project: {
        id: String(project?._id || project?.id || projectId || ""),
        name: project?.name || project?.title || "Untitled Project",
        status:
          project?.status ||
          (project?.isAtRisk ? "at-risk" : "live"),
      },
      summary: {
        nextAction,
        blockedCount,
        ownerSummary,
      },
      pulse: {
        todayCompleted: safeNumber(pulseData?.completedToday, 0),
        inMotion: safeNumber(pulseData?.inProgress, 0),
        blocked: safeNumber(metrics?.blocked, 0),
        ready: safeNumber(metrics?.ready, 0),
      },
      momentum: {
        score: safeNumber(metrics?.momentum, 0),
        label:
          metrics?.momentumLabel ||
          getMomentumLabel(safeNumber(metrics?.momentum, 0)),
        weeklyShips: safeNumber(metrics?.weeklyShips, 0),
        trend:
          typeof metrics?.momentumTrend === "number"
            ? metrics.momentumTrend
            : 0,
      },
      priorityStack: Array.isArray(criticalMoves) ? criticalMoves : [],
      sprint: sprintSnapshot,
      foresight,
      liveActivity: Array.isArray(activity) ? activity : [],
      teamCapacity,
      activeGoals: Array.isArray(objectives) ? objectives : [],
      updatedAt:
        data?.updatedAt ||
        data?.project?.updatedAt ||
        pulseData?.lastShipAt ||
        null,
    };
  }, [
    activity,
    criticalMoves,
    data,
    metrics,
    objectives,
    overviewMemberCount,
    overviewMembers,
    project,
    projectId,
    pulseData,
    tasks,
  ]);

  const isHealthy = Boolean(data?.isHealthy ?? true);
  const hasWarnings = Boolean(data?.hasWarnings ?? false);

  const shipUpdate = useCallback(async (_payload) => {
    return true;
  }, []);

  return {
    data,
    pulse,
    loading,
    error,
    refresh,
    refreshSilently,

    overview,

    project,
    metrics,
    criticalMoves,
    objectives,
    sprint: overview?.sprint || data?.sprint || null,
    announcements: data?.announcements || [],
    pinnedAnnouncement: data?.pinnedAnnouncement || null,
    activity,
    pulseData,

    tasks,
    milestones,
    events,
    threads,
    files,

    overviewMembers,
    overviewMemberCount,

    shipUpdate,
    isHealthy,
    hasWarnings,

    isLive: pulse?.liveActivity,
    activeUsers: pulseData?.activeUsers,
    lastShipAt: pulseData?.lastShipAt,
  };
}

export default useProjectOverview;
