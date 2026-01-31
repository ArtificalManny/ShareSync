// src/api/focusEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - API Layer
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';
import { rankMoves, getTopMoves } from '../utils/focusRanking';

/**
 * Get user's top focus moves across all projects
 * @param {number} count - Number of moves to return (default 3)
 * @returns {Promise<Array>}
 */
export async function getUserFocusMoves(count = 3) {
  try {
    const response = await client.get('/users/me/focus', {
      params: { count },
    });
    return response.data;
  } catch (error) {
    console.error('[FocusEngine API] Error fetching user focus:', error);
    // Return mock data for development
    return getMockUserFocusMoves();
  }
}

/**
 * Get project's critical moves
 * @param {string} projectId 
 * @param {number} count 
 * @returns {Promise<Array>}
 */
export async function getProjectFocusMoves(projectId, count = 3) {
  try {
    const response = await client.get(`/projects/${projectId}/focus`, {
      params: { count },
    });
    return response.data;
  } catch (error) {
    console.error('[FocusEngine API] Error fetching project focus:', error);
    return getMockProjectFocusMoves(projectId);
  }
}

/**
 * Mark a move as completed
 * @param {string} moveId 
 * @returns {Promise<Object>}
 */
export async function completeFocusMove(moveId) {
  try {
    const response = await client.post(`/focus/moves/${moveId}/complete`);
    return response.data;
  } catch (error) {
    console.error('[FocusEngine API] Error completing move:', error);
    throw error;
  }
}

/**
 * Snooze a move (push to later)
 * @param {string} moveId 
 * @param {number} hours - Hours to snooze
 * @returns {Promise<Object>}
 */
export async function snoozeFocusMove(moveId, hours = 4) {
  try {
    const response = await client.post(`/focus/moves/${moveId}/snooze`, { hours });
    return response.data;
  } catch (error) {
    console.error('[FocusEngine API] Error snoozing move:', error);
    throw error;
  }
}

/**
 * Get moves that user is blocking
 * @returns {Promise<Array>}
 */
export async function getBlockingMoves() {
  try {
    const response = await client.get('/users/me/blocking');
    return response.data;
  } catch (error) {
    console.error('[FocusEngine API] Error fetching blocking moves:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA (for development)
// ═══════════════════════════════════════════════════════════════════════════════

function getMockUserFocusMoves() {
  const now = new Date();
  
  const allMoves = [
    {
      id: 'fm1',
      title: 'Ship Sprint 3 retro document',
      description: 'Complete and distribute the sprint retrospective',
      type: 'ship',
      impact: 'Unblocks PMM launch planning',
      momentum: 220,
      unblocks: 3,
      deadline: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
      project: {
        id: 'p1',
        name: 'ShareSync Core',
        color: '#7C3AED',
      },
      assignee: { id: 'u1', name: 'You' },
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'fm2',
      title: 'Fix authentication timeout bug',
      description: 'Users getting logged out after 5 minutes',
      type: 'fix',
      impact: 'Critical for beta launch',
      momentum: 180,
      unblocks: 5,
      deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      project: {
        id: 'p1',
        name: 'ShareSync Core',
        color: '#7C3AED',
      },
      assignee: { id: 'u1', name: 'You' },
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'fm3',
      title: 'Review PR #142: Dashboard redesign',
      description: 'Jordan\'s dashboard component updates',
      type: 'review',
      impact: 'Unblocks frontend team',
      momentum: 140,
      unblocks: 2,
      deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      project: {
        id: 'p2',
        name: 'Design System',
        color: '#06B6D4',
      },
      assignee: { id: 'u1', name: 'You' },
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'fm4',
      title: 'Complete API documentation',
      description: 'Document the v2 endpoints for external devs',
      type: 'doc',
      impact: 'Enables partner integrations',
      momentum: 160,
      unblocks: 0,
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      project: {
        id: 'p3',
        name: 'API v2',
        color: '#10B981',
      },
      assignee: { id: 'u1', name: 'You' },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'fm5',
      title: 'Merge momentum engine feature',
      description: 'Final review and merge the momentum tracking',
      type: 'ship',
      impact: 'Core feature for Q1 launch',
      momentum: 280,
      unblocks: 4,
      deadline: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      project: {
        id: 'p1',
        name: 'ShareSync Core',
        color: '#7C3AED',
      },
      assignee: { id: 'u1', name: 'You' },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Rank and return top 3
  return getTopMoves(allMoves, 3);
}

function getMockProjectFocusMoves(projectId) {
  const now = new Date();
  
  return [
    {
      id: `pm1-${projectId}`,
      title: 'Ship Sprint 3 retro',
      type: 'ship',
      impact: 'Unblocks PMM launch',
      momentum: 220,
      unblocks: 3,
      deadline: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      assignee: { id: 'u1', name: 'Manny' },
    },
    {
      id: `pm2-${projectId}`,
      title: 'Close API bug #24',
      type: 'fix',
      impact: 'Critical for beta',
      momentum: 160,
      unblocks: 2,
      deadline: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      assignee: { id: 'u2', name: 'Sarah' },
    },
    {
      id: `pm3-${projectId}`,
      title: 'Review authentication PRs',
      type: 'review',
      impact: 'Unblocks 3 teammates',
      momentum: 140,
      unblocks: 3,
      deadline: null,
      assignee: { id: 'u1', name: 'Manny' },
    },
  ];
}

export default {
  getUserFocusMoves,
  getProjectFocusMoves,
  completeFocusMove,
  snoozeFocusMove,
  getBlockingMoves,
};
