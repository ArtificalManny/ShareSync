import React from "react";

/**
 * PageHeader - Elite Refinement
 * Updated with tighter tracking and high-contrast metadata hierarchy.
 */
export default function PageHeader({
  title,
  subtitle = null,
  icon = null,
  actions = null,
  className = "",
}) {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {icon && <span className="text-2xl" aria-hidden>{icon}</span>}
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] leading-none">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0 mb-1">
          {actions}
        </div>
      )}
    </div>
  );
}
