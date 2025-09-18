import client from "./client"; // shared axios instance

/**
 * Create an invite for a project (owner/manage required)
 * POST /projects/:id/invites  body: { email, role }
 * Returns: { projectId, invites }
 */
export async function sendInvite(projectId, { email, role = "member" }) {
  const { data } = await client.post(`/projects/${projectId}/invites`, {
    email: String(email || "").trim().toLowerCase(),
    role: role === "viewer" ? "viewer" : "member",
  });
  return data; // { projectId, invites }
}

/**
 * Accept an invite with a token (global)
 * POST /invites/accept  body: { token }
 * Returns: { projectId, members, invites }
 */
export async function acceptInvite(token) {
  const { data } = await client.post(`/invites/accept`, { token });
  return data;
}

/** List invites for a project */
export async function listInvites(projectId) {
  const { data } = await client.get(`/projects/${projectId}/invites`);
  // Backend returns an array already
  return Array.isArray(data) ? data : data?.items || data || [];
}

/** Revoke a pending invite by token */
export async function revokeInvite(projectId, token) {
  const { data } = await client.delete(`/projects/${projectId}/invites/${token}`);
  return data; // { ok: true }
}

export default { sendInvite, acceptInvite, listInvites, revokeInvite };
