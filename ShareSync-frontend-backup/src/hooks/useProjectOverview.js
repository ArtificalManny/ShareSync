// src/hooks/useProjectOverview.js
// ═══════════════════════════════════════════════════════════════════════════════
// Hook: Main Data Hook for ProjectHome
//
// FIXES IN THIS PASS:
// - Use /projects/:id/overview (or /projects/:id fallback) as the PRIMARY
//   overview source instead of /projects/:id/pulse
// - Keep /pulse as supplemental live heartbeat data only
// - Merge richer raw project data so Overview can derive:
//   * critical moves
//   * member count
//   * momentum / weekly ships
//   * blockers / task counts
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getProjectPulse } from "../api/projectOverview";
import { apiRequest } from "../utils/api";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeProjectMembers(project) {
  if (!project) return [];

  const owner = project.owner || project.ownerId;
  const ownerId = owner?._id || owner?.id || owner || null;
  const members = Array.isArray(project.members) ? project.members : [];

  const normalized = [];

  if (
    owner &&
    typeof owner === "object" &&
    (owner.name || owner.firstName || owner.lastName || owner.username || owner.email)
  ) {
    normalized.push({
      id: String(owner._id || owner.id),
      role: "owner",
      name:
        owner.name ||
        `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
        owner.username ||
        owner.email ||
        "Project Owner",
    });
  } else if (ownerId) {
    normalized.push({
      id: String(ownerId),
      role: "owner",
      name: "Project Owner",
    });
  }

  members.forEach((member) => {
    const user = member?.user || member?.userId || member;
    const uid = String(user?._id || user?.id || user || "");

    if (!uid) return;
    if (ownerId && uid === String(ownerId)) return;

    normalized.push({
      id: uid,
      role: member?.role || "member",
      name:
        user?.name ||
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        user?.username ||
        user?.email ||
        "Member",
    });
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

function getTaskStatus(task) {
  return String(task?.status || task?.state || task?.lane || "").toLowerCase();
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

function deriveCriticalMoves(tasks = [], backendCriticalMoves = []) {
  if (Array.isArray(backendCriticalMoves) && backendCriticalMoves.length > 0) {
    return backendCriticalMoves;
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  const actionable = tasks.filter((task) => {
    const status = getTaskStatus(task);
    return status !== "done" && status !== "completed" && status !== "archived";
  });

  return [...actionable]
    .sort((a, b) => {
      const blockedDelta = Number(isTaskBlocked(b)) - Number(isTaskBlocked(a));
      if (blockedDelta !== 0) return blockedDelta;

      const priorityDelta = priorityRank(b?.priority) - priorityRank(a?.priority);
      if (priorityDelta !== 0) return priorityDelta;

      const aStatus = getTaskStatus(a);
      const bStatus = getTaskStatus(b);

      const aInProgress = aStatus === "in_progress" ? 1 : 0;
      const bInProgress = bStatus === "in_progress" ? 1 : 0;
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

function countByStatuses(tasks = [], statuses = []) {
  const wanted = new Set(statuses.map((s) => String(s).toLowerCase()));
  return tasks.filter((task) => wanted.has(getTaskStatus(task))).length;
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
            "[useProjectOverview] /overview fetch issue, will continue with /projects/:id:",
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

  const pulseData = useMemo(() => {
    const top = data || {};
    const live = pulse || {};

    const pickNumber = (key) => {
      if (typeof top?.[key] === "number") return top[key];
      if (typeof live?.[key] === "number") return live[key];
      return undefined;
    };

    return {
      completedToday: pickNumber("completedToday"),
      completedThisWeek: pickNumber("completedThisWeek"),
      inProgress: pickNumber("inProgress"),
      blocked: pickNumber("blocked"),
      totalTasks: pickNumber("totalTasks"),
      completedTasks: pickNumber("completedTasks"),
    };
  }, [data, pulse]);

  const overviewMembers = useMemo(() => normalizeProjectMembers(project), [project]);
  const overviewMemberCount = overviewMembers.length;

  const criticalMoves = useMemo(() => {
    return deriveCriticalMoves(tasks, data?.criticalMoves || []);
  }, [tasks, data]);

  const objectives = useMemo(() => data?.objectives || [], [data]);

  const metrics = useMemo(() => {
    const existingMomentum =
      typeof data?.metrics?.momentum === "number"
        ? data.metrics.momentum
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
        : countByStatuses(tasks, ["in_progress", "doing", "active", "review"]);

    const completedCount =
      typeof pulseData?.completedTasks === "number"
        ? pulseData.completedTasks
        : countByStatuses(tasks, ["done", "completed"]);

    const blockedCount =
      typeof pulseData?.blocked === "number"
        ? pulseData.blocked
        : tasks.filter(isTaskBlocked).length;

    const totalTasksCount =
      typeof pulseData?.totalTasks === "number"
        ? pulseData.totalTasks
        : tasks.length;

    const weeklyShips =
      typeof data?.metrics?.weeklyShips === "number"
        ? data.metrics.weeklyShips
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
      weeklyShips,
      momentumTrend,
      completionForecast,
      risks: data?.metrics?.risks || data?.risks || [],
      suggestions: data?.metrics?.suggestions || data?.suggestions || [],
      teamCapacity: data?.metrics?.teamCapacity || data?.teamCapacity || [],
      inProgress: inProgressCount,
      blocked: blockedCount,
      totalTasks: totalTasksCount,
      completedTasks: completedCount,
    };
  }, [activity, data, pulseData, tasks]);

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

    project,
    metrics,
    criticalMoves,
    objectives,
    sprint: data?.sprint,
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
    activeUsers: pulse?.activeUsers,
    lastShipAt: pulse?.lastShipAt,
  };
}

export default useProjectOverview;
