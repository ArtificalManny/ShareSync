// src/config/featureFlags.js
// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS - Extended configuration for Phase 10+ features
// ═══════════════════════════════════════════════════════════════════════════════
//
// This file extends the base flags.js with additional feature configurations.
// Import from here for full feature flag support including Phase 10 FOMO features.
//
// ═══════════════════════════════════════════════════════════════════════════════

// Re-export everything from base flags
export * from './flags';
export { default as FLAGS } from './flags';

// Import base flag helper
function parseBool(v, def = false) {
  if (v === undefined || v === null) return def;
  return /^(1|true|on|yes)$/i.test(String(v));
}

function envFlag(name, def = false) {
  const v = import.meta?.env?.[name];
  return parseBool(v, def);
}

// Load localStorage overrides
function loadOverrides() {
  try {
    const raw = localStorage.getItem('sharesync.flags');
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return typeof obj === 'object' && obj ? obj : {};
  } catch {
    return {};
  }
}

const overrides = loadOverrides();
const flag = (key, envName, def = false) =>
  (overrides[key] !== undefined ? overrides[key] : envFlag(envName, def));

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10: FOMO FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════════════════════

// 10.1 Live Arena - Real-time team visibility
export const LIVE_ARENA_V1 = flag('LIVE_ARENA_V1', 'VITE_FEATURE_LIVE_ARENA_V1', false);

// 10.2 Momentum Streaks - Public leaderboard
export const MOMENTUM_STREAKS_V1 = flag('MOMENTUM_STREAKS_V1', 'VITE_FEATURE_MOMENTUM_STREAKS_V1', false);

// 10.3 Focus Sessions - Pomodoro integration
export const FOCUS_SESSIONS_V1 = flag('FOCUS_SESSIONS_V1', 'VITE_FEATURE_FOCUS_SESSIONS_V1', true);

// 10.4 Weekly Retro - AI-generated insights
export const WEEKLY_RETRO_V1 = flag('WEEKLY_RETRO_V1', 'VITE_FEATURE_WEEKLY_RETRO_V1', false);

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10 SUB-FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

// Live Arena sub-features
export const ARENA_PRESENCE_DOTS = flag('ARENA_PRESENCE_DOTS', 'VITE_FEATURE_ARENA_PRESENCE_DOTS', true);
export const ARENA_ACTIVE_TASKS = flag('ARENA_ACTIVE_TASKS', 'VITE_FEATURE_ARENA_ACTIVE_TASKS', true);
export const ARENA_COWORK_INVITE = flag('ARENA_COWORK_INVITE', 'VITE_FEATURE_ARENA_COWORK_INVITE', false);

// Momentum Streaks sub-features
export const STREAKS_FIRE_ANIMATION = flag('STREAKS_FIRE_ANIMATION', 'VITE_FEATURE_STREAKS_FIRE_ANIMATION', true);
export const STREAKS_HALL_OF_FAME = flag('STREAKS_HALL_OF_FAME', 'VITE_FEATURE_STREAKS_HALL_OF_FAME', true);
export const STREAKS_COMEBACK_BADGE = flag('STREAKS_COMEBACK_BADGE', 'VITE_FEATURE_STREAKS_COMEBACK_BADGE', true);

// Focus Sessions sub-features
export const FOCUS_NOTIFICATIONS = flag('FOCUS_NOTIFICATIONS', 'VITE_FEATURE_FOCUS_NOTIFICATIONS', true);
export const FOCUS_SOUNDS = flag('FOCUS_SOUNDS', 'VITE_FEATURE_FOCUS_SOUNDS', true);
export const FOCUS_TEAM_VISIBILITY = flag('FOCUS_TEAM_VISIBILITY', 'VITE_FEATURE_FOCUS_TEAM_VISIBILITY', true);
export const FOCUS_AUTO_BREAK = flag('FOCUS_AUTO_BREAK', 'VITE_FEATURE_FOCUS_AUTO_BREAK', false);

// Weekly Retro sub-features
export const RETRO_AI_INSIGHTS = flag('RETRO_AI_INSIGHTS', 'VITE_FEATURE_RETRO_AI_INSIGHTS', true);
export const RETRO_PEAK_HOURS = flag('RETRO_PEAK_HOURS', 'VITE_FEATURE_RETRO_PEAK_HOURS', true);
export const RETRO_COLLABORATION = flag('RETRO_COLLABORATION', 'VITE_FEATURE_RETRO_COLLABORATION', true);
export const RETRO_EXPORT = flag('RETRO_EXPORT', 'VITE_FEATURE_RETRO_EXPORT', false);

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

// WebSocket connection
export const WEBSOCKET_ENABLED = flag('WEBSOCKET_ENABLED', 'VITE_FEATURE_WEBSOCKET', false);
export const WEBSOCKET_DEBUG = flag('WEBSOCKET_DEBUG', 'VITE_WEBSOCKET_DEBUG', false);

