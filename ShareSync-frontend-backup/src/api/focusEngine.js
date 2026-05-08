// src/api/focusEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Three-Move Focus Engine - API Layer
// User-scoped only for Home.jsx.
//
// DAILY FOCUS ADDITION:
// - Adds frontend helpers for /daily-focus/today
// - Preserves existing /tasks/priorities behavior for current components
// - Does NOT add broad /tasks fallback
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

/**
 * Safely unwrap a standard backend response:
 * - { success: true, data: ... }
 * - { data: ... }
 * - raw object
 */
const unwrapData = (payload) => {
  if (!payload) return null;
  if (payload.data !== undefined) return payload.data;
  return payload;
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

const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/**
 * Normalize Daily Focus payload shape.
 */
const normalizeDailyFocusPlan = (plan) => {
  const safePlan = plan || {};

  return {
    dateKey: safePlan.dateKey || '',
    status: safePlan.status || 'suggested',
    question: safePlan.question || 'What should we work on today?',
    suggestions: Array.isArray(safePlan.suggestions) ? safePlan.suggestions : [],
    selectedMoves: Array.isArray(safePlan.selectedMoves) ? safePlan.selectedMoves : [],
  };
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
 *
 * Existing legacy behavior:
 * - This expects a real task ID.
 * - Daily Focus moves should use completeDailyFocusMove(moveId).
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

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY FOCUS API HELPERS
// Backend routes:
// GET    /daily-focus/today
// POST   /daily-focus/today/accept
// POST   /daily-focus/today/moves
// PATCH  /daily-focus/today/moves/:moveId
// DELETE /daily-focus/today/moves/:moveId
// POST   /daily-focus/today/moves/:moveId/complete
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTodayDailyFocus(options = {}) {
  const timezone = options.timezone || getBrowserTimezone();

  try {
    const response = await client.get('/daily-focus/today', {
      params: { timezone },
    });

    return normalizeDailyFocusPlan(unwrapData(response.data || response));
  } catch (error) {
    console.warn('[FocusEngine API] Daily Focus unavailable:', error?.message || error);

    return normalizeDailyFocusPlan({
      status: 'suggested',
      question: 'What should we work on today?',
      suggestions: [],
      selectedMoves: [],
    });
  }
}

export async function acceptTodayDailyFocus(moveIds = [], options = {}) {
  const timezone = options.timezone || getBrowserTimezone();

  if (!Array.isArray(moveIds) || moveIds.length === 0) {
    throw new Error('acceptTodayDailyFocus requires at least one move id.');
  }

  try {
    const response = await client.post('/daily-focus/today/accept', {
      moveIds,
      timezone,
    });

    return normalizeDailyFocusPlan(unwrapData(response.data || response));
  } catch (error) {
    console.error('[FocusEngine API] Error accepting Daily Focus moves:', error);
    throw error;
  }
}

export async function addDailyFocusMove({ title, projectId } = {}, options = {}) {
  const timezone = options.timezone || getBrowserTimezone();
  const cleanTitle = String(title || '').trim();

  if (!cleanTitle) {
    throw new Error('addDailyFocusMove requires a title.');
  }

  try {
    const response = await client.post('/daily-focus/today/moves', {
      title: cleanTitle,
      projectId: projectId || undefined,
      timezone,
    });

    return normalizeDailyFocusPlan(unwrapData(response.data || response));
  } catch (error) {
    console.error('[FocusEngine API] Error adding Daily Focus move:', error);
    throw error;
  }
}

export async function updateDailyFocusMove(moveId, { title } = {}, options = {}) {
  const timezone = options.timezone || getBrowserTimezone();
  const cleanTitle = String(title || '').trim();

  if (!moveId) {
    throw new Error('updateDailyFocusMove requires a move id.');
  }

  if (!cleanTitle) {
    throw new Error('updateDailyFocusMove requires a title.');
  }

  try {
    const response = await client.patch(`/daily-focus/today/moves/${moveId}`, {
      title: cleanTitle,
      timezone,
    });

    return normalizeDailyFocusPlan(unwrapData(response.data || response));
  } catch (error) {
    console.error('[FocusEngine API] Error updating Daily Focus move:', error);
    throw error;
  }
}

export async function deleteDailyFocusMove(moveId, options = {}) {
  const timezone = options.timezone || getBrowserTimezone();

  if (!moveId) {
    throw new Error('deleteDailyFocusMove requires a move id.');
  }

  try {
    const response = await client.delete(`/daily-focus/today/moves/${moveId}`, {
      params: { timezone },
    });

    return normalizeDailyFocusPlan(unwrapData(response.data || response));
  } catch (error) {
    console.error('[FocusEngine API] Error deleting Daily Focus move:', error);
    throw error;
  }
}

export async function completeDailyFocusMove(moveId, options = {}) {
  const timezone = options.timezone || getBrowserTimezone();

  if (!moveId) {
    throw new Error('completeDailyFocusMove requires a move id.');
  }

  try {
    const response = await client.post(`/daily-focus/today/moves/${moveId}/complete`, {
      timezone,
    });

    return normalizeDailyFocusPlan(unwrapData(response.data || response));
  } catch (error) {
    console.error('[FocusEngine API] Error completing Daily Focus move:', error);
    throw error;
  }
}

export default {
  getUserFocusMoves,
  getProjectFocusMoves,
  completeFocusMove,
  snoozeFocusMove,
  getBlockingMoves,

  getTodayDailyFocus,
  acceptTodayDailyFocus,
  addDailyFocusMove,
  updateDailyFocusMove,
  deleteDailyFocusMove,
  completeDailyFocusMove,
};
