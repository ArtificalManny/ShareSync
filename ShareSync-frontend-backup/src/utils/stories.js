/**
 * Tiny helpers to track "last seen" per project (localStorage) and
 * decide whether a project has unread activity.
 */

const LS_PREFIX = "ss:lastSeen:";

function lsGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key, val) {
  try {
    window.localStorage.setItem(key, String(val));
  } catch {}
}

export function storageKeyFor(projectId) {
  return `${LS_PREFIX}${String(projectId)}`;
}

/** Return a numeric timestamp (ms) or 0 if never seen. */
export function getLastSeen(projectId) {
  const v = lsGet(storageKeyFor(projectId));
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Set last seen timestamp (ms). */
export function setLastSeen(projectId, ts = Date.now()) {
  lsSet(storageKeyFor(projectId), ts);
  return ts;
}

/**
 * Decide unread:
 * - Use project.lastActivityAt if present
 * - Fallback to project.updatedAt
 * - Compare to lastSeen
 */
export function hasUnread(project, lastSeen) {
  const activity =
    project?.lastActivityAt ||
    project?.updatedAt ||
    project?.createdAt ||
    0;

  const a = toMs(activity);
  const s = Number(lastSeen || 0);
  return a > s;
}

/** Build a { [projectId]: boolean } map for a list of projects. */
export function buildUnreadMap(projects = []) {
  const out = {};
  for (const p of projects) {
    const id = String(p?._id || p?.id || "");
    if (!id) continue;
    const lastSeen = getLastSeen(id);
    out[id] = hasUnread(p, lastSeen);
  }
  return out;
}

/** Normalize any date-ish value to ms. */
function toMs(v) {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const d = new Date(v);
  const n = d.getTime();
  return Number.isFinite(n) ? n : 0;
}
