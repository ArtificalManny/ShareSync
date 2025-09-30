// /src/api/chat.js
//
// Thin REST client for Messenger (DMs + project chat).
// All functions are no-op safe: they catch network errors and return sane fallbacks.
// Endpoints used (conventional):
//   - GET    /api/chat/conversations?kind=dm|project&projectId=&page=&limit=
//   - POST   /api/chat/conversations         { kind, memberIds, projectId }
//   - GET    /api/chat/conversations/:id/messages?cursor=&page=&limit=
//   - POST   /api/chat/conversations/:id/messages   { text, attachments }
//   - POST   /api/chat/conversations/:id/reactions  { messageId, emoji, op: 'toggle' }
//   - POST   /api/chat/conversations/:id/read       { at }
//   - POST   /api/chat/conversations/:id/summarize  {}   (phase 2)

const API_BASE = "/api";

function buildQS(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
    else q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function toJson(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.message || j?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ----- Conversations -----

/**
 * listConversations({ kind, projectId, page, limit })
 * @returns {Promise<{items:any[], nextCursor?:string, total?:number}>}
 */
export async function listConversations(params = {}) {
  const qs = buildQS({
    kind: params.kind,           // 'dm' | 'project' | undefined
    projectId: params.projectId, // optional filter
    page: params.page,
    limit: params.limit ?? 20,
  });
  try {
    const res = await fetch(`${API_BASE}/chat/conversations${qs}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return await toJson(res);
  } catch {
    return { items: [], nextCursor: null, total: 0 };
  }
}

/**
 * createConversation({ kind, memberIds, projectId })
 * @returns {Promise<any>}
 */
export async function createConversation(body = {}) {
  try {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        kind: body.kind || "dm",
        memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
        projectId: body.projectId || undefined,
      }),
    });
    return await toJson(res);
  } catch (e) {
    throw new Error(e?.message || "Failed to create conversation");
  }
}

// ----- Messages -----

/**
 * listMessages(convoId, { cursor|page, limit })
 * Supports either cursor or page pagination (backend decides).
 * @returns {Promise<{items:any[], nextCursor?:string, page?:number, total?:number}>}
 */
export async function listMessages(convoId, params = {}) {
  if (!convoId) return { items: [], nextCursor: null };
  const qs = buildQS({
    cursor: params.cursor,
    page: params.page,
    limit: params.limit ?? 30,
  });
  try {
    const res = await fetch(`${API_BASE}/chat/conversations/${encodeURIComponent(convoId)}/messages${qs}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return await toJson(res);
  } catch {
    return { items: [], nextCursor: null };
  }
}

/**
 * sendMessage(convoId, { text, attachments })
 * @returns {Promise<any>} created message
 */
export async function sendMessage(convoId, body = {}) {
  if (!convoId) throw new Error("Missing conversation id");
  try {
    const res = await fetch(`${API_BASE}/chat/conversations/${encodeURIComponent(convoId)}/messages`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        text: String(body.text || "").trim(),
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
      }),
    });
    return await toJson(res);
  } catch (e) {
    throw new Error(e?.message || "Failed to send message");
  }
}

/**
 * toggleReaction(convoId, messageId, emoji)
 * @returns {Promise<{ ok: boolean }>}
 */
export async function toggleReaction(convoId, messageId, emoji) {
  if (!convoId || !messageId || !emoji) return { ok: false };
  try {
    const res = await fetch(`${API_BASE}/chat/conversations/${encodeURIComponent(convoId)}/reactions`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ messageId, emoji, op: "toggle" }),
    });
    await toJson(res);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * markRead(convoId, at)
 * Marks messages up to timestamp `at` as read server-side.
 */
export async function markRead(convoId, at = Date.now()) {
  if (!convoId) return { ok: false };
  try {
    const res = await fetch(`${API_BASE}/chat/conversations/${encodeURIComponent(convoId)}/read`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ at }),
    });
    await toJson(res);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * summarizeConversation(convoId) — Phase 2 helper
 * Posts a summary message in the conversation (server does the summarization).
 */
export async function summarizeConversation(convoId) {
  if (!convoId) throw new Error("Missing conversation id");
  try {
    const res = await fetch(`${API_BASE}/chat/conversations/${encodeURIComponent(convoId)}/summarize`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return await toJson(res);
  } catch (e) {
    throw new Error(e?.message || "Failed to summarize conversation");
  }
}

export default {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
  toggleReaction,
  markRead,
  summarizeConversation,
};
