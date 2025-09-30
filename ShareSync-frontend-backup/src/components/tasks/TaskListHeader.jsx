import React from "react";

/**
 * TaskListHeader
 * Compact header with a schedule-state filter.
 *
 * Props:
 *  - value?: 'all'|'early'|'on_time'|'late'|'at_risk'
 *  - onChange?: (next) => void
 */
export default function TaskListHeader({ value = "all", onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tasks</h3>
      <div className="inline-flex items-center gap-2">
        <label htmlFor="state-filter" className="text-xs text-slate-600 dark:text-slate-400">
          Schedule
        </label>
        <select
          id="state-filter"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1"
        >
          <option value="all">All</option>
          <option value="early">Early</option>
          <option value="on_time">On-time</option>
          <option value="late">Late</option>
          <option value="at_risk">At risk</option>
        </select>
      </div>
    </div>
  );
}
