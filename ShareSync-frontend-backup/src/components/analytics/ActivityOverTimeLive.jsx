import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getUserStats, getProjectStats } from '../../api/stats';
import ConfettiBurst from '../xp/ConfettiBurst';
import useReducedMotion from '../../hooks/useReducedMotion';
import { BRAND_V2 } from '../../config/flags.js';

// very lightweight line chart using <svg> so we don't add deps
function MiniLine({ points = [], width = 640, height = 140, padding = 16 }) {
  if (!points?.length) return <div className="text-sm text-slate-500">No data</div>;

  const ys = points.map(p => (p.tasks || 0) + (p.updates || 0));
  const minY = 0;
  const maxY = Math.max(1, Math.max(...ys));

  const x = (i) =>
    padding + (i / Math.max(1, points.length - 1)) * (width - padding * 2);
  const y = (v) =>
    height - padding - ((v - minY) / Math.max(1, maxY - minY)) * (height - padding * 2);

  const d = ys
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(' ');

  return (
    <svg width="Available" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Activity over time">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/**
 * Props:
 * - projectId?: string | null
 * - range?: number|string (controlled)  // if provided, component won't keep its own state
 * - defaultRange?: '7' | '30' | '90'    // used only when range is uncontrolled
 * - series?: Array<{tasks?:number,updates?:number}> | undefined
 * - onRangeChange?: (next: string) => void
 */
export default function ActivityOverTimeLive({
  projectId = null,
  range: rangeProp,                 // controlled
  defaultRange = '30',              // uncontrolled initial
  series: seriesProp,               // if provided, we render this and SKIP fetching
  onRangeChange,
}) {
  const controlled = rangeProp !== undefined && rangeProp !== null;

  // Uncontrolled internal state (ignored when controlled)
  const [rangeState, setRangeState] = useState(String(defaultRange || '30'));
  const range = String(controlled ? rangeProp : rangeState);

  const prefersReduced = useReducedMotion();
  const [confetti, setConfetti] = useState(false);
  const prevTotalRef = useRef(0);

  const [seriesState, setSeriesState] = useState([]);
  const [loading, setLoading] = useState(!seriesProp); // if series provided, no loading
  const [err, setErr] = useState('');

  // The data we actually show
  const points = useMemo(() => {
    const raw = seriesProp ?? seriesState;
    return Array.isArray(raw) ? raw : [];
  }, [seriesProp, seriesState]);

  // Sum of activity used for simple milestone checks
  const total = useMemo(() => {
    return points.reduce((sum, p) => sum + (p.tasks || 0) + (p.updates || 0), 0);
  }, [points]);

  // Fetch only when we DON'T get series from props
  useEffect(() => {
    if (Array.isArray(seriesProp)) {
      // External series wins; ensure loading false/error clear
      setLoading(false);
      setErr('');
      return;
    }

    let ignore = false;
    setLoading(true);
    setErr('');

    const fetcher = projectId
      ? () => getProjectStats(projectId, { range })
      : () => getUserStats({ range });

    fetcher()
      .then((data) => {
        if (ignore) return;
        // Some backends name this "activitySeries" – handle both defensively
        const list = data?.activitySeries || data?.series || [];
        setSeriesState(Array.isArray(list) ? list : []);
      })
      .catch((e) => !ignore && setErr(e?.message || 'Failed to load activity'))
      .finally(() => !ignore && setLoading(false));

    return () => { ignore = true; };
  }, [projectId, range, seriesProp]);

  // Motion-gated milestone celebration — fires when crossing thresholds
  useEffect(() => {
    if (!BRAND_V2) return;
    if (prefersReduced) return;

    const prev = prevTotalRef.current || 0;
    if (total <= prev) {
      prevTotalRef.current = total;
      return;
    }

    const milestones = [10, 25, 50, 100, 200, 500, 1000];
    const crossed = milestones.some((m) => prev < m && total >= m);
    if (crossed) {
      setConfetti(true);
      const t = setTimeout(() => setConfetti(false), 1200);
      prevTotalRef.current = total;
      return () => clearTimeout(t);
    }

    prevTotalRef.current = total;
  }, [total, prefersReduced]);

  const handleRangeChange = (next) => {
    if (controlled) {
      onRangeChange?.(next);
    } else {
      setRangeState(next);
    }
  };

  return (
    <div className="relative">
      {confetti && (
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <ConfettiBurst />
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <label htmlFor="range" className="text-xs text-slate-500">Range</label>
        <select
          id="range"
          value={range}
          onChange={(e) => handleRangeChange(e.target.value)}
          className="text-sm rounded-lg border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
          aria-label="Activity range"
        >
          <option value="7">7d</option>
          <option value="30">30d</option>
          <option value="90">90d</option>
        </select>
      </div>

      <div className="text-slate-800 dark:text-slate-100">
        {loading ? (
          <div className="h-[160px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : err ? (
          <div className="text-sm text-rose-600">Error: {err}</div>
        ) : (
          <MiniLine points={points} />
        )}
      </div>
    </div>
  );
}
