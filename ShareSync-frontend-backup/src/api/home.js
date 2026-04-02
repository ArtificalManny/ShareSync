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
  // Many implementations support GET /activities; we probe safely.
  const data =
    (await safeGet(`/activities?limit=${limit}`)) ||
    (await safeGet(`/activity?limit=${limit}`)) ||
    (await safeGet(`/user/activities?limit=${limit}`));

  return Array.isArray(data) ? data : [];
}

export async function fetchActivitySummary() {
  const res = await safeGet("/users/me");

  // Handle the various ways the backend might wrap the user object
  const user = res?.user || res?.data?.user || res?.data || res;

  // If we couldn't get a real user, return null to force the fallback computation
  if (!user || (!user._id && !user.id && !user.email)) return null;

  // ⭐ BUG FIX: Safely parse the focus metric
  // If the database stores focus as an object (e.g. { score: 85 }), drill into it.
  let focusValue = 0;
  if (typeof user.focus === 'number') {
    focusValue = user.focus;
  } else if (typeof user.focus === 'object' && user.focus !== null) {
    focusValue = user.focus.score || user.focus.value || user.focus.current || user.focus.level || 0;
  }

  return {
    ships: user.totalShips || 0,
    streakDays: user.currentStreak || user.streakDays || 0,
    focus: focusValue,
    efficiency: 0, // Real 0 for efficiency until advanced analytics are built
  };
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
