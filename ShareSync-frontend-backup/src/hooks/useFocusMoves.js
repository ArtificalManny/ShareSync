// src/hooks/useFocusMoves.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - Data Hook (DEBUG MODE)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUserFocusMoves, getProjectFocusMoves } from '../api/focusEngine';
import { rankMoves, calculateImpactSummary, getUrgencyLevel } from '../utils/focusRanking';

/**
 * 🚨 DATA ADAPTER: Translates backend Task schemas into Frontend Move schemas
 */
const normalizeTaskToMove = (task) => {
  if (!task) return null;
  return {
    ...task,
    id: task._id || task.id || task.taskId,
    taskId: task._id || task.id || task.taskId,
    title: task.title || 'Untitled Move',
    deadline: task.dueDate || task.deadline,
    momentum: task.xpValue || task.momentum || task.storyPoints * 10 || 25,
    unblocks: task.blockingCount || task.unblocks || (task.blocks ? task.blocks.length : 0),
    type: task.type || 'default',
    project: task.projectId || task.project,
  };
};

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
      console.log("🟢 [FOCUS ENGINE] 1. Raw API Response:", data);
      
      // 🚨 Aggressive Extraction: Find the array no matter where it is hidden
      let rawArray = [];
      if (Array.isArray(data)) {
        rawArray = data;
      } else if (data && typeof data === 'object') {
        // Search the object for any array containing items
        rawArray = data.tasks || data.data || data.moves || Object.values(data).find(Array.isArray) || [];
      }
      console.log("🟢 [FOCUS ENGINE] 2. Extracted Array:", rawArray);
      
      const normalizedMoves = rawArray.map(normalizeTaskToMove).filter(Boolean);
      console.log("🟢 [FOCUS ENGINE] 3. Normalized Moves:", normalizedMoves);

      // 🚨 TEMPORARY BYPASS: We are turning off rankMoves to see if it was filtering out valid tasks
      // const ranked = rankMoves(normalizedMoves);
      const ranked = normalizedMoves; 
      console.log("🟢 [FOCUS ENGINE] 4. Ranked Moves (Bypassed):", ranked);

      setMoves(ranked.slice(0, count));
      setLastFetch(Date.now());
    } catch (err) {
      console.error("🔴 [FOCUS ENGINE] Error:", err);
      setError(err.message || 'Failed to load focus moves');
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;
    
    const interval = setInterval(() => fetchMoves(true), refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMoves]);

  useEffect(() => {
    const handleRefresh = () => setTimeout(() => fetchMoves(true), 500);
    
    window.addEventListener('local-ship', handleRefresh);
    window.addEventListener('task-complete', handleRefresh);
    
    return () => {
      window.removeEventListener('local-ship', handleRefresh);
      window.removeEventListener('task-complete', handleRefresh);
    };
  }, [fetchMoves]);

  // We still calculate impact summary for the footer
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

// ... [useProjectFocusMoves and useFocusUrgency remain the same for now to save space] ...
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
      const rawArray = Array.isArray(data) ? data : (data?.tasks || data?.data || []);
      const normalizedMoves = rawArray.map(normalizeTaskToMove).filter(Boolean);
      setMoves(normalizedMoves.slice(0, count));
    } catch (err) {
      setError(err.message || 'Failed to load project focus moves');
    } finally {
      setLoading(false);
    }
  }, [projectId, count]);

  useEffect(() => { fetchMoves(); }, [fetchMoves]);
  return { moves, loading, error, refresh: fetchMoves };
}

export function useFocusUrgency() {
  const { moves, loading } = useUserFocusMoves({ count: 5 });
  const urgencyState = useMemo(() => {
    if (loading || !moves.length) return { level: 'none', count: 0, mostUrgent: null };
    const criticalMoves = moves.filter(m => getUrgencyLevel(m.deadline) === 'critical');
    const highMoves = moves.filter(m => getUrgencyLevel(m.deadline) === 'high');
    if (criticalMoves.length > 0) return { level: 'critical', count: criticalMoves.length, mostUrgent: criticalMoves[0] };
    if (highMoves.length > 0) return { level: 'high', count: highMoves.length, mostUrgent: highMoves[0] };
    return { level: 'normal', count: moves.length, mostUrgent: moves[0] };
  }, [moves, loading]);
  return urgencyState;
}

export default useUserFocusMoves;
