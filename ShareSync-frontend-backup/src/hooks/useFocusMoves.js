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
import { calculateImpactSummary, getUrgencyLevel } from '../utils/focusRanking';

const normalizeTaskToMove = (task) => {
  if (!task) return null;
  const sourceType = String(task.sourceType || '').toLowerCase();
  const validId = task.id || task._id || task.taskId || task.sourceId;
  const sourceId = task.sourceId || task.taskId || task._id || validId;
  const projectId = task.projectId || task.project?.id || task.project?._id;

  return {
    ...task,
    id: validId,
    sourceId,
    taskId: sourceType === 'milestone' ? undefined : (task.taskId || sourceId),
    title: task.title || 'Untitled Move',
    deadline: task.dueDate || task.deadline,
    momentum: task.xpValue || task.momentum || task.estimatedMomentum || task.storyPoints * 10 || 25,
    unblocks: task.blockingCount || task.unblocks || (task.blocks ? task.blocks.length : 0),
    type: sourceType === 'milestone' ? 'ship' : (task.type || 'default'),
    project: task.project && typeof task.project === 'object'
      ? task.project
      : projectId
        ? { id: projectId, name: task.projectName || 'Project', color: task.projectColor || '#8B5CF6' }
        : undefined,
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
      setMoves(normalizedMoves.slice(0, count));
    } catch (err) {
      setError(err.message || 'Failed to load focus moves');
    } finally {
      setLoading(false);
    }
  }, [count]);

  const completeMove = useCallback(async (moveId, move) => {
    if (!moveId) return;

    // 1. Instantly remove from UI.
    setMoves(prev => prev.filter(m =>
      String(m.id) !== String(move?.id || moveId) &&
      String(m.sourceId || '') !== String(move?.sourceId || moveId) &&
      String(m.taskId || '') !== String(move?.taskId || moveId)
    ));
    
    // 2. Background sync with the correct source.
    try {
      await completeFocusMove(move || moveId);
      
      // We ONLY refresh if the server successfully processed the XP/Gamification
      await fetchMoves(true); 
    } catch (err) {
      console.warn("Backend gamification logic failed, but task is optimistically removed from UI to preserve flow state.", err);
      // 🚨 FRONTEND FIX: Do NOT call fetchMoves() here. 
      // If the server fails (e.g., 404), we leave the card hidden so it doesn't rudely pop back.
    }
  }, [fetchMoves]);

  const snoozeMove = useCallback(async (moveId, hours, move) => {
    if (!moveId) return;
    setMoves(prev => prev.filter(m =>
      String(m.id) !== String(move?.id || moveId) &&
      String(m.sourceId || '') !== String(move?.sourceId || moveId) &&
      String(m.taskId || '') !== String(move?.taskId || moveId)
    ));
    
    try {
      await snoozeFocusMove(move || moveId, hours);
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
