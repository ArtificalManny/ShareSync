// src/api/invites.js
// ═══════════════════════════════════════════════════════════════════════════════
// INVITES API — Wires to backend InvitesController + GlobalInvitesController
// Backend routes:
//   POST   /api/projects/:id/invites        → createInvite
//   GET    /api/projects/:id/invites        → listInvites
//   DELETE /api/projects/:id/invites/:token → revokeInvite
//   POST   /api/invites/accept              → acceptInvite
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Send an invite to a user by email.
 * @param {string} projectId
 * @param {{ email: string, role?: string }} payload
 */
export async function sendInvite(projectId, payload = {}) {
  const email = String(payload.email || '').trim().toLowerCase();
  const role = payload.role || 'member';

  const res = await client.post(`/projects/${projectId}/invites`, { email, role });
  return res.data?.data || res.data;
}

/**
 * List all invites for a project.
 * @param {string} projectId
 */
export async function listInvites(projectId) {
  const res = await client.get(`/projects/${projectId}/invites`);
  const data = res.data?.data || res.data;
  return Array.isArray(data) ? data : data?.invites || [];
}

/**
 * Revoke a pending invite by token.
 * @param {string} projectId
 * @param {string} token
 */
export async function revokeInvite(projectId, token) {
  const res = await client.delete(`/projects/${projectId}/invites/${encodeURIComponent(token)}`);
  return res.data?.data || res.data;
}

/**
 * Accept an invite using its token.
 * @param {string} token
 */
export async function acceptInvite(token) {
  if (!token) throw new Error('Missing invite token.');
  const res = await client.post('/invites/accept', { token });
  return res.data?.data || res.data;
}

export default { sendInvite, listInvites, revokeInvite, acceptInvite };
