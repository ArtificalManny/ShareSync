import client from './client';

function unwrap(payload) {
  if (payload?.data?.data !== undefined) return payload.data.data;
  if (payload?.data !== undefined) return payload.data;
  return payload;
}

function unwrapArray(payload) {
  const data = unwrap(payload);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.tasks)) return data.tasks;

  return [];
}

function normalizeTask(t = {}) {
  const scheduleState =
    t.scheduleState ??
    t.status ??
    "todo";

  return {
    ...t,
    id: t.id || t._id,
    _id: t._id || t.id,
    dueDate: t.dueDate ?? null,
    completedAt: t.completedAt ?? null,
    scheduleState,
  };
}

export async function createTask(projectId, payload) {
  if (!projectId) throw new Error('projectId is required');

  const response = await client.post(`/projects/${projectId}/tasks`, payload);
  const task = unwrap(response);

  return normalizeTask(task);
}

export async function patchTask(projectId, taskId, patch) {
  if (!projectId) throw new Error('projectId is required');
  if (!taskId) throw new Error('taskId is required');

  const response = await client.patch(`/projects/${projectId}/tasks/${taskId}`, patch);
  const task = unwrap(response);

  return normalizeTask(task);
}

export async function listTasks(projectId, params = {}) {
  if (!projectId) throw new Error('projectId is required');

  const response = await client.get(`/projects/${projectId}/tasks`, { params });
  return unwrapArray(response).map(normalizeTask);
}

export async function getPriorityTasks(limit = 3, projectId = null) {
  const params = { limit };
  if (projectId) params.projectId = projectId;

  const response = await client.get('/tasks/priorities', { params });
  return unwrapArray(response).map(normalizeTask);
}

export async function getSmartSuggestions(projectId) {
  try {
    const response = await client.get(`/projects/${projectId}/suggestions/smart`);
    return unwrapArray(response);
  } catch (err) {
    console.warn("Could not load smart suggestions:", err);
    return [];
  }
}

export default {
  createTask,
  patchTask,
  listTasks,
  getPriorityTasks,
  getSmartSuggestions,
};
