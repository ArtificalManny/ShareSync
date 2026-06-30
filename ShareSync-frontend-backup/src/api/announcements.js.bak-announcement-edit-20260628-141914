import client from './client'; // Import your main authenticated client

// Helper to safely unwrap backend responses
const unwrap = (response) => response?.data?.data || response?.data;

export const getAnnouncements = async (projectId) => {
  const response = await client.get(`/projects/${projectId}/announcements`);
  return unwrap(response);
};

export const getPinnedAnnouncements = async (projectId) => {
  const response = await client.get(`/projects/${projectId}/announcements/pinned`);
  return unwrap(response);
};

export const createAnnouncement = async (projectId, data) => {
  const response = await client.post(`/projects/${projectId}/announcements`, data);
  return unwrap(response);
};

export const markAnnouncementAsRead = async (projectId, announcementId) => {
  const response = await client.patch(`/projects/${projectId}/announcements/${announcementId}/read`);
  return unwrap(response);
};

export const deleteAnnouncement = async (projectId, announcementId) => {
  const response = await client.delete(`/projects/${projectId}/announcements/${announcementId}`);
  return unwrap(response);
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEW ENDPOINTS: Utilizing the centralized authenticated client
// ═══════════════════════════════════════════════════════════════════════════════

export const toggleAnnouncementPin = async (projectId, announcementId) => {
  const response = await client.patch(`/projects/${projectId}/announcements/${announcementId}/pin`);
  return unwrap(response);
};

export const toggleLike = async (projectId, announcementId) => {
  const response = await client.post(`/projects/${projectId}/announcements/${announcementId}/like`);
  return unwrap(response);
};

export const addComment = async (projectId, announcementId, data) => {
  const response = await client.post(`/projects/${projectId}/announcements/${announcementId}/comments`, data);
  return unwrap(response);
};

export const deleteComment = async (projectId, announcementId, commentId) => {
  const response = await client.delete(`/projects/${projectId}/announcements/${announcementId}/comments/${commentId}`);
  return unwrap(response);
};
