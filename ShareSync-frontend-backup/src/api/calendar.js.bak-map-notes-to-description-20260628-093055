import client from './client';

/**
 * Link a calendar provider (Phase 2 OAuth).
 */
export async function linkCalendar(provider, payload = {}) {
  if (!provider) throw new Error('provider is required');
  const { data } = await client.post('/calendar/link', { provider, ...payload });
  return data;
}

/**
 * Unlink a calendar provider.
 */
export async function unlinkCalendar(provider) {
  if (!provider) throw new Error('provider is required');
  const { data } = await client.post('/calendar/unlink', { provider });
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

  const { data } = await client.get(
    `/calendar/project/${projectId}/rhythm?${params.toString()}`
  );

  return data;
}

/**
 * Create a new calendar event / work session.
 *
 * Create still sends the full payload because the backend needs projectId/type
 * when a new Schedule session is created.
 */
export async function createEvent(payload) {
  const { data } = await client.post('/calendar/events', payload);
  return data;
}

/**
 * Update an existing calendar event / work session.
 *
 * The backend update DTO rejects projectId/type, so strip only those fields
 * before PUT /calendar/events/:id.
 */
export async function updateEvent(eventId, payload = {}) {
  if (!eventId) throw new Error('eventId is required');

  const {
    type: _type,
    projectId: _projectId,
    ...cleanPayload
  } = payload || {};

  const { data } = await client.put(`/calendar/events/${eventId}`, cleanPayload);
  return data;
}

export default {
  linkCalendar,
  unlinkCalendar,
  getIcsUrl,
  getProjectRhythm,
  createEvent,
  updateEvent,
};
