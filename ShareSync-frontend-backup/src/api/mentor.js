// Lightweight client for the "Charles Xavier" mentor MVP.
import client from "./client";

/** GET /projects/:id/velocity → { buckets:[{weekStart,created,completed,wip}], windowWeeks } */
export async function getVelocity(projectId, params = {}) {
  if (!projectId) throw new Error("projectId is required");
  const { data } = await client.get(`/projects/${projectId}/velocity`, { params });
  return data || { buckets: [], windowWeeks: 8 };
}

/** POST /projects/:id/mentor/predict → { atRiskTasks, forecast, suggestions } */
export async function predict(projectId, opts = {}) {
  if (!projectId) throw new Error("projectId is required");
  const { data } = await client.post(`/projects/${projectId}/mentor/predict`, opts);
  return (
    data || {
      atRiskTasks: [],
      forecast: null,
      suggestions: [],
    }
  );
}

/**
 * NEW: Monte-Carlo probabilities
 * Tries project-scoped route first, then falls back to a global route:
 *  - POST /projects/:id/mentor/probabilities
 *  - POST /mentor/probabilities   (body should include projectId)
 *
 * Expected return (flexible, we normalize a bit):
 * {
 *   projectId, horizonDays, trials,
 *   etaP50: "YYYY-MM-DD", etaP80: "YYYY-MM-DD", onTimeProb: 0.73,
 *   percentiles: { p10: "...", p25: "...", p50: "...", p75: "...", p90: "..." },
 *   notes?: string[]
 * }
 */
export async function probabilities(projectId, payload = {}) {
  if (!projectId) throw new Error("projectId is required");

  // Try project-scoped first
  try {
    const { data } = await client.post(
      `/projects/${projectId}/mentor/probabilities`,
      { ...payload, projectId }
    );
    return normalizeProbs(data, projectId);
  } catch {
    // Fallback to global route
    const { data } = await client.post(`/mentor/probabilities`, {
      projectId,
      ...payload,
    });
    return normalizeProbs(data, projectId);
  }
}

function normalizeProbs(raw, projectId) {
  const d = raw || {};
  const percentiles = d.percentiles || {
    p10: d.etaP10 || null,
    p25: d.etaP25 || null,
    p50: d.etaP50 || d.eta || null,
    p75: d.etaP75 || null,
    p90: d.etaP90 || null,
  };
  return {
    projectId: d.projectId || projectId,
    horizonDays: d.horizonDays ?? 30,
    trials: d.trials ?? 1000,
    etaP50: d.etaP50 || percentiles.p50 || null,
    etaP80: d.etaP80 || percentiles.p80 || percentiles.p90 || null,
    onTimeProb: typeof d.onTimeProb === "number" ? d.onTimeProb : null,
    percentiles,
    notes: Array.isArray(d.notes) ? d.notes : [],
  };
}

/** (optional) GET /mentor/nudges?projectId=... */
export async function listNudges({ projectId, unreadOnly, limit } = {}) {
  const { data } = await client.get(`/mentor/nudges`, {
    params: {
      projectId: projectId || undefined,
      unreadOnly: unreadOnly ? 1 : undefined,
      limit: limit || undefined,
    },
  });
  return Array.isArray(data) ? data : data?.items || [];
}

/** (optional) mark a nudge as read — tries both common patterns */
export async function markNudgeRead(id) {
  if (!id) throw new Error("nudge id required");
  try {
    const { data } = await client.post(`/mentor/nudges/${id}/read`);
    return data;
  } catch {
    const { data } = await client.post(`/mentor/nudges/read`, { id });
    return data;
  }
}

/** (optional) POST /mentor/nudges */
export async function createNudge(payload) {
  const { data } = await client.post(`/mentor/nudges`, payload);
  return data;
}

export default {
  getVelocity,
  predict,
  probabilities,     // ← NEW export
  listNudges,
  markNudgeRead,
  createNudge,
};
