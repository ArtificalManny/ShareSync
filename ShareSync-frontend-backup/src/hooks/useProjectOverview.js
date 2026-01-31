// src/hooks/useProjectOverview.js
// ═══════════════════════════════════════════════════════════════════════════════
// Hook: Main Data Hook for ProjectHome
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProjectOverview, getProjectPulse } from '../api/projectOverview';

/**
 * Main hook for ProjectHome data
 * Combines all project overview data with real-time pulse
 */
export function useProjectOverview(projectId, options = {}) {
  const { 
    autoRefresh = true, 
    refreshInterval = 30000, // 30 seconds
    includePulse = true,
  } = options;

  const [data, setData] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pulseIntervalRef = useRef(null);

  // Fetch main overview data
  const fetchOverview = useCallback(async () => {
    if (!projectId) return;

    try {
      setError(null);
      const overview = await getProjectOverview(projectId);
      setData(overview);
    } catch (err) {
      setError(err.message || 'Failed to load project overview');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch pulse data (more frequent, lighter)
  const fetchPulse = useCallback(async () => {
    if (!projectId || !includePulse) return;

    try {
      const pulseData = await getProjectPulse(projectId);
      setPulse(pulseData);
    } catch (err) {
      console.error('Pulse fetch error:', err);
    }
  }, [projectId, includePulse]);

  // Initial fetch
  useEffect(() => {
    fetchOverview();
    if (includePulse) fetchPulse();
  }, [fetchOverview, fetchPulse, includePulse]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !projectId) return;

    const overviewInterval = setInterval(fetchOverview, refreshInterval);
    
    if (includePulse) {
      pulseIntervalRef.current = setInterval(fetchPulse, 10000); // Pulse every 10s
    }

    return () => {
      clearInterval(overviewInterval);
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
    };
  }, [autoRefresh, projectId, refreshInterval, fetchOverview, fetchPulse, includePulse]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), includePulse && fetchPulse()]);
  }, [fetchOverview, fetchPulse, includePulse]);

  return {
    // Core data
    data,
    pulse,
    loading,
    error,
    refresh,
    
    // Derived data for convenience
    project: data?.project,
    momentum: data?.momentum,
    heartbeat: data?.heartbeat,
    energySync: data?.energySync,
    teamBalance: data?.teamBalance,
    criticalMoves: data?.criticalMoves,
    objectives: data?.objectives,
    sprint: data?.sprint,
    recentActivity: data?.recentActivity,
    announcement: data?.announcement,
    
    // Pulse-specific
    isLive: pulse?.liveActivity,
    activeUsers: pulse?.activeUsers,
    lastShipAt: pulse?.lastShipAt,
  };
}

export default useProjectOverview;
