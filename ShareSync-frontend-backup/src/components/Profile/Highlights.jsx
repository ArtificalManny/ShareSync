import React from "react";
import {
  CheckCircle2,
  Flag,
  Trophy,
  ClipboardCheck,
} from "lucide-react";

/**
 * Highlights
 * Props:
 *  - items: Array<{ type?: 'task'|'milestone'|'sprint'|string, title?: string, date?: string|number|Date, meta?: string, href?: string }>
 *  - emptyMessage?: string
 *  - className?: string
 */
export default function Highlights({
  items = [],
  emptyMessage = "No highlights yet.",
  className = "",
}) {
  const iconFor = (type) => {
    switch (type) {
      case "task":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "milestone":
        return <Flag className="w-4 h-4 text-indigo-600" />;
      case "sprint":
        return <Trophy className="w-4 h-4 text-amber-500" />;
      default:
        return <ClipboardCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className={["profile-card", className].filter(Boolean).join(" ")}>
      <div className="text-xs text-muted">Recent highlights</div>
      {items.length === 0 ? (
        <div className="mt-2 text-sm text-muted">{emptyMessage}</div>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((it, idx) => {
            const icon = iconFor(it?.type);
            const dt = it?.date ? new Date(it.date) : null;
            const when = dt ? dt.toLocaleDateString() : "";
            const content = (
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {it?.title || it?.type || "Highlight"}
                  </div>
                  <div className="text-[11px] text-muted">
                    {[when, it?.meta].filter(Boolean).join(" • ")}
                  </div>
                </div>
              </div>
            );
            return (
              <li
                key={idx}
                className="rounded-lg border border-border bg-surface px-3 py-2"
              >
                {it?.href ? (
                  <a href={it.href} className="no-underline hover:underline">
                    {content}
                  </a>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
