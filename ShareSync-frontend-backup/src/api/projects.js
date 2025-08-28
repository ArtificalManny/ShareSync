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

/**
 * Fetch list of projects for the logged-in user
 */
export async function listProjects(params = {}) {
  const qs = toQS(params);
  const { data } = await client.get(`/projects${qs}`);
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];
}

/**
 * Create project
 */
export async function createProject(payload) {
  const { data } = await client.post("/projects", payload);
  return data;
}

/**
 * Get project by id
 */
export async function getProject(id) {
  const { data } = await client.get(`/projects/${id}`);
  return data;
}

/**
 * Quick projects list for home rail
 */
export async function getProjectsQuick() {
  const { data } = await client.get("/projects/quick");
  return Array.isArray(data) ? data : [];
}

/**
 * Project feed via Activities endpoint
 * GET /api/activities?scope=project&projectId=...&range=30d&cursor=&limit=
 */
export async function getProjectFeed(id, { limit = 20, cursor } = {}) {
  const { data } = await client.get("/activities", {
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
 * Post update
 */
export async function postProjectUpdate(id, payload) {
  const { data } = await client.post("/activities", {
    projectId: id,
    type: "update",
    ...payload,            // { text, mentions, files }
  });
  return data;
}
/**
 * Tasks
 */
export async function createTask(id, payload) {
  const { data } = await client.post(`/projects/${id}/tasks`, payload);
  return data;
}

export async function patchTask(id, taskId, payload) {
  const { data } = await client.patch(`/projects/${id}/tasks/${taskId}`, payload);
  return data;
}