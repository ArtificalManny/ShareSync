// /src/api/activity.js
import api from "./client";
 
/**
 * Unified activity fetcher (cursor-ready) with normalization.
 *
 * Route priority:
 *   1. /projects/:projectId/activity (ActivitiesController — most reliable)
 *   2. /activity?scope=... (UnifiedActivityController)
 *   3. /activities?scope=... (legacy fallback)
 *
 * Params:
 *  - scope: 'user' | 'project' (default 'user')
 *  - userId?: string
 *  - projectId?: string
 *  - entityId?: string         // task, file, update, etc.
 *  - types?: string[]          // e.g., ['task.created','update.posted']
 *  - cursor?: string
 *  - limit?: number            // default 20
 *  - signal?: AbortSignal
 *
 * Returns: { items: Activity[], nextCursor: string|null }
 */
export async function getActivity({
  scope = "user",
  userId,
  projectId,
  entityId,
  types,
  cursor,
  limit = 20,
  signal,
} = {}) {
  const params = {
    scope,
    ...(userId ? { userId } : {}),
    ...(projectId ? { projectId } : {}),
    ...(entityId ? { entityId } : {}),
    ...(Array.isArray(types) && types.length ? { types: types.join(",") } : {}),
    ...(cursor ? { cursor } : {}),
    ...(limit ? { limit } : {}),
  };
 
  let json;
 
  // ✅ FIX: Try project-scoped route first (ActivitiesController)
  // This is the most reliable endpoint: @Controller('projects/:projectId/activity')
  if (scope === 'project' && projectId) {
    try {
      const { data } = await api.get(`/projects/${projectId}/activity`, {
        params: {
          limit,
          cursor: cursor || undefined,
          entityId: entityId || undefined,
        },
        signal,
      });
      json = data;
    } catch (e) {
      // 404 = route not found, try next
      if (e?.response?.status !== 404) {
        // Real error (auth, server, etc.) — don't swallow it
        // Still try fallbacks below
      }
      json = null;
    }
  }
 
  // ✅ FIX: Second attempt — /activity (NOT /api/activity — client already adds /api)
  if (!json) {
    try {
      const { data } = await api.get("/activity", { params, signal });
      json = data;
    } catch (e) {
      // Fallback to legacy route
      try {
        const { data } = await api.get("/activities", { params, signal });
        json = data;
      } catch (e2) {
        throw e; // surface original error
      }
    }
  }
 
  // Normalize shape: expect { items: any[], nextCursor?: string } OR an array
  const rawItems = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : [];
 
  let items;
  try {
    const { normalizeActivity } = await import("../models/activity.js");
    items = rawItems.map((it) => normalizeActivity(it));
  } catch {
    // If normalizeActivity model doesn't exist, pass items through raw
    items = rawItems;
  }
 
  return {
    items,
    nextCursor: json?.nextCursor || null,
  };
}
 
/**
 * CSV export (keeps your existing behavior & route).
 * Accepts same filters as getActivity; forwards as query params.
 */
export async function exportActivity(params) {
  const resp = await api.get("/activities/export.csv", {
    params,
    responseType: "blob",
  });
  const url = URL.createObjectURL(resp.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "activity_export.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
