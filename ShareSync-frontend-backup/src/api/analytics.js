import client from './client';

/**
 * Fetch real-time intelligence data (Peak windows, Co-working multipliers)
 */
export async function getIntelligence(projectId = null) {
  const params = {};
  if (projectId) params.projectId = projectId;
  
  const { data } = await client.get('/analytics/user/intelligence', { params });
  return data?.data || data;
}

export default { getIntelligence };
