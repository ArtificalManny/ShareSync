// src/api/milestones.js
// ═══════════════════════════════════════════════════════════════════════════════
// Milestones API - CRUD operations for project milestones
// SAFE MODE:
// - getMilestones() returns [] on 404 so Roadmap never "breaks" if backend isn't wired yet.
// - Other errors still throw (auth/500/etc) so real issues surface.
// ═══════════════════════════════════════════════════════════════════════════════

import client from "./client";

function extractList(payload) {
  // Accept common shapes:
  // 1) { success: true, data: [...] }
  // 2) [...]
  // 3) { milestones: [...] }
  // 4) { data: [...] }
  if (payload?.success && Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.milestones)) return payload.milestones;
  if (Array.isArray(payload?.data)) return payload.data;
  return null;
}

function shouldSoftFail(status) {
  // Roadmap should quietly show empty state when the route doesn't exist yet.
  // Keep auth errors loud.
  return status === 404;
}

/**
 * Get all milestones for a project
 * Backend (current assumption): GET /milestones?projectId=xxx
 *
 * @param {string} projectId - Project ID
 * @param {object} options - Query options (status, sort, limit)
 * @returns {Promise<Array>} Array of milestones
 */
export const getMilestones = async (projectId, options = {}) => {
  if (!projectId) return [];

  try {
    const params = new URLSearchParams({ projectId });

    // These are optional; safe if backend ignores them.
    if (options.status) params.append("status", options.status);
    if (options.sort) params.append("sort", options.sort);
    if (options.limit != null) params.append("limit", String(options.limit));

    const response = await client.get(`/milestones?${params.toString()}`);

    const data = response?.data;
    const list = extractList(data);

    if (Array.isArray(list)) return list;

    console.warn("[milestones.js] Unexpected response shape:", data);
    return [];
  } catch (error) {
    const status = error?.response?.status;

    if (shouldSoftFail(status)) {
      console.warn("[milestones.js] getMilestones: 404 (route missing). Returning [].");
      return [];
    }

    console.error(
      "[milestones.js] getMilestones failed:",
      error?.response?.data || error?.message
    );
    throw error;
  }
};

/**
 * Get a single milestone by ID
 * Backend: GET /milestones/:id
 */
export const getMilestone = async (milestoneId) => {
  try {
    const response = await client.get(`/milestones/${milestoneId}`);
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error("[milestones.js] getMilestone failed:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Create a new milestone
 * Backend: POST /milestones
 */
export const createMilestone = async (projectId, milestoneData) => {
  try {
    const response = await client.post("/milestones", {
      projectId,
      ...milestoneData,
    });
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error("[milestones.js] createMilestone failed:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Update a milestone
 * Backend: PUT /milestones/:id
 */
export const updateMilestone = async (milestoneId, updates) => {
  try {
    const response = await client.put(`/milestones/${milestoneId}`, updates);
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error("[milestones.js] updateMilestone failed:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Delete a milestone
 * Backend: DELETE /milestones/:id
 */
export const deleteMilestone = async (milestoneId) => {
  try {
    await client.delete(`/milestones/${milestoneId}`);
  } catch (error) {
    console.error("[milestones.js] deleteMilestone failed:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Link a task to a milestone
 * Backend: POST /milestones/:id/tasks
 */
export const linkTask = async (milestoneId, taskId) => {
  try {
    const response = await client.post(`/milestones/${milestoneId}/tasks`, { taskId });
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error("[milestones.js] linkTask failed:", error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Unlink a task from a milestone
 * Backend: DELETE /milestones/:id/tasks/:taskId
 */
export const unlinkTask = async (milestoneId, taskId) => {
  try {
    const response = await client.delete(`/milestones/${milestoneId}/tasks/${taskId}`);
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error("[milestones.js] unlinkTask failed:", error?.response?.data || error?.message);
    throw error;
  }
};

export default {
  getMilestones,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  linkTask,
  unlinkTask,
};
