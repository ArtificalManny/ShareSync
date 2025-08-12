// /src/api/user.js
import client from './client';

/**
 * GET /api/user/activity-summary?range=28d
 * Returns totals + time-series used by KPI row and Activity chart.
 */
export async function getActivitySummary(range = '28d') {
  const { data } = await client.get(`/user/activity-summary?range=${range}`);
  return data;
}
