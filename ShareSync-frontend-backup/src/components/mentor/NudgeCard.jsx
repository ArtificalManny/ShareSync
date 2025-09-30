import React from "react";
import { X, Sparkles, ClipboardList, Megaphone, Play } from "lucide-react";
import GradientText from "../ui/GradientText";

/**
 * NudgeCard
 * Small, dismissible suggestion block.
 *
 * A11y:
 *  - Whole card is focusable (tabIndex=0)
 *  - Enter/Space activates primary action
 *  - Escape dismisses the card
 *
 * Props:
 *  - id?: string
 *  - kind: 'update' | 'task' | 'sprint' | 'custom'
 *  - title: string
 *  - message: string
 *  - actions?: Array<{label: string, onClick: () => void}>
 *  - onAction?: (actionLabel:string, index:number) => void
 *  - onDismiss?: () => void
 *  - className?
 *  - icon?: ReactNode (override)
 */
export default function NudgeCard({
  id,
  kind = "custom",
  title = "Quick nudge",
  message = "",
  actions = [],
  onAction,
  onDismiss,
  className = "",
  icon,
}) {
  const Icon =
    kind === "task" ? ClipboardList :
    kind === "update" ? Megaphone :
    kind === "sprint" ? Play :
    Sparkles;

  const titleId = id ? `${id}-title` : undefined;
  const descId = id ? `${id}-desc` : undefined;

  const doPrimary = () => {
    if (actions?.length) {
      const a = actions[0];
      a.onClick?.();
      onAction?.(a.label, 0);
    }
  };

  const onKeyDown = (e) => {
    // Activate primary on Enter/Space
    if ((e.key === "Enter" || e.key === " ") && !e.defaultPrevented) {
      e.preventDefault();
      doPrimary();
    }
    // Dismiss on Escape
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault();
      onDismiss?.();
    }
  };

  return (
    <aside
      className={`rounded-xl border border-border bg-surface p-3 flex items-start gap-3 hover-raise focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      data-testid="mentor-nudge"
    >
      <div
        className="shrink-0 h-8 w-8 grid place-items-center rounded-lg text-emerald-600"
        style={{
          background:
            "linear-gradient(135deg, rgb(var(--grad-emerald-a) / .18), rgb(var(--grad-emerald-b) / .18))",
        }}
        aria-hidden="true"
      >
        {icon ? icon : <Icon className="w-4 h-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div id={titleId} className="text-sm font-semibold text-text font-display">
          <GradientText variant="cnbc">{title}</GradientText>
        </div>
        {message ? (
          <p id={descId} className="text-xs text-muted mt-0.5">
            {message}
          </p>
        ) : null}

        {actions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {actions.map((a, i) => (
              <button
                key={`${a.label}-${i}`}
                onClick={() => {
                  a.onClick?.();
                  onAction?.(a.label, i);
                }}
                className="text-xs rounded-lg px-2.5 py-1.5 border border-border hover:bg-surface/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-md hover:bg-surface/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Dismiss nudge"
      >
        <X className="w-4 h-4 text-muted" />
      </button>
    </aside>
  );
}
