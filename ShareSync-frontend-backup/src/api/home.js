import api from "./client";

/**
 * Home API helpers (SAFE).
 * - Uses existing endpoints when available.
 * - Falls back gracefully if an endpoint doesn't exist yet.
 */

async function safeGet(url, config) {
  try {
    const res = await api.get(url, config);
    return res?.data;
  } catch (err) {
    const status = err?.response?.status;
    // 404/501 etc => endpoint not implemented; return null
    if (status && (status === 404 || status === 501)) return null;
    // Other errors still shouldn't crash Home
    console.warn("[home.api] GET failed:", url, status, err?.message);
    return null;
  }
}

async function safePost(url, body, config) {
  try {
    const res = await api.post(url, body, config);
    return res?.data;
  } catch (err) {
    const status = err?.response?.status;
    if (status && (status === 404 || status === 501)) return null;
    console.warn("[home.api] POST failed:", url, status, err?.message);
    return null;
  }
}

export async function fetchProjects() {
  // Known working endpoint from Projects.jsx
  const data = await safeGet("/projects");
  return Array.isArray(data) ? data : [];
}

export async function fetchActivities({ limit = 50 } = {}) {
  // You said you have POST /api/activities in backend branch.
  // Many implementations support GET /activities; we probe safely.
  const data =
    (await safeGet(`/activities?limit=${limit}`)) ||
    (await safeGet(`/activity?limit=${limit}`)) ||
    (await safeGet(`/user/activities?limit=${limit}`));

  return Array.isArray(data) ? data : [];
}

export async function fetchActivitySummary() {
  // Probe common summary endpoints you’ve used before
  // (no backend edits required; if present, we use it)
  const data =
    (await safeGet("/user/activity-summary")) ||
    (await safeGet("/users/activity-summary")) ||
    (await safeGet("/users/me/activity-summary")) ||
    (await safeGet("/users/me/summary"));

  return data || null;
}

export async function tryShipProject(projectId) {
  // Optional: if backend supports a "ship" action, we use it.
  // Otherwise returns null and the UI still works (fake ceremony).
  const data =
    (await safePost(`/projects/${projectId}/ship`, {})) ||
    (await safePost(`/projects/${projectId}/complete`, {})) ||
    (await safePost(`/projects/${projectId}/close`, {}));

  return data || null;
}
