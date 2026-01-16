// src/components/mentor/NudgeCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// 1) Icon  2) Title + message  3) Action buttons
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { X, Sparkles, ClipboardList, Megaphone, Play } from "lucide-react";
import Card from "../common/Card";

/* ─────────────────────────────────────────────────────────────────────────
   KIND → ICON & COLOR MAPPING
───────────────────────────────────────────────────────────────────────── */
const kindConfig = {
  task: { 
    icon: ClipboardList, 
    bg: "bg-brand/10", 
    text: "text-brand" 
  },
  update: { 
    icon: Megaphone, 
    bg: "bg-warning/10", 
    text: "text-warning" 
  },
  sprint: { 
    icon: Play, 
    bg: "bg-success/10", 
    text: "text-success" 
  },
  custom: { 
    icon: Sparkles, 
    bg: "bg-brand/10", 
    text: "text-brand" 
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
export default function NudgeCard({
  id,
  kind = "custom",
  title = "Quick nudge",
  message = "",
  actions = [],
  onAction,
  onDismiss,
  className = "",
  icon: customIcon,
}) {
  const config = kindConfig[kind] || kindConfig.custom;
  const Icon = config.icon;

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
    if ((e.key === "Enter" || e.key === " ") && !e.defaultPrevented) {
      e.preventDefault();
      doPrimary();
    }
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault();
      onDismiss?.();
    }
  };

  return (
    <Card
      variant="elevated"
      padding="sm"
      as="aside"
      className={`group ${className}`}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      data-testid="mentor-nudge"
    >
      <div className="flex items-start gap-3">
        {/* Element 1: Icon */}
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.bg}`}
          aria-hidden="true"
        >
          {customIcon || <Icon className={`w-4 h-4 ${config.text}`} />}
        </div>

        {/* Element 2: Content */}
        <div className="min-w-0 flex-1">
          <p id={titleId} className="text-sm font-medium text-text-primary">
            {title}
          </p>
          {message && (
            <p id={descId} className="text-xs text-text-tertiary mt-0.5">
              {message}
            </p>
          )}

          {/* Element 3: Actions */}
          {actions?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {actions.map((a, i) => (
                <button
                  key={`${a.label}-${i}`}
                  onClick={() => {
                    a.onClick?.();
                    onAction?.(a.label, i);
                  }}
                  className="
                    text-xs px-2.5 py-1.5 rounded-lg
                    bg-surface-2 text-text-secondary
                    hover:bg-surface-3 hover:text-text-primary
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
                    transition-colors
                  "
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="
              shrink-0 p-1.5 rounded-lg
              text-text-tertiary hover:text-text-primary
              hover:bg-surface-2
              focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
              transition-colors
            "
            aria-label="Dismiss nudge"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </Card>
  );
}
