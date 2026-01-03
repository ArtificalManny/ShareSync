import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getNotifications = async (unreadOnly = false) => {
  const response = await api.get(`/api/notifications`, {
    params: { unreadOnly }
  });
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/api/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch(`/api/notifications/read-all`);
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/api/notifications/${notificationId}`);
  return response.data;
};

export const updateNotificationSettings = async (settings) => {
  const response = await api.patch(`/api/users/me/notification-settings`, settings);
  return response.data;
};

export const updatePhoneNumber = async (phoneNumber) => {
  const response = await api.patch(`/api/users/me/phone`, { phoneNumber });
  return response.data;
};
