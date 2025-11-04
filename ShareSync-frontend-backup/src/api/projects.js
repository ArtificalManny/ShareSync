// src/api/projects.js
import client from "./client";

/** GET /api/projects */
export async function listProjects(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "all") {
      qs.set(k, String(v));
    }
  });
  const { data } = await client.get(`/projects?${qs}`);
  return Array.isArray(data) ? data : [];
}

/** POST /api/projects */
export async function createProject(payload) {
  const { data } = await client.post("/projects", payload);
  return data;
}

/** GET /api/projects/:id */
export async function getProject(id) {
  const { data } = await client.get(`/projects/${id}`);
  return data;
}

/** PATCH /api/projects/:id */
export async function updateProject(id, patch) {
  const { data } = await client.patch(`/projects/${id}`, patch);
  return data;
}

/** POST /api/projects/:id/ship */
export async function shipProject(id) {
  const { data } = await client.post(`/projects/${id}/ship`);
  return data;
}

/** GET /api/projects/quick */
export async function getProjectsQuick(limit = 6) {
  const { data } = await client.get(`/projects/quick?limit=${Math.max(1, Math.min(12, Number(limit)))}`);
  return Array.isArray(data) ? data : [];
}