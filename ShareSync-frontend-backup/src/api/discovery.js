// src/api/discovery.js
// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVERY API - Frontend client for Discover feed
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';

/**
 * Get main discovery feed
 */
export async function getDiscoveryFeed(params = {}) {
  const { page = 1, limit = 20, q, sort, category, signal } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (q) queryParams.set('q', q);
  if (sort) queryParams.set('sort', sort);
  if (category) queryParams.set('category', category);

  const response = await api.get(`/api/discovery?${queryParams.toString()}`, { signal });
  return response.data;
}

/**
 * Get personalized feed (requires auth)
 */
export async function getPersonalizedFeed(params = {}) {
  const { page = 1, limit = 20, signal } = params;
  const response = await api.get(`/api/discovery/feed?page=${page}&limit=${limit}`, { signal });
  return response.data;
}

/**
 * Get trending projects
 */
export async function getTrendingProjects(limit = 10, signal) {
  const response = await api.get(`/api/discovery/trending?limit=${limit}`, { signal });
  return response.data;
}

/**
 * Get categories
 */
export async function getCategories(signal) {
  const response = await api.get('/api/discovery/categories', { signal });
  return response.data;
}

/**
 * Get discovery sections (Hot Streaks, Quiet but Promising, etc.)
 * This is what the current Discover.jsx Jungle view uses
 */
export async function getDiscoverySections(params = {}) {
  const { signal } = params;
  const response = await api.get('/api/discovery/sections', { signal });
  
  // Map to expected format for existing Discover.jsx
  const data = response.data || {};
  return {
    hotStreaks: data.hotStreaks || [],
    quietPromising: data.quietPromising || [],
    peopleLikeYou: data.peopleLikeYou || [],
    recentlyShipped: data.recentlyShipped || [],
  };
}

export default {
  getDiscoveryFeed,
  getPersonalizedFeed,
  getTrendingProjects,
  getCategories,
  getDiscoverySections,
};
