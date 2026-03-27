// src/api/follows.js
// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOWS API - Instagram-style project following
//
// followProject(id)          → POST /api/follows/:id
// unfollowProject(id)        → DELETE /api/follows/:id
// getFollowedProjects()      → GET /api/follows
// getFollowStatus(id)        → GET /api/follows/check/:id
// getBulkFollowStatus([ids]) → GET /api/follows/status?ids=a,b,c
// updateFollowPreferences    → PATCH /api/projects/:id/preferences
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Follow a project
 * @param {string} projectId
 * @returns {Promise<{ success: boolean, following: boolean, followersCount: number }>}
 */
export async function followProject(projectId) {
  try {
    const res = await client.post(`/follows/${projectId}`);
    return res?.data || res;
  } catch (err) {
    console.error('[follows] followProject failed:', err);
    throw err;
  }
}

/**
 * Unfollow a project
 * @param {string} projectId
 * @returns {Promise<{ success: boolean, following: boolean, followersCount: number }>}
 */
export async function unfollowProject(projectId) {
  try {
    const res = await client.delete(`/follows/${projectId}`);
    return res?.data || res;
  } catch (err) {
    console.error('[follows] unfollowProject failed:', err);
    throw err;
  }
}

/**
 * Get all projects the current user follows (full project data)
 * Used by Projects page to merge followed projects into the grid
 * @returns {Promise<Array>} Array of project objects
 */
export async function getFollowedProjects() {
  try {
    const res = await client.get('/follows');
    const payload = res?.data || res;
    return payload?.data || payload || [];
  } catch (err) {
    console.error('[follows] getFollowedProjects failed:', err);
    return [];
  }
}

/**
 * Check if the current user follows a specific project
 * @param {string} projectId
 * @returns {Promise<boolean>}
 */
export async function getFollowStatus(projectId) {
  try {
    const res = await client.get(`/follows/check/${projectId}`);
    const payload = res?.data || res;
    return !!payload?.following;
  } catch (err) {
    console.error('[follows] getFollowStatus failed:', err);
    return false;
  }
}

/**
 * Bulk check follow status for multiple projects (used by Discover feed)
 * @param {string[]} projectIds - Array of project IDs
 * @returns {Promise<Record<string, boolean>>} Map of projectId → isFollowing
 */
export async function getBulkFollowStatus(projectIds) {
  try {
    if (!projectIds || projectIds.length === 0) return {};
    const ids = projectIds.join(',');
    const res = await client.get(`/follows/status?ids=${ids}`);
    const payload = res?.data || res;
    return payload?.statuses || {};
  } catch (err) {
    console.error('[follows] getBulkFollowStatus failed:', err);
    return {};
  }
}

/**
 * Update notification and follow preferences for a specific project
 * @param {string} projectId - The ID of the project
 * @param {Object} preferences - The preferences payload to update
 * @returns {Promise<Object>}
 */
export async function updateFollowPreferences(projectId, preferences) {
  try {
    // Hits the backend route: PATCH /api/projects/:id/preferences
    const res = await client.patch(`/projects/${projectId}/preferences`, preferences);
    return res?.data || res;
  } catch (err) {
    console.error('[follows] updateFollowPreferences failed:', err);
    throw err;
  }
}
