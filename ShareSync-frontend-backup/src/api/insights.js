// src/api/insights.js
// ═══════════════════════════════════════════════════════════════════════════════
// Insights API - Data fetching for project analytics and trends
// SAFE MODE: Returns null gracefully on error to prevent dashboard crashes.
// ═══════════════════════════════════════════════════════════════════════════════

import client from "./client";

/**
 * Fetch insights data for a specific project
 * @param {string} projectId - The ID of the project
 * @param {string} range - Time range for data (e.g., '7d', '30d')
 * @returns {Promise<Object|null>} The structured insights data payload
 */
export const getProjectInsights = async (projectId, range = '7d') => {
  if (!projectId) return null;

  try {
    const params = new URLSearchParams({ range });
    const response = await client.get(`/projects/${projectId}/insights?${params.toString()}`);
    
    // Support standard NestJS response wrapping
    return response?.data?.data || response?.data || null;
  } catch (error) {
    const status = error?.response?.status;
    
    // Soft fail on 404s in case the route isn't fully propagated yet
    if (status === 404) {
      console.warn(`[insights.js] getProjectInsights: 404 (route missing for project ${projectId}).`);
      return null;
    }

    console.error(
      "[insights.js] getProjectInsights failed:",
      error?.response?.data || error?.message
    );
    throw error;
  }
};

export default {
  getProjectInsights,
};
