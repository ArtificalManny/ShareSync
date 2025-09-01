// /src/api/activity.js
import api from "./client";

/**
 * Unified activity fetcher (cursor-ready) with normalization.
 * Tries /api/activity first; falls back to /activities for legacy servers.
 *
 * Params:
 *  - scope: 'user' | 'project' (default 'user')
 *  - userId?: string
 *  - projectId?: string
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
  types,
  cursor,
  limit = 20,
  signal,
} = {}) {
  const params = {
    scope,
    ...(userId ? { userId } : {}),
    ...(projectId ? { projectId } : {}),
    ...(Array.isArray(types) && types.length ? { types: types.join(",") } : {}),
    ...(cursor ? { cursor } : {}),
    ...(limit ? { limit } : {}),
  };

  // Attempt the new route first
  let json;
  try {
    const { data } = await api.get("/api/activity", { params, signal });
    json = data;
  } catch (e) {
    // Fallback to legacy route if available
    try {
      const { data } = await api.get("/activities", { params, signal });
      json = data;
    } catch (e2) {
      throw e; // surface original error
    }
  }

  // Normalize shape: expect { items: any[], nextCursor?: string } OR an array
  const rawItems = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : [];
  const { normalizeActivity } = await import("../models/activity.js");
  const items = rawItems.map((it) => normalizeActivity(it));

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
