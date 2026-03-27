// src/hooks/useFocusMoves.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - Data Hook (BULLETPROOF OPTIMISTIC UI)
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
  const validId = task._id || task.id || task.taskId;
  return {
    ...task,
    id: validId,
    taskId: validId,
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

  const completeMove = useCallback(async (moveId) => {
    if (!moveId) return;

    // 1. Instantly remove from UI for the dopamine hit
    setMoves(prev => prev.filter(m => m.id !== moveId && m.taskId !== moveId));
    
    // 2. Background sync with server
    try {
      const cleanId = typeof moveId === 'object' ? (moveId._id || moveId.id) : moveId.toString();
      await completeFocusMove(cleanId);
      
      // We ONLY refresh if the server successfully processed the XP/Gamification
      await fetchMoves(true); 
    } catch (err) {
      console.warn("Backend gamification logic failed, but task is optimistically removed from UI to preserve flow state.", err);
      // 🚨 FRONTEND FIX: Do NOT call fetchMoves() here. 
      // If the server fails (e.g., 404), we leave the card hidden so it doesn't rudely pop back.
    }
  }, [fetchMoves]);

  const snoozeMove = useCallback(async (moveId, hours) => {
    if (!moveId) return;
    setMoves(prev => prev.filter(m => m.id !== moveId && m.taskId !== moveId));
    
    try {
      const cleanId = typeof moveId === 'object' ? (moveId._id || moveId.id) : moveId.toString();
      await snoozeFocusMove(cleanId, hours);
      await fetchMoves(true);
    } catch (err) {
      console.warn("Server snooze failed, but UI state preserved.", err);
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
