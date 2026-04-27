#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/api/follows.js"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[harden_follows_api] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


NEW_CONTENT = """// src/api/follows.js
// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOWS API - Instagram-style project following
//
// Simple follow routes:
// followProject(id)          → POST /api/follows/:id
// unfollowProject(id)        → DELETE /api/follows/:id
// getFollowedProjects()      → GET /api/follows
// getFollowStatus(id)        → GET /api/follows/check/:id
// getBulkFollowStatus([ids]) → GET /api/follows/status?ids=a,b,c
//
// Spectator preference route:
// updateFollowPreferences    → PATCH /api/projects/:id/follow
// fallback                   → PATCH /api/projects/:id/preferences
// ═══════════════════════════════════════════════════════════════════════════════

import client from './client';

function requireProjectId(projectId, caller = 'follows API') {
  const id = String(projectId || '').trim();

  if (!id || id === 'undefined' || id === 'null') {
    throw new Error(`[${caller}] Missing valid projectId`);
  }

  return id;
}

function encodeProjectId(projectId, caller) {
  return encodeURIComponent(requireProjectId(projectId, caller));
}

function unwrapResponse(res) {
  const payload = res?.data ?? res;

  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if ('data' in payload && payload.data !== undefined) {
    return payload.data;
  }

  return payload;
}

function normalizeFollowMutationResult(raw, fallbackFollowing) {
  const payload = unwrapResponse(raw) || {};

  return {
    success: payload.success ?? true,
    following: Boolean(payload.following ?? payload.isFollowing ?? fallbackFollowing),
    followersCount: Number(payload.followersCount ?? payload.project?.followersCount ?? 0),
    data: payload,
  };
}

/**
 * Follow a project.
 * This creates a follower/spectator relationship, not a project membership.
 *
 * @param {string} projectId
 * @returns {Promise<{ success: boolean, following: boolean, followersCount: number, data?: Object }>}
 */
export async function followProject(projectId) {
  const id = encodeProjectId(projectId, 'followProject');

  try {
    const res = await client.post(`/follows/${id}`);
    return normalizeFollowMutationResult(res, true);
  } catch (err) {
    console.error('[follows] followProject failed:', err);
    throw err;
  }
}

/**
 * Unfollow a project.
 *
 * @param {string} projectId
 * @returns {Promise<{ success: boolean, following: boolean, followersCount: number, data?: Object }>}
 */
export async function unfollowProject(projectId) {
  const id = encodeProjectId(projectId, 'unfollowProject');

  try {
    const res = await client.delete(`/follows/${id}`);
    return normalizeFollowMutationResult(res, false);
  } catch (err) {
    console.error('[follows] unfollowProject failed:', err);
    throw err;
  }
}

/**
 * Get all projects the current user follows.
 * Used by Projects/Discover surfaces to merge followed projects into the UI.
 *
 * @returns {Promise<Array>} Array of project objects
 */
export async function getFollowedProjects() {
  try {
    const res = await client.get('/follows');
    const payload = unwrapResponse(res);

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.projects)) return payload.projects;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.follows)) return payload.follows;

    return [];
  } catch (err) {
    console.error('[follows] getFollowedProjects failed:', err);
    return [];
  }
}

/**
 * Check if the current user follows a specific project.
 *
 * @param {string} projectId
 * @returns {Promise<boolean>}
 */
export async function getFollowStatus(projectId) {
  const id = encodeProjectId(projectId, 'getFollowStatus');

  try {
    const res = await client.get(`/follows/check/${id}`);
    const payload = unwrapResponse(res);

    return Boolean(payload?.following ?? payload?.isFollowing ?? false);
  } catch (err) {
    console.error('[follows] getFollowStatus failed:', err);
    return false;
  }
}

/**
 * Bulk check follow status for multiple projects.
 * Used by Discover feed / FeaturedProjects cards.
 *
 * @param {string[]} projectIds - Array of project IDs
 * @returns {Promise<Record<string, boolean>>} Map of projectId → isFollowing
 */
export async function getBulkFollowStatus(projectIds) {
  try {
    const cleanIds = Array.from(
      new Set(
        (Array.isArray(projectIds) ? projectIds : [])
          .map((id) => String(id || '').trim())
          .filter((id) => id && id !== 'undefined' && id !== 'null')
      )
    );

    if (cleanIds.length === 0) return {};

    const ids = cleanIds.map(encodeURIComponent).join(',');
    const res = await client.get(`/follows/status?ids=${ids}`);
    const payload = unwrapResponse(res);

    return payload?.statuses || payload?.data?.statuses || {};
  } catch (err) {
    console.error('[follows] getBulkFollowStatus failed:', err);
    return {};
  }
}

/**
 * Update notification and follow preferences for a specific public project.
 *
 * Preferred backend route:
 *   PATCH /api/projects/:id/follow
 *
 * Compatibility fallback:
 *   PATCH /api/projects/:id/preferences
 *
 * @param {string} projectId - The ID of the project
 * @param {Object} preferences - The preferences payload to update
 * @returns {Promise<Object>}
 */
export async function updateFollowPreferences(projectId, preferences = {}) {
  const id = encodeProjectId(projectId, 'updateFollowPreferences');

  try {
    const res = await client.patch(`/projects/${id}/follow`, preferences);
    return unwrapResponse(res);
  } catch (primaryErr) {
    const status = primaryErr?.response?.status;

    // Keep compatibility with the older route if the newer spectator-follow
    // preferences endpoint is not available in a given backend branch.
    if (status === 404 || status === 405) {
      try {
        const fallback = await client.patch(`/projects/${id}/preferences`, preferences);
        return unwrapResponse(fallback);
      } catch (fallbackErr) {
        console.error('[follows] updateFollowPreferences fallback failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    console.error('[follows] updateFollowPreferences failed:', primaryErr);
    throw primaryErr;
  }
}
"""


