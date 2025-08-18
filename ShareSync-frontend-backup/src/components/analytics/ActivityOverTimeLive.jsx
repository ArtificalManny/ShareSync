// /src/components/analytics/ActivityOverTimeLive.jsx
import React, { useEffect, useState } from 'react';
import { getUserStats, getProjectStats } from '../../api/stats';

// very lightweight line chart using <svg> so we don't add deps
function MiniLine({ points = [], width = 640, height = 140, padding = 16 }) {
  if (!points.length) return <div className="text-sm text-slate-500">No data</div>;

  const xs = points.map((_, i) => i);
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
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Activity over time">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function ActivityOverTimeLive({
  projectId = null,         // if provided → project scoped
  defaultRange = '30',      // '7' | '30' | '90'
}) {
  const [range, setRange] = useState(String(defaultRange || '30'));
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
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
        setSeries(Array.isArray(list) ? list : []);
      })
      .catch((e) => !ignore && setErr(e?.message || 'Failed to load activity'))
      .finally(() => !ignore && setLoading(false));

    return () => { ignore = true; };
  }, [projectId, range]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label htmlFor="range" className="text-xs text-slate-500">Range</label>
        <select
          id="range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="text-sm rounded-lg border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
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
          <MiniLine points={series} />
        )}
      </div>
    </div>
  );
}