// Real-time presence
export const REALTIME_PRESENCE = flag('REALTIME_PRESENCE', 'VITE_FEATURE_REALTIME_PRESENCE', false);

// Real-time notifications
export const REALTIME_NOTIFICATIONS = flag('REALTIME_NOTIFICATIONS', 'VITE_FEATURE_REALTIME_NOTIFICATIONS', false);

// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

// XP System
export const XP_SYSTEM_V1 = flag('XP_SYSTEM_V1', 'VITE_FEATURE_XP_SYSTEM_V1', false);

// Badges & Achievements
export const BADGES_V1 = flag('BADGES_V1', 'VITE_FEATURE_BADGES_V1', false);

// Level system
export const LEVELS_V1 = flag('LEVELS_V1', 'VITE_FEATURE_LEVELS_V1', false);

// Daily challenges
export const DAILY_CHALLENGES_V1 = flag('DAILY_CHALLENGES_V1', 'VITE_FEATURE_DAILY_CHALLENGES_V1', false);

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE FLAG GROUPS (for easy checking)
// ═══════════════════════════════════════════════════════════════════════════════

export const PHASE_10_FLAGS = {
  LIVE_ARENA_V1,
  MOMENTUM_STREAKS_V1,
  FOCUS_SESSIONS_V1,
  WEEKLY_RETRO_V1,
};

export const REALTIME_FLAGS = {
  WEBSOCKET_ENABLED,
  WEBSOCKET_DEBUG,
  REALTIME_PRESENCE,
  REALTIME_NOTIFICATIONS,
};

export const GAMIFICATION_FLAGS = {
  XP_SYSTEM_V1,
  BADGES_V1,
  LEVELS_V1,
  DAILY_CHALLENGES_V1,
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if any flag in a group is enabled
 * @param {object} flagGroup - Group of flags
 * @returns {boolean}
 */
export function isAnyEnabled(flagGroup) {
  return Object.values(flagGroup).some(v => v === true);
}

/**
 * Check if all flags in a group are enabled
 * @param {object} flagGroup - Group of flags
 * @returns {boolean}
 */
export function isAllEnabled(flagGroup) {
  return Object.values(flagGroup).every(v => v === true);
}

/**
 * Get enabled flags from a group
 * @param {object} flagGroup - Group of flags
 * @returns {string[]} Array of enabled flag names
 */
export function getEnabledFlags(flagGroup) {
  return Object.entries(flagGroup)
    .filter(([_, v]) => v === true)
    .map(([k]) => k);
}

/**
 * Set a flag override (persists to localStorage)
 * @param {string} key - Flag key
 * @param {boolean} value - Flag value
 */
export function setFlagOverride(key, value) {
  try {
    const overrides = loadOverrides();
    overrides[key] = value;
    localStorage.setItem('sharesync.flags', JSON.stringify(overrides));
    // Note: Requires page reload to take effect
  } catch (e) {
    console.error('[FeatureFlags] Failed to set override:', e);
  }
}

/**
 * Clear all flag overrides
 */
export function clearFlagOverrides() {
  try {
    localStorage.removeItem('sharesync.flags');
  } catch (e) {
    console.error('[FeatureFlags] Failed to clear overrides:', e);
  }
}

/**
 * Get all current flags (useful for debugging)
 * @returns {object} All flags with current values
 */
export function getAllFlags() {
  return {
    // Phase 10
    LIVE_ARENA_V1,
    MOMENTUM_STREAKS_V1,
    FOCUS_SESSIONS_V1,
    WEEKLY_RETRO_V1,
    
    // Arena sub-features
    ARENA_PRESENCE_DOTS,
    ARENA_ACTIVE_TASKS,
    ARENA_COWORK_INVITE,
    
    // Streaks sub-features
    STREAKS_FIRE_ANIMATION,
    STREAKS_HALL_OF_FAME,
    STREAKS_COMEBACK_BADGE,
    
    // Focus sub-features
    FOCUS_NOTIFICATIONS,
    FOCUS_SOUNDS,
    FOCUS_TEAM_VISIBILITY,
    FOCUS_AUTO_BREAK,
    
    // Retro sub-features
    RETRO_AI_INSIGHTS,
    RETRO_PEAK_HOURS,
    RETRO_COLLABORATION,
    RETRO_EXPORT,
    
    // Real-time
    WEBSOCKET_ENABLED,
    WEBSOCKET_DEBUG,
    REALTIME_PRESENCE,
    REALTIME_NOTIFICATIONS,
    
    // Gamification
    XP_SYSTEM_V1,
    BADGES_V1,
    LEVELS_V1,
    DAILY_CHALLENGES_V1,
  };
}

// Debug helper - log all flags in development
if (import.meta?.env?.DEV) {
  console.log('[FeatureFlags] Phase 10 flags:', PHASE_10_FLAGS);
}