def main():
    print("[harden_follows_api] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    original = TARGET.read_text(encoding="utf-8")

    required_markers = [
        "export async function followProject(projectId)",
        "export async function unfollowProject(projectId)",
        "export async function getFollowedProjects()",
        "export async function getFollowStatus(projectId)",
        "export async function getBulkFollowStatus(projectIds)",
        "export async function updateFollowPreferences(projectId, preferences)",
        "import client from './client';",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Missing expected marker before rewrite: {marker}")

    required_after = [
        "function requireProjectId(projectId, caller = 'follows API')",
        "function encodeProjectId(projectId, caller)",
        "function unwrapResponse(res)",
        "function normalizeFollowMutationResult(raw, fallbackFollowing)",
        "client.post(`/follows/${id}`)",
        "client.delete(`/follows/${id}`)",
        "client.get(`/follows/check/${id}`)",
        "client.get(`/follows/status?ids=${ids}`)",
        "client.patch(`/projects/${id}/follow`, preferences)",
        "client.patch(`/projects/${id}/preferences`, preferences)",
    ]

    for marker in required_after:
      if marker not in NEW_CONTENT:
          fail(f"Internal safety check failed. Missing marker in new content: {marker}")

    if original == NEW_CONTENT:
        print("[harden_follows_api] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-harden-follows-api-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[harden_follows_api] backup created: {backup}")

    TARGET.write_text(NEW_CONTENT, encoding="utf-8")
    print(f"[harden_follows_api] patched: {TARGET}")

    print("")
    print("[harden_follows_api] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"requireProjectId|encodeProjectId|unwrapResponse|normalizeFollowMutationResult|followProject|unfollowProject|getBulkFollowStatus|updateFollowPreferences|/projects/\\\\$\\\\{id\\\\}/follow|/projects/\\\\$\\\\{id\\\\}/preferences\" src/api/follows.js -C 8")
    print("  git diff -- src/api/follows.js")


if __name__ == "__main__":
    main()
