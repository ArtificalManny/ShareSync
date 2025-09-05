import client from './client';

/** Create a task in a project */
export async function createTask(projectId, payload) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.post(`/projects/${projectId}/tasks`, payload);
  return data;
}

/** Patch/update a task in a project */
export async function patchTask(projectId, taskId, patch) {
  if (!projectId) throw new Error('projectId is required');
  if (!taskId) throw new Error('taskId is required');
  const { data } = await client.patch(`/projects/${projectId}/tasks/${taskId}`, patch);
  return data;
}

/** List tasks for a project (optional: filters) */
export async function listTasks(projectId, params = {}) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.get(`/projects/${projectId}/tasks`, { params });
  return data;
}