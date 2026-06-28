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

  const { data } = await client.get(
    `/calendar/project/${projectId}/rhythm?${params.toString()}`
  );

  return data;
}

/**
 * CalendarEvent schema uses `description`, while the Schedule UI may use `notes`.
 * Normalize before sending to the backend so notes persist.
 */
function normalizeCalendarPayload(payload = {}, { forUpdate = false } = {}) {
  const {
    notes,
    note,
    type,
    projectId,
    id,
    _id,
    createdAt,
    updatedAt,
    createdBy,
    attendees,
    originalData,
    mode,
    editable,
    day,
    hour,
    minute,
    startHour,
    startMinute,
    duration,
    ...rest
  } = payload || {};

  const cleanPayload = { ...rest };

  if (notes !== undefined) {
    cleanPayload.description = notes;
  } else if (note !== undefined) {
    cleanPayload.description = note;
  }

  // Create needs projectId/type. Update does not.
  if (!forUpdate) {
    if (projectId !== undefined) cleanPayload.projectId = projectId;
    if (type !== undefined) cleanPayload.type = type;
  }

  return cleanPayload;
}

/**
 * Create a new calendar event / work session.
 */
export async function createEvent(payload) {
  const cleanPayload = normalizeCalendarPayload(payload, { forUpdate: false });
  const { data } = await client.post('/calendar/events', cleanPayload);
  return data;
}

/**
 * Update an existing calendar event / work session.
 */
export async function updateEvent(eventId, payload = {}) {
  if (!eventId) throw new Error('eventId is required');

  const cleanPayload = normalizeCalendarPayload(payload, { forUpdate: true });
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
