const LS_KEY = "ss:kpi:comments";

/** internal load/save helpers */
function loadStore() {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveStore(obj) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {}
}

/** Build a namespaced key for a point’s comments */
export function buildKey({ projectId, metric, t }) {
  const pid = String(projectId ?? "");
  const m = String(metric ?? "");
  const ts = typeof t === "number" ? t : new Date(t).getTime();
  return `${pid}|${m}|${ts}`;
}

/** Get comments array for a point (returns []) */
export function getComments(key) {
  if (!key) return [];
  const store = loadStore();
  const arr = store[key];
  return Array.isArray(arr) ? arr : [];
}

/** Add a comment to a point */
export function addComment(key, comment) {
  if (!key) return;
  const store = loadStore();
  const arr = Array.isArray(store[key]) ? store[key] : [];
  const payload = {
    text: String(comment?.text || ""),
    at: Number(comment?.at || Date.now()),
    author: comment?.author || "User",
  };
  arr.push(payload);
  store[key] = arr;
  saveStore(store);
  return payload;
}
