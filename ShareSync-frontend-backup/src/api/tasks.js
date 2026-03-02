import client from './client';

/**
 * Normalize task shape so UI code can rely on presence of schedule fields.
 * Ensures dueDate/completedAt are strings (or null) and scheduleState is one of the allowed values.
 */
function normalizeTask(t) {
  if (!t || typeof t !== 'object') return t;
  const allowed = new Set(['early', 'on_time', 'late', 'at_risk', null, undefined]);
  const scheduleState = allowed.has(t.scheduleState) ? t.scheduleState : null;
  return {
    ...t,
    dueDate: t.dueDate ?? null,
    completedAt: t.completedAt ?? null,
    scheduleState,
  };
}

/** Create a task in a project
 * Accepts schedule fields: { title, ..., dueDate?, completedAt?, scheduleState? }
 */
export async function createTask(projectId, payload) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.post(`/projects/${projectId}/tasks`, payload);
  // BE returns created task; normalize schedule fields for UI
  return normalizeTask(data);
}

/** Patch/update a task in a project
 * Accepts schedule fields in patch.
 */
export async function patchTask(projectId, taskId, patch) {
  if (!projectId) throw new Error('projectId is required');
  if (!taskId) throw new Error('taskId is required');
  const { data } = await client.patch(`/projects/${projectId}/tasks/${taskId}`, patch);
  return normalizeTask(data);
}

/** Alias for patchTask — convenience for components that call "updateTask" */
export const updateTask = patchTask;

/** List tasks for a project (optional: cursor/limit, state filters, etc.)
 * Returns { items, nextCursor } with normalized tasks.
 */
export async function listTasks(projectId, params = {}) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.get(`/projects/${projectId}/tasks`, { params });
  if (Array.isArray(data)) {
    // some APIs return raw array
    return data.map(normalizeTask);
  }
  // expected shape { items, nextCursor }
  const items = Array.isArray(data?.items) ? data.items.map(normalizeTask) : [];
  return { items, nextCursor: data?.nextCursor ?? null };
}

/** Get user priority tasks ("Your 3 Moves Today")
 */
export async function getPriorityTasks(limit = 3, projectId = null) {
  const params = { limit };
  if (projectId) params.projectId = projectId;
  
  const { data } = await client.get('/tasks/priorities', { params });
  const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  return items.map(normalizeTask);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.1: Smart Suggestions for FirstMission onboarding
// ═══════════════════════════════════════════════════════════════════════════════

/** Get smart task suggestions based on user archetype
 *  Falls back to empty array if backend endpoint doesn't exist yet
 */
export async function getSmartSuggestions(archetype = null) {
  try {
    const params = {};
    if (archetype) params.archetype = archetype;
    const { data } = await client.get('/tasks/suggestions', { params });
    const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    return items;
  } catch (err) {
    // If endpoint doesn't exist (404) or any other error, return empty
    // FirstMission.jsx has its own FALLBACK_SUGGESTIONS
    console.warn('[getSmartSuggestions] Endpoint not available:', err?.response?.status || err?.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.1+: Additional task operations
// ═══════════════════════════════════════════════════════════════════════════════

/** Delete a task from a project */
export async function deleteTask(projectId, taskId) {
  if (!projectId) throw new Error('projectId is required');
  if (!taskId) throw new Error('taskId is required');
  const { data } = await client.delete(`/projects/${projectId}/tasks/${taskId}`);
  return data;
}

/** Batch-reorder tasks within a project (for drag-and-drop)
 * @param {string} projectId
 * @param {string[]} taskIds — ordered array of task IDs (new sort order)
 * @param {string} [status] — optional status column (for kanban reorder within a column)
 */
export async function reorderTasks(projectId, taskIds, status) {
  if (!projectId) throw new Error('projectId is required');
  if (!Array.isArray(taskIds) || taskIds.length === 0) throw new Error('taskIds array is required');
  const payload = { taskIds };
  if (status) payload.status = status;
  const { data } = await client.put(`/projects/${projectId}/tasks/reorder`, payload);
  return data;
}

/** Move a task to a different status (for kanban column drag)
 * @param {string} projectId
 * @param {string} taskId
 * @param {string} newStatus — target status column
 * @param {number} [order] — optional position within the new column
 */
export async function moveTaskStatus(projectId, taskId, newStatus, order) {
  if (!projectId) throw new Error('projectId is required');
  if (!taskId) throw new Error('taskId is required');
  const patch = { status: newStatus };
  if (typeof order === 'number') patch.order = order;
  return patchTask(projectId, taskId, patch);
}

/** Complete a task (via the standalone /tasks/:id/complete endpoint) */
export async function completeTask(taskId) {
  if (!taskId) throw new Error('taskId is required');
  const { data } = await client.post(`/tasks/${taskId}/complete`);
  return normalizeTask(data);
}

/** Update due date for a task */
export async function updateDueDate(taskId, dueDate) {
  if (!taskId) throw new Error('taskId is required');
  const { data } = await client.put(`/tasks/${taskId}/due-date`, { dueDate });
  return normalizeTask(data);
}

/** Set reminder preference for a task */
export async function setTaskReminder(taskId, reminder) {
  if (!taskId) throw new Error('taskId is required');
  const { data } = await client.put(`/tasks/${taskId}/reminder`, { reminder });
  return data;
}

export default {
  createTask,
  patchTask,
  updateTask,
  listTasks,
  getPriorityTasks,
  getSmartSuggestions,
  deleteTask,
  reorderTasks,
  moveTaskStatus,
  completeTask,
  updateDueDate,
  setTaskReminder,
};
