from pathlib import Path
import sys

ROOT = Path.cwd()
TREND_CHARTS = ROOT / "src/components/growth/TrendCharts.jsx"

TREND_CHARTS_CODE = """// src/components/growth/TrendCharts.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Historical Trend Charts
// Premium visual polish for Profile growth analytics
// Backend-aligned shape: velocity, quality, collaboration, overall, summary, meta
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Users, Star } from 'lucide-react';

const METRIC_CONFIG = {
  velocity: {
    label: 'Velocity',
    color: '#8B5CF6',
    soft: 'rgba(139, 92, 246, 0.12)',
    glow: 'rgba(139, 92, 246, 0.18)',
    icon: Zap,
    description: 'Shipping pace and completed work volume.',
  },
  quality: {
    label: 'Quality',
    color: '#10B981',
    soft: 'rgba(16, 185, 129, 0.12)',
    glow: 'rgba(16, 185, 129, 0.18)',
    icon: Star,
    description: 'Priority impact and completion quality.',
  },
  collaboration: {
    label: 'Collaboration',
    color: '#06B6D4',
    soft: 'rgba(6, 182, 212, 0.12)',
    glow: 'rgba(6, 182, 212, 0.18)',
    icon: Users,
    description: 'Shared work, comments, discussions, and team interaction.',
  },
  overall: {
    label: 'Overall',
    color: '#F59E0B',
    soft: 'rgba(245, 158, 11, 0.14)',
    glow: 'rgba(245, 158, 11, 0.2)',
    icon: Activity,
    description: 'Weighted blend of velocity, quality, and collaboration.',
  },
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
  const value = Number(trends?.summary?.[`${metric}Growth`] || 0);
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function getLatestValue(data, metric) {
  if (!Array.isArray(data) || data.length === 0) return 0;
  return clampNumber(data[data.length - 1]?.[metric]);
}

function buildPath(data, dataKey, height = 60) {
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
}

function MiniChart({ data, dataKey, color, height = 64, showGrid = false }) {
  const points = useMemo(() => buildPath(data, dataKey, height), [data, dataKey, height]);

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
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
      {showGrid && (
        <>
          <line x1="0" y1={height * 0.25} x2="100" y2={height * 0.25} stroke="currentColor" strokeWidth="0.2" className="text-slate-300/80 dark:text-white/10" />
          <line x1="0" y1={height * 0.5} x2="100" y2={height * 0.5} stroke="currentColor" strokeWidth="0.2" className="text-slate-300/80 dark:text-white/10" />
          <line x1="0" y1={height * 0.75} x2="100" y2={height * 0.75} stroke="currentColor" strokeWidth="0.2" className="text-slate-300/80 dark:text-white/10" />
        </>
      )}

      <path d={areaPath} fill={`${color}14`} />
      <path
        d={points}
        fill="none"
        stroke={`${color}22`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GrowthBadge({ growth }) {
  const isPositive = growth > 0;
  const isNeutral = growth === 0;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400">
        Stable
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold
        ${isPositive
          ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
          : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
        }
      `}
    >
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{growth}%
    </span>
  );
}

function MetricCard({ metric, data, growth }) {
  const config = METRIC_CONFIG[metric] || METRIC_CONFIG.overall;
  const Icon = config.icon;
  const latestValue = getLatestValue(data, metric);

  return (
    <div
      className="
        group relative overflow-hidden rounded-[1.35rem]
        border border-slate-200/80 bg-white/90
        p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]
        transition-all duration-200
        hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]
        dark:border-white/[0.07] dark:bg-[#18181b]/95 dark:shadow-black/25 dark:hover:border-white/[0.12]
      "
    >
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full blur-3xl transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundColor: config.glow, opacity: 0.55 }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
            style={{ backgroundColor: config.soft }}
          >
            <Icon className="h-4.5 w-4.5" style={{ color: config.color }} />
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-400">
              {config.label}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500">
              {metric === 'overall' ? 'Composite signal' : 'Profile signal'}
            </p>
          </div>
        </div>

        <GrowthBadge growth={growth} />
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              {latestValue}
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-slate-300 dark:text-zinc-600">
              / 100
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-zinc-500">
            {config.description}
          </p>
        </div>
      </div>

      <div className="relative mt-5 h-16 rounded-2xl bg-slate-50/80 px-2 py-2 dark:bg-white/[0.03]">
        <MiniChart data={data} dataKey={metric} color={config.color} height={56} />
      </div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center dark:border-white/[0.12] dark:bg-white/[0.03]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
        <Activity className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
        Growth trends are still warming up.
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-zinc-400">
        Complete tasks, create updates, and collaborate with teammates to build a richer performance history.
      </p>
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
  const selectedConfig = METRIC_CONFIG[selectedMetric] || METRIC_CONFIG.overall;
  const SelectedIcon = selectedConfig.icon;
  const selectedLatest = getLatestValue(normalizedData, selectedMetric);
  const selectedGrowth = getMetricGrowth(trends, selectedMetric);

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-56 rounded-[1.35rem] border border-slate-200/80 bg-white/80 p-5 shadow-sm animate-pulse dark:border-white/[0.06] dark:bg-[#18181b]">
              <div className="h-9 w-28 rounded-xl bg-slate-100 dark:bg-zinc-800" />
              <div className="mt-6 h-10 w-20 rounded-xl bg-slate-100 dark:bg-zinc-800" />
              <div className="mt-8 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!trends || !Array.isArray(trends.data)) return null;

  return (
    <div className={className}>
      <div className="mb-6 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-lg font-black uppercase tracking-[0.18em] text-slate-900 dark:text-white">
              Growth Trends
            </h3>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            Last {weeksLabel} weeks of measurable profile performance.
          </p>
        </div>

        <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400">
          Live analytics
        </span>
      </div>

      {normalizedData.length === 0 ? (
        <EmptyChartState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {METRICS.map((metric) => (
              <MetricCard
                key={metric}
                metric={metric}
                data={normalizedData}
                growth={getMetricGrowth(trends, metric)}
              />
            ))}
          </div>

          <div
            className="
              mt-7 overflow-hidden rounded-[1.75rem]
              border border-slate-200/80 bg-white/90
              shadow-[0_18px_60px_rgba(15,23,42,0.07)]
              dark:border-white/[0.07] dark:bg-[#18181b]/95 dark:shadow-black/30
            "
          >
            <div className="flex flex-col gap-5 border-b border-slate-200/70 px-6 py-5 dark:border-white/[0.06] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: selectedConfig.soft }}
                >
                  <SelectedIcon className="h-5 w-5" style={{ color: selectedConfig.color }} />
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">
                    Trend Comparison
                  </p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">
                    {selectedConfig.label} over time
                  </h3>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                    {selectedConfig.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                  <span className="text-slate-400 dark:text-zinc-500">Current </span>
                  <span className="font-black text-slate-950 dark:text-white">{selectedLatest}/100</span>
                  <span className="mx-2 text-slate-300 dark:text-zinc-700">•</span>
                  <span className={selectedGrowth >= 0 ? 'font-bold text-teal-600 dark:text-teal-300' : 'font-bold text-red-500 dark:text-red-300'}>
                    {selectedGrowth >= 0 ? '+' : ''}{selectedGrowth}%
                  </span>
                </div>

                <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-inner dark:border-white/[0.08] dark:bg-[#111113]">
                  {METRICS.map((metric) => {
                    const config = METRIC_CONFIG[metric] || METRIC_CONFIG.overall;
                    const isSelected = selectedMetric === metric;

                    return (
                      <button
                        key={metric}
                        type="button"
                        onClick={() => setSelectedMetric(metric)}
                        className={`
                          rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em]
                          transition-all duration-200
                          ${isSelected
                            ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-800 dark:text-white dark:ring-white/[0.08]'
                            : 'text-slate-500 hover:bg-white/70 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-200'
                          }
                        `}
                        style={isSelected ? { color: config.color } : undefined}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              <div className="relative h-72 rounded-[1.25rem] bg-gradient-to-b from-slate-50 to-white px-3 py-4 dark:from-white/[0.035] dark:to-transparent">
                <MiniChart
                  data={normalizedData}
                  dataKey={selectedMetric}
                  color={selectedConfig.color}
                  height={260}
                  showGrid
                />
              </div>

              <div className="mt-4 flex justify-between px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-600">
                {normalizedData.map((point, index) => {
                  const interval = Math.max(1, Math.ceil(normalizedData.length / 6));
                  const shouldShow = index % interval === 0 || index === normalizedData.length - 1;

                  return (
                    <span
                      key={`${point.label}-${index}`}
                      className={shouldShow ? 'opacity-100' : 'opacity-0 md:opacity-35'}
                    >
                      {point.weekLabel || point.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
"""

def fail(message):
    print(f"\\n[polish_trend_charts_visuals] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[polish_trend_charts_visuals] starting")

    if not TREND_CHARTS.exists():
        fail(f"Could not find {TREND_CHARTS}")

    original = TREND_CHARTS.read_text(encoding="utf-8")

    required_markers = [
        "export default function TrendCharts",
        "function MiniChart",
        "function MetricCard",
        "METRIC_CONFIG",
        "normalizeTrendData",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "Premium visual polish" in original and "Live analytics" in original:
        print("[polish_trend_charts_visuals] TrendCharts already appears visually polished")
        return

    backup = TREND_CHARTS.with_suffix(TREND_CHARTS.suffix + ".bak-visual-polish")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[polish_trend_charts_visuals] backup created: {backup}")

    TREND_CHARTS.write_text(TREND_CHARTS_CODE, encoding="utf-8")
    print(f"[polish_trend_charts_visuals] patched: {TREND_CHARTS}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Premium visual polish|Live analytics|GrowthBadge|EmptyChartState|showGrid|Trend Comparison|Current\" src/components/growth/TrendCharts.jsx")
    print("  git diff -- src/components/growth/TrendCharts.jsx")

if __name__ == "__main__":
    main()
