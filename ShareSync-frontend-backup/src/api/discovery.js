// /src/api/discovery.js
// Simple client and local fallback for the Discover surface.

import client from "./client";

/**
 * Return a list of discoverable projects.
 * MUST always resolve to an array (never undefined).
 * Each project should tolerate partial stats; UI is defensive.
 */
export async function getDiscoveryFeed(params = {}) {
  // If you have a backend route, use it:
  try {
    const res = await client.get("/discovery", { params });
    const items = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.items) ? res.data.items : [];
    return items;
  } catch {
    // Fallback—empty list (not undefined)
    return [];
  }
}

/**
 * (Optional) If you want to fetch a single page or different shape later.
 */
export async function getDiscoveryPage(params = {}) {
  const items = await getDiscoveryFeed(params);
  return { items, next: null };
}

export default { getDiscoveryFeed, getDiscoveryPage };
