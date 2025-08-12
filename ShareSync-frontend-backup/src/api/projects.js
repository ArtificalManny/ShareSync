// /src/api/projects.js
import { getAccessToken } from '../utils/tokenUtils';

/** Build a query string from a params object (skips empty values) */
function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function listProjects(params = {}) {
  const token = getAccessToken();
  const url = `/api/projects${qs(params)}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    // try to surface backend message
    let msg = '';
    try { msg = await res.text(); } catch {}
    throw new Error(msg || `HTTP ${res.status}`);
  }

  // some backends return {projects: []}, others return []
  const data = await res.json();
  return Array.isArray(data) ? data : (data.projects || []);
}

export async function createProject(payload) {
  const token = getAccessToken();
  const res = await fetch('/api/projects', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json(); // must include {_id, ...}
}
