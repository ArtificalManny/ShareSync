// Minimal calendar integration client (MVP).
// - link/unlink are stubs for Phase 2 OAuth (Google/Microsoft).
// - getIcsUrl returns the download URL for project tasks iCal export.

import client from './client';

/**
 * Link a calendar provider (Phase 2 OAuth).
 * @param {'google'|'microsoft'|'ical'} provider
 * @param {Object} payload
 */
export async function linkCalendar(provider, payload = {}) {
  if (!provider) throw new Error('provider is required');
  const { data } = await client.post(`/calendar/link`, { provider, ...payload });
  return data; // e.g., { linked: true, provider, accountEmail }
}

/**
 * Unlink a calendar provider.
 * @param {'google'|'microsoft'|'ical'} provider
 */
export async function unlinkCalendar(provider) {
  if (!provider) throw new Error('provider is required');
  const { data } = await client.post(`/calendar/unlink`, { provider });
  return data; // e.g., { linked: false, provider }
}

/**
 * Get the iCal (.ics) URL for a project's tasks.
 * @param {string} projectId
 * @returns {string} absolute or relative URL suitable for <a download>
 */
export function getIcsUrl(projectId) {
  if (!projectId) throw new Error('projectId is required');
  // If your API is behind /api prefix, keep it; otherwise adjust here.
  return `/api/projects/${encodeURIComponent(projectId)}/tasks.ics`;
}

export default { linkCalendar, unlinkCalendar, getIcsUrl };
