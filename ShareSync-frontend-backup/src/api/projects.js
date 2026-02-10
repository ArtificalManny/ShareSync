// src/api/projects.js - ENHANCED WITH TASKS & SHIPS
import api from './client';

// If backend returns { success: true, data: ... }, unwrap it.
// If backend returns raw data directly, keep as-is.
function unwrap(response) {
  const payload = response?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

// ============================================
// PROJECTS
// ============================================

export const getProjects = async () => {
  const response = await api.get('/projects');
  return unwrap(response);
};

export const getProjectsQuick = async () => {
  const response = await api.get('/projects/quick');
  return unwrap(response);
};

export const getProject = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return unwrap(response);
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PROJECT (Compatibility Layer)
// Backend expects CreateProjectDto:
//   { name, description?, emoji?, icon?, color?, visibility?, tags?, settings?, goals? }
// Your frontend currently sends:
//   { title, description, category, status, privacy, members }
//
// This mapper keeps frontend unchanged while matching backend DTO strictly.
// We intentionally do NOT send unknown fields (status/privacy/members) to avoid 400.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeCreateProjectPayload(projectData = {}) {
  const title = (projectData.title ?? projectData.name ?? '').trim();
  const description = (projectData.description ?? '').trim();
  const category = (projectData.category ?? '').trim();

  const privacy = (projectData.privacy ?? '').toString().trim().toLowerCase();
  const visibility =
    privacy === 'public' ? 'public' :
    privacy === 'private' ? 'private' :
    undefined;

  const tags = category ? [category] : undefined;

  const emoji = (projectData.emoji ?? '').toString().trim() || undefined;
  const icon = (projectData.icon ?? '').toString().trim() || undefined;

  const rawColor = (projectData.color ?? '').toString().trim();
  const color =
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(rawColor) ? rawColor : undefined;

  return {
    name: title,
    description: description || undefined,
    visibility,
    tags,
    emoji,
    icon,
    color,
  };
}

export const createProject = async (projectData) => {
  const payload = normalizeCreateProjectPayload(projectData);

  if (!payload.name || payload.name.trim().length < 2) {
    const err = new Error("Project name is required (min 2 chars).");
    err.normalizedMessage = "Project name is required (min 2 chars).";
    throw err;
  }

  const response = await api.post('/projects', payload);
  return unwrap(response);
};

export const updateProject = async (projectId, updates) => {
  const response = await api.put(`/projects/${projectId}`, updates);
  return unwrap(response);
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return unwrap(response);
};

// ============================================
// TASKS
// ============================================

export const getTasks = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/tasks`);
  return unwrap(response);
};

export const createTask = async (projectId, taskData) => {
  const response = await api.post(`/projects/${projectId}/tasks`, taskData);
  return unwrap(response);
};

export const updateTask = async (projectId, taskId, updates) => {
  const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, updates);
  return unwrap(response);
};

export const completeTask = async (projectId, taskId) => {
  const response = await api.post(`/projects/${projectId}/tasks/${taskId}/complete`);
  return unwrap(response);
};

export const deleteTask = async (projectId, taskId) => {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return unwrap(response);
};

// ============================================
// SHIPS
// ============================================

export const getShips = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/ships`);
  return unwrap(response);
};

export const shipProject = async (projectId, shipData) => {
  const response = await api.post(`/projects/${projectId}/ships`, shipData);
  return unwrap(response);
};

export const deleteShip = async (projectId, shipId) => {
  const response = await api.delete(`/projects/${projectId}/ships/${shipId}`);
  return unwrap(response);
};
