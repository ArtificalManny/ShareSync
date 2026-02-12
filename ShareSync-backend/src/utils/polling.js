/**
 * src/utils/polling.js
 * Tiny helpers for safe polling.
 * - shouldPoll: pause when tab hidden / offline
 * - jitterMs: random jitter to avoid thundering herd
 * - nextIntervalMs: simple exponential backoff with cap
 */

export function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function shouldPoll() {
  if (!isBrowser()) return true;

  // If the tab is hidden, skip to reduce load.
  if (document.visibilityState && document.visibilityState !== "visible") return false;

  // If offline, skip.
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;

  return true;
}

export function jitterMs(baseMs, jitterPct = 0.12) {
  const base = Number(baseMs) || 0;
  if (base <= 0) return 0;

  const pct = Math.max(0, Math.min(1, Number(jitterPct) || 0));
  const maxJitter = Math.floor(base * pct);
  const delta = Math.floor(Math.random() * (maxJitter + 1));
  return base + delta;
}

/**
 * Basic backoff:
 * - attempt=0 -> baseMs
 * - attempt=1 -> baseMs*2
 * - attempt=2 -> baseMs*4 ...
 * capped at maxMs
 */
export function nextIntervalMs(baseMs, attempt, maxMs = 120000) {
  const base = Math.max(1000, Number(baseMs) || 0);
  const a = Math.max(0, Number(attempt) || 0);
  const cap = Math.max(base, Number(maxMs) || base);

  const scaled = base * Math.pow(2, a);
  return Math.min(scaled, cap);
}
