// src/components/states/LoadingState.jsx
import React from "react";

/**
 * LoadingState
 * - Minimal skeleton/placeholder for list/panel loads.
 * - Accessible: role="status" + aria-busy + offscreen label.
 *
 * Props:
 *  - label?: string     // screen-reader text
 *  - lines?: number     // skeleton rows
 *  - className?: string
 */
export default function LoadingState({ label = "Loading…", lines = 3, className = "" }) {
  const safe = Math.max(1, Math.min(10, Number(lines) || 3));
  return (
    <div
      role="status"
      aria-busy="true"
      className={[
        "rounded-2xl border border-border bg-surface p-4",
        "animate-pulse text-sm",
        className,
      ].join(" ")}
    >
      <span className="sr-only">{label}</span>
      <div className="space-y-2">
        {Array.from({ length: safe }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-slate-200/70 dark:bg-slate-700/60"
            style={{ width: `${80 - i * 6}%` }}
          />
        ))}
      </div>
    </div>
  );
}
