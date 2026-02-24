// src/api/moderation.js
// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION API - Report content violations
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

export async function reportContent({ contentType, contentId, reason, details }) {
  const response = await api.post('/api/moderation/report', {
    contentType,
    contentId,
    reason,
    details,
  });
  return response.data;
}

export async function checkTextContent(text, context) {
  try {
    const response = await api.post('/api/moderation/check-text', {
      text,
      context,
    });
    return response.data;
  } catch (error) {
    console.warn('[Moderation] Check failed, allowing content:', error);
    return { allowed: true, decision: 'ALLOW', categories: [] };
  }
}

// ✅ FIXED: Added missing exports to unblock AdminModerationProjects.jsx
export async function getModerationProjects(params) {
  const response = await api.get('/api/moderation/projects', { params });
  return response.data;
}

export async function patchModerationProject(id, data) {
  const response = await api.patch(`/api/moderation/projects/${id}`, data);
  return response.data;
}

export default {
  reportContent,
  checkTextContent,
  getModerationProjects,
  patchModerationProject,
};
