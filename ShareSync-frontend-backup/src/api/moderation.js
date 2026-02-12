// src/api/moderation.js
// Moderation API (frontend-only)
// - GET pending/approved/rejected projects for admin review
// - PATCH project moderation status / reason / spectatorMode
//
// NOTE: Assumes backend endpoints:
//   GET   /moderation/projects?status=pending
//   PATCH /moderation/projects/:id  { moderationStatus, reason, spectatorMode }
//

import api from './client';

function unwrap(response) {
  const payload = response?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

function normalizeError(err, fallback = 'Request failed') {
  const msg =
    err?.normalizedMessage ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;

  const status = err?.response?.status;
  const url = err?.config?.url;
  const method = err?.config?.method?.toUpperCase?.();

  const enriched = new Error(msg);
  enriched.normalizedMessage = msg;
  enriched.status = status;
  enriched.url = url;
  enriched.method = method;
  enriched.raw = err;
  return enriched;
}

export async function getModerationProjects({ status = 'pending' } = {}) {
  try {
    const response = await api.get('/moderation/projects', {
      params: { status },
    });
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw normalizeError(err, 'Failed to load moderation projects');
  }
}

export async function patchModerationProject(projectId, patch = {}) {
  try {
    if (!projectId) throw new Error('projectId is required');

    // Only send known safe fields
    const body = {};
    if (patch.moderationStatus) body.moderationStatus = patch.moderationStatus;
    if (typeof patch.reason === 'string') body.reason = patch.reason;
    if (patch.spectatorMode) body.spectatorMode = patch.spectatorMode;

    const response = await api.patch(`/moderation/projects/${projectId}`, body);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, 'Failed to update moderation status');
  }
}
