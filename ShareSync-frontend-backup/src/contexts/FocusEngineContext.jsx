// src/contexts/FocusEngineContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - State Management
// ═══════════════════════════════════════════════════════════════════════════════
//
// Provides real-time focus moves state across the app.
// Auto-refreshes when ships/changes happen.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getUserFocusMoves, completeFocusMove, snoozeFocusMove } from '../api/focusEngine';
import { calculateImpactSummary } from '../utils/focusRanking';

const FocusEngineContext = createContext(null);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function FocusEngineProvider({ children, autoRefreshInterval = 30000 }) {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch moves
  const fetchMoves = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      const data = await getUserFocusMoves(10); // Fetch more than we display for flexibility
      setMoves(data);
      setLastRefresh(Date.now());
    } catch (err) {
      setError(err.message || 'Failed to load focus moves');
      console.error('[FocusEngine] Fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      fetchMoves(true); // Silent refresh
    }, autoRefreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchMoves, autoRefreshInterval]);

  // Listen for ship events to trigger refresh
  useEffect(() => {
    const handleShip = () => {
      // Delay slightly to let backend update
      setTimeout(() => fetchMoves(true), 500);
    };
    
    const handleTaskComplete = () => {
      setTimeout(() => fetchMoves(true), 500);
    };
    
    window.addEventListener('local-ship', handleShip);
    window.addEventListener('global-ship', handleShip);
    window.addEventListener('task-complete', handleTaskComplete);
    
    return () => {
      window.removeEventListener('local-ship', handleShip);
      window.removeEventListener('global-ship', handleShip);
      window.removeEventListener('task-complete', handleTaskComplete);
    };
  }, [fetchMoves]);

  // Complete a move
  const completeMove = useCallback(async (moveId, move) => {
    try {
      await completeFocusMove(move || moveId);
      
      // Optimistic update
      setMoves(prev => prev.filter(m =>
        String(m.id) !== String(move?.id || moveId) &&
        String(m.sourceId || '') !== String(move?.sourceId || moveId) &&
        String(m.taskId || '') !== String(move?.taskId || moveId)
      ));
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('focus-move-complete', { 
        detail: { moveId } 
      }));
      
      // Refresh to get new moves
      setTimeout(() => fetchMoves(true), 1000);
      
      return true;
    } catch (err) {
      console.error('[FocusEngine] Complete error:', err);
      throw err;
    }
  }, [fetchMoves]);

  // Snooze a move
  const snoozeMove = useCallback(async (moveId, hours = 4, move) => {
    try {
      await snoozeFocusMove(move || moveId, hours);
      
      // Optimistic update - remove from current list
      setMoves(prev => prev.filter(m =>
        String(m.id) !== String(move?.id || moveId) &&
        String(m.sourceId || '') !== String(move?.sourceId || moveId) &&
        String(m.taskId || '') !== String(move?.taskId || moveId)
      ));
      
      // Refresh to get updated list
      setTimeout(() => fetchMoves(true), 500);
      
      return true;
    } catch (err) {
      console.error('[FocusEngine] Snooze error:', err);
      throw err;
    }
  }, [fetchMoves]);

  // Get top N moves
  const getTopNMoves = useCallback((count = 3) => {
    return moves.slice(0, count);
  }, [moves]);

  // Computed values
  const topMoves = useMemo(() => getTopNMoves(3), [getTopNMoves]);
  const impactSummary = useMemo(() => calculateImpactSummary(topMoves), [topMoves]);
  const hasUrgentMoves = useMemo(() => 
    topMoves.some(m => m.urgencyLevel === 'critical' || m.urgencyLevel === 'high'),
    [topMoves]
  );

  const value = useMemo(() => ({
    // Data
    moves,
    topMoves,
    impactSummary,
    hasUrgentMoves,
    
    // State
    loading,
    error,
    lastRefresh,
    isRefreshing,
    
    // Actions
    refresh: () => fetchMoves(false),
    silentRefresh: () => fetchMoves(true),
    completeMove,
    snoozeMove,
    getTopNMoves,
  }), [
    moves, topMoves, impactSummary, hasUrgentMoves,
    loading, error, lastRefresh, isRefreshing,
    fetchMoves, completeMove, snoozeMove, getTopNMoves,
  ]);

  return (
    <FocusEngineContext.Provider value={value}>
      {children}
    </FocusEngineContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main hook for accessing focus engine state
 */
export function useFocusEngine() {
  const context = useContext(FocusEngineContext);
  
  if (!context) {
    // Return a default state if not within provider
    // This allows components to work without the provider during development
    return {
      moves: [],
      topMoves: [],
      impactSummary: { totalMomentum: 0, totalUnblocks: 0, criticalCount: 0, highCount: 0 },
      hasUrgentMoves: false,
      loading: false,
      error: null,
      lastRefresh: null,
      isRefreshing: false,
      refresh: () => {},
      silentRefresh: () => {},
      completeMove: async () => false,
      snoozeMove: async () => false,
      getTopNMoves: () => [],
    };
  }
  
  return context;
}

/**
 * Hook that only returns top moves (lighter weight)
 */
export function useTopMoves(count = 3) {
  const { getTopNMoves, loading, error, isRefreshing } = useFocusEngine();
  
  const topMoves = useMemo(() => getTopNMoves(count), [getTopNMoves, count]);
  
  return { topMoves, loading, error, isRefreshing };
}

/**
 * Hook for moves by specific project
 */
export function useProjectMoves(projectId) {
  const { moves, loading, error } = useFocusEngine();
  
  const projectMoves = useMemo(() => 
    moves.filter(m => m.project?.id === projectId || m.projectId === projectId),
    [moves, projectId]
  );
  
  return { projectMoves, loading, error };
}

export default FocusEngineContext;
