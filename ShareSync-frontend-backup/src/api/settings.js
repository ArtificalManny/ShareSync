// src/api/settings.js
// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS API - Frontend client for settings management
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

/**
 * Get all user settings
 */
export async function getSettings() {
  const response = await api.get('/api/settings');
  return response.data?.data || response.data;
}

/**
 * Update all settings
 */
export async function updateSettings(settings) {
  const response = await api.put('/api/settings', settings);
  return response.data?.data || response.data;
}

/**
 * Get a specific settings section
 * @param {string} section - momentum, focus, social, mentor, etc.
 */
export async function getSettingsSection(section) {
  const response = await api.get(`/api/settings/${section}`);
  return response.data?.data || response.data;
}

/**
 * Update a specific settings section
 * @param {string} section - momentum, focus, social, mentor, etc.
 * @param {object} update - The updates to apply
 */
export async function updateSettingsSection(section, update) {
  const response = await api.patch(`/api/settings/${section}`, update);
  return response.data?.data || response.data;
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(notifications) {
  return updateSettingsSection('notifications', notifications);
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(privacy) {
  return updateSettingsSection('privacy', privacy);
}

/**
 * Update appearance settings
 */
export async function updateAppearanceSettings(appearance) {
  return updateSettingsSection('appearance', appearance);
}

/**
 * Update mentor settings
 */
export async function updateMentorSettings(mentor) {
  return updateSettingsSection('mentor', mentor);
}

/**
 * Update momentum settings
 */
export async function updateMomentumSettings(momentum) {
  return updateSettingsSection('momentum', momentum);
}

/**
 * Update focus settings
 */
export async function updateFocusSettings(focus) {
  return updateSettingsSection('focus', focus);
}

/**
 * Update social settings
 */
export async function updateSocialSettings(social) {
  return updateSettingsSection('social', social);
}

/**
 * Update presence settings
 */
export async function updatePresenceSettings(presence) {
  return updateSettingsSection('presence', presence);
}

/**
 * Use a streak freeze
 */
export async function useStreakFreeze() {
  const response = await api.post('/api/settings/streak-freeze');
  return response.data;
}

/**
 * Export all settings
 */
export async function exportSettings() {
  const response = await api.get('/api/settings/export/all');
  return response.data?.data || response.data;
}

/**
 * Import settings from export
 */
export async function importSettings(exported) {
  const response = await api.post('/api/settings/import', exported);
  return response.data;
}

/**
 * Reset settings to defaults
 */
export async function resetSettings() {
  const response = await api.post('/api/settings/reset');
  return response.data;
}

export default {
  getSettings,
  updateSettings,
  getSettingsSection,
  updateSettingsSection,
  updateNotificationSettings,
  updatePrivacySettings,
  updateAppearanceSettings,
  updateMentorSettings,
  updateMomentumSettings,
  updateFocusSettings,
  updateSocialSettings,
  updatePresenceSettings,
  useStreakFreeze,
  exportSettings,
  importSettings,
  resetSettings,
};
