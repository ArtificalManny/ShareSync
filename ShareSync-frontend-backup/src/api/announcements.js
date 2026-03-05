import client from './client';

export const getAnnouncements = async (projectId) => {
  const response = await client.get(`/projects/${projectId}/announcements`);
  // Handle case where custom Axios interceptor already extracts .data
  return response.data !== undefined ? response.data : response;
};

export const getPinnedAnnouncements = async (projectId) => {
  const response = await client.get(`/projects/${projectId}/announcements/pinned`);
  return response.data !== undefined ? response.data : response;
};

export const createAnnouncement = async (projectId, data) => {
  // Automatically handle multipart/form-data for file uploads
  const config = data instanceof FormData 
    ? { headers: { 'Content-Type': 'multipart/form-data' } } 
    : {};
    
  const response = await client.post(`/projects/${projectId}/announcements`, data, config);
  return response.data !== undefined ? response.data : response;
};

export const markAnnouncementAsRead = async (projectId, announcementId) => {
  const response = await client.patch(`/projects/${projectId}/announcements/${announcementId}/read`);
  return response.data !== undefined ? response.data : response;
};

export const deleteAnnouncement = async (projectId, announcementId) => {
  const response = await client.delete(`/projects/${projectId}/announcements/${announcementId}`);
  return response.data !== undefined ? response.data : response;
};
