// src/services/api.js
// Canonical client-side API surface (uses utils/http; safe against "/api/api")

import http from "../utils/http";

// --- AUDIT ---
async function listAudit({ scope = "user", userId, projectId, limit = 20, cursor } = {}) {
  const { data } = await http.get("/audit", {
    params: { scope, userId, projectId, limit, cursor },
  });
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return { items, nextCursor: data?.nextCursor ?? null };
}

// --- PROJECTS (minimal, used by ProjectHome) ---
async function getProject(projectId) {
  const { data } = await http.get(`/projects/${projectId}`);
  return data;
}

async function getProjectStats(projectId, { range = 30 } = {}) {
  const { data } = await http.get(`/projects/${projectId}/stats`, { params: { range } });
  return data;
}

export const api = {
  audit: { list: listAudit },
  projects: { get: getProject, stats: getProjectStats },
};

export default api;
