import React from "react";
import { Clock } from "lucide-react";
import { fmtDateLabel } from "../../utils/formatters";

/**
 * PublicActivitySummary
 *
 * Props:
 *  - items: Array<{ type?: string, text?: string, createdAt?: string }>
 *  - max?: number (default 8)
 *  - emptyText?: string
 */
export default function PublicActivitySummary({
  items = [],
  max = 8,
  emptyText = "No recent public activity.",
}) {
  const list = (Array.isArray(items) ? items : []).slice(0, max);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-semibold text-text">Recent public activity</h3>
      </div>

      {list.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200/70 dark:divide-slate-800">
          {list.map((ev, i) => (
            <li key={i} className="py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-text truncate">
                    {ev.text || ev.title || ev.type || "Update"}
                  </div>
                  {ev.type && (
                    <div className="mt-0.5 text-[11px] text-muted uppercase tracking-wide">
                      {ev.type}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-xs text-muted">
                  {ev.createdAt ? fmtDateLabel(ev.createdAt) : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
