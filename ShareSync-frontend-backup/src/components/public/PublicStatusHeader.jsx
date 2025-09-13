import React from "react";
import GradientText from "../ui/GradientText";
import AnimatedRing from "../ui/AnimatedRing";

/**
 * PublicStatusHeader
 *
 * Props:
 *  - project: { title|name, icon?: {kind:'emoji'|'svg', value:string} }
 *  - updatedAt?: string|Date
 */
function SVGIcon({ name, className = "w-6 h-6" }) {
  const common = { className, "aria-hidden": true };
  switch (name) {
    case "rocket":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 2c3 0 6 2 8 4l-6 6-2-2-6 6-2-2 6-6-2-2 6-6z" fill="currentColor" />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M13 2L3 14h7l-1 8 11-12h-7l0-8z" fill="currentColor" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
      );
    default:
      return <div className={className} />;
  }
}

export default function PublicStatusHeader({ project = {}, updatedAt }) {
  const title = project?.title || project?.name || "Project";
  const icon = project?.icon;

  const updated =
    updatedAt
      ? new Date(updatedAt).toLocaleString()
      : null;

  return (
    <header className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <AnimatedRing size="48px" thickness="2px" animated>
          <div className="h-8 w-8 rounded-lg grid place-content-center bg-slate-100 dark:bg-slate-800 text-xl">
            {icon?.kind === "emoji" && <span role="img" aria-label="icon">{icon.value}</span>}
            {icon?.kind === "svg" && (
              <span className="text-indigo-600">
                <SVGIcon name={icon.value} className="w-5 h-5" />
              </span>
            )}
            {!icon && (
              <span className="text-indigo-600">
                <SVGIcon name="target" className="w-5 h-5" />
              </span>
            )}
          </div>
        </AnimatedRing>

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold truncate">
            <GradientText variant="blue">{title}</GradientText>
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
              Public
            </span>
            {updated && (
              <span className="text-xs text-muted">Last updated {updated}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
