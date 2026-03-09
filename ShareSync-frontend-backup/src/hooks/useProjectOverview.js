// src/hooks/useProjectOverview.js
// ═══════════════════════════════════════════════════════════════════════════════
// Hook: Main Data Hook for ProjectHome
// ⭐ UPGRADE: Item 9 - Inject AuthContext to compute Spectator/Member roles
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getProjectPulse } from "../api/projectOverview";
import { apiRequest } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export function useProjectOverview(projectId, options = {}) {
  const { user } = useAuth();
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
      const res = await apiRequest(`/projects/${projectId}/pulse`);
      const payload = res?.data ?? res;
      setData(payload);
    } catch (err) {
      console.warn("[useProjectOverview] Pulse failed, falling back to basic project data:", err?.message);
      try {
        const fallback = await apiRequest(`/projects/${projectId}`);
        const fallbackPayload = fallback?.data ?? fallback;
        setData({ project: fallbackPayload, tasks: fallbackPayload?.tasks || [], activity: [], milestones: [], events: [], threads: [], files: [] });
      } catch (fallbackErr) {
        setError(fallbackErr?.message || "Failed to load project");
      }
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
    await Promise.all([fetchOverview(), includePulse ? fetchPulse() : Promise.resolve()]);
  }, [fetchOverview, fetchPulse, includePulse]);

  // ───────────────────────────────────────────────────────────────────────────
  // ROLE DETECTION (Item 9)
  // ───────────────────────────────────────────────────────────────────────────
  const { isMember, isFollowing, isSpectator } = useMemo(() => {
    const project = data?.project;
    if (!user || !project) return { isMember: false, isFollowing: false, isSpectator: true };

    const userId = user.id || user._id;
    const isOwner = project.ownerId === userId || project.owner?._id === userId;
    
    const isProjectMember = isOwner || project.members?.some(m => {
      const mid = m?.userId?._id || m?.userId || m?._id || m;
      return mid === userId;
    });

    const isProjectFollower = project.followers?.some(f => {
      const fid = f?.userId?._id || f?.userId || f?._id || f;
      return fid === userId;
    });

    return {
      isMember: isProjectMember,
      isFollowing: isProjectFollower,
      isSpectator: !isProjectMember,
    };
  }, [data?.project, user]);

  // ───────────────────────────────────────────────────────────────────────────
  // Compatibility layer for ProjectHome.jsx
  // ───────────────────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const momentumPct =
      typeof data?.metrics?.momentum === "number" ? data.metrics.momentum :
      typeof data?.momentum?.percentage === "number" ? data.momentum.percentage :
      typeof data?.momentum === "number" ? data.momentum : 0;

    const weeklyShips =
      typeof data?.metrics?.weeklyShips === "number" ? data.metrics.weeklyShips :
      typeof data?.heartbeat?.shipsPerWeek === "number" ? data.heartbeat.shipsPerWeek : 0;

    const momentumTrend =
      typeof data?.metrics?.momentumTrend === "number" ? data.metrics.momentumTrend :
      typeof data?.momentum?.trend === "number" ? data.momentum.trend : 0;

    const completionForecast = typeof data?.metrics?.completionForecast === "number" ? data.metrics.completionForecast : 0;

    return {
      momentum: momentumPct,
      weeklyShips,
      momentumTrend,
      completionForecast,
      risks: data?.metrics?.risks || data?.risks || [],
      suggestions: data?.metrics?.suggestions || data?.suggestions || [],
      teamCapacity: data?.metrics?.teamCapacity || data?.teamCapacity || [],
    };
  }, [data]);

  const activity = useMemo(() => data?.activity || data?.recentActivity || [], [data]);
  const tasks = useMemo(() => data?.tasks || [], [data]);
  const milestones = useMemo(() => data?.milestones || [], [data]);
  const events = useMemo(() => data?.events || [], [data]);
  const threads = useMemo(() => data?.threads || [], [data]);
  const files = useMemo(() => data?.files || [], [data]);

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

    // Project Data
    project: data?.project,
    metrics,
    criticalMoves: data?.criticalMoves || [],
    objectives: data?.objectives || [],
    sprint: data?.sprint,
    announcements: data?.announcements || [],
    pinnedAnnouncement: data?.pinnedAnnouncement || null,
    activity,

    // Access Flags
    isMember,
    isFollowing,
    isSpectator,

    tasks,
    milestones,
    events,
    threads,
    files,

    shipUpdate,
    isHealthy,
    hasWarnings,
    isLive: pulse?.liveActivity,
    activeUsers: pulse?.activeUsers,
    lastShipAt: pulse?.lastShipAt,
  };
}

export default useProjectOverview;
