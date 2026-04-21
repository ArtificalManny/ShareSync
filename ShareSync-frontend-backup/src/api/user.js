// src/api/user.js
// ═══════════════════════════════════════════════════════════════════════════════
// USER API - Frontend client for user profile, settings, and streak protection
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

export const STREAK_PROTECTION_STATUS_ENDPOINT = '/users/me/streak-protection';
export const STREAK_PROTECTION_USE_FREEZE_ENDPOINT = '/users/me/streak-protection/use-freeze';

export const DEFAULT_STREAK_PROTECTION_STATUS = Object.freeze({
  supported: false,
  streakState: 'unknown',
  isAtRisk: false,
  allowFreeze: false,
  freezeCount: 0,
  streakDays: 0,
  message: '',
  riskWindowText: '',
  cooldownEndsAt: null,
  lastActivityDate: null,
  source: 'unavailable',
});

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  return Boolean(value);
}

function normalizeNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function normalizeStreakProtectionStatus(payload = {}) {
  const raw = payload?.data || payload || {};
  const source =
    raw?.streakProtection ||
    raw?.protection ||
    raw?.status ||
    raw ||
    {};

  const freezeCount = normalizeNumber(
    firstDefined(
      source.freezeCount,
      source.freezesRemaining,
      source.remainingFreezes,
      raw.freezeCount,
      raw.freezesRemaining,
      raw.remainingFreezes
    ),
    0
  );

  const allowFreeze = normalizeBoolean(
    firstDefined(
      source.allowFreeze,
      source.canUseFreeze,
      source.freezeAllowed,
      raw.allowFreeze,
      raw.canUseFreeze,
      raw.freezeAllowed
    ),
    false
  );

  const isAtRisk = normalizeBoolean(
    firstDefined(
      source.isAtRisk,
      source.atRisk,
      source.streakAtRisk,
      raw.isAtRisk,
      raw.atRisk,
      raw.streakAtRisk
    ),
    false
  );

  const streakDays = normalizeNumber(
    firstDefined(
      source.streakDays,
      source.currentStreakDays,
      raw.streakDays,
      raw.currentStreakDays
    ),
    0
  );

  const streakState =
    firstDefined(
      source.streakState,
      source.status,
      raw.streakState,
      raw.status
    ) || (isAtRisk ? 'at_risk' : 'safe');

  const supportedMarker = firstDefined(
    source.supported,
    source.endpointAvailable,
    raw.supported,
    raw.endpointAvailable
  );

  const supported =
    supportedMarker !== undefined
      ? Boolean(supportedMarker)
      : Object.keys(source || {}).length > 0;

  return {
    ...DEFAULT_STREAK_PROTECTION_STATUS,
    supported,
    streakState,
    isAtRisk,
    allowFreeze,
    freezeCount,
    streakDays,
    message:
      firstDefined(source.message, source.summary, raw.message, raw.summary) || '',
    riskWindowText:
      firstDefined(
        source.riskWindowText,
        source.riskWindow,
        raw.riskWindowText,
        raw.riskWindow
      ) || '',
    cooldownEndsAt:
      firstDefined(
        source.cooldownEndsAt,
        raw.cooldownEndsAt
      ) || null,
    lastActivityDate:
      firstDefined(
        source.lastActivityDate,
        raw.lastActivityDate
      ) || null,
    source:
      firstDefined(
        source.source,
        raw.source
      ) || 'backend',
  };
}

export async function getMe() {
  try {
    const userResponse = await api.get('/users/me');
    const user = userResponse.data?.data || userResponse.data;

    let settings = {};
    try {
      const settingsResponse = await api.get('/settings');
      settings = settingsResponse.data?.data || settingsResponse.data || {};
    } catch (e) {
      console.debug('Settings endpoint not available, using user data');
    }

    return {
      ...user,
      publicProfile: settings.social?.publicProfile ?? user.publicProfile ?? true,
      discoverable: settings.social?.discoverable ?? user.discoverable ?? false,
      appearance: settings.appearance || user.appearance || { theme: 'system', mode: 'pro' },
      notifications: settings.notifications || user.notificationSettings || {},
      mentor: settings.mentor || user.mentor || { enabled: true, tone: 'wise', intensity: 3 },
      momentum: settings.momentum || user.momentum || { dailyGoal: 5, weekendCount: true, allowFreeze: true },
      focus: settings.focus || user.focus || { dailyTarget: 4, autoStart: false, startTime: '09:00' },
      social: settings.social || user.social || { showStreakTo: 'friends', celebrate: true },
      legacy: settings.legacy || user.legacy || { showEverywhere: true, yearlyVideo: false },
      security: settings.security || user.security || { twoFA: false },
      presence: settings.presence || user.presence || { showCursor: true, showOnlineStatus: true },
      privacy: settings.privacy || user.privacySettings || {},
    };
  } catch (error) {
    console.error('Failed to get user:', error);
    throw error;
  }
}

