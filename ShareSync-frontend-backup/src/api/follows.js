// src/api/follows.js
// ──────────────────────────────────────────────────────────────
// FOLLOW API (frontend-safe)
// - follow/unfollow/status/me-follows
// - defensive token handling (supports multiple key names)
// - uses fetch so it won't depend on any missing client wrapper
// ──────────────────────────────────────────────────────────────

const API_BASE = (import.meta?.env?.VITE_API_URL || "").replace(/\/$/, "");

// If you run Vite with a proxy, keep this as "/api" (relative).
// If you deploy with a full URL, set VITE_API_URL.
function apiUrl(path) {
  if (!path.startsWith("/")) path = `/${path}`;
  if (!API_BASE) return path; // relative (proxy)
  return `${API_BASE}${path}`;
}

function getToken() {
  try {
    return (
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
}

async function request(path, { method = "GET", body, headers } = {}) {
  const token = getToken();

  const res = await fetch(apiUrl(path), {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Try to parse json; fall back to text
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      (typeof data === "string" ? data : null) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ──────────────────────────────────────────────────────────────
// Public functions
// ──────────────────────────────────────────────────────────────

export async function followProject(projectId, preferences = null) {
  if (!projectId) throw new Error("followProject: projectId is required");
  return request(`/api/projects/${projectId}/follow`, {
    method: "POST",
    body: preferences ? { preferences } : undefined,
  });
}

export async function unfollowProject(projectId) {
  if (!projectId) throw new Error("unfollowProject: projectId is required");
  return request(`/api/projects/${projectId}/follow`, { method: "DELETE" });
}

export async function getFollowStatus(projectId) {
  if (!projectId) throw new Error("getFollowStatus: projectId is required");
  return request(`/api/projects/${projectId}/follow/status`, { method: "GET" });
}

export async function updateFollowPreferences(projectId, preferences) {
  if (!projectId) throw new Error("updateFollowPreferences: projectId is required");
  if (!preferences) throw new Error("updateFollowPreferences: preferences is required");
  return request(`/api/projects/${projectId}/follow/preferences`, {
    method: "PATCH",
    body: { preferences },
  });
}

export async function getMyFollows() {
  return request(`/api/users/me/follows`, { method: "GET" });
}
