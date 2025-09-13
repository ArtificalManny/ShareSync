const BASE = "/api/sprints";

export async function getSprints({ range = 28, projectId, userId, signal } = {}) {
  try {
    const q = new URLSearchParams({ range: String(range) });
    if (projectId) q.set("projectId", projectId);
    if (userId) q.set("userId", userId);
    const res = await fetch(`${BASE}?${q.toString()}`, { credentials: "include", signal });
    if (!res.ok) throw new Error(`Failed getSprints (${res.status})`);
    return await res.json();
  } catch (e) {
    if (import.meta?.env?.MODE !== "production") {
      // dev fallback
      const out = [];
      const now = new Date();
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        out.push({ id: `dev-${i}`, startedAt: d.toISOString(), finishedAt: d.toISOString(), durationMin: 25 });
      }
      return out;
    }
    throw e;
  }
}

export async function getSprintCompletions({ range = 14, userId, projectId, signal } = {}) {
  try {
    const q = new URLSearchParams({ range: String(range) });
    if (userId) q.set("userId", userId);
    if (projectId) q.set("projectId", projectId);
    const res = await fetch(`${BASE}/completions?${q.toString()}`, { credentials: "include", signal });
    if (!res.ok) throw new Error(`Failed completions (${res.status})`);
    return await res.json(); // expect [{ date: 'YYYY-MM-DD', count }]
  } catch (e) {
    if (import.meta?.env?.MODE !== "production") {
      // dev fallback
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

export async function postSprintStart(payload) {
  const res = await fetch(`${BASE}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error(`Failed to start sprint (${res.status})`);
  return res.json();
}

export async function postSprintFinish(payload) {
  const res = await fetch(`${BASE}/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error(`Failed to finish sprint (${res.status})`);
  return res.json();
}
