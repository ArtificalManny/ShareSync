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

/**
 * Fetch dashboard productivity stats for Home page
 */
export async function getMyDashboard(params = {}) {
  const { data } = await client.get('/analytics/me/dashboard', { params });
  return data?.data || data;
}

/**
 * Fetch personal profile analytics for Profile page
 */
export async function getMyProfileStats() {
  const { data } = await client.get('/analytics/me/profile-stats');
  return data?.data || data;
}

export default { getIntelligence, getMyDashboard, getMyProfileStats };
