// src/hooks/useFocusMoves.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - Data Hook (OPTIMISTIC UI)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getUserFocusMoves, 
  getProjectFocusMoves,
  completeFocusMove,
  snoozeFocusMove 
} from '../api/focusEngine';
import { rankMoves, calculateImpactSummary, getUrgencyLevel } from '../utils/focusRanking';

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
  const { count = 3, autoRefresh = true, refreshInterval = 30000 } = options;
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMoves = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await getUserFocusMoves(count);
      const rawArray = Array.isArray(data) ? data : (data?.tasks || data?.data || []);
      const normalizedMoves = rawArray.map(normalizeTaskToMove).filter(Boolean);
      setMoves(rankMoves(normalizedMoves).slice(0, count));
    } catch (err) {
      setError(err.message || 'Failed to load focus moves');
    } finally {
      setLoading(false);
    }
  }, [count]);

  // 🚨 BEHAVIORAL FIX: Optimistic UI
  // We instantly remove the move from the screen for the dopamine hit.
  // We don't wait for the server.
  const completeMove = useCallback(async (moveId) => {
    // 1. Instantly remove from UI
    setMoves(prev => prev.filter(m => m.id !== moveId && m.taskId !== moveId));
    
    // 2. Background sync with server
    try {
      await completeFocusMove(moveId.toString().trim());
      await fetchMoves(true); // Refill the empty slot silently
    } catch (err) {
      console.warn("Server threw an error, but UI is optimistically updated.", err);
      // If 404, it means it's already done/gone on the server anyway. Win-win.
      await fetchMoves(true); 
    }
  }, [fetchMoves]);

  const snoozeMove = useCallback(async (moveId, hours) => {
    // 1. Instantly remove from UI
    setMoves(prev => prev.filter(m => m.id !== moveId && m.taskId !== moveId));
    
    // 2. Background sync
    try {
      await snoozeFocusMove(moveId.toString().trim(), hours);
      await fetchMoves(true);
    } catch (err) {
      console.warn("Server snooze failed, refreshing state.", err);
      await fetchMoves(true);
    }
  }, [fetchMoves]);

  useEffect(() => { fetchMoves(); }, [fetchMoves]);

  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;
    const interval = setInterval(() => fetchMoves(true), refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMoves]);

  const impactSummary = useMemo(() => calculateImpactSummary(moves), [moves]);

  return { moves, loading, error, refresh: fetchMoves, impactSummary, completeMove, snoozeMove };
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
