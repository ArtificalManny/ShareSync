import axios from "axios";
import { getAccessToken } from "../utils/tokenUtils"; // adjust path if needed

function authConfig(extra = {}) {
  const token = getAccessToken?.();
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
      ...(extra.headers || {}),
    },
    withCredentials: true,
    ...extra,
  };
}

/**
 * Send an invite.
 * FE-friendly signature retained:
 *   sendInvite(projectId, { email, role, message?, inviterId? })
 * Also supports object form:
 *   sendInvite({ projectId, email, role, message?, inviterId? })
 *
 * BE: POST /api/invites/send  body: { email, role, projectId, inviterId?, message? }
 */
export async function sendInvite(projectIdOrPayload, maybePayload) {
  let projectId, payload;
  if (typeof projectIdOrPayload === "string" || typeof projectIdOrPayload === "number") {
    projectId = projectIdOrPayload;
    payload = maybePayload || {};
  } else {
    payload = projectIdOrPayload || {};
    projectId = payload.projectId;
  }

  const email = String(payload.email || "").trim().toLowerCase();
  const role = payload.role === "viewer" ? "viewer" : "member";
  const body = {
    email,
    role,
    projectId,
    inviterId: payload.inviterId,
    message: payload.message,
  };

  const res = await axios.post("/api/invites/send", body, authConfig());
  return res.data; // e.g. { ok, inviteId, token }
}

/**
 * Accept an invite.
 * BE: POST /api/invites/accept  body: { token }
 * Returns (typical): { ok, projectId, members, invites }
 */
export async function acceptInvite({ token }) {
  const res = await axios.post("/api/invites/accept", { token }, authConfig());
  return res.data;
}

/**
 * List invites for a project.
 * BE (choose one supported by your server): GET /api/invites/list?projectId=...
 * Returns: Array<{ email, role, status, token, createdAt }>
 */
export async function listInvites(projectId) {
  const res = await axios.get("/api/invites/list", authConfig({ params: { projectId } }));
  const data = res.data;
  return Array.isArray(data) ? data : data?.items || data || [];
}

/**
 * Revoke an invite (pending).
 * BE: DELETE /api/invites/:token  (with { projectId } in body if needed)
 */
export async function revokeInvite(projectId, tokenOrId) {
  const res = await axios.delete(`/api/invites/${encodeURIComponent(tokenOrId)}`, authConfig({ data: { projectId } }));
  return res.data; // { ok: true }
}

export default { sendInvite, acceptInvite, listInvites, revokeInvite };
