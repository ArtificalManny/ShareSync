// src/components/growth/TrendCharts.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Historical Trend Charts
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Users, Star } from 'lucide-react';

const METRIC_CONFIG = {
  velocity: { label: 'Velocity', color: '#7C3AED', icon: Zap },
  quality: { label: 'Quality', color: '#10B981', icon: Star },
  collaboration: { label: 'Collaboration', color: '#06B6D4', icon: Users },
  overall: { label: 'Overall', color: '#F59E0B', icon: Activity },
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
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-full">
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
        strokeWidth="2"
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
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: config.color }} />
          <span className="text-sm font-medium text-text-secondary">{config.label}</span>
        </div>
        <span className={`
          flex items-center gap-1 text-xs font-medium
          ${isPositive ? 'text-success' : 'text-error-500'}
        `}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{growth}%
        </span>
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className="text-3xl font-bold text-text-primary">{latestValue}</span>
        <span className="text-sm text-text-tertiary ml-1">/ 100</span>
      </div>

      {/* Chart */}
      <div className="h-16">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 rounded-xl bg-surface-1 border border-white/[0.06] animate-pulse">
              <div className="h-4 w-20 bg-surface-2 rounded mb-3" />
              <div className="h-8 w-16 bg-surface-2 rounded mb-3" />
              <div className="h-16 bg-surface-2 rounded" />
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand" />
          <h3 className="font-semibold text-text-primary">Growth Trends</h3>
          <span className="text-xs text-text-tertiary">Last {trends.weeks} weeks</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text-secondary">Trend Comparison</span>
          <div className="flex gap-2">
            {metrics.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={`
                  px-2 py-1 rounded text-xs capitalize
                  ${selectedMetric === m
                    ? 'bg-brand/10 text-brand'
                    : 'text-text-tertiary hover:text-text-secondary'
                  }
                  transition-colors
                `}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Large Chart */}
        <div className="h-48">
          <MiniChart
            data={trends.data}
            dataKey={selectedMetric}
            color={METRIC_CONFIG[selectedMetric]?.color || '#7C3AED'}
            height={192}
          />
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-[10px] text-text-tertiary">
          {trends.data.slice(0, 6).map((d, i) => (
            <span key={i}>{d.weekLabel}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
