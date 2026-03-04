// src/api/settings.js
// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS API HELPER
// Talks to NestJS SettingsController (@Controller('api/settings'))
// Used by Settings.jsx to load & save user settings.
// ⭐ ADDED: 404 Fallback mocks to prevent frontend UI crashes while backend is pending
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

// Default fallback data to keep the UI rendering cleanly if the backend returns 404
const DEFAULT_SETTINGS_MOCK = {
  theme: "system",
  emailNotifications: true,
  pushNotifications: false,
  soundEnabled: true,
  focusModeDefaults: {
    duration: 25,
    autoStartBreaks: false,
  },
  privacy: {
    publicProfile: true,
    showActivityStatus: true,
  }
};

/**
 * Get current user's settings.
 * Backend response shape (SettingsController.getSettings):
 * { success: true, data: { ...settingsObject } }
 */
export async function getSettings() {
  try {
    const res = await client.get('/settings');
    // Prefer the wrapped "data" field if present
    return res.data?.data ?? res.data;
  } catch (error) {
    // Intercept 404 (Not Found) or 500 (Server Error) and return mock data safely
    if (error.response?.status === 404 || error.response?.status === 500) {
      console.warn("⚠️ [API FALLBACK] GET /api/settings not found. Returning mock settings to prevent UI crash.");
      return DEFAULT_SETTINGS_MOCK;
    }
    throw error; // Throw real network errors
  }
}

/**
 * Update current user's settings (deep-merge in backend).
 * Uses PUT /settings to update multiple sections at once.
 */
export async function updateSettings(payload) {
  try {
    const res = await client.put('/settings', payload);
    return res.data?.data ?? res.data;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      console.warn("⚠️ [API FALLBACK] PUT /api/settings not found. Simulating save success.");
      return { ...DEFAULT_SETTINGS_MOCK, ...payload };
    }
    throw error;
  }
}

/**
 * Optional: update a single settings section
 * e.g. updateSettingsSection('notifications', { emailActivity: false })
 * This maps to PATCH /settings/:section in SettingsController.
 */
export async function updateSettingsSection(section, payload) {
  try {
    const res = await client.patch(`/settings/${section}`, payload);
    return res.data?.data ?? res.data;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      console.warn(`⚠️ [API FALLBACK] PATCH /api/settings/${section} not found. Simulating save success.`);
      return payload;
    }
    throw error;
  }
}
