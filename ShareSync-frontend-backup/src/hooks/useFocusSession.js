// src/hooks/useFocusSession.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.3: Focus Sessions - Convenience Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Re-exports the context hook with additional utilities.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import { useFocusSession as useFocusSessionContext, FOCUS_STATUS, FOCUS_DURATIONS } from '../contexts/FocusSessionContext';

/**
 * useFocusSession - Main hook for focus session management
 * Re-exports context with additional utilities
 */
export default function useFocusSession() {
  const context = useFocusSessionContext();
  
  // Quick start helpers
  const startQuick = useCallback((task) => {
    context.startSession({ minutes: 25, task });
  }, [context]);

  const startShort = useCallback((task) => {
    context.startSession({ minutes: 15, task });
  }, [context]);

  const startLong = useCallback((task) => {
    context.startSession({ minutes: 45, task });
  }, [context]);

  // Progress helpers
  const progressPercent = useMemo(() => {
    return Math.round(context.progress);
  }, [context.progress]);

  const minutesRemaining = useMemo(() => {
    return Math.ceil(context.remainingSeconds / 60);
  }, [context.remainingSeconds]);

  const minutesElapsed = useMemo(() => {
    return Math.floor((context.totalSeconds - context.remainingSeconds) / 60);
  }, [context.totalSeconds, context.remainingSeconds]);

  // Status helpers
  const statusText = useMemo(() => {
    switch (context.status) {
      case FOCUS_STATUS.RUNNING:
        return 'In Focus';
      case FOCUS_STATUS.PAUSED:
        return 'Paused';
      case FOCUS_STATUS.BREAK:
        return 'On Break';
      case FOCUS_STATUS.COMPLETED:
        return 'Completed';
      default:
        return 'Ready';
    }
  }, [context.status]);

  const statusEmoji = useMemo(() => {
    switch (context.status) {
      case FOCUS_STATUS.RUNNING:
        return '🎯';
      case FOCUS_STATUS.PAUSED:
        return '⏸️';
      case FOCUS_STATUS.BREAK:
        return '☕';
      case FOCUS_STATUS.COMPLETED:
        return '🎉';
      default:
        return '⏱️';
    }
  }, [context.status]);

  return {
    ...context,
    
    // Quick start helpers
    startQuick,
    startShort,
    startLong,
    
    // Progress helpers
    progressPercent,
    minutesRemaining,
    minutesElapsed,
    
    // Status helpers
    statusText,
    statusEmoji,
  };
}

/**
 * useFocusStats - Get focus statistics
 */
export function useFocusStats() {
  const { sessionsToday, totalFocusTimeToday, getSessionHistory } = useFocusSessionContext();
  
  const weeklyStats = useMemo(() => {
    const sessions = getSessionHistory(100);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklySessions = sessions.filter(s => 
      new Date(s.completedAt) > weekAgo
    );
    
    const totalMinutes = weeklySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgPerDay = totalMinutes / 7;
    
    return {
      sessions: weeklySessions.length,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      avgPerDay: Math.round(avgPerDay),
    };
  }, [getSessionHistory]);

  return {
    today: {
      sessions: sessionsToday,
      totalMinutes: totalFocusTimeToday,
      totalHours: Math.round(totalFocusTimeToday / 60 * 10) / 10,
    },
    weekly: weeklyStats,
    history: getSessionHistory(10),
  };
}

export { FOCUS_STATUS, FOCUS_DURATIONS };