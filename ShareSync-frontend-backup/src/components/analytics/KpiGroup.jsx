import React from "react";
import KpiChart from "./KpiChart";

/**
 * KpiGroup
 * Responsive grid of small KPI trend charts with staggered fade-in
 * (disabled automatically under prefers-reduced-motion).
 *
 * Props:
 *  - data: Array<{ label: string, series: Array<{t, v}>, color?: string, gradientVariant?: string }>
 *  - height?: number
 *  - showLegend?: boolean
 */
export default function KpiGroup({ data = [], height = 160, showLegend = false }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        No KPI series yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {data.map((k, idx) => (
        <div
          key={`${k.label}-${idx}`}
          // Staggered delay – motion.css disables animation via media query
          style={{ animationDelay: `${Math.min(idx, 6) * 70}ms` }}
          className="chart-fade-in"
        >
          <KpiChart
            title={k.label}
            series={k.series}
            color={k.color}
            gradientVariant={k.gradientVariant}
            height={height}
            showLegend={showLegend}
          />
        </div>
      ))}
    </div>
  );
}
