// src/api/milestones.js
// ═══════════════════════════════════════════════════════════════════════════════
// Milestones API - CRUD operations for project milestones
// ⚠️ IMPORTANT: Matches backend routes at /milestones (not nested under /projects)
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Get all milestones for a project
 * Backend: GET /milestones?projectId=xxx
 * 
 * @param {string} projectId - Project ID
 * @param {object} options - Query options (status, sort, limit)
 * @returns {Promise<Array>} Array of milestones
 */
export const getMilestones = async (projectId, options = {}) => {
  try {
    const params = new URLSearchParams({ projectId });
    if (options.status) params.append('status', options.status);
    if (options.sort) params.append('sort', options.sort);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await client.get(`/milestones?${params.toString()}`);
    
    // Handle response: { success: true, data: [...] }
    const data = response?.data;
    if (data?.success && Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.milestones)) return data.milestones;
    
    console.warn('[milestones.js] Unexpected response shape:', data);
    return [];
  } catch (error) {
    console.error('[milestones.js] getMilestones failed:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Get a single milestone by ID
 * Backend: GET /milestones/:id
 * 
 * @param {string} milestoneId - Milestone ID
 * @returns {Promise<object>} Milestone object
 */
export const getMilestone = async (milestoneId) => {
  try {
    const response = await client.get(`/milestones/${milestoneId}`);
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error('[milestones.js] getMilestone failed:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Create a new milestone
 * Backend: POST /milestones
 * 
 * @param {string} projectId - Project ID
 * @param {object} milestoneData - Milestone data (title, description, targetDate, etc.)
 * @returns {Promise<object>} Created milestone
 */
export const createMilestone = async (projectId, milestoneData) => {
  try {
    const response = await client.post('/milestones', {
      projectId,
      ...milestoneData,
    });
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error('[milestones.js] createMilestone failed:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Update a milestone
 * Backend: PUT /milestones/:id
 * 
 * @param {string} milestoneId - Milestone ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated milestone
 */
export const updateMilestone = async (milestoneId, updates) => {
  try {
    const response = await client.put(`/milestones/${milestoneId}`, updates);
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error('[milestones.js] updateMilestone failed:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Delete a milestone
 * Backend: DELETE /milestones/:id
 * 
 * @param {string} milestoneId - Milestone ID
 * @returns {Promise<void>}
 */
export const deleteMilestone = async (milestoneId) => {
  try {
    await client.delete(`/milestones/${milestoneId}`);
  } catch (error) {
    console.error('[milestones.js] deleteMilestone failed:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Link a task to a milestone
 * Backend: POST /milestones/:id/tasks
 * 
 * @param {string} milestoneId - Milestone ID
 * @param {string} taskId - Task ID to link
 * @returns {Promise<object>} Updated milestone
 */
export const linkTask = async (milestoneId, taskId) => {
  try {
    const response = await client.post(`/milestones/${milestoneId}/tasks`, { taskId });
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error('[milestones.js] linkTask failed:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Unlink a task from a milestone
 * Backend: DELETE /milestones/:id/tasks/:taskId
 * 
 * @param {string} milestoneId - Milestone ID
 * @param {string} taskId - Task ID to unlink
 * @returns {Promise<object>} Updated milestone
 */
export const unlinkTask = async (milestoneId, taskId) => {
  try {
    const response = await client.delete(`/milestones/${milestoneId}/tasks/${taskId}`);
    return response?.data?.data || response?.data;
  } catch (error) {
    console.error('[milestones.js] unlinkTask failed:', error?.response?.data || error?.message);
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
