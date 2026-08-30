// src/api/projectOverviewShared.js
// Shared short-lived project-overview request coalescing.
//
// Home has multiple independent consumers of /projects/:id/overview
// (mission readiness, workload intelligence, etc.). When those mount
// together, identical reads for the same project should share one
// in-flight request instead of producing a request burst.

import client from "./client";

const recentOverviewReads = new Map();
const RECENT_RESPONSE_MS = 750;

function normalizeProjectId(projectId) {
  return String(projectId || "").trim();
}

export async function getSharedProjectOverview(projectId) {
  const id = normalizeProjectId(projectId);

  if (!id) {
    throw new Error("projectId is required");
  }

  const now = Date.now();
  const existing = recentOverviewReads.get(id);

  // Reuse the exact request while another Home subsystem is already
  // fetching this project's overview.
  if (existing?.promise) {
    return existing.promise;
  }

  // Cover immediate sequential consumers that mount just after the
  // first request resolves, without introducing meaningful stale data.
  if (
    existing?.response &&
    Number.isFinite(existing?.resolvedAt) &&
    now - existing.resolvedAt <= RECENT_RESPONSE_MS
  ) {
    return existing.response;
  }

  const promise = client
    .get(`/projects/${id}/overview`)
    .then((response) => {
      recentOverviewReads.set(id, {
        promise: null,
        response,
        resolvedAt: Date.now(),
      });

      return response;
    })
    .catch((error) => {
      recentOverviewReads.delete(id);
      throw error;
    });

  recentOverviewReads.set(id, {
    promise,
    response: existing?.response || null,
    resolvedAt: existing?.resolvedAt || 0,
  });

  return promise;
}
