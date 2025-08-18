// src/components/analytics/KpiRow.jsx
import React from 'react';

function Kpi({ label, value, suffix, help }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        {help ? (
          <span className="text-xs text-slate-400" title={help} aria-label={help}>ⓘ</span>
        ) : null}
      </div>
      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {value}
        {suffix ? <span className="text-slate-400 text-sm ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}

/**
 * Props:
 *  - cadence { value, windowDays }
 *  - onTimeCompletion { value (0..1), windowDays }
 *  - activeDays { value, windowDays }
 *  - throughputPerWeek { value, windowDays }
 */
export default function KpiRow({ cadence, onTimeCompletion, activeDays, throughputPerWeek }) {
  const pct = typeof onTimeCompletion?.value === 'number'
    ? Math.round(onTimeCompletion.value * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <Kpi
        label="Cadence"
        value={cadence?.value ?? 0}
        suffix={`/ ${cadence?.windowDays ?? 14}d`}
        help="Updates + completed tasks, recency-weighted over a rolling 14 days."
      />
      <Kpi
        label="On-time"
        value={`${pct}%`}
        suffix={`/${onTimeCompletion?.windowDays ?? 30}d`}
        help="Share of tasks completed by due date over 30 days."
      />
      <Kpi
        label="Active days"
        value={activeDays?.value ?? 0}
        suffix={`/${activeDays?.windowDays ?? 28}d`}
        help="Days with any activity in the last 28 days."
      />
      <Kpi
        label="Throughput"
        value={throughputPerWeek?.value ?? 0}
        suffix={`/wk`}
        help="Completed tasks per 7-day window."
      />
    </div>
  );
}
