// src/api/retro.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - API Calls
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

/**
 * Get weekly retro data
 */
export async function getWeeklyRetro(weekOffset = 0) {
  try {
    const response = await api.get('/retro/weekly', {
      params: { weekOffset },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Retro API] Failed to get weekly retro:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get retro history
 */
export async function getRetroHistory(limit = 12) {
  try {
    const response = await api.get('/retro/history', {
      params: { limit },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Retro API] Failed to get history:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save retro notes/reflections
 */
export async function saveRetroNotes(weekId, notes) {
  try {
    const response = await api.post('/retro/notes', {
      weekId,
      notes,
      savedAt: new Date().toISOString(),
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Retro API] Failed to save notes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark retro as viewed
 */
export async function markRetroViewed(weekId) {
  try {
    await api.post('/retro/viewed', { weekId });
    return { success: true };
  } catch (error) {
    console.error('[Retro API] Failed to mark viewed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get collaboration stats
 */
export async function getCollaborationStats(period = 'week') {
  try {
    const response = await api.get('/retro/collaborations', {
      params: { period },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Retro API] Failed to get collaboration stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get productivity trends
 */
export async function getProductivityTrends(weeks = 4) {
  try {
    const response = await api.get('/retro/trends', {
      params: { weeks },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Retro API] Failed to get trends:', error);
    return { success: false, error: error.message };
  }
}

export default {
  getWeeklyRetro,
  getRetroHistory,
  saveRetroNotes,
  markRetroViewed,
  getCollaborationStats,
  getProductivityTrends,
};
