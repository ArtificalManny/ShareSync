import client from "./client";

/**
 * SAFE: only depends on "projectId" query param.
 * Does NOT assume backend supports status/sort params.
 *
 * Expected backend routes:
 *   GET /api/milestones?projectId=...
 *
 * Response can be:
 *   - an array
 *   - { items: [...] }
 *   - { milestones: [...] }
 */
export async function getMilestones(projectId) {
  if (!projectId) return [];

  const res = await client.get("/milestones", {
    params: { projectId },
  });

  const data = res?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.milestones)) return data.milestones;

  return [];
}
