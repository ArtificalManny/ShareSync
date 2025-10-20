import { useEffect, useMemo, useState } from "react";

/**
 * useKPIs
 * Fetches aggregate KPIs for the current user or a project.
 * Gracefully falls back to demo values if the API isn't available.
 *
 * Args: { projectId?: string, refreshMs?: number }
 * Returns:
 *  { loading, error, data: { velocity, ontimePercent, streakDays, deltas } }
 */
export default function useKPIs({ projectId, refreshMs = 60_000 } = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);

  const endpoint = projectId
    ? `/api/kpis?scope=project&id=${encodeURIComponent(projectId)}`
    : `/api/kpis?scope=user`;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Expect shape: { velocity, ontimePercent, streakDays, deltas? }
      setKpis(normalize(json));
    } catch (e) {
      // fallback demo values—stable but believable
      setKpis(
        projectId
          ? { velocity: 0.9, ontimePercent: 82, streakDays: 2, deltas: { velocity: +0.1, ontimePercent: +3, streakDays: +1 } }
          : { velocity: 1.1, ontimePercent: 88, streakDays: 6, deltas: { velocity: +0.2, ontimePercent: +2, streakDays: +1 } }
      );
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    if (!refreshMs) return;
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, refreshMs]);

  const data = useMemo(() => kpis, [kpis]);

  return { loading, error, data };
}

function normalize(x) {
  if (!x || typeof x !== "object") return null;
  const v = Number(x.velocity ?? 0);
  const o = Math.round(Number(x.ontimePercent ?? 0));
  const s = Math.round(Number(x.streakDays ?? 0));
  const d = x.deltas || { velocity: 0, ontimePercent: 0, streakDays: 0 };
  return { velocity: v, ontimePercent: o, streakDays: s, deltas: d };
}
