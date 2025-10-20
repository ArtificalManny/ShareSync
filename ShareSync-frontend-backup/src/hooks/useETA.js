import { useEffect, useMemo, useRef, useState } from "react";

/**
 * useETA
 * Estimate ETA to the next milestone using a robust median of similar tasks.
 *
 * Args: { projectId: string, milestoneId?: string, refreshMs?: number }
 * Returns:
 *  {
 *    loading, error,
 *    etaDate, // Date | null
 *    etaIso,  // string | null
 *    confidence, // 0..1
 *    comparables: number,
 *    reasons: string[],
 *    stats: { medianHours, p90Hours, sample: number }
 *  }
 *
 * API attempts (in order):
 *  1) /api/eta?projectId=...&milestoneId=...
 *  2) /api/projects/:id/tasks?state=done  (derive durations)
 *  3) fallback heuristic: openCount * 1.6d
 */
export default function useETA({ projectId, milestoneId, refreshMs = 5 * 60_000 }) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [state, setState]     = useState(null);
  const abortRef              = useRef(null);

  const refresh = async () => {
    if (!projectId) {
      setState(null);
      setLoading(false);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true); setError(null);

    try {
      // 1) direct ETA endpoint
      const etaRes = await safeFetch(`/api/eta?projectId=${encodeURIComponent(projectId)}${milestoneId ? `&milestoneId=${encodeURIComponent(milestoneId)}` : ""}`, controller.signal);
      if (etaRes.ok) {
        const json = await etaRes.json().catch(() => null);
        const normalized = toStateFromApi(json);
        if (normalized) { setState(normalized); setLoading(false); return; }
      }

      // 2) derive from historical done tasks
      const doneRes = await safeFetch(`/api/projects/${encodeURIComponent(projectId)}/tasks?state=done`, controller.signal);
      const openRes = await safeFetch(`/api/projects/${encodeURIComponent(projectId)}/tasks?state=open`, controller.signal);

      const done = doneRes.ok ? await doneRes.json().catch(() => []) : [];
      const open = openRes.ok ? await openRes.json().catch(() => []) : [];

      const durationsHrs = (Array.isArray(done) ? done : [])
        .map((t) => {
          const started = toTime(t.startedAt || t.createdAt);
          const finished = toTime(t.completedAt || t.doneAt || t.closedAt);
          if (!started || !finished || finished <= started) return null;
          return (finished - started) / (1000 * 60 * 60); // hours
        })
        .filter((n) => Number.isFinite(n) && n > 0);

      const stats = summarize(durationsHrs);
      const workLeft = Math.max(1, (Array.isArray(open) ? open.length : 1));
      const medianHours = stats.medianHours || 6; // fallback median
      const etaMs = workLeft * medianHours * 60 * 60 * 1000;

      const etaDate = new Date(Date.now() + etaMs);
      setState({
        etaDate,
        etaIso: etaDate.toISOString(),
        confidence: clamp01(0.4 + 0.1 * Math.min(stats.sample / 12, 1)), // more samples -> higher confidence
        comparables: stats.sample,
        reasons: [
          `Based on ${stats.sample} similar completions`,
          `Median duration ${Math.round(medianHours)}h${stats.p90Hours ? ` (p90 ${Math.round(stats.p90Hours)}h)` : ""}`,
          `Open items: ${workLeft}`,
        ],
        stats,
      });
    } catch (e) {
      setError(e);
      // 3) simple heuristic: 1.6 days per open item
      const etaMs = 1.6 * 24 * 60 * 60 * 1000;
      const etaDate = new Date(Date.now() + etaMs);
      setState({
        etaDate,
        etaIso: etaDate.toISOString(),
        confidence: 0.35,
        comparables: 0,
        reasons: ["Heuristic fallback: no history available", "Assumed 1.6d per unit of work"],
        stats: { medianHours: 38, p90Hours: null, sample: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    if (!refreshMs) return;
    const id = setInterval(refresh, refreshMs);
    return () => { clearInterval(id); abortRef.current?.abort?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, milestoneId, refreshMs]);

  const value = useMemo(() => state, [state]);
  return { loading, error, ...value };
}

/* --------------- helpers --------------- */

async function safeFetch(url, signal) {
  try {
    return await fetch(url, { credentials: "include", signal });
  } catch {
    return { ok: false, status: 0, json: async () => null };
  }
}

function toStateFromApi(json) {
  if (!json) return null;
  const eta = json.eta || json.etaDate || json.date || json.target;
  const dt = eta ? new Date(eta) : null;
  if (!dt || isNaN(+dt)) return null;
  return {
    etaDate: dt,
    etaIso: dt.toISOString(),
    confidence: clamp01(json.confidence ?? 0.6),
    comparables: Number(json.comparables ?? json.samples ?? 0) || 0,
    reasons: Array.isArray(json.reasons) ? json.reasons : [json.reason].filter(Boolean),
    stats: {
      medianHours: toNum(json.stats?.medianHours, null),
      p90Hours: toNum(json.stats?.p90Hours, null),
      sample: toNum(json.stats?.sample ?? json.comparables, 0),
    },
  };
}

function summarize(hoursArray) {
  const arr = (Array.isArray(hoursArray) ? hoursArray.slice() : []).filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  const n = arr.length;
  if (!n) return { medianHours: null, p90Hours: null, sample: 0 };

  const median = arr[Math.floor(n / 2)];
  const p90 = arr[Math.floor(n * 0.9)] ?? arr[n - 1];
  // winsorize extremes a bit
  const medianClamped = Math.max(1, Math.min(median, 72));

  return { medianHours: medianClamped, p90Hours: p90 || null, sample: n };
}

function clamp01(x) { return Math.max(0, Math.min(1, Number(x) || 0)); }
function toNum(x, d) { const n = Number(x); return Number.isFinite(n) ? n : d; }
function toTime(x)   { const t = x ? new Date(x).getTime() : NaN; return Number.isFinite(t) ? t : null; }
