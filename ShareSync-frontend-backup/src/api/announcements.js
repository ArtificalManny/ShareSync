// src/api/announcements.js
// ═══════════════════════════════════════════════════════════════════════════════
// Announcements API — CRUD + likes + comments + attachments
// Uses shared client (has JWT auth interceptor)
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

function unwrap(res) {
  return res?.data?.data ?? res?.data;
}

// ─── Core CRUD ──────────────────────────────────────────────────────────────

export async function getAnnouncements(projectId) {
  const res = await client.get(`/projects/${projectId}/announcements`);
  return unwrap(res);
}

export async function getPinnedAnnouncements(projectId) {
  const res = await client.get(`/projects/${projectId}/announcements/pinned`);
  return unwrap(res);
}

export async function createAnnouncement(projectId, data) {
  const res = await client.post(`/projects/${projectId}/announcements`, data);
  return unwrap(res);
}

export async function deleteAnnouncement(projectId, announcementId) {
  const res = await client.delete(`/projects/${projectId}/announcements/${announcementId}`);
  return unwrap(res);
}

export async function markAnnouncementAsRead(projectId, announcementId) {
  const res = await client.patch(`/projects/${projectId}/announcements/${announcementId}/read`);
  return unwrap(res);
}

export async function toggleAnnouncementPin(projectId, announcementId) {
  const res = await client.patch(`/projects/${projectId}/announcements/${announcementId}/pin`);
  return unwrap(res);
}

// ─── Likes ──────────────────────────────────────────────────────────────────

export async function toggleLike(projectId, announcementId) {
  const res = await client.patch(`/projects/${projectId}/announcements/${announcementId}/like`);
  return unwrap(res);
}

// ─── Comments ───────────────────────────────────────────────────────────────

export async function addComment(projectId, announcementId, data) {
  const res = await client.post(`/projects/${projectId}/announcements/${announcementId}/comments`, data);
  return unwrap(res);
}

export async function deleteComment(projectId, announcementId, commentId) {
  const res = await client.delete(`/projects/${projectId}/announcements/${announcementId}/comments/${commentId}`);
  return unwrap(res);
}
