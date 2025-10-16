// src/utils/reactions.js
const LS_KEY = 'ss.reactions.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function save(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

export function getReactions(targetId) {
  const all = load();
  return all[targetId] || {};            // { "👍": 2, "✨": 1 }
}
export function hasReacted(targetId, emoji, meId='me') {
  const all = load();
  const key = `${targetId}::${emoji}::${meId}`;
  return Boolean(all.__who?.[key]);
}

export async function toggleReaction(targetId, emoji, { meId='me', tryApi=true } = {}) {
  // optimistic local
  const all = load();
  all[targetId] = all[targetId] || {};
  all.__who = all.__who || {};
  const whoKey = `${targetId}::${emoji}::${meId}`;
  const already = Boolean(all.__who[whoKey]);

  if (already) {
    all.__who[whoKey] = false;
    all[targetId][emoji] = Math.max(0, (all[targetId][emoji] || 0) - 1);
  } else {
    all.__who[whoKey] = true;
    all[targetId][emoji] = (all[targetId][emoji] || 0) + 1;
  }
  save(all);

  // optional API (best-effort)
  if (tryApi) {
    try {
      await fetch('/reactions/toggle', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ targetId, emoji }),
        credentials: 'include',
      });
    } catch {
      /* keep local only */
    }
  }
  return { counts: all[targetId], reacted: !already };
}
