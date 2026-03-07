// src/api/settings.js
// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS API HELPER
// Talks to NestJS SettingsController (@Controller('api/settings'))
// Used by Settings.jsx to load & save user settings.
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Get current user's settings.
 * Backend response shape (SettingsController.getSettings):
 *   { success: true, data: { ...settingsObject } }
 */
export async function getSettings() {
  const res = await client.get('/users/me/settings');
  // Prefer the wrapped "data" field if present
  return res.data?.data ?? res.data;
}

/**
 * Update current user's settings (deep-merge in backend).
 * Uses PUT /settings to update multiple sections at once.
 */
export async function updateSettings(payload) {
  const res = await client.put('/users/me/settings', payload);
  return res.data?.data ?? res.data;
}

/**
 * Optional: update a single settings section
 *  e.g. updateSettingsSection('notifications', { emailActivity: false })
 * This maps to PATCH /settings/:section in SettingsController.
 */
export async function updateSettingsSection(section, payload) {
  const res = await client.patch(`/users/me/settings/${section}`, payload);
  return res.data?.data ?? res.data;
}
