import client from './client';

const DEFAULT_TIMEOUT_MS = 8000;

/** Build the public, shareable status URL for a given token. */
export function buildPublicStatusUrl(token) {
  return `/status/${encodeURIComponent(String(token))}`;
}

/** Build an absolute URL from a path (SSR/browser safe). */
export function buildAbsoluteUrl(path) {
  try {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    return origin ? `${origin}${path}` : path;
  } catch {
    return path;
  }
}

/** Convenience: copy the public status URL to clipboard. */
export async function copyPublicStatusLink(token) {
  const full = buildAbsoluteUrl(buildPublicStatusUrl(token));
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(full);
    } else {
      // Fallback
      const el = document.createElement("input");
      el.value = full;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    return true;
  } catch {
    return false;
  }
}

/* ---------- Enable / Disable / Regenerate ---------- */

/** POST /api/public/projects/:projectId/enable -> { token } */
export async function enablePublic(projectId, { signal } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const response = await client.post(
    `/public/projects/${encodeURIComponent(projectId)}/enable`,
    undefined,
    { signal }
  );
  const data = response?.data ?? response;
  return { token: data?.token ?? data?.publicToken };
}

/** POST /api/public/projects/:projectId/disable -> { ok:true } */
export async function disablePublic(projectId, { signal } = {}) {
  if (!projectId) throw new Error("projectId is required");
  await client.post(
    `/public/projects/${encodeURIComponent(projectId)}/disable`,
    undefined,
    { signal }
  );
  return { ok: true };
}

/** POST /api/public/projects/:projectId/regenerate -> { token } */
export async function regeneratePublicToken(projectId, { signal } = {}) {
  if (!projectId) throw new Error("projectId is required");
  const response = await client.post(
    `/public/projects/${encodeURIComponent(projectId)}/regenerate`,
    undefined,
    { signal }
  );
  const data = response?.data ?? response;
  return { token: data?.token ?? data?.publicToken };
}

/* ---------- Public status fetchers ---------- */

/**
 * GET /api/public/projects/:token/status
 * Returns a sanitized snapshot for public viewing.
 */
export async function fetchPublicProjectStatus(
  tokenOrId,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) {
  if (!tokenOrId) throw new Error("Missing public token");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const compositeSignal = _mergeSignals(signal, controller.signal);

  const url = `/api/public/projects/${encodeURIComponent(String(tokenOrId))}/status`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: compositeSignal,
    });

    if (res.status === 404) {
      if (import.meta?.env?.MODE !== "production") {
        console.warn("[public] 404; returning dev mock.");
        return _mockStatus();
      }
      throw new Error("Public status link not found or has been revoked.");
    }

    if (!res.ok) {
      throw new Error(await _safeErr(res, `Failed to fetch public status (${res.status})`));
    }

    const json = await res.json();
    return _normalizeStatus(json);
  } catch (err) {
    if (import.meta?.env?.MODE !== "production") {
      console.warn("[public] fetchPublicProjectStatus failed; returning dev mock.", err);
      return _mockStatus();
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Alias matching the spec name in your note. */
export const getPublicStatus = fetchPublicProjectStatus;

/* ---------- internals ---------- */

function _mergeSignals(a, b) {
  if (!a) return b;
  if (!b) return a;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (a.aborted || b.aborted) ctrl.abort();
  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });
  return ctrl.signal;
}

async function _safeErr(res, fallback) {
  try {
    const text = await res.text();
    return text || fallback || "Request failed";
  } catch {
    return fallback || "Request failed";
  }
}

function _normalizeStatus(raw) {
  return {
    title: raw?.title ?? "Untitled Project",
    owner: {
      name: raw?.owner?.name ?? "Unknown",
      avatarUrl: raw?.owner?.avatarUrl ?? undefined,
    },
    lastUpdatedAt: raw?.lastUpdatedAt ?? new Date().toISOString(),
    summary: raw?.summary ?? "",
    kpis: {
      onTime30d: _num01(raw?.kpis?.onTime30d),
      throughputPerWeek: _num(raw?.kpis?.throughputPerWeek),
      activeDays28d: _num(raw?.kpis?.activeDays28d),
      cadence14d: _num(raw?.kpis?.cadence14d),
    },
    activity: Array.isArray(raw?.activity) ? raw.activity : [],
  };
}

function _num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function _num01(v, def = 0) {
  const n = _num(v, def);
  return Math.max(0, Math.min(1, n));
}

function _mockStatus() {
  const now = new Date();
  return {
    title: "Demo Project",
    owner: { name: "Public Owner" },
    lastUpdatedAt: now.toISOString(),
    summary: "Public snapshot of recent activity and delivery reliability.",
    kpis: {
      onTime30d: 0.82,
      throughputPerWeek: 7,
      activeDays28d: 19,
      cadence14d: 12,
    },
    activity: [
      { type: "update", text: "Kicked off Q4 roadmap", createdAt: now.toISOString() },
      { type: "task.completed", text: "Finalize dashboard layout", createdAt: now.toISOString() },
    ],
  };
}

/** Optional default export for compatibility */
export default {
  buildPublicStatusUrl,
  buildAbsoluteUrl,
  copyPublicStatusLink,
  enablePublic,
  disablePublic,
  regeneratePublicToken,
  fetchPublicProjectStatus,
  getPublicStatus,
};

export async function getPublicProject(token) {
  const res = await fetch(`/api/public/projects/${token}`);
  if (!res.ok) throw new Error('Failed to load public project');
  return res.json();
}
export async function getPublicActivity(token, { page = 1, limit = 20 } = {}) {
  const url = new URL(`/api/public/projects/${token}/activity`, window.location.origin);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load public activity');
  return res.json();
}