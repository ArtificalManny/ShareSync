// src/api/notifications.js
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS API - Frontend client for notification endpoints
// Phase 9: Complete notification system
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

/**
 * Fetch notifications for current user
 * @param {Object} options - Query options
 * @param {number} options.limit - Max notifications to fetch
 * @param {number} options.offset - Pagination offset
 * @param {boolean} options.unreadOnly - Only fetch unread
 * @param {string} options.type - Filter by notification type
 */
export async function fetchNotifications(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));
    if (options.unreadOnly) params.append('unreadOnly', 'true');
    if (options.type) params.append('type', options.type);

    const query = params.toString();
    const url = `/api/notifications${query ? `?${query}` : ''}`;
    
    const response = await api.get(url);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] fetchNotifications error:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function fetchUnreadCount() {
  try {
    const response = await api.get('/api/notifications/unread-count');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] fetchUnreadCount error:', error);
    throw error;
  }
}

/**
 * Get notification count grouped by type
 */
export async function fetchCountByType() {
  try {
    const response = await api.get('/api/notifications/count-by-type');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] fetchCountByType error:', error);
    throw error;
  }
}

/**
 * Mark a single notification as read
 * @param {string} notificationId 
 */
export async function markAsRead(notificationId) {
  try {
    const response = await api.patch(`/api/notifications/${notificationId}/read`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] markAsRead error:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  try {
    const response = await api.patch('/api/notifications/read-all');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] markAllAsRead error:', error);
    throw error;
  }
}

/**
 * Mark a notification as clicked (also marks as read)
 * @param {string} notificationId 
 */
export async function markAsClicked(notificationId) {
  try {
    const response = await api.patch(`/api/notifications/${notificationId}/clicked`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] markAsClicked error:', error);
    throw error;
  }
}

/**
 * Dismiss a notification
 * @param {string} notificationId 
 */
export async function dismissNotification(notificationId) {
  try {
    const response = await api.patch(`/api/notifications/${notificationId}/dismiss`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] dismissNotification error:', error);
    throw error;
  }
}

/**
 * Delete a notification
 * @param {string} notificationId 
 */
export async function deleteNotification(notificationId) {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] deleteNotification error:', error);
    throw error;
  }
}

/**
 * Delete all read notifications
 */
export async function deleteAllRead() {
  try {
    const response = await api.delete('/api/notifications/read');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] deleteAllRead error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNEL VERIFICATION (Phase 4 - Email/SMS opt-in)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Start email verification
 * @param {string} email 
 */
export async function startEmailVerification(email) {
  try {
    const response = await api.post('/api/notifications/channels/email/start', { email });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] startEmailVerification error:', error);
    throw error;
  }
}

/**
 * Verify email with code
 * @param {string} email 
 * @param {string} code 
 */
export async function verifyEmail(email, code) {
  try {
    const response = await api.post('/api/notifications/channels/email/verify', { email, code });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] verifyEmail error:', error);
    throw error;
  }
}

/**
 * Start SMS verification
 * @param {string} phoneNumber 
 */
export async function startSmsVerification(phoneNumber) {
  try {
    const response = await api.post('/api/notifications/channels/sms/start', { phoneNumber });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] startSmsVerification error:', error);
    throw error;
  }
}

/**
 * Verify phone with code
 * @param {string} phoneNumber 
 * @param {string} code 
 */
export async function verifySms(phoneNumber, code) {
  try {
    const response = await api.post('/api/notifications/channels/sms/verify', { phoneNumber, code });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] verifySms error:', error);
    throw error;
  }
}

/**
 * Set opt-in preference for a channel
 * @param {'email' | 'sms'} channel 
 * @param {boolean} optIn 
 */
export async function setChannelOptIn(channel, optIn) {
  try {
    const response = await api.patch(`/api/notifications/channels/${channel}/opt-in`, { optIn });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] setChannelOptIn error:', error);
    throw error;
  }
}

export default {
  fetchNotifications,
  fetchUnreadCount,
  fetchCountByType,
  markAsRead,
  markAllAsRead,
  markAsClicked,
  dismissNotification,
  deleteNotification,
  deleteAllRead,
  startEmailVerification,
  verifyEmail,
  startSmsVerification,
  verifySms,
  setChannelOptIn,
};
