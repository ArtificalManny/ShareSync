// /src/api/stats.js
import client from './client';

// User-scoped stats (Home)
export async function getUserStats({ range = 30 } = {}) {
  const r = await client.get(`/users/me/stats?range=${range}`);
  return r.data;
}

// Project-scoped stats (ProjectHome)
export async function getProjectStats(projectId, { range = 30 } = {}) {
  if (!projectId) throw new Error('projectId is required');
  const r = await client.get(`/projects/${projectId}/stats?range=${range}`);
  return r.data;
}