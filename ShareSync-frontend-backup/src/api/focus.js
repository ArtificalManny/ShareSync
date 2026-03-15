// src/api/focus.js
// ═══════════════════════════════════════════════════════════════════════════════
// API: Focus Engine Endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Get user's focus moves across all projects
 */
export async function getUserFocusMoves() {
  try {
    const response = await client.get('/api/focus/active').catch(() => ({ data: null }));
    return response.data;
  } catch (error) {
    console.error('[Focus API] User moves error:', error);
    return getMockUserFocusMoves();
  }
}

/**
 * Get project-specific focus moves
 */
export async function getProjectFocusMoves(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/focus`);
    return response.data;
  } catch (error) {
    console.error('[Focus API] Project moves error:', error);
    return getMockProjectFocusMoves(projectId);
  }
}

/**
 * Mark a move as complete
 */
export async function completeFocusMove(moveId) {
  try {
    const response = await client.post(`/focus/moves/${moveId}/complete`);
    return response.data;
  } catch (error) {
    console.error('[Focus API] Complete error:', error);
    throw error;
  }
}

/**
 * Snooze a move
 */
export async function snoozeFocusMove(moveId, duration = 60) {
  try {
    const response = await client.post(`/focus/moves/${moveId}/snooze`, { duration });
    return response.data;
  } catch (error) {
    console.error('[Focus API] Snooze error:', error);
    throw error;
  }
}

/**
 * Get tasks that current user is blocking
 */
export async function getBlockingTasks() {
  try {
    const response = await client.get('/users/me/blocking');
    return response.data;
  } catch (error) {
    console.error('[Focus API] Blocking error:', error);
    return [];
  }
}

// Mock data
function getMockUserFocusMoves() {
  return {
    moves: [
      {
        id: 'fm1',
        title: 'Ship momentum engine',
        description: 'Complete final testing and deploy',
        type: 'ship',
        impact: 'high',
        momentum: 250,
        unblocks: 2,
        deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        project: { id: 'p1', name: 'ShareSync', color: '#7C3AED' },
      },
      {
        id: 'fm2',
        title: 'Review design system PRs',
        description: '3 PRs waiting for review',
        type: 'review',
        impact: 'medium',
        momentum: 120,
        unblocks: 3,
        deadline: null,
        project: { id: 'p1', name: 'ShareSync', color: '#7C3AED' },
      },
      {
        id: 'fm3',
        title: 'Fix authentication timeout',
        description: 'Critical bug affecting beta users',
        type: 'fix',
        impact: 'high',
        momentum: 180,
        unblocks: 0,
        deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        project: { id: 'p2', name: 'API Service', color: '#06B6D4' },
      },
    ],
    impactSummary: {
      totalMomentum: 550,
      totalUnblocks: 5,
      urgentCount: 2,
    },
  };
}

function getMockProjectFocusMoves(projectId) {
  return getMockUserFocusMoves().moves.filter(m => m.project.id === projectId);
}

export default {
  getUserFocusMoves,
  getProjectFocusMoves,
  completeFocusMove,
  snoozeFocusMove,
  getBlockingTasks,
};
