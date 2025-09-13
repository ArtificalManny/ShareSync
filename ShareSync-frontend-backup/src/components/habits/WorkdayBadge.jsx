import React from "react";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/**
 * WorkdayBadge
 * Shows configured workdays/hours.
 *
 * Props:
 *  - workdays: number[] (0..6)
 *  - hours: { start: "HH:MM", end: "HH:MM" } (optional)
 *  - className?
 */
export default function WorkdayBadge({ workdays = [1,2,3,4,5], hours = null, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1 ${className}`}>
      <div className="flex items-center gap-1">
        {DAYS.map((d, i) => {
          const on = workdays.includes(i);
          return (
            <span
              key={d}
              className={[
                "text-[10px] px-1.5 py-0.5 rounded-md border",
                on
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-transparent text-muted border-transparent"
              ].join(" ")}
              aria-pressed={on}
              title={d}
            >
              {d[0]}
            </span>
          );
        })}
      </div>
      {hours && (
        <span className="text-[11px] text-muted">• {hours.start}–{hours.end}</span>
      )}
    </div>
  );
}
