// /src/api/user.js (FRONTEND)
import client from './client';

/**
 * GET /api/user/activity-summary?range=28d
 * Returns the stats used by KPI row + Activity chart.
 * Example keys (your backend may include more):
 * {
 *   totalXP, streakDays, taskCompletionRate, daysActive, longestStreak,
 *   tasksThisWeek, tasksToday, activityCalendar: [{ date, count }, ...],
 *   xpHistory, streakData, tier
 * }
 */
export async function getActivitySummary(range = '28d') {
  const { data } = await client.get(`/user/activity-summary?range=${range}`);
  return data;
}
