// src/api/notifications.js
import api from './client';

export async function fetchNotifications(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));
    if (options.unreadOnly) params.append('unreadOnly', 'true');
    if (options.type) params.append('type', options.type);

    const query = params.toString();
    const url = `/notifications${query ? `?${query}` : ''}`;
    
    const response = await api.get(url);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] fetchNotifications error:', error);
    throw error;
  }
}

export async function fetchUnreadCount() {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('[notifications] fetchUnreadCount error:', error);
    throw error;
  }
}

export async function fetchCountByType() {
  try {
    const response = await api.get('/notifications/count-by-type');
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function markAsRead(notificationId) {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function markAllAsRead() {
  try {
    const response = await api.patch('/notifications/read-all');
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function markAsClicked(notificationId) {
  try {
    const response = await api.patch(`/notifications/${notificationId}/clicked`);
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function dismissNotification(notificationId) {
  try {
    const response = await api.patch(`/notifications/${notificationId}/dismiss`);
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function deleteNotification(notificationId) {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function deleteAllRead() {
  try {
    const response = await api.delete('/notifications/read');
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function startEmailVerification(email) {
  try {
    const response = await api.post('/notifications/channels/email/start', { email });
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function verifyEmail(email, code) {
  try {
    const response = await api.post('/notifications/channels/email/verify', { email, code });
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function startSmsVerification(phoneNumber) {
  try {
    const response = await api.post('/notifications/channels/sms/start', { phoneNumber });
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function verifySms(phoneNumber, code) {
  try {
    const response = await api.post('/notifications/channels/sms/verify', { phoneNumber, code });
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function setChannelOptIn(channel, optIn) {
  try {
    const response = await api.patch(`/notifications/channels/${channel}/opt-in`, { optIn });
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function updateNotificationSettings(settings) {
  try {
    const response = await api.patch('/notifications/settings', settings);
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export async function updatePhoneNumber(phoneNumber) {
  try {
    const response = await api.patch('/notifications/channels/sms/phone', { phoneNumber });
    return response.data?.data || response.data;
  } catch (error) { throw error; }
}

export default {
  fetchNotifications, fetchUnreadCount, fetchCountByType, markAsRead, markAllAsRead, markAsClicked, dismissNotification, deleteNotification, deleteAllRead, startEmailVerification, verifyEmail, startSmsVerification, verifySms, setChannelOptIn, updateNotificationSettings, updatePhoneNumber,
};
