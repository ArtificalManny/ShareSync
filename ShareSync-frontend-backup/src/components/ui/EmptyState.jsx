// src/components/ui/EmptyState.jsx
import React from "react";
import { cn } from "./cn";

export default function EmptyState({
  icon = "Sparkles",
  title = "",
  children = null,
  primary = null,
  secondary = null,
  className = "",
}) {
  return (
    <div
      className={cn(
        "glass rounded-2xl border border-border bg-surface/50 p-6 text-center",
        "flex flex-col items-center justify-center gap-3",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="text-4xl" aria-hidden>{icon}</div>
      {title && <div className="text-lg font-semibold">{title}</div>}
      {children && <div className="text-sm text-muted max-w-sm mx-auto">{children}</div>}
      <div className="mt-2 flex items-center gap-3">
        {primary && (
          <button
            type="button"
            onClick={primary.onClick}
            className="btn btn--primary"
          >
            {primary.label}
          </button>
        )}
        {secondary && (
          <button
            type="button"
            onClick={secondary.onClick}
            className="btn btn--outline"
          >
            {secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}