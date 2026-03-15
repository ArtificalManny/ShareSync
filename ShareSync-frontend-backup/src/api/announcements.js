
// src/api/announcements.js

// Uses shared client (baseURL already includes /api)

import client from './client';

 

export async function getAnnouncements(projectId) {

  const { data } = await client.get(`/projects/${projectId}/announcements`);

  return Array.isArray(data) ? data : (data?.data || []);

}

 

export async function getPinnedAnnouncements(projectId) {

  const { data } = await client.get(`/projects/${projectId}/announcements/pinned`);

  return Array.isArray(data) ? data : (data?.data || []);

}

 

export async function createAnnouncement(projectId, payload) {

  const { data } = await client.post(`/projects/${projectId}/announcements`, payload);

  return data?.data || data;

}

 

export async function markAnnouncementAsRead(projectId, announcementId) {

  const { data } = await client.patch(`/projects/${projectId}/announcements/${announcementId}/read`);

  return data?.data || data;

}

 

export async function toggleAnnouncementPin(projectId, announcementId) {

  const { data } = await client.patch(`/projects/${projectId}/announcements/${announcementId}/pin`);

  return data?.data || data;

}

 

export async function deleteAnnouncement(projectId, announcementId) {

  const { data } = await client.delete(`/projects/${projectId}/announcements/${announcementId}`);

  return data?.data || data;

}

