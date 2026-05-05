// src/api/focusEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - API Layer
// User-scoped only for Home.jsx.
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Safely unwrap API responses like:
 * - [...]
 * - { data: [...] }
 * - { data: { data: [...] } }
 * - { data: { tasks: [...] } }
 * - { tasks: [...] }
 */
const extractArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.tasks)) return payload.tasks;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  if (payload.data && Array.isArray(payload.data.tasks)) return payload.data.tasks;
  return [];
};

const isOpenTask = (task) => {
  const status = String(task?.status || '').toLowerCase();

  return (
    status !== 'done' &&
    status !== 'completed' &&
    status !== 'complete' &&
    status !== 'archived' &&
    status !== 'deleted'
  );
};

/**
 * Get the logged-in user's top focus moves.
 *
 * Important:
 * Home must NOT fall back to broad /tasks.
 * If /tasks/priorities returns empty, return [].
 * Fresh accounts should see the empty state.
 */
export async function getUserFocusMoves(count = 3) {
  try {
    const res = await client.get('/tasks/priorities', {
      params: { limit: count },
    });

    const tasks = extractArray(res.data || res).filter(isOpenTask);

    return tasks.slice(0, count);
  } catch (error) {
    console.warn('[FocusEngine API] User focus unavailable:', error?.message || error);

    // Do not return mock data here.
    // Do not fetch broad /tasks here.
    // A fresh user should see "All caught up" / empty state.
    return [];
  }
}

/**
 * Get project-specific critical moves.
 * This is allowed to fall back to /tasks because it remains scoped by projectId.
 */
export async function getProjectFocusMoves(projectId, count = 3) {
  if (!projectId) return [];

  try {
    const response = await client.get(`/projects/${projectId}/focus`, {
      params: { count },
    });

    return extractArray(response.data || response).filter(isOpenTask).slice(0, count);
  } catch (error) {
    console.warn('[FocusEngine API] Project focus failed, using project-scoped fallback:', error?.message || error);

    try {
      const res = await client.get('/tasks', {
        params: { projectId, limit: Math.max(count, 10) },
      });

      const allTasks = extractArray(res.data || res);
      return allTasks.filter(isOpenTask).slice(0, count);
    } catch (fallbackError) {
      console.warn('[FocusEngine API] Project task fallback failed:', fallbackError?.message || fallbackError);
      return [];
    }
  }
}

/**
 * Mark a move as completed.
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
 * Snooze a move.
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
 * Get moves that user is blocking.
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

export default {
  getUserFocusMoves,
  getProjectFocusMoves,
  completeFocusMove,
  snoozeFocusMove,
  getBlockingMoves,
};
