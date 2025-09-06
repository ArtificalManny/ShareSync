// src/api/invites.js
import client from "./client"; // same axios instance you use elsewhere

/**
 * Create an invite for a project (owner/manage required)
 * POST /api/projects/:id/invites  body: { email, role }
 */
export async function sendInvite(projectId, { email, role = "member" }) {
  const { data } = await client.post(`/projects/${projectId}/invites`, {
    email: String(email || "").trim().toLowerCase(),
    role: role === "viewer" ? "viewer" : "member",
  });
  return data; // { ok: true, invite }
}

/**
 * Accept an invite (global) using token from email/link
 * POST /api/invites/accept  body: { projectId, token }
 */
export async function acceptInvite({ projectId, token }) {
  const { data } = await client.post(`/invites/accept`, {
    projectId,
    token,
  });
  return data; // { ok: true, members: [...] }
}

/** (Optional) List invites (owner/manage) */
export async function listInvites(projectId) {
  const { data } = await client.get(`/projects/${projectId}/invites`);
  return Array.isArray(data) ? data : data?.items || data;
}

/** (Optional) Revoke a pending invite (owner/manage) */
export async function revokeInvite(projectId, token) {
  const { data } = await client.delete(`/projects/${projectId}/invites/${token}`);
  return data; // { ok: true }
}