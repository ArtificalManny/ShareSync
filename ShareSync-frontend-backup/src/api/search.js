// src/api/search.js
// ═══════════════════════════════════════════════════════════════════════════════
// Phase 1: Search uses discovery as the source of truth for public-listed projects
// Frontend-only safe wiring: calls existing /api/discovery endpoint with ?q=
// ═══════════════════════════════════════════════════════════════════════════════

import api from "./client";

// If backend returns { success: true, data: ... }, unwrap it.
// If backend returns raw data directly, keep as-is.
function unwrap(response) {
  const payload = response?.data;
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}

function normalizeError(err, fallback = "Request failed") {
  const msg =
    err?.normalizedMessage ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;

  const enriched = new Error(msg);
  enriched.normalizedMessage = msg;
  enriched.status = err?.response?.status;
  enriched.url = err?.config?.url;
  enriched.method = err?.config?.method?.toUpperCase?.();
  enriched.raw = err;
  return enriched;
}

// ─────────────────────────────────────────────────────────────────────────────
// Projects: Public-listed search (Phase 1)
// Uses /discovery as source of truth.
// Accepts q param; backend should return [] if no results.
// ─────────────────────────────────────────────────────────────────────────────
export async function searchPublicListedProjects(q) {
  try {
    const query = String(q || "").trim();
    if (!query || query.length < 2) return [];

    const res = await api.get("/discovery", { params: { q: query } });
    const data = unwrap(res);

    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw normalizeError(err, "Failed to search public projects");
  }
}
