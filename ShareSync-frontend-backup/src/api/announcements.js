// src/api/announcements.js
// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS API — Uses shared client (port 5050 + JWT auth)
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

// ─── Core CRUD ──────────────────────────────────────────────────────────────

export const getAnnouncements = async (projectId) => {
  const res = await client.get(`/projects/${projectId}/announcements`);
  return res.data;
};

export const getPinnedAnnouncements = async (projectId) => {
  const res = await client.get(`/projects/${projectId}/announcements/pinned`);
  return res.data;
};

export const createAnnouncement = async (projectId, data) => {
  const res = await client.post(`/projects/${projectId}/announcements`, data);
  return res.data;
};

export const markAnnouncementAsRead = async (projectId, announcementId) => {
  const res = await client.patch(`/projects/${projectId}/announcements/${announcementId}/read`);
  return res.data;
};

export const toggleAnnouncementPin = async (projectId, announcementId) => {
  const res = await client.patch(`/projects/${projectId}/announcements/${announcementId}/pin`);
  return res.data;
};

export const deleteAnnouncement = async (projectId, announcementId) => {
  const res = await client.delete(`/projects/${projectId}/announcements/${announcementId}`);
  return res.data;
};

// ─── Social Features (stubs — backend endpoints needed) ─────────────────────
// These prevent crashes in AnnouncementsView. Wire to real endpoints when built.

export const toggleLike = async (projectId, announcementId) => {
  try {
    const res = await client.patch(`/projects/${projectId}/announcements/${announcementId}/like`);
    return res.data;
  } catch {
    console.warn('[announcements] toggleLike endpoint not available yet');
    return null;
  }
};

export const addComment = async (projectId, announcementId, data) => {
  try {
    const res = await client.post(`/projects/${projectId}/announcements/${announcementId}/comments`, data);
    return res.data;
  } catch {
    console.warn('[announcements] addComment endpoint not available yet');
    return null;
  }
};

export const deleteComment = async (projectId, announcementId, commentId) => {
  try {
    const res = await client.delete(`/projects/${projectId}/announcements/${announcementId}/comments/${commentId}`);
    return res.data;
  } catch {
    console.warn('[announcements] deleteComment endpoint not available yet');
    return null;
  }
};
