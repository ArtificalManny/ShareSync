// src/api/leaderboard.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.2: Momentum Streaks - Leaderboard API
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

/**
 * Get leaderboard data
 */
export async function getLeaderboard(options = {}) {
  const { category = 'streaks', period = 'weekly', limit = 10, teamOnly = false } = options;
  
  try {
    const response = await api.get('/leaderboard', {
      params: { category, period, limit, teamOnly },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Leaderboard API] Failed to fetch:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's rank
 */
export async function getMyRank(category = 'streaks') {
  try {
    const response = await api.get('/leaderboard/me', {
      params: { category },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Leaderboard API] Failed to get rank:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get comeback stories
 */
export async function getComebacks(period = 'weekly', limit = 5) {
  try {
    const response = await api.get('/leaderboard/comebacks', {
      params: { period, limit },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Leaderboard API] Failed to get comebacks:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get hall of fame entries
 */
export async function getHallOfFame(category = 'streaks', limit = 10) {
  try {
    const response = await api.get('/leaderboard/hall-of-fame', {
      params: { category, limit },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Leaderboard API] Failed to get hall of fame:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Opt in/out of public leaderboard
 */
export async function updateLeaderboardVisibility(visible) {
  try {
    const response = await api.patch('/users/me/preferences', {
      showOnLeaderboard: visible,
    });
    return { success: true };
  } catch (error) {
    console.error('[Leaderboard API] Failed to update visibility:', error);
    return { success: false, error: error.message };
  }
}

export default {
  getLeaderboard,
  getMyRank,
  getComebacks,
  getHallOfFame,
  updateLeaderboardVisibility,
};
