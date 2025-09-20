import client from './client'; // axios instance (base /api) + auth
import { getAccessToken } from '../utils/tokenUtils';

// Helpers
function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------- Create ----------
export async function createProject(payload) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---------- Get one ----------
export async function getProject(id) {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const error = new Error(text || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// ---------- List for "/projects" (accepts optional filters, sent as query) ----------
export async function listProjects(filters = {}) {
  const params = new URLSearchParams();
  // send known filters if provided (backend may ignore; FE has fallback filtering)
  if (filters.query) params.set('query', filters.query);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.owner && filters.owner !== 'all') params.set('owner', filters.owner);
  if (filters.updated && filters.updated !== '7d') params.set('updated', filters.updated);

  const url = params.toString() ? `/projects?${params}` : '/projects';
  const { data } = await client.get(url);
  return Array.isArray(data) ? data : [];
}

// ---------- Quick rail ----------
export async function getProjectsQuick() {
  const { data } = await client.get('/projects/quick');
  return Array.isArray(data) ? data : [];
}

// ---------- Feed ----------
export async function getProjectFeed(id, { limit = 20, cursor } = {}) {
  const u = new URL(`/api/projects/${id}/feed`, window.location.origin);
  u.searchParams.set('limit', String(limit));
  if (cursor) u.searchParams.set('cursor', cursor);

  const res = await fetch(u.pathname + u.search, {
    method: 'GET',
    credentials: 'include',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  return res.json(); // { items, nextCursor }
}

// ---------- Mutations ----------
export async function postProjectUpdate(id, payload) {
  const res = await fetch(`/api/projects/${id}/updates`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  return res.json(); // created update object
}

export async function createTask(id, payload) {
  const res = await fetch(`/api/projects/${id}/tasks`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  return res.json(); // created task
}

export async function patchTask(id, taskId, payload) {
  const res = await fetch(`/api/projects/${id}/tasks/${taskId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  return res.json(); // updated task
}
