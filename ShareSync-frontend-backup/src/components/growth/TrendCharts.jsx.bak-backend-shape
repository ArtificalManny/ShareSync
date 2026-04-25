// src/components/growth/TrendCharts.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Historical Trend Charts (High Contrast Responsive)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Users, Star } from 'lucide-react';

const METRIC_CONFIG = {
  velocity: { label: 'Velocity', color: '#8B5CF6', icon: Zap }, // Violet
  quality: { label: 'Quality', color: '#10B981', icon: Star },   // Emerald
  collaboration: { label: 'Collaboration', color: '#06B6D4', icon: Users }, // Cyan
  overall: { label: 'Overall', color: '#F59E0B', icon: Activity }, // Amber
};

function MiniChart({ data, dataKey, color, height = 60 }) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return '';

    const values = data.map(d => d[dataKey] || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const width = 100 / (data.length - 1);

    return values.map((v, i) => {
      const x = i * width;
      const y = height - ((v - min) / range) * (height - 10) - 5;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [data, dataKey, height]);

  const areaPath = useMemo(() => {
    if (!points) return '';
    const width = 100;
    return `${points} L ${width} ${height} L 0 ${height} Z`;
  }, [points, height]);

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-full drop-shadow-sm">
      {/* Area */}
      <path
        d={areaPath}
        fill={`${color}15`}
      />
      {/* Line */}
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({ metric, data, growth }) {
  const config = METRIC_CONFIG[metric] || METRIC_CONFIG.overall;
  const Icon = config.icon;
  const latestValue = data?.[data.length - 1]?.[metric] || 0;
  const isPositive = growth >= 0;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: `${config.color}15` }}>
            <Icon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400">{config.label}</span>
        </div>
        <span className={`
          flex items-center gap-1 text-xs font-black tracking-wider px-2 py-1 rounded-md
          ${isPositive ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}
        `}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{growth}%
        </span>
      </div>

      {/* Value */}
      <div className="mb-4 flex items-baseline gap-1.5">
        <span className="text-4xl font-black text-slate-900 dark:text-white">{latestValue}</span>
        <span className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">/ 100</span>
      </div>

      {/* Chart */}
      <div className="h-16 mt-2">
        <MiniChart data={data} dataKey={metric} color={config.color} />
      </div>
    </div>
  );
}

export default function TrendCharts({
  trends,
  loading,
  className = '',
}) {
  const [selectedMetric, setSelectedMetric] = useState('overall');

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 animate-pulse">
              <div className="h-4 w-20 bg-slate-100 dark:bg-zinc-800 rounded mb-4" />
              <div className="h-8 w-16 bg-slate-100 dark:bg-zinc-800 rounded mb-4" />
              <div className="h-16 bg-slate-100 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!trends?.data) return null;

  const metrics = ['velocity', 'quality', 'collaboration', 'overall'];

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white">Growth Trends</h3>
          <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
            Last {trends.weeks} Weeks
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-8">
        {metrics.map(metric => (
          <MetricCard
            key={metric}
            metric={metric}
            data={trends.data}
            growth={trends.summary?.[`${metric}Growth`] || 0}
          />
        ))}
      </div>

      {/* Combined Chart */}
      <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">Trend Comparison</span>
          <div className="flex gap-2 bg-slate-50 dark:bg-[#111113] p-1.5 rounded-lg border border-slate-200 dark:border-white/5">
            {metrics.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={`
                  px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                  ${selectedMetric === m
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/10'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Large Chart */}
        <div className="h-56 mt-4">
          <MiniChart
            data={trends.data}
            dataKey={selectedMetric}
            color={METRIC_CONFIG[selectedMetric]?.color || '#8B5CF6'}
            height={224}
          />
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 px-1">
          {trends.data.map((d, i) => (
            // Only show every other label if it gets too crowded, or just slice nicely
            <span key={i} className={i % Math.ceil(trends.data.length/6) === 0 ? "opacity-100" : "opacity-0 md:opacity-100"}>
              {d.weekLabel}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
