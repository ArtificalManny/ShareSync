from pathlib import Path
import sys

ROOT = Path.cwd()
TREND_CHARTS = ROOT / "src/components/growth/TrendCharts.jsx"

TREND_CHARTS_CODE = """// src/components/growth/TrendCharts.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Historical Trend Charts
// Backend-aligned shape: velocity, quality, collaboration, overall, summary, meta
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Users, Star } from 'lucide-react';

const METRIC_CONFIG = {
  velocity: { label: 'Velocity', color: '#8B5CF6', icon: Zap },
  quality: { label: 'Quality', color: '#10B981', icon: Star },
  collaboration: { label: 'Collaboration', color: '#06B6D4', icon: Users },
  overall: { label: 'Overall', color: '#F59E0B', icon: Activity },
};

const METRICS = ['velocity', 'quality', 'collaboration', 'overall'];

function clampNumber(value) {
  const next = Number(value || 0);

  if (!Number.isFinite(next)) return 0;

  return Math.max(0, Math.min(100, Math.round(next)));
}

function normalizeTrendPoint(point = {}, index = 0) {
  const velocity = clampNumber(point.velocity);
  const quality = clampNumber(point.quality);
  const collaboration = clampNumber(point.collaboration);
  const suppliedOverall = Number(point.overall);
  const fallbackOverall = Math.round((velocity * 0.4) + (quality * 0.3) + (collaboration * 0.3));

  return {
    ...point,
    velocity,
    quality,
    collaboration,
    overall: Number.isFinite(suppliedOverall) ? clampNumber(suppliedOverall) : clampNumber(fallbackOverall),
    label: point.label || point.weekLabel || point.week || point.date || `Week ${index + 1}`,
    weekLabel: point.weekLabel || point.label || point.week || `Week ${index + 1}`,
  };
}

function normalizeTrendData(trends) {
  if (!trends || !Array.isArray(trends.data)) return [];

  return trends.data.map(normalizeTrendPoint);
}

function getWeeksLabel(trends, data) {
  return (
    trends?.meta?.weeks ||
    trends?.weeks ||
    data?.length ||
    12
  );
}

function getMetricGrowth(trends, metric) {
  return Number(trends?.summary?.[`${metric}Growth`] || 0);
}

function MiniChart({ data, dataKey, color, height = 60 }) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return '';

    const values = data.map((d) => clampNumber(d[dataKey]));

    if (values.length === 1) {
      const y = height - ((values[0] / 100) * (height - 10)) - 5;
      return `M 0 ${y} L 100 ${y}`;
    }

    const max = Math.max(...values, 100);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const step = 100 / Math.max(data.length - 1, 1);

    return values.map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * (height - 10) - 5;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [data, dataKey, height]);

  const areaPath = useMemo(() => {
    if (!points) return '';
    return `${points} L 100 ${height} L 0 ${height} Z`;
  }, [points, height]);

  if (!points) {
    return (
      <div className="h-full w-full rounded-xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
          No data yet
        </span>
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-full drop-shadow-sm">
      <path d={areaPath} fill={`${color}18`} />
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
  const latestValue = data?.[data.length - 1]?.[metric] ?? 0;
  const isPositive = growth >= 0;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: `${config.color}15` }}>
            <Icon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400">
            {config.label}
          </span>
        </div>

        <span
          className={`
            flex items-center gap-1 text-xs font-black tracking-wider px-2 py-1 rounded-md
            ${isPositive
              ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
              : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
            }
          `}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{growth}%
        </span>
      </div>

      <div className="mb-4 flex items-baseline gap-1.5">
        <span className="text-4xl font-black text-slate-900 dark:text-white">
          {clampNumber(latestValue)}
        </span>
        <span className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
          / 100
        </span>
      </div>

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

  const normalizedData = useMemo(() => normalizeTrendData(trends), [trends]);
  const weeksLabel = getWeeksLabel(trends, normalizedData);

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 animate-pulse">
              <div className="h-4 w-20 bg-slate-100 dark:bg-zinc-800 rounded mb-4" />
              <div className="h-8 w-16 bg-slate-100 dark:bg-zinc-800 rounded mb-4" />
              <div className="h-16 bg-slate-100 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!trends || !Array.isArray(trends.data)) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
            Growth Trends
          </h3>
          <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
            Last {weeksLabel} Weeks
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-8">
        {METRICS.map((metric) => (
          <MetricCard
            key={metric}
            metric={metric}
            data={normalizedData}
            growth={getMetricGrowth(trends, metric)}
          />
        ))}
      </div>

      <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-8">
          <span className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">
            Trend Comparison
          </span>

          <div className="flex gap-2 bg-slate-50 dark:bg-[#111113] p-1.5 rounded-lg border border-slate-200 dark:border-white/5">
            {METRICS.map((metric) => (
              <button
                key={metric}
                type="button"
                onClick={() => setSelectedMetric(metric)}
                className={`
                  px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                  ${selectedMetric === metric
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/10'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                {METRIC_CONFIG[metric]?.label || metric}
              </button>
            ))}
          </div>
        </div>

        <div className="h-56 mt-4">
          <MiniChart
            data={normalizedData}
            dataKey={selectedMetric}
            color={METRIC_CONFIG[selectedMetric]?.color || '#8B5CF6'}
            height={224}
          />
        </div>

        <div className="flex justify-between mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 px-1">
          {normalizedData.map((point, index) => {
            const interval = Math.max(1, Math.ceil(normalizedData.length / 6));
            const shouldShow = index % interval === 0 || index === normalizedData.length - 1;

            return (
              <span key={`${point.label}-${index}`} className={shouldShow ? 'opacity-100' : 'opacity-0 md:opacity-40'}>
                {point.weekLabel || point.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
"""

def fail(message):
    print(f"\\n[patch_trend_charts_backend_shape] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_trend_charts_backend_shape] starting")

    if not TREND_CHARTS.exists():
        fail(f"Could not find {TREND_CHARTS}")

    original = TREND_CHARTS.read_text(encoding="utf-8")

    required_markers = [
        "export default function TrendCharts",
        "function MiniChart",
        "function MetricCard",
        "METRIC_CONFIG",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "normalizeTrendPoint" in original and "trends?.meta?.weeks" in original:
        print("[patch_trend_charts_backend_shape] TrendCharts already appears backend-shape aligned")
        return

    backup = TREND_CHARTS.with_suffix(TREND_CHARTS.suffix + ".bak-backend-shape")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_trend_charts_backend_shape] backup created: {backup}")

    TREND_CHARTS.write_text(TREND_CHARTS_CODE, encoding="utf-8")
    print(f"[patch_trend_charts_backend_shape] patched: {TREND_CHARTS}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"normalizeTrendPoint|trends\\?\\.meta\\?\\.weeks|weekLabel|overall|METRICS|No data yet\" src/components/growth/TrendCharts.jsx")
    print("  git diff -- src/components/growth/TrendCharts.jsx")

if __name__ == "__main__":
    main()
