// /src/components/analytics/ActivityLineGraph.jsx
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

/**
 * Props:
 *  - data: [{ date: '2025-08-01', value: 3 }, ...]
 *  - title?: string
 *  - yLabel?: string
 */
export default function ActivityLineGraph({ data = [], title = 'Activity Over Time', yLabel = 'Tasks' }) {
  // Coerce safe, sorted data
  const safe = Array.isArray(data)
    ? [...data]
        .map(d => ({
          date: d.date || d.day || d.ts || d._id || '',
          value: Number(d.value ?? d.count ?? d.xp ?? 0),
        }))
        .filter(d => d.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={safe} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => {
                try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
                catch { return d; }
              }}
              tick={{ fontSize: 12 }}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 8 }}
            />
            <Tooltip
              formatter={(v) => [v, yLabel]}
              labelFormatter={(l) => {
                try { return new Date(l).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
                catch { return l; }
              }}
            />
            <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
