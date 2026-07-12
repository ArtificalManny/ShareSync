import client from './client';

/**
 * Link a calendar provider.
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
 * Fetch the unified Rhythm timeline.
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

function normalizeCalendarPayload(payload = {}, { forUpdate = false } = {}) {
  const source = payload || {};

  const {
    id: _id,
    _id: __id,
    notes,
    originalData: _originalData,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    mode: _mode,
    editable: _editable,
    day: _day,
    hour: _hour,
    minute: _minute,
    startHour: _startHour,
    startMinute: _startMinute,
    duration: _duration,
    ...cleanPayload
  } = source;

  // Backend stores Schedule notes as `description`.
  // Prefer live textarea value `notes` when present.
  if (Object.prototype.hasOwnProperty.call(source, 'notes')) {
    cleanPayload.description = notes ?? '';
  } else if (Object.prototype.hasOwnProperty.call(source, 'description')) {
    cleanPayload.description = source.description ?? '';
  }

  if (forUpdate) {
    // These are creation-only / ownership fields. Do not send them during PUT.
    delete cleanPayload.projectId;
    delete cleanPayload.type;
    delete cleanPayload.userId;
    delete cleanPayload.createdBy;
    delete cleanPayload.attendees;
  }

  return cleanPayload;
}

/**
 * Create a new calendar event / Schedule session.
 */
export async function createEvent(payload = {}) {
  const cleanPayload = normalizeCalendarPayload(payload, { forUpdate: false });
  const { data } = await client.post('/calendar/events', cleanPayload);
  return data;
}

/**
 * Update an existing calendar event / Schedule session.
 */
export async function updateEvent(eventId, payload = {}) {
  if (!eventId) throw new Error('eventId is required');

  const cleanPayload = normalizeCalendarPayload(payload, { forUpdate: true });
  const { data } = await client.put(`/calendar/events/${eventId}`, cleanPayload);
  return data;
}

/**
 * Permanently delete an existing calendar event / Schedule session.
 */
export async function deleteEvent(eventId) {
  if (!eventId) throw new Error('eventId is required');

  const { data } = await client.delete(`/calendar/events/${eventId}`);
  return data;
}

export default {
  linkCalendar,
  unlinkCalendar,
  getIcsUrl,
  getProjectRhythm,
  createEvent,
  updateEvent,
  deleteEvent,
};
