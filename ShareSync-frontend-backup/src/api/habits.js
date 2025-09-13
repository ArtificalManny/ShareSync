const BASE = "/api/habits";
const TIMEOUT = 8000;

function withTimeout(promise, ms = TIMEOUT) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return {
    run: async (init) => {
      try { return await promise(ctrl.signal, init); }
      finally { clearTimeout(t); }
    },
    signal: ctrl.signal,
  };
}

function safeJson(res) {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

// ---------- Core metrics ----------
export async function getCadence({ range = 14, signal } = {}) {
  try {
    const q = new URLSearchParams({ range: String(range) });
    const res = await fetch(`${BASE}/cadence?${q.toString()}`, { signal, credentials: "include" });
    if (!res.ok) throw new Error(`Failed cadence (${res.status})`);
    const json = await res.json();
    return {
      activeDays14: Number(json?.activeDays ?? json?.activeDays14 ?? 0),
      range,
    };
  } catch (e) {
    if (import.meta?.env?.MODE !== "production") {
      // Dev fallback
      return { activeDays14: Math.floor(Math.random() * Math.min(14, range)), range };
    }
    throw e;
  }
}

export async function getSprintMomentum({ range = 7, signal } = {}) {
  try {
    const q = new URLSearchParams({ range: String(range) });
    const res = await fetch(`${BASE}/momentum?${q.toString()}`, { signal, credentials: "include" });
    if (!res.ok) throw new Error(`Failed momentum (${res.status})`);
    const json = await res.json();
    // expect [{ date, count }]
    return Array.isArray(json) ? json : [];
  } catch (e) {
    if (import.meta?.env?.MODE !== "production") {
      // Dev fallback (last N days)
      const out = [];
      const now = new Date();
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        out.push({ date: d.toISOString().slice(0,10), count: Math.round(Math.random()*3) });
      }
      return out;
    }
    throw e;
  }
}

// ---------- Preferences ----------
export async function getHabitsPrefs() {
  try {
    const res = await fetch(`${BASE}/prefs`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed prefs (${res.status})`);
    return await res.json();
  } catch (e) {
    if (import.meta?.env?.MODE !== "production") {
      return {
        workdays: [1,2,3,4,5],
        quietHours: { start: 22, end: 7 },
        nudges: { sprint: true, update: true, convertTask: true },
        weeklyReflection: { day: 5, hour: 16 }, // Fri 4pm
      };
    }
    throw e;
  }
}

export async function updateHabitsPrefs(patch) {
  const res = await fetch(`${BASE}/prefs`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch || {}),
  });
  if (!res.ok) throw new Error(`Failed to update prefs (${res.status})`);
  return res.json();
}

// ---------- Reflections ----------
export async function postReflection(payload) {
  const res = await fetch(`${BASE}/reflections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error(`Failed to save reflection (${res.status})`);
  return res.json();
}

export async function getLatestReflection() {
  try {
    const res = await fetch(`${BASE}/reflections/latest`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed reflection (${res.status})`);
    return await res.json();
  } catch (e) {
    if (import.meta?.env?.MODE !== "production") {
      return null;
    }
    throw e;
  }
}

// ---------- Nudges ----------
export async function dismissNudge(id) {
  if (!id) return;
  try {
    const res = await fetch(`${BASE}/nudges/${encodeURIComponent(id)}/dismiss`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to dismiss nudge (${res.status})`);
    return await res.json();
  } catch {
    // non-fatal; ignore
    return null;
  }
}
