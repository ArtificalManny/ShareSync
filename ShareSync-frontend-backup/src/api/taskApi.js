// src/api/taskApi.js
// ═══════════════════════════════════════════════════════════════════════════════
// TASK API (Flow / Kanban / Stack)
// Minimal, low-risk wrapper around your existing backend routes.
// Uses fetch directly (no dependency on client.js to avoid breaking changes).
//
// Existing endpoints preserved:
// - GET   /tasks/board?projectId=... (&sprintId optional)
// - PATCH /tasks/:id/move   { status, order, sprintId? }
//
// New (Stack) endpoint added:
// - GET   /tasks/stack?projectId=... (&assigneeId optional, &limit optional)
//
// "Complete task" is implemented safely using moveTask(..., { status: "done" })
// to avoid guessing backend endpoints.
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
 * GET /tasks/stack?projectId=... (&assigneeId optional, &limit optional)
 * Backend is expected to filter to "stack" statuses (todo/in_progress) or return a broader set.
 * Frontend hook will filter+sort safely either way.
 */
export async function fetchStackTasks({ projectId, assigneeId, limit } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const qs = new URLSearchParams({ projectId });

  if (assigneeId) qs.set("assigneeId", assigneeId);
  if (typeof limit === "number" && Number.isFinite(limit)) qs.set("limit", String(limit));

  return request(`/tasks/stack?${qs.toString()}`, { method: "GET" });
}

/**
 * COMPLETE TASK (safe implementation)
 * We do NOT assume a /complete endpoint exists.
 * We reuse your known-good moveTask endpoint and mark as "done".
 */
export async function completeTask(taskId) {
  if (!taskId) throw new Error("taskId is required");
  return moveTask(taskId, { status: "done" });
}
