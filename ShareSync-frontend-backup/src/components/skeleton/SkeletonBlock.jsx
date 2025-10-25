import React from "react";

// Glassy rounded skeleton block
export default function SkeletonBlock({
  height = 96,
  radius = 16,
  repeat = 1,
  className = "",
}) {
  const items = Array.from({ length: repeat });
  return (
    <div className={`grid gap-3 ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="animate-pulse border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/50 backdrop-blur rounded"
          style={{ height, borderRadius: radius }}
        />
      ))}
    </div>
  );
}