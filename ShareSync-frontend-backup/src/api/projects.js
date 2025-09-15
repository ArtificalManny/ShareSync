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

/** Create a project */
export async function createProject(payload) {
  const { data } = await client.post(`/projects`, payload);
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
 * GET /api/activities?scope=project&projectId=...&range=30d&cursor=&limit=
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
  return data; // { items, nextCursor }
}

/**
 * Post a project update
 * Server expects: { projectId, type, text, visibility?, meta? }
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

/** Tasks (kept for convenience) */
export async function createTask(id, payload) {
  const { data } = await client.post(`/projects/${id}/tasks`, payload);
  return data;
}

export async function patchTask(id, taskId, payload) {
  const { data } = await client.patch(`/projects/${id}/tasks/${taskId}`, payload);
  return data;
}

/** 🔹 Patch project icon (owner-only on backend) */
export async function patchProjectIcon(projectId, icon /* { kind, value } or null */) {
  if (!projectId) throw new Error("projectId is required");
  const { data } = await client.patch(`/projects/${projectId}/icon`, icon ?? null);
  return data; // { projectId, patch: { icon } }
}
