// src/api/taskApi.js
// ═══════════════════════════════════════════════════════════════════════════════
// TASK API (Flow / Kanban / Stack / Pulse)
// Minimal, low-risk wrapper around your existing backend routes.
// Uses fetch directly (no dependency on client.js to avoid breaking changes).
// ═══════════════════════════════════════════════════════════════════════════════

function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SOCKET_URL || // sometimes people reuse this
    window.location.origin
  );
}

function getTokenAny() {
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

async function request(path, { method = "GET", body } = {}) {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const token = getTokenAny();

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    // ignore (some endpoints might return empty)
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  // Your backend returns: { success: true, data: ... }
  return json?.data ?? json;
}

/**
 * GET /tasks/board?projectId=... (&sprintId optional)
 */
export async function fetchKanbanBoard({ projectId, sprintId } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const qs = new URLSearchParams({ projectId });
  if (sprintId) qs.set("sprintId", sprintId);
  return request(`/tasks/board?${qs.toString()}`, { method: "GET" });
}

/**
 * PATCH /tasks/:id/move with { status, order, sprintId? }
 */
export async function moveTask(taskId, { status, order, sprintId } = {}) {
  if (!taskId) throw new Error("taskId is required");
  const body = {};
  if (status) body.status = status;
  if (typeof order === "number") body.order = order;
  if (sprintId !== undefined) body.sprintId = sprintId; // allow null-ish
  return request(`/tasks/${taskId}/move`, { method: "PATCH", body });
}

/**
 * GET /tasks/stack?projectId=...&limit=... (&assigneeId optional)
 */
export async function fetchStackTasks({ projectId, limit = 10, assigneeId } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const qs = new URLSearchParams();
  qs.set("projectId", projectId);
  if (limit) qs.set("limit", String(limit));
  if (assigneeId) qs.set("assigneeId", assigneeId);
  return request(`/tasks/stack?${qs.toString()}`, { method: "GET" });
}

/**
 * PATCH /tasks/:id/complete
 * Safe fallback: if endpoint doesn't exist, mark as done via moveTask().
 */
export async function completeTask(taskId) {
  if (!taskId) throw new Error("taskId is required");
  try {
    return await request(`/tasks/${taskId}/complete`, { method: "PATCH", body: {} });
  } catch (e) {
    if (e?.status === 404) {
      return moveTask(taskId, { status: "done" });
    }
    throw e;
  }
}

/**
 * GET /tasks/pulse?projectId=...
 * Phase 2: timestamp-based metrics
 */
export async function fetchPulseMetrics({ projectId } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const qs = new URLSearchParams({ projectId });
  return request(`/tasks/pulse?${qs.toString()}`, { method: "GET" });
}
