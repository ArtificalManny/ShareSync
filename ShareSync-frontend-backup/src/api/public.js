// /src/api/public.js

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Build the public, shareable status URL for a given token.
 * Example: /status/<token>
 */
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

/**
 * Fetch public project status by token (or id).
 * Expected backend route (adjust if needed):
 *   GET /api/public/projects/:token/status
 *
 * Returns shape:
 * {
 *   title: string,
 *   owner: { name: string, avatarUrl?: string },
 *   lastUpdatedAt: string, // ISO
 *   summary?: string,
 *   kpis: {
 *     onTime30d: number,        // 0..1
 *     throughputPerWeek: number,
 *     activeDays28d: number,
 *     cadence14d: number
 *   }
 * }
 */
export async function fetchPublicProjectStatus(
  tokenOrId,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) {
  if (!tokenOrId) throw new Error("Missing public token");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const compositeSignal = mergeSignals(signal, controller.signal);

  const url = `/api/public/projects/${encodeURIComponent(String(tokenOrId))}/status`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: compositeSignal,
    });

    if (res.status === 404) {
      // Dev DX: return mock if backend not wired yet
      if (import.meta?.env?.MODE !== "production") {
        console.warn("[public] 404 from backend; returning mock data for development.");
        return mockStatus();
      }
      throw new Error("Public status link not found or has been revoked.");
    }

    if (!res.ok) {
      const text = await safeText(res);
      throw new Error(
        `Failed to fetch public status (${res.status}). ${text || ""}`.trim()
      );
    }

    const json = await res.json();
    return normalizeStatus(json);
  } catch (err) {
    if (import.meta?.env?.MODE !== "production") {
      console.warn("[public] fetchPublicProjectStatus failed; returning mock in dev.", err);
      return mockStatus();
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// -------- helpers --------

function mergeSignals(a, b) {
  if (!a) return b;
  if (!b) return a;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (a.aborted || b.aborted) ctrl.abort();
  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });
  return ctrl.signal;
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function normalizeStatus(raw) {
  // Make sure required fields exist; fill safe defaults
  return {
    title: raw?.title ?? "Untitled Project",
    owner: {
      name: raw?.owner?.name ?? "Unknown",
      avatarUrl: raw?.owner?.avatarUrl ?? undefined,
    },
    lastUpdatedAt: raw?.lastUpdatedAt ?? new Date().toISOString(),
    summary: raw?.summary ?? "",
    kpis: {
      onTime30d: num0to1(raw?.kpis?.onTime30d),
      throughputPerWeek: num(raw?.kpis?.throughputPerWeek),
      activeDays28d: num(raw?.kpis?.activeDays28d),
      cadence14d: num(raw?.kpis?.cadence14d),
    },
  };
}

function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function num0to1(v, def = 0) {
  const n = num(v, def);
  return Math.max(0, Math.min(1, n));
}

// -------- dev mock --------

function mockStatus() {
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
  };
}