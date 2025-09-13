import React from "react";
import { X, Sparkles, ClipboardList, Megaphone, Play } from "lucide-react";

/**
 * NudgeCard
 * Small, dismissible suggestion block.
 *
 * Props:
 *  - kind: 'update' | 'task' | 'sprint' | 'custom'
 *  - title: string
 *  - message: string
 *  - actions?: Array<{label: string, onClick: () => void}>
 *  - onDismiss?: () => void
 *  - className?
 */
export default function NudgeCard({
  kind = "custom",
  title = "Quick nudge",
  message = "",
  actions = [],
  onDismiss,
  className = "",
}) {
  const Icon = kind === "task" ? ClipboardList
    : kind === "update" ? Megaphone
    : kind === "sprint" ? Play
    : Sparkles;

  return (
    <aside
      className={`rounded-xl border border-border bg-surface p-3 flex items-start gap-3 ${className}`}
      role="note"
    >
      <div className="shrink-0 h-8 w-8 grid place-items-center rounded-lg bg-grad-emerald/10 text-emerald-600">
        <Icon className="w-4 h-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-text">{title}</div>
        {message ? <p className="text-xs text-muted mt-0.5">{message}</p> : null}

        {actions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {actions.map((a, i) => (
              <button
                key={`${a.label}-${i}`}
                onClick={a.onClick}
                className="text-xs rounded-lg px-2.5 py-1.5 border border-border hover:bg-surface/70"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-md hover:bg-surface/70"
        aria-label="Dismiss nudge"
      >
        <X className="w-4 h-4 text-muted" />
      </button>
    </aside>
  );
}