export async function getPublicUser(username) {
  try {
    const response = await api.get(`/users/public/${username}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Failed to get public user:', error);
    throw error;
  }
}

export async function updateProfile(updates) {
  try {
    if (updates instanceof FormData) {
      const response = await api.post('/users/me/avatar', updates, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data || response.data;
    }

    const settingsFields = [
      'appearance', 'mentor', 'momentum', 'focus', 'social',
      'legacy', 'security', 'presence', 'privacy',
    ];

    const settingsUpdate = {};
    const profileUpdate = {};

    for (const [key, value] of Object.entries(updates)) {
      if (settingsFields.includes(key)) {
        settingsUpdate[key] = value;
      } else {
        profileUpdate[key] = value;
      }
    }

    if (Object.keys(settingsUpdate).length > 0) {
      try {
        await api.put('/settings', settingsUpdate);
      } catch (e) {
        Object.assign(profileUpdate, settingsUpdate);
      }
    }

    if (Object.keys(profileUpdate).length > 0) {
      const response = await api.put('/users/me', profileUpdate);
      return response.data?.data || response.data;
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
}

export async function updateNotifications(notifications) {
  try {
    const response = await api.patch('/settings/notifications', notifications);
    return response.data?.data || response.data;
  } catch (e) {
    const response = await api.patch('/users/me', { notificationSettings: notifications });
    return response.data?.data || response.data;
  }
}

export async function updatePrivacy(privacy) {
  try {
    const response = await api.patch('/settings/privacy', privacy);
    return response.data?.data || response.data;
  } catch (e) {
    const response = await api.patch('/users/me', { privacySettings: privacy });
    return response.data?.data || response.data;
  }
}

export async function getUserById(userId) {
  const response = await api.get(`/users/${userId}`);
  return response.data?.data || response.data;
}

export async function getUserByUsername(username) {
  const response = await api.get(`/users/username/${username}`);
  return response.data?.data || response.data;
}

export async function searchUsers(query, limit = 10) {
  const response = await api.get('/users/search', { params: { q: query, limit } });
  return response.data?.data || response.data || [];
}

export async function getStreakProtectionStatus() {
  try {
    const response = await api.get(STREAK_PROTECTION_STATUS_ENDPOINT);
    return normalizeStreakProtectionStatus(response.data?.data || response.data || {});
  } catch (error) {
    const statusCode = error?.response?.status;

    if ([404, 405, 501].includes(statusCode)) {
      return {
        ...DEFAULT_STREAK_PROTECTION_STATUS,
        supported: false,
        source: 'unavailable',
        message: 'Streak protection endpoint is not available yet.',
      };
    }

    console.error('Failed to get streak protection status:', error);
    throw error;
  }
}

export async function useStreakFreeze() {
  try {
    const response = await api.post(STREAK_PROTECTION_USE_FREEZE_ENDPOINT, {});
    return normalizeStreakProtectionStatus(response.data?.data || response.data || {});
  } catch (error) {
    const statusCode = error?.response?.status;

    if ([404, 405, 501].includes(statusCode)) {
      const endpointError = new Error('Streak protection endpoint is not available yet.');
      endpointError.code = 'STREAK_PROTECTION_UNAVAILABLE';
      throw endpointError;
    }

    console.error('Failed to use streak freeze:', error);
    throw error;
  }
}

export async function updateAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.data || response.data;
}

export async function deleteAvatar() {
  const response = await api.delete('/users/me/avatar');
  return response.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await api.post('/users/me/change-password', { currentPassword, newPassword });
  return response.data;
}

export async function exportUserData() {
  const response = await api.get('/users/me/export', { responseType: 'blob' });
  return response.data;
}

export async function deleteAccount(confirmation) {
  const response = await api.delete('/users/me', { data: { confirmation } });
  return response.data;
}

export default {
  getMe,
  getPublicUser,
  updateProfile,
  updateNotifications,
  updatePrivacy,
  getUserById,
  getUserByUsername,
  searchUsers,
  getStreakProtectionStatus,
  useStreakFreeze,
  updateAvatar,
  deleteAvatar,
  changePassword,
  exportUserData,
  deleteAccount,
};
