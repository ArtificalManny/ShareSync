// src/hooks/useProjectOverview.js
// ═══════════════════════════════════════════════════════════════════════════════
// Hook: Main Data Hook for ProjectHome
// ──────────────────────────────────────────────────────────────────────────────
// NOTE: This hook now provides "compat layer" fields used by ProjectHome.jsx:
// - metrics, activity, shipUpdate, isHealthy, hasWarnings, tasks/milestones/etc.
// This avoids backend quagmires by keeping everything frontend-only.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getProjectPulse } from "../api/projectOverview";
import { apiRequest } from "../utils/api"; // ✅ ADDED: Direct API access

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
      // ✅ FIX: Replaced the broken `getProjectOverview` wrapper with a direct
      // call to the correct `/pulse` endpoint that actually exists on the backend.
      const res = await apiRequest(`/projects/${projectId}/pulse`);
      const payload = res?.data ?? res;
      setData(payload);
    } catch (err) {
      setError(err?.message || "Failed to load project overview");
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
      // Keep pulse errors non-fatal
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
  // Compatibility layer for ProjectHome.jsx
  // ───────────────────────────────────────────────────────────────────────────

  // ProjectHome expects metrics.momentum (0-100), metrics.weeklyShips, metrics.momentumTrend, etc.
  const metrics = useMemo(() => {
    const momentumPct =
      typeof data?.metrics?.momentum === "number"
        ? data.metrics.momentum
        : typeof data?.momentum?.percentage === "number"
        ? data.momentum.percentage
        : typeof data?.momentum === "number"
        ? data.momentum
        : 0;

    const weeklyShips =
      typeof data?.metrics?.weeklyShips === "number"
        ? data.metrics.weeklyShips
        : typeof data?.heartbeat?.shipsPerWeek === "number"
        ? data.heartbeat.shipsPerWeek
        : 0;

    const momentumTrend =
      typeof data?.metrics?.momentumTrend === "number"
        ? data.metrics.momentumTrend
        : typeof data?.momentum?.trend === "number"
        ? data.momentum.trend
        : 0;

    // Optional extras used by some cards
    const completionForecast =
      typeof data?.metrics?.completionForecast === "number"
        ? data.metrics.completionForecast
        : 0;

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

  // ProjectHome expects "activity" array
  const activity = useMemo(() => {
    return data?.activity || data?.recentActivity || [];
  }, [data]);

  // ProjectHome expects these fields (even if empty)
  const tasks = useMemo(() => data?.tasks || [], [data]);
  const milestones = useMemo(() => data?.milestones || [], [data]);
  const events = useMemo(() => data?.events || [], [data]);
  const threads = useMemo(() => data?.threads || [], [data]);
  const files = useMemo(() => data?.files || [], [data]);

  // Health flags expected by ProjectHome (non-breaking defaults)
  const isHealthy = Boolean(data?.isHealthy ?? true);
  const hasWarnings = Boolean(data?.hasWarnings ?? false);

  // ProjectHome calls shipUpdate({description})
  // We keep this frontend-safe: if backend not wired, it still resolves.
  const shipUpdate = useCallback(async (_payload) => {
    // Intentionally no-op to avoid backend quagmire.
    // If/when you wire a real endpoint, implement it in api/projectOverview.js and call it here.
    return true;
  }, []);

  return {
    // Raw
    data,
    pulse,
    loading,
    error,
    refresh,

    // Primary (ProjectHome.jsx expects these)
    project: data?.project,
    metrics,
    criticalMoves: data?.criticalMoves || [],
    objectives: data?.objectives || [],
    sprint: data?.sprint,
    announcements: data?.announcements || [],
    pinnedAnnouncement: data?.pinnedAnnouncement || null,
    activity,

    // Extended (optional)
    tasks,
    milestones,
    events,
    threads,
    files,

    // Actions / flags
    shipUpdate,
    isHealthy,
    hasWarnings,

    // Pulse convenience
    isLive: pulse?.liveActivity,
    activeUsers: pulse?.activeUsers,
    lastShipAt: pulse?.lastShipAt,
  };
}

export default useProjectOverview;
