// Lightweight cross-tab presence store.
// Shape: Map<userId, lastSeenMs>. Broadcasts via BroadcastChannel('presence')
// with a localStorage fallback so multiple tabs stay in sync.

const PRESENCE_TTL_ONLINE_MS = 70_000;          // <= 70s → online
const PRESENCE_TTL_AWAY_MS   = 5 * 60_000;      // <= 5m  → away, else offline

const _map = new Map();        // userId -> lastSeenMs
const _subs = new Set();       // Set<fn(snapshot)>

// BroadcastChannel (soft-fallback to localStorage event)
let _bc = null;
try {
  _bc = new BroadcastChannel('presence');
  _bc.onmessage = (ev) => {
    const msg = ev?.data || {};
    if (msg && msg.type === 'presence:update' && msg.userId) {
      _map.set(String(msg.userId), Number(msg.ts || Date.now()));
      _emit();
    }
  };
} catch { /* noop */ }

function _post(msg) {
  try { _bc?.postMessage(msg); } catch {}
  try {
    localStorage.setItem('__presence_ping', JSON.stringify({ ...msg, _t: Date.now() }));
  } catch {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== '__presence_ping') return;
    try {
      const msg = JSON.parse(e.newValue || '{}');
      if (msg && msg.type === 'presence:update' && msg.userId) {
        _map.set(String(msg.userId), Number(msg.ts || Date.now()));
        _emit();
      }
    } catch { /* noop */ }
  });
}

function _snapshot() {
  // Return plain object { userId: lastSeenMs }
  const obj = {};
  _map.forEach((v, k) => { obj[k] = v; });
  return obj;
}

function _emit() {
  const snap = _snapshot();
  _subs.forEach((cb) => {
    try { cb(snap); } catch {}
  });
}

/** Set/update a user's lastSeen (ms). */
export function setLastSeen(userId, ts = Date.now()) {
  if (!userId) return;
  _map.set(String(userId), Number(ts));
  _emit();
  _post({ type: 'presence:update', userId: String(userId), ts: Number(ts) });
}

/** Return a plain object map { userId: lastSeenMs }. */
export function getPresence() {
  return _snapshot();
}

/** Simple presence status helper: 'online' | 'away' | 'offline'. */
export function getStatus(userId, now = Date.now(), {
  onlineMs = PRESENCE_TTL_ONLINE_MS,
  awayMs   = PRESENCE_TTL_AWAY_MS,
} = {}) {
  const t = _map.get(String(userId));
  if (!t) return 'offline';
  const dt = now - Number(t);
  if (dt <= onlineMs) return 'online';
  if (dt <= awayMs)   return 'away';
  return 'offline';
}

/** Boolean helper. */
export function isOnline(userId, opts) {
  return getStatus(userId, Date.now(), opts) === 'online';
}

/** Last seen ms (0 if unknown). */
export function lastSeen(userId) {
  return Number(_map.get(String(userId)) || 0);
}

/** Subscribe to presence changes; returns an unsubscribe. */
export function subscribe(cb) {
  if (typeof cb !== 'function') return () => {};
  _subs.add(cb);
  try { cb(_snapshot()); } catch {}
  return () => _subs.delete(cb);
}

export default {
  setLastSeen,
  getPresence,
  getStatus,
  isOnline,
  lastSeen,
  subscribe,
};
