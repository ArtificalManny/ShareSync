import api from "./client";

/**
 * Safe path normalizer:
 * - If api.baseURL already ends with /api, do NOT prefix.
 * - Otherwise, prefix /api.
 *
 * This lets the same frontend work with either backend routing style:
 *   baseURL = http://localhost:5050      -> /api/projects
 *   baseURL = http://localhost:5050/api  -> /projects (which becomes /api/projects)
 */
export function withApiPrefix(path) {
  const base = String(api?.defaults?.baseURL || "");
  const baseHasApi = /\/api\/?$/.test(base);
  if (baseHasApi) return path;
  return path.startsWith("/api") ? path : `/api${path}`;
}
