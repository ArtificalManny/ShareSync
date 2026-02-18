import axios from 'axios';

// ──────────────────────────────────────────────────────────────
// Notifications API (frontend-safe)
// - Keeps your existing exports (no breaking changes)
// - Adds Step 5 aliases:
//   fetchNotifications(), markNotificationRead(), markAllRead(), fetchUnreadCount()
// - Adds: listNotifications({limit, unreadOnly})
// - Makes baseURL tolerant if VITE_API_URL already includes "/api"
// ──────────────────────────────────────────────────────────────

function normalizeBaseURL(raw) {
  const base = (raw || '').replace(/\/$/, '');
  if (!base) return 'http://localhost:5050/api';

  // If env already ends with /api, keep it; otherwise append /api
  if (base.endsWith('/api')) return base;
  return `${base}/api`;
}

// Expect VITE_API_URL like: http://localhost:5050 OR http://localhost:5050/api
const API_URL = normalizeBaseURL(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token if present (matches your AuthContext style)
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token');

  if (token && !config.headers?.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ──────────────────────────────────────────────────────────────
// NEW: tolerant list function used by NotificationCenter / Dropdown
// ──────────────────────────────────────────────────────────────
export const listNotifications = async ({ limit = 25, unreadOnly = false } = {}) => {
  const response = await api.get(`/notifications`, {
    params: { limit, unreadOnly },
  });
  return response.data;
};

// ──────────────────────────────────────────────────────────────
// NEW: unread count helper (if your backend supports it)
// If the route doesn't exist yet, this will throw and caller can fall back.
// Typical route: GET /notifications/unread-count
// ──────────────────────────────────────────────────────────────
export const getUnreadCount = async () => {
  const response = await api.get(`/notifications/unread-count`);
  return response.data;
};

// ──────────────────────────────────────────────────────────────
// Existing exports (kept)
// ──────────────────────────────────────────────────────────────

export const getNotifications = async (unreadOnly = false) => {
  const response = await api.get(`/notifications`, {
    params: { unreadOnly },
  });
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch(`/notifications/read-all`);
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const updateNotificationSettings = async (settings) => {
  const response = await api.patch(`/users/me/notification-settings`, settings);
  return response.data;
};

export const updatePhoneNumber = async (phoneNumber) => {
  const response = await api.patch(`/users/me/phone`, { phoneNumber });
  return response.data;
};

// ──────────────────────────────────────────────────────────────
// Step 5 — New helper names (aliases)
// These are intentionally thin wrappers around your existing exports.
// No breaking changes for any current imports.
// ──────────────────────────────────────────────────────────────

/**
 * fetchNotifications({ limit, unreadOnly })
 * Returns whatever the backend returns (commonly: { notifications, total, unread }).
 */
export const fetchNotifications = async ({ limit = 25, unreadOnly = false } = {}) => {
  return listNotifications({ limit, unreadOnly });
};

/**
 * markNotificationRead(id)
 */
export const markNotificationRead = async (id) => {
  return markNotificationAsRead(id);
};

/**
 * markAllRead()
 */
export const markAllRead = async () => {
  return markAllNotificationsAsRead();
};

/**
 * fetchUnreadCount()
 * Uses /notifications/unread-count when available.
 * If your backend returns { unread: number } or { count: number }, caller handles it.
 */
export const fetchUnreadCount = async () => {
  return getUnreadCount();
};
