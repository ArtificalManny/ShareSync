import client from './client';

/**
 * Link a calendar provider (Phase 2 OAuth).
 */
export async function linkCalendar(provider, payload = {}) {
  if (!provider) throw new Error('provider is required');
  const { data } = await client.post(`/calendar/link`, { provider, ...payload });
  return data;
}

/**
 * Unlink a calendar provider.
 */
export async function unlinkCalendar(provider) {
  if (!provider) throw new Error('provider is required');
  const { data } = await client.post(`/calendar/unlink`, { provider });
  return data;
}

/**
 * Get the iCal (.ics) URL for a project's tasks.
 */
export function getIcsUrl(projectId) {
  if (!projectId) throw new Error('projectId is required');
  return `/api/projects/${encodeURIComponent(projectId)}/tasks.ics`;
}

/**
 * Fetch the unified Rhythm timeline (Events + Tasks + Sprints)
 */
export async function getProjectRhythm(projectId, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const { data } = await client.get(`/calendar/project/${projectId}/rhythm?${params.toString()}`);
  return data;
}

/**
 * Create a new calendar event / work session
 */
export async function createEvent(payload) {
  const { data } = await client.post('/calendar/events', payload);
  return data;
}

export default { linkCalendar, unlinkCalendar, getIcsUrl, getProjectRhythm, createEvent };
