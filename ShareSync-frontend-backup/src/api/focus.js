// src/api/focus.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.3: Focus Sessions - API Calls
// ═══════════════════════════════════════════════════════════════════════════════
//
// API endpoints for logging focus time, syncing sessions, and analytics.
//
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

/**
 * Log a completed focus session
 */
export async function logFocusSession(sessionData) {
  const {
    duration,
    taskId,
    taskName,
    projectId,
    startedAt,
    completedAt,
    wasInterrupted = false,
  } = sessionData;

  try {
    const response = await api.post('/focus-sessions', {
      duration,
      taskId,
      taskName,
      projectId,
      startedAt,
      completedAt,
      wasInterrupted,
    });

    return { success: true, session: response.data };
  } catch (error) {
    console.error('[Focus API] Failed to log session:', error);
    
    // Store locally for later sync
    storeLocalSession(sessionData);
    
    return { success: false, error: error.message, storedLocally: true };
  }
}

/**
 * Get focus session history
 */
export async function getFocusHistory(options = {}) {
  const { limit = 20, taskId, projectId, startDate, endDate } = options;

  try {
    const response = await api.get('/focus-sessions', {
      params: { limit, taskId, projectId, startDate, endDate },
    });

    return { success: true, sessions: response.data };
  } catch (error) {
    console.error('[Focus API] Failed to get history:', error);
    
    // Return local sessions as fallback
    const localSessions = getLocalSessions();
    return { success: false, sessions: localSessions, error: error.message };
  }
}

/**
 * Get focus stats for a time period
 */
export async function getFocusStats(period = 'week') {
  try {
    const response = await api.get('/focus-sessions/stats', {
      params: { period },
    });

    return { success: true, stats: response.data };
  } catch (error) {
    console.error('[Focus API] Failed to get stats:', error);
    
    // Calculate from local sessions
    const localStats = calculateLocalStats(period);
    return { success: false, stats: localStats, error: error.message };
  }
}

/**
 * Update task with focus time
 */
export async function addFocusTimeToTask(taskId, minutes) {
  try {
    const response = await api.patch(`/tasks/${taskId}/focus`, {
      focusMinutes: minutes,
      lastFocusedAt: new Date().toISOString(),
    });

    return { success: true, task: response.data };
  } catch (error) {
    console.error('[Focus API] Failed to update task focus time:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Start a focus session (broadcasts to team if enabled)
 */
export async function startFocusSession(sessionData) {
  const { taskId, taskName, projectId, duration, broadcastToTeam = true } = sessionData;

  try {
    const response = await api.post('/focus-sessions/start', {
      taskId,
      taskName,
      projectId,
      plannedDuration: duration,
      broadcastToTeam,
    });

    return { success: true, sessionId: response.data.id };
  } catch (error) {
    console.error('[Focus API] Failed to start session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * End a focus session
 */
export async function endFocusSession(sessionId, data = {}) {
  const { actualDuration, wasCompleted = true, wasInterrupted = false } = data;

  try {
    const response = await api.patch(`/focus-sessions/${sessionId}/end`, {
      actualDuration,
      wasCompleted,
      wasInterrupted,
      endedAt: new Date().toISOString(),
    });

    return { success: true, session: response.data };
  } catch (error) {
    console.error('[Focus API] Failed to end session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync local sessions to server
 */
export async function syncLocalSessions() {
  const localSessions = getLocalSessions();
  if (localSessions.length === 0) return { success: true, synced: 0 };

  let synced = 0;
  const failed = [];

  for (const session of localSessions) {
    try {
      await api.post('/focus-sessions', session);
      synced++;
    } catch {
      failed.push(session);
    }
  }

  // Update local storage with only failed sessions
  if (failed.length > 0) {
    localStorage.setItem('ss.focus-sessions-pending', JSON.stringify(failed));
  } else {
    localStorage.removeItem('ss.focus-sessions-pending');
  }

  return { success: true, synced, failed: failed.length };
}

/**
 * Get focus leaderboard
 */
export async function getFocusLeaderboard(period = 'weekly', limit = 10) {
  try {
    const response = await api.get('/focus-sessions/leaderboard', {
      params: { period, limit },
    });

    return { success: true, leaderboard: response.data };
  } catch (error) {
    console.error('[Focus API] Failed to get leaderboard:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update focus preferences
 */
export async function updateFocusPreferences(preferences) {
  try {
    const response = await api.patch('/users/me/focus-preferences', preferences);
    return { success: true, preferences: response.data };
  } catch (error) {
    console.error('[Focus API] Failed to update preferences:', error);
    
    // Store locally
    try {
      localStorage.setItem('ss.focus-settings', JSON.stringify(preferences));
    } catch {}
    
    return { success: false, error: error.message, storedLocally: true };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const LOCAL_SESSIONS_KEY = 'ss.focus-sessions';
const PENDING_SESSIONS_KEY = 'ss.focus-sessions-pending';

/**
 * Store session locally (for offline support)
 */
function storeLocalSession(session) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_SESSIONS_KEY) || '[]');
    pending.push({
      ...session,
      localId: `local-${Date.now()}`,
      storedAt: new Date().toISOString(),
    });
    localStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(pending.slice(-50)));
  } catch (e) {
    console.error('[Focus API] Failed to store local session:', e);
  }
}

/**
 * Get locally stored sessions
 */
function getLocalSessions() {
  try {
    const stored = localStorage.getItem(LOCAL_SESSIONS_KEY);
    return stored ? JSON.parse(stored).sessions || [] : [];
  } catch {
    return [];
  }
}

/**
 * Calculate stats from local sessions
 */
function calculateLocalStats(period) {
  const sessions = getLocalSessions();
  
  const now = new Date();
  const periodMs = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  }[period] || 7 * 24 * 60 * 60 * 1000;

  const cutoff = new Date(now - periodMs);
  
  const relevantSessions = sessions.filter(s => 
    new Date(s.completedAt) > cutoff
  );

  const totalMinutes = relevantSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const uniqueDays = new Set(
    relevantSessions.map(s => new Date(s.completedAt).toDateString())
  ).size;

  return {
    totalSessions: relevantSessions.length,
    totalMinutes,
    totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    avgSessionLength: relevantSessions.length > 0 
      ? Math.round(totalMinutes / relevantSessions.length) 
      : 0,
    activeDays: uniqueDays,
    avgMinutesPerDay: uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0,
  };
}

export default {
  logFocusSession,
  getFocusHistory,
  getFocusStats,
  addFocusTimeToTask,
  startFocusSession,
  endFocusSession,
  syncLocalSessions,
  getFocusLeaderboard,
  updateFocusPreferences,
};
