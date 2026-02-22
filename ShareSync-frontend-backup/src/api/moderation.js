// src/api/moderation.js
// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION API - Report content violations
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

/**
 * Report content for moderation review
 * @param {Object} params
 * @param {'project' | 'task' | 'comment' | 'user' | 'file'} params.contentType
 * @param {string} params.contentId
 * @param {string} params.reason
 * @param {string} [params.details] - Optional additional details
 */
export async function reportContent({ contentType, contentId, reason, details }) {
  const response = await api.post('/api/moderation/report', {
    contentType,
    contentId,
    reason,
    details,
  });
  return response.data;
}

/**
 * Check if content is allowed before submission
 * @param {string} text - Text to check
 * @param {string} [context] - Optional context (e.g., "task_title", "comment")
 */
export async function checkTextContent(text, context) {
  try {
    const response = await api.post('/api/moderation/check-text', {
      text,
      context,
    });
    return response.data;
  } catch (error) {
    // If moderation check fails, allow content but log
    console.warn('[Moderation] Check failed, allowing content:', error);
    return { allowed: true, decision: 'ALLOW', categories: [] };
  }
}

export default {
  reportContent,
  checkTextContent,
};
