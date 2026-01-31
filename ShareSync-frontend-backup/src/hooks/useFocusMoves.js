// src/hooks/useFocusMoves.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - Data Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Standalone hook for components that need focus data
// without the full context provider.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUserFocusMoves, getProjectFocusMoves } from '../api/focusEngine';
import { rankMoves, calculateImpactSummary, getUrgencyLevel } from '../utils/focusRanking';

/**
 * Hook for fetching user's focus moves across all projects
 */
export function useUserFocusMoves(options = {}) {
  const { 
    count = 3, 
    autoRefresh = true, 
    refreshInterval = 30000,
  } = options;
  
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchMoves = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const data = await getUserFocusMoves(count);
      setMoves(rankMoves(data));
      setLastFetch(Date.now());
    } catch (err) {
      setError(err.message || 'Failed to load focus moves');
    } finally {
      setLoading(false);
    }
  }, [count]);

  // Initial fetch
  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;
    
    const interval = setInterval(() => fetchMoves(true), refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMoves]);

  // Listen for ship events
  useEffect(() => {
    const handleRefresh = () => setTimeout(() => fetchMoves(true), 500);
    
    window.addEventListener('local-ship', handleRefresh);
    window.addEventListener('task-complete', handleRefresh);
    
    return () => {
      window.removeEventListener('local-ship', handleRefresh);
      window.removeEventListener('task-complete', handleRefresh);
    };
  }, [fetchMoves]);

  const impactSummary = useMemo(() => calculateImpactSummary(moves), [moves]);

  return {
    moves,
    loading,
    error,
    lastFetch,
    refresh: fetchMoves,
    impactSummary,
  };
}

/**
 * Hook for fetching a specific project's focus moves
 */
export function useProjectFocusMoves(projectId, options = {}) {
  const { count = 3, autoRefresh = true } = options;
  
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMoves = useCallback(async (silent = false) => {
    if (!projectId) return;
    
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const data = await getProjectFocusMoves(projectId, count);
      setMoves(rankMoves(data));
    } catch (err) {
      setError(err.message || 'Failed to load project focus moves');
    } finally {
      setLoading(false);
    }
  }, [projectId, count]);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const handleRefresh = () => setTimeout(() => fetchMoves(true), 500);
    window.addEventListener('local-ship', handleRefresh);
    
    return () => window.removeEventListener('local-ship', handleRefresh);
  }, [autoRefresh, fetchMoves]);

  return { moves, loading, error, refresh: fetchMoves };
}

/**
 * Hook that returns just the urgency state
 */
export function useFocusUrgency() {
  const { moves, loading } = useUserFocusMoves({ count: 5 });
  
  const urgencyState = useMemo(() => {
    if (loading || !moves.length) {
      return { level: 'none', count: 0, mostUrgent: null };
    }
    
    const criticalMoves = moves.filter(m => getUrgencyLevel(m.deadline) === 'critical');
    const highMoves = moves.filter(m => getUrgencyLevel(m.deadline) === 'high');
    
    if (criticalMoves.length > 0) {
      return { level: 'critical', count: criticalMoves.length, mostUrgent: criticalMoves[0] };
    }
    if (highMoves.length > 0) {
      return { level: 'high', count: highMoves.length, mostUrgent: highMoves[0] };
    }
    
    return { level: 'normal', count: moves.length, mostUrgent: moves[0] };
  }, [moves, loading]);

  return urgencyState;
}

export default useUserFocusMoves;
