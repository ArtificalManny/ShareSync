// /src/api/search.js
// Search & Discovery API client
//
// GET /search?q=&types=&projectId=&userId=&sort=&page=&limit=
//
// - types: CSV from SUPPORTED_TYPES (user,project,post,file,task)
// - sort: 'relevance' | 'recent' (backend should default to 'relevance')
// - projectId/userId: optional scope filters

import client from "./client";

export const SUPPORTED_TYPES = ["user", "project", "post", "file", "task"];

/**
 * Normalize various input forms into a backend CSV:
 * - string: "user,project"
 * - array:  ["user","project"]
 * - Set:    new Set(["user","project"])
 * - null/undefined: omit
 */
export function parseTypesParam(types) {
  if (!types) return undefined;
  if (typeof types === "string") {
    // sanitize: split on commas/space, dedupe, keep only supported
    const parts = types
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const filtered = Array.from(new Set(parts)).filter((t) =>
      SUPPORTED_TYPES.includes(t)
    );
    return filtered.length ? filtered.join(",") : undefined;
  }
  if (Array.isArray(types) || types instanceof Set) {
    const arr = Array.from(types).map((s) => String(s || "").toLowerCase().trim());
    const filtered = Array.from(new Set(arr)).filter((t) =>
      SUPPORTED_TYPES.includes(t)
    );
    return filtered.length ? filtered.join(",") : undefined;
  }
  return undefined;
}

/**
 * searchAll({ q, types, projectId, userId, sort, page, limit })
 * -> GET /search with provided params
 *
 * Returns whatever the backend responds with (mixed results list or grouped),
 * so the UI can adapt without us over-normalizing here.
 */
export async function searchAll({
  q = "",
  types,
  projectId,
  userId,
  sort,
  page,
  limit,
} = {}) {
  const params = {};

  const query = String(q || "").trim();
  if (query) params.q = query;

  const typeCsv = parseTypesParam(types);
  if (typeCsv) params.types = typeCsv;

  if (projectId) params.projectId = projectId;
  if (userId) params.userId = userId;

  const s = String(sort || "").toLowerCase();
  if (s === "relevance" || s === "recent") params.sort = s;

  if (Number.isFinite(page)) params.page = Number(page);
  if (Number.isFinite(limit)) params.limit = Number(limit);

  const { data } = await client.get("/search", { params });
  return data;
}

export default {
  searchAll,
  parseTypesParam,
  SUPPORTED_TYPES,
};
