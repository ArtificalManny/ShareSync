// src/api/taskApi.js
// ═══════════════════════════════════════════════════════════════════════════════
// TASK API (Flow / Kanban / Stack / Pulse)
// Uses central client.js to guarantee correct baseURL, /api/v1 prefix, and tokens.
// Maps Stack Panel directly to the highly reliable /tasks/priorities endpoint.
//
// ASSIGNMENT SAFETY PASS:
// - Preserves assigneeId as canonical assignment field
// - Supports richer createTask payloads without breaking older callers
// - Keeps backwards compatibility with older assignedToId callers by mapping
//   assignedToId -> assigneeId
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
 *   createTask(projectId, { title, status, priority, description, assigneeId, ... })
 *   createTask({ projectId, title, status, priority, description, assigneeId, ... })
 */
export async function createTask(projectIdOrOpts, maybeData) {
  let input = {};

  if (typeof projectIdOrOpts === "string") {
    input = {
      ...(maybeData || {}),
      projectId: projectIdOrOpts,
    };
  } else {
    input = { ...(projectIdOrOpts || {}) };
  }

  const {
    projectId,
    title,
    status = "backlog",
    priority,
    description,
    assigneeId,
    assignedToId,
    dueDate,
    tags,
    effort,
    estimatedTime,
    milestoneId,
  } = input;

  if (!projectId) throw new Error("projectId is required");
  if (!title || !String(title).trim()) throw new Error("title is required");

  const body = {
    title: String(title).trim(),
    status,
  };

  if (priority) body.priority = priority;
  if (description) body.description = description;

  // Canonical assignment field
  if (assigneeId) {
    body.assigneeId = assigneeId;
  } else if (assignedToId) {
    // Backwards-compatibility for older callers
    body.assigneeId = assignedToId;
  }

  if (dueDate) body.dueDate = dueDate;
  if (Array.isArray(tags) && tags.length > 0) body.tags = tags;
  if (effort !== undefined) body.effort = effort;
  if (estimatedTime !== undefined) body.estimatedTime = estimatedTime;
  if (milestoneId) body.milestoneId = milestoneId;

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
  if (assigneeId) qs.set("assigneeId", String(assigneeId));

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
 * PATCH /tasks/:id - partial update
 */
export async function updateTask(taskId, updates = {}) {
  if (!taskId) throw new Error("taskId is required");

  const body = {};
  for (const [key, value] of Object.entries(updates || {})) {
    if (value !== undefined) body[key] = value;
  }

  const response = await client.patch(`/tasks/${taskId}`, body);
  return response.data?.data || response.data;
}

/**
 * DELETE /tasks/:id
 */
export async function deleteTask(taskId) {
  if (!taskId) throw new Error("taskId is required");

  await client.delete(`/tasks/${taskId}`);
  return true;
}

/**
 * GET /tasks/:id - fetch the complete task document
 */
export async function fetchTaskDetail(taskId) {
  if (!taskId) throw new Error("taskId is required");

  const response = await client.get(`/tasks/${taskId}`);
  return response.data?.data || response.data;
}

/**
 * POST /tasks/:id/comments - add a task comment
 */
export async function addTaskComment(taskId, { content, mentions = [] } = {}) {
  if (!taskId) throw new Error("taskId is required");

  const normalizedContent = String(content || "").trim();

  if (!normalizedContent) {
    throw new Error("Comment content is required");
  }

  const response = await client.post(`/tasks/${taskId}/comments`, {
    content: normalizedContent,
    mentions: Array.isArray(mentions) ? mentions : [],
  });

  return response.data?.data || response.data;
}

/**
 * DELETE /tasks/:id/comments/:commentId - delete your own comment
 */
export async function deleteTaskComment(taskId, commentId) {
  if (!taskId) throw new Error("taskId is required");
  if (!commentId) throw new Error("commentId is required");

  const response = await client.delete(
    `/tasks/${taskId}/comments/${commentId}`
  );

  return response.data?.data || response.data;
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
