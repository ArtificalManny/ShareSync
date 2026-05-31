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

export async function createTask(projectId, payload) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.post(`/projects/${projectId}/tasks`, payload);
  return normalizeTask(data);
}

export async function patchTask(projectId, taskId, patch) {
  if (!projectId) throw new Error('projectId is required');
  if (!taskId) throw new Error('taskId is required');
  const { data } = await client.patch(`/projects/${projectId}/tasks/${taskId}`, patch);
  return normalizeTask(data);
}

export async function listTasks(projectId, params = {}) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.get(`/projects/${projectId}/tasks`, { params });
  if (Array.isArray(data)) {
    return data.map(normalizeTask);
  }
  const items = Array.isArray(data?.items) ? data.items.map(normalizeTask) : [];
  return { items, nextCursor: data?.nextCursor ?? null };
}

export async function getPriorityTasks(limit = 3, projectId = null) {
  const params = { limit };
  if (projectId) params.projectId = projectId;
  
  const { data } = await client.get('/tasks/priorities', { params });
  const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  return items.map(normalizeTask);
}

// ⭐ FIX FOR SCREENSHOT 1: Add missing getSmartSuggestions
export async function getSmartSuggestions(projectId) {
  try {
    const { data } = await client.get(`/projects/${projectId}/suggestions/smart`);
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.warn("Could not load smart suggestions:", err);
    return [];
  }
}

export default { createTask, patchTask, listTasks, getPriorityTasks, getSmartSuggestions };
