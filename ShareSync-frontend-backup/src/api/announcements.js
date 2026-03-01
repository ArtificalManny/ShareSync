import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAnnouncements = async (projectId) => {
  const response = await api.get(`/api/projects/${projectId}/announcements`);
  return response.data;
};

export const getPinnedAnnouncements = async (projectId) => {
  const response = await api.get(`/api/projects/${projectId}/announcements/pinned`);
  return response.data;
};

export const createAnnouncement = async (projectId, data) => {
  const response = await api.post(`/api/projects/${projectId}/announcements`, data);
  return response.data;
};

export const addCommentToAnnouncement = async (projectId, announcementId, text) => {
  const response = await api.post(`/api/projects/${projectId}/announcements/${announcementId}/comments`, { text });
  return response.data;
};

export const markAnnouncementAsRead = async (projectId, announcementId) => {
  const response = await api.patch(`/api/projects/${projectId}/announcements/${announcementId}/read`);
  return response.data;
};

export const deleteAnnouncement = async (projectId, announcementId) => {
  const response = await api.delete(`/api/projects/${projectId}/announcements/${announcementId}`);
  return response.data;
};
