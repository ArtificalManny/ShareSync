import { useMemo } from "react";

/**
 * Normalize many shapes into [{ t: number(ms), v: number }]
 * Accepted:
 *  - Array<number>
 *  - Array<[time, value]>
 *  - Array<{ t|time|date|x|ts, v|value|y }>
 */
export function normalizeSeries(raw) {
  if (!raw) return [];
  const toMs = (ts) => {
    const d = new Date(ts);
    const n = d.getTime();
    return Number.isFinite(n) ? n : null;
  };

  if (Array.isArray(raw) && raw.every((x) => typeof x === "number")) {
    // Treat as recent-day sequence ending today
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (raw.length - 1));
    const startMs = start.getTime();
    return raw.map((v, i) => ({
      t: startMs + i * 24 * 60 * 60 * 1000,
      v: Number.isFinite(v) ? Number(v) : 0,
    }));
  }

  if (Array.isArray(raw)) {
    return raw
      .map((pt) => {
        if (Array.isArray(pt) && pt.length >= 2) {
          const t = toMs(pt[0]);
          const v = Number(pt[1]);
          if (t == null || !Number.isFinite(v)) return null;
          return { t, v };
        }
        if (pt && typeof pt === "object") {
          const tx = pt.t ?? pt.time ?? pt.date ?? pt.x ?? pt.ts;
          const t = toMs(tx);
          const vx = pt.v ?? pt.value ?? pt.y;
          const v = Number(vx);
          if (t == null || !Number.isFinite(v)) return null;
          return { t, v };
        }
        return null;
      })
      .filter(Boolean);
  }

  return [];
}

/** Pull a series from common stats shapes */
export function pickSeries(stats, key) {
  const candidate =
    stats?.series?.[key] ??
    stats?.[key]?.series ??
    stats?.timeseries?.[key] ??
    stats?.[key]?.history ??
    stats?.[key]?.points ??
    stats?.[key]?.values ??
    null;
  return normalizeSeries(candidate);
}

/**
 * useKpiSeries(stats, keys)
 * - stats: result of getProjectStats(id, {range})
 * - keys: array of { label, key, color?, gradientVariant? }
 *
 * Returns: [{ label, series:[{t(ms),v}], color?, gradientVariant? }]
 */
export default function useKpiSeries(
  stats,
  keys = [
    { label: "Cadence", key: "cadence" },
    { label: "Throughput / wk", key: "throughputPerWeek" },
    { label: "Active Days", key: "activeDays" },
    { label: "On-time %", key: "onTimeCompletion" },
  ]
) {
  return useMemo(() => {
    if (!stats) return [];
    return keys
      .map(({ label, key, color, gradientVariant }) => {
        const series = pickSeries(stats, key);

        // Sort & de-dupe by ms timestamp
        const seen = new Set();
        const sorted = series
          .slice()
          .sort((a, b) => a.t - b.t)
          .filter((p) => {
            if (!p || !Number.isFinite(p.t)) return false;
            const k = p.t;
            if (seen.has(k)) return false;
            seen.add(k);
            // sanitize NaN/Infinity values
            p.v = Number.isFinite(p.v) ? p.v : 0;
            return true;
          });

        return sorted.length
          ? { label, series: sorted, color, gradientVariant }
          : null;
      })
      .filter(Boolean);
  }, [stats, keys]);
}
