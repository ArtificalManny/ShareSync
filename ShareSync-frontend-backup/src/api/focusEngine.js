// src/api/focusEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - API Layer (BULLETPROOF)
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';
import { getTopMoves } from '../utils/focusRanking';

/**
 * 🚨 HELPER: Aggressively digs through heavily nested API wrappers to find the array
 * Protects against { success: true, data: { success: true, data: [...] } }
 */
const extractArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
};

/**
 * Get user's top focus moves across all projects
 * @param {number} count - Number of moves to return
 * @returns {Promise<Array>}
 */
export async function getUserFocusMoves(count = 3) {
  try {
    let tasks = [];

    // ATTEMPT 1: Try the strict backend priority algorithm
    try {
      const res = await client.get('/tasks/priorities', { params: { limit: count } });
      tasks = extractArray(res.data || res);
    } catch (err) {
      console.warn("⚠️ Priorities endpoint failed, proceeding to fallback...");
    }

    // ATTEMPT 2 (FALLBACK): If strict algorithm yielded nothing, cast a wider net
    if (!tasks || tasks.length === 0) {
      console.log("🟢 [API] Priorities empty. Falling back to general active tasks...");
      
      // Fetch recent tasks broadly
      const res = await client.get('/tasks', { params: { limit: 20 } });
      const allTasks = extractArray(res.data || res);

      // Frontend Filter: Exclude anything that is already done
      tasks = allTasks.filter(t => 
        t.status !== 'DONE' && 
        t.status !== 'done' && 
        t.status !== 'COMPLETED'
      );
    }

    return tasks;

  } catch (error) {
    console.error('🔴 [FocusEngine API] Fatal error fetching user focus:', error);
    // If the server completely dies, return Mock Data so the UI doesn't break
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
    return extractArray(response.data || response);
  } catch (error) {
    console.warn('⚠️ Project focus failed, using fallback:', error);
    
    // Fallback logic for projects
    const res = await client.get('/tasks', { params: { projectId, limit: 10 } });
    const allTasks = extractArray(res.data || res);
    return allTasks.filter(t => t.status !== 'DONE' && t.status !== 'done');
  }
}

/**
 * Mark a move as completed
 * @param {string} moveId 
 * @returns {Promise<Object>}
 */
export async function completeFocusMove(moveId) {
  try {
    const response = await client.patch(`/tasks/${moveId}/complete`, {});
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
    return extractArray(response.data || response);
  } catch (error) {
    console.error('[FocusEngine API] Error fetching blocking moves:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA (Safety Net)
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
      deadline: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      project: { id: 'p1', name: 'ShareSync Core', color: '#7C3AED' },
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
      deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      project: { id: 'p1', name: 'ShareSync Core', color: '#7C3AED' },
      assignee: { id: 'u1', name: 'You' },
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
  return getTopMoves(allMoves, 3);
}

export default {
  getUserFocusMoves,
  getProjectFocusMoves,
  completeFocusMove,
  snoozeFocusMove,
  getBlockingMoves,
};
