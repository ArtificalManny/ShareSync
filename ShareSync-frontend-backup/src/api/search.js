import api from "./client";

/**
 * searchAll(payloadOrQuery)
 * - Supports modern signature: searchAll({ q, types, sort, scope, page, limit })
 * - Supports legacy signature: searchAll("text")
 *
 * IMPORTANT: This file does NOT require any backend changes.
 * It will try a few likely endpoints. If all fail, it throws so the caller can handle it.
 */

function unwrap(res) {
  // supports both {success, data} and raw
  return res?.data?.data ?? res?.data;
}

async function tryGet(path, params) {
  const res = await api.get(path, { params });
  return unwrap(res);
}

async function tryPost(path, body) {
  const res = await api.post(path, body);
  return unwrap(res);
}

export async function searchAll(payloadOrQuery) {
  const isString = typeof payloadOrQuery === "string";
  const q = isString ? payloadOrQuery : (payloadOrQuery?.q ?? "");

  // Normalize to a payload for POST-style endpoints
  const payload = isString
    ? { q, types: ["project","task","user","post","file"], sort: "relevance", scope: "all", page: 1, limit: 25 }
    : payloadOrQuery;

  // Normalize GET params too
  const params = {
    q: payload?.q ?? "",
    types: Array.isArray(payload?.types) ? payload.types.join(",") : payload?.types,
    sort: payload?.sort,
    scope: payload?.scope,
    page: payload?.page,
    limit: payload?.limit,
  };

  // Try common patterns WITHOUT assuming your backend:
  // 1) GET /search
  try { return await tryGet("/search", params); } catch {}
  // 2) POST /search
  try { return await tryPost("/search", payload); } catch {}
  // 3) POST /search/all
  try { return await tryPost("/search/all", payload); } catch {}
  // 4) GET /discover/search (some apps do this)
  try { return await tryGet("/discover/search", params); } catch {}

  // If none worked, throw so SearchPage catches and shows "No results."
  throw new Error("No search endpoint matched");
}

export const search = searchAll;
