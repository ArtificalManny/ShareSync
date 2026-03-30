// src/api/growthTrack.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Identity & Growth Track - API Layer (LIVE ENGINE)
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

/**
 * Get user's skill profile from the live Analytics Engine
 */
export async function getSkillProfile(userId) {
  if (!userId) return null;
  try {
    const response = await client.get(`/analytics/growth/${userId}/skills`);
    return response.data?.data || response.data;
  } catch (error) {
    console.warn('[GrowthTrack API] Skills unavailable:', error?.message);
    return null;
  }
}

/**
 * Get evolution moments (milestones and ships)
 */
export async function getEvolutionMoments(userId) {
  if (!userId) return [];
  try {
    const response = await client.get(`/analytics/growth/${userId}/evolution`);
    return response.data?.data || response.data;
  } catch (error) {
    console.warn('[GrowthTrack API] Evolution unavailable:', error?.message);
    return [];
  }
}

/**
 * Get AI-generated actionable growth suggestions
 */
export async function getGrowthSuggestions(userId) {
  if (!userId) return [];
  try {
    const response = await client.get(`/analytics/growth/${userId}/suggestions`);
    return response.data?.data || response.data;
  } catch (error) {
    console.warn('[GrowthTrack API] Suggestions unavailable:', error?.message);
    return [];
  }
}

/**
 * Get historical trend data (velocity, quality, collaboration)
 */
export async function getGrowthTrends(userId, metric = 'all', weeks = 12) {
  if (!userId) return null;
  try {
    const response = await client.get(`/analytics/growth/${userId}/trends`, {
      params: { metric, weeks },
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.warn('[GrowthTrack API] Trends unavailable:', error?.message);
    return null;
  }
}

export default {
  getSkillProfile,
  getEvolutionMoments,
  getGrowthSuggestions,
  getGrowthTrends,
};
