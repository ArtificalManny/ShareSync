import React from "react";

/**
 * SprintChip
 * Props:
 *  - label: string
 *  - active?: boolean (adds marquee/shine)
 *  - onClick?: () => void
 *  - className?: string
 */
export default function SprintChip({ label, active = false, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        "border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900",
        "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
        active ? "bg-grad-purple text-white border-transparent" : "text-slate-700 dark:text-slate-300",
        className,
      ].join(" ")}
      aria-pressed={active}
      title={active ? "Active sprint" : "Sprint"}
    >
      <span>{label}</span>

      {/* Shine/marquee overlay (defined in motion.css) */}
      {active && <span className="sprint-marquee" aria-hidden="true" />}
    </button>
  );
}
