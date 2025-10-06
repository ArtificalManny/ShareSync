import React from "react";
import { cn } from "./cn";

export default function EmptyState({
  icon = "✨",
  title = "",
  children = null,
  primary = null,   // { label, onClick }
  secondary = null, // { label, onClick }
  className = "",
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 text-center",
        "flex flex-col items-center justify-center gap-2",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="text-2xl" aria-hidden>{icon}</div>
      {title && <div className="text-sm font-semibold">{title}</div>}
      {children && <div className="text-xs text-muted">{children}</div>}
      <div className="mt-1 flex items-center gap-2">
        {primary && (
          <button
            type="button"
            onClick={primary.onClick}
            className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus-visible:shadow-focus"
          >
            {primary.label}
          </button>
        )}
        {secondary && (
          <button
            type="button"
            onClick={secondary.onClick}
            className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm border border-border bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 focus:outline-none focus-visible:shadow-focus"
          >
            {secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}