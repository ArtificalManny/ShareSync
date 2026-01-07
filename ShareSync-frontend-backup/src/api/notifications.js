import axios from 'axios';

// Expect VITE_API_URL like: http://localhost:5050/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

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
