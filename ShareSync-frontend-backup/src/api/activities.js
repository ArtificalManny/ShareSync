import client from "./client";

/**
 * getActivities
 * Unified activities endpoint that returns all event kinds.
 * 🔥 Wrapped in strict error handling to support optimistic rendering pipelines.
 *
 * @param {{ scope:'project'|'workspace'|'user', projectId?:string, userId?:string, types?:string|string[], limit?:number, cursor?:string }} params
 * Types can be: 'update','task.created','task.updated','task.completed','file.added','audit', etc.
 *
 * Returns: { items: any[], nextCursor?: string|null }
 */
export async function getActivities(params = {}) {
  const {
    scope = "project",
    projectId,
    userId,
    types,
    limit = 20,
    cursor,
  } = params;

  const finalParams = {
    scope,
    projectId,
    userId,
    limit,
    cursor: cursor || undefined,
  };

  if (Array.isArray(types) && types.length) {
    finalParams.types = types.join(","); // backend may accept CSV
  } else if (typeof types === "string" && types) {
    finalParams.types = types;
  }

  try {
    const { data } = await client.get("/activities", { params: finalParams });
    return {
      items: Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [],
      nextCursor: data?.nextCursor || null,
    };
  } catch (error) {
    console.error("[Activities API] getActivities failed:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch activities");
  }
}

/**
 * getMeaningfulActivity
 * Backend (if present): GET /activities/meaningful?range=14&projectId=...&userId=...
 * Falls back to getActivities() + client-side filter for “signal” events.
 */
export async function getMeaningfulActivity({ range = 14, projectId, userId, cursor } = {}) {
  try {
    const { data } = await client.get("/activities/meaningful", {
      params: { range, projectId, userId, cursor: cursor || undefined },
    });
    return {
      items: Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [],
      nextCursor: data?.nextCursor || null,
    };
  } catch {
    // Fallback: fetch generic, then filter locally
    const since = Date.now() - range * 24 * 60 * 60 * 1000;
    try {
      const base = await getActivities({
        scope: userId ? "user" : (projectId ? "project" : "workspace"),
        projectId,
        userId,
        limit: 200, // larger batch to filter client-side
      });
      const signalKinds = new Set([
        "update.posted", "update",
        "task.created", "task.completed",
        "file.added", "file.uploaded",
      ]);
      const keep = (ev) => {
        const k = String(ev?.type || ev?.kind || "").toLowerCase();
        const t = new Date(ev?.createdAt || ev?.timestamp || Date.now()).getTime();
        return (signalKinds.has(k) || k.startsWith("update") || k.startsWith("task.") || k.startsWith("file"))
          && t >= since;
      };
      return { items: (base.items || []).filter(keep), nextCursor: null };
    } catch (fallbackError) {
      console.warn("Fallback meaningful activity fetch failed.");
      return { items: [], nextCursor: null };
    }
  }
}

/** Convenience: recent user activity without paging noise */
export async function getRecentUserEvents({ userId, range = 14 } = {}) {
  return getActivities({ scope: "user", userId, limit: 100 })
    .then(({ items }) => {
      const since = Date.now() - range * 24 * 60 * 60 * 1000;
      return (items || []).filter((u) => new Date(u?.createdAt || u?.timestamp || 0).getTime() >= since);
    })
    .catch((error) => {
      console.warn("getRecentUserEvents failed:", error);
      return [];
    });
}
