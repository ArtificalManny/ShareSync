// src/api/taskApi.js
// ═══════════════════════════════════════════════════════════════════════════════
// TASK API (Flow / Kanban / Stack / Pulse)
// Uses central client.js to guarantee correct baseURL, /api/v1 prefix, and tokens.
// Maps Stack Panel directly to the highly reliable /tasks/priorities endpoint.
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * GET /tasks/board?projectId=... (&sprintId optional)
 */
export async function fetchKanbanBoard({ projectId, sprintId } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const qs = new URLSearchParams({ projectId });
  if (sprintId) qs.set("sprintId", sprintId);
  
  const response = await client.get(`/tasks/board?${qs.toString()}`);
  return response.data?.data || response.data;
}

/**
 * PATCH /tasks/:id/move with { status, order, sprintId? }
 */
export async function moveTask(taskId, { status, order, sprintId } = {}) {
  if (!taskId) throw new Error("taskId is required");
  const body = {};
  if (status !== undefined) body.status = status;
  if (order !== undefined) body.order = order;
  if (sprintId !== undefined) body.sprintId = sprintId;

  const response = await client.patch(`/tasks/${taskId}/move`, body);
  return response.data?.data || response.data;
}

/**
 * POST /projects/:projectId/tasks - Create a new task
 * Supports two call signatures for backwards compatibility:
 *   createTask(projectId, { title, status, priority, description })
 *   createTask({ projectId, title, status, priority, description })
 */
export async function createTask(projectIdOrOpts, maybeData) {
  let projectId, title, status, priority, description;

  if (typeof projectIdOrOpts === "string") {
    // Two-arg form: createTask(projectId, { title, ... })
    projectId = projectIdOrOpts;
    ({ title, status = "backlog", priority, description } = maybeData || {});
  } else {
    // Single-object form: createTask({ projectId, title, ... })
    ({ projectId, title, status = "backlog", priority, description } = projectIdOrOpts || {});
  }

  if (!projectId) throw new Error("projectId is required");
  if (!title) throw new Error("title is required");

  const body = { title, status };
  if (priority) body.priority = priority;
  if (description) body.description = description;

  const response = await client.post(`/projects/${projectId}/tasks`, body);
  return response.data?.data || response.data;
}

/**
 * GET /tasks/priorities?projectId=...&limit=...
 * Replaces the missing /tasks/stack route with the pre-existing priorities engine.
 */
export async function fetchStackTasks({ projectId, limit = 10, assigneeId } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const qs = new URLSearchParams();
  qs.set("projectId", projectId);
  if (limit) qs.set("limit", String(limit));
  
  // Notice we use /tasks/priorities instead of /tasks/stack 
  // because getPriorityTasks is fully built and tested in your TasksController.
  const response = await client.get(`/tasks/priorities?${qs.toString()}`);
  return response.data?.data || response.data;
}

/**
 * PATCH /tasks/:id/complete
 * Safe fallback: if endpoint doesn't exist, mark as done via moveTask().
 */
export async function completeTask(taskId) {
  if (!taskId) throw new Error("taskId is required");
  try {
    const response = await client.patch(`/tasks/${taskId}/complete`, {});
    return response.data?.data || response.data;
  } catch (e) {
    if (e.response && e.response.status === 404) {
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
  
  const response = await client.get(`/tasks/pulse?${qs.toString()}`);
  return response.data?.data || response.data;
}
