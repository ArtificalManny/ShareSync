// /src/api/projects.js
import client from './client'; // axios instance with /api base + auth interceptor
import { getAccessToken } from '../utils/tokenUtils';

// ---- helpers ----
function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function toQS(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ---- REQUIRED by Projects.jsx ----
/**
 * Fetch list of projects for the logged-in user.
 * Accepts optional filters (query, status, owner, updated) but works without them too.
 * Returns [] on success (even if empty). Throws on HTTP error.
 */
export async function listProjects(params = {}) {
  // You can use axios client or fetch; using axios here for simplicity.
  const qs = toQS(params);
  const { data } = await client.get(`/projects${qs}`, {
    headers: { ...authHeaders() },
    withCredentials: true,
  });
  // Normalize to array
  return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
}

// ---- existing exports (kept working) ----
export async function createProject(payload) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

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

// Quick list for the home “stories” rail
export async function getProjectsQuick() {
  const { data } = await client.get('/projects/quick', {
    headers: { ...authHeaders() },
    withCredentials: true,
  });
  return Array.isArray(data) ? data : [];
}

// Feed + mutations
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
