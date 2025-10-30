// src/services/audit.js
import client from '../api/client';

/**
 * Fetch audit log – returns { items: [], total: 0 }
 */
export const fetchAudit = async ({ scope, projectId, limit = 20 }) => {
  const params = { scope, limit };
  if (scope === 'project' && projectId) params.projectId = projectId;

  const { data } = await client.get('/audit', { params });
  return data; // backend should return { items: [], total: 0 }
};