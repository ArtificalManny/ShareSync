import client from "./client";

/**
 * User-scoped stats (Home)
 * Supports optional project filter and AbortController via { signal }.
 */
export async function getUserStats(
  { range = 30, projectId } = {},
  { signal } = {}
) {
  const params = new URLSearchParams();
  params.set("range", String(range));
  if (projectId && projectId !== "all") params.set("projectId", String(projectId));
  const r = await client.get(`/users/me/stats?${params.toString()}`, { signal });
  return r.data;
}

/**
 * Project-scoped stats (ProjectHome)
 * Accepts { range } and optional { signal } in the third arg.
 */
export async function getProjectStats(projectId, { range = 30 } = {}, { signal } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const params = new URLSearchParams();
  params.set("range", String(range));
  const r = await client.get(`/projects/${projectId}/stats?${params.toString()}`, { signal });
  return r.data;
}

export async function getProjectInsights(projectId, { range = 30 } = {}, opts = {}) {
  const res = await getProjectStats(projectId, { range }, opts);
  return res?.insights || [];
}
