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
  try {
    const { data } = await client.post(`/projects/${projectId}/tasks`, payload);
    return normalizeTask(data);
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to create task');
  }
}

/** Patch/update a task in a project
 * Accepts schedule fields in patch.
 * 🔥 Wrapped in strict try/catch to guarantee Optimistic UI components can reliably catch and revert state.
 */
export async function patchTask(projectId, taskId, patch) {
  if (!projectId) throw new Error('projectId is required');
  if (!taskId) throw new Error('taskId is required');
  try {
    const { data } = await client.patch(`/projects/${projectId}/tasks/${taskId}`, patch);
    return normalizeTask(data);
  } catch (error) {
    console.warn('[Optimistic UI API Fallback Triggered] patchTask failed:', error);
    throw new Error(error?.response?.data?.message || 'Failed to update task');
  }
}

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

/** * Get smart suggestions (Restored to fix FirstMission import error)
 */
export async function getSmartSuggestions(projectId = null) {
  try {
    const params = projectId ? { projectId } : {};
    const { data } = await client.get('/tasks/suggestions', { params });
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  } catch (error) {
    console.warn('[tasks API] getSmartSuggestions failed:', error);
    return [];
  }
}

// ✅ Added getSmartSuggestions to the default export
export default { createTask, patchTask, listTasks, getPriorityTasks, getSmartSuggestions };
