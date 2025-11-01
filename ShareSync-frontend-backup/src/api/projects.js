// /src/api/projects.js
import client from "./client"; // axios instance with /api base + auth interceptor

function toQS(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "all") {
      p.set(k, String(v));
    }
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** List projects for the logged-in user */
export async function listProjects(params = {}) {
  const qs = toQS(params);
  const { data } = await client.get(`/projects${qs}`);
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];
}

/** Create a project with DNA */
export async function createProject(payload) {
  const dna = generateDNA(payload.name);
  const { data } = await client.post(`/projects`, { ...payload, ...dna });
  return data;
}

/** Get a project by id */
export async function getProject(id) {
  const { data } = await client.get(`/projects/${id}`);
  return data;
}

/** Quick projects list for home rail */
export async function getProjectsQuick() {
  const { data } = await client.get(`/projects/quick`);
  return Array.isArray(data) ? data : [];
}

/**
 * Project feed via Activities endpoint
 */
export async function getProjectFeed(id, { limit = 20, cursor } = {}) {
  const { data } = await client.get(`/activities`, {
    params: {
      scope: "project",
      projectId: id,
      range: "30d",
      limit,
      cursor: cursor || undefined,
    },
  });
  return data;
}

/**
 * Post a project update
 */
export async function postProjectUpdate(projectId, payload) {
  if (!projectId) throw new Error("projectId is required");

  const text = typeof payload === "string" ? payload : payload?.text || "";
  const visibility = payload?.visibility === "public" ? "public" : "private";
  const mentions = Array.isArray(payload?.mentions) ? payload.mentions : [];
  const files = Array.isArray(payload?.files) ? payload.files : [];
  const clientTempId = payload?.clientTempId;

  const body = {
    projectId,
    type: "update",
    text,
    visibility,
    meta: { mentions, files, clientTempId },
  };

  const { data } = await client.post(`/activities`, body);
  return data;
}

/** Tasks */
export async function createTask(id, payload) {
  const { data } = await client.post(`/projects/${id}/tasks`, payload);
  return data;
}

export async function patchTask(id, taskId, payload) {
  const { data } = await client.patch(`/projects/${id}/tasks/${taskId}`, payload);
  return data;
}

/** Patch project icon */
export async function patchProjectIcon(projectId, icon) {
  if (!projectId) throw new Error("projectId is required");
  const { data } = await client.patch(`/projects/${projectId}/icon`, icon ?? null);
  return data;
}

/* =======================================================================
 *  Transparency Layer
 * ======================================================================= */

export async function enablePublic(projectId) {
  if (!projectId) throw new Error("projectId is required");
  const { data } = await client.post(`/public/projects/${encodeURIComponent(projectId)}/enable`);
  return { token: data?.token };
}

export async function disablePublic(projectId) {
  if (!projectId) throw new Error("projectId is required");
  const { data } = await client.post(`/public/projects/${encodeURIComponent(projectId)}/disable`);
  return data ?? { ok: true };
}

export async function regeneratePublicToken(projectId) {
  if (!projectId) throw new Error("projectId is required");
  const { data } = await client.post(`/public/projects/${encodeURIComponent(projectId)}/regenerate`);
  return { token: data?.token };
}

export async function getPublicStatus(token) {
  if (!token) throw new Error("token is required");
  const { data } = await client.get(`/public/projects/${encodeURIComponent(token)}/status`);
  return data;
}

export function buildPublicStatusUrl(token) {
  return `/status/${encodeURIComponent(String(token))}`;
}

/* NEW: DNA Generator */
function generateDNA(name) {
  const hash = name.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const colors = ["#6366f1", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981"];
  const icons = ["Briefcase", "Rocket", "Target", "Lightbulb", "Zap"];
  return {
    color: colors[hash % colors.length],
    icon: icons[hash % icons.length],
    pulse: (hash % 3) + 1, // 1–3 beats
  };
}