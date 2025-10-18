// /src/state/metrics.js
const _metrics = { counters: {}, last: [] };

export function bumpCounter(key, delta = 1) {
  _metrics.counters[key] = (_metrics.counters[key] || 0) + delta;
  _metrics.last.unshift({ key, delta, at: Date.now() });
  _metrics.last = _metrics.last.slice(0, 200);
}

export function pushEvent(key, payload = {}) {
  _metrics.last.unshift({ key, payload, at: Date.now() });
  _metrics.last = _metrics.last.slice(0, 200);
  _metrics.counters[key] = (_metrics.counters[key] || 0) + 1;
}

export function getSnapshot() {
  return JSON.parse(JSON.stringify(_metrics));
}

/* ────────────────────────────────────────────────────────────
   Presence helpers (light telemetry in-memory)
   - presence_heartbeats: counter of heartbeats observed
   - presence_online_count: last sampled online count (number)
   These are intentionally no-op safe.
──────────────────────────────────────────────────────────── */
export function recordPresenceHeartbeat() {
  bumpCounter("presence_heartbeats", 1);
}

export function recordPresenceOnlineCount(n) {
  const count = Math.max(0, Number(n) || 0);
  _metrics.counters["presence_online_count"] = count; // last sample
  _metrics.last.unshift({ key: "presence_online_count", count, at: Date.now() });
  _metrics.last = _metrics.last.slice(0, 200);
}

// Optional: listen to browser-wide custom events so any surface can
// dispatch updates without importing this module directly.
if (typeof window !== "undefined" && window.addEventListener) {
  try {
    window.addEventListener("presence:heartbeat", () => recordPresenceHeartbeat());
    // If you dispatch: window.dispatchEvent(new CustomEvent('presence:count', { detail:{ count: N }}))
    window.addEventListener("presence:count", (e) => {
      const c = e?.detail?.count;
      if (c != null) recordPresenceOnlineCount(c);
    });
  } catch { /* ignore */ }
}
