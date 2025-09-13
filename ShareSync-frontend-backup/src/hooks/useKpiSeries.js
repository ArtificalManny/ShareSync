import { useMemo } from "react";

/**
 * Normalize a variety of timeseries shapes into [{ t: ISOString, v: number }]
 * Accepted inputs:
 *  - Array<number>
 *  - Array<[time, value]>
 *  - Array<{ t|time|date|x|ts, v|value|y }>
 */
export function normalizeSeries(raw) {
  if (!raw) return [];
  if (Array.isArray(raw) && raw.every((x) => typeof x === "number")) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (raw.length - 1));
    return raw.map((v, i) => ({
      t: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i).toISOString(),
      v: Number(v) || 0,
    }));
  }
  if (Array.isArray(raw)) {
    return raw
      .map((pt) => {
        if (Array.isArray(pt) && pt.length >= 2) {
          const [ts, val] = pt;
          return { t: new Date(ts).toISOString(), v: Number(val) || 0 };
        }
        if (pt && typeof pt === "object") {
          const t = pt.t ?? pt.time ?? pt.date ?? pt.x ?? pt.ts;
          const v = pt.v ?? pt.value ?? pt.y;
          if (t == null || v == null) return null;
          return { t: new Date(t).toISOString(), v: Number(v) || 0 };
        }
        return null;
      })
      .filter(Boolean);
  }
  return [];
}

/**
 * Try several common locations for a series inside a stats object.
 */
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
 * - keys: array of { label, key, color? } describing which series to extract
 *
 * Returns: [{ label, series:[{t,v}], color? }]
 */
export default function useKpiSeries(stats, keys = [
  { label: "Cadence", key: "cadence" },
  { label: "Throughput / wk", key: "throughputPerWeek" },
  { label: "Active Days", key: "activeDays" },
  { label: "On-time %", key: "onTimeCompletion" },
]) {
  return useMemo(() => {
    if (!stats) return [];
    return keys
      .map(({ label, key, color }) => {
        const series = pickSeries(stats, key);
        return series.length ? { label, series, color } : null;
      })
      .filter(Boolean);
  }, [stats, keys]);
}
