import React from "react";
import { Sparkles, ClipboardList, Megaphone, Play } from "lucide-react";
import { toast } from "../ui/Toaster.jsx";

/**
 * NudgeToast
 * Compact toast-friendly rendering of a mentor nudge.
 *
 * Usage:
 *   showNudgeToast({
 *     kind: 'task' | 'update' | 'sprint' | 'custom',
 *     title: 'Review at-risk tasks',
 *     message: '3 tasks are trending at risk.',
 *     cta: { label: 'View at-risk', onClick: () => navigate(...)}  // optional
 *   })
 */

function NudgeToastContent({ kind = "custom", title = "Mentor nudge", message = "", cta }) {
  const Icon =
    kind === "task" ? ClipboardList :
    kind === "update" ? Megaphone :
    kind === "sprint" ? Play :
    Sparkles;

  return (
    <div className="flex items-start gap-3">
      <div
        className="shrink-0 h-8 w-8 grid place-items-center rounded-lg text-indigo-700"
        style={{
          background:
            "linear-gradient(135deg, rgb(99 102 241 / .18), rgb(79 70 229 / .18))",
        }}
        aria-hidden="true"
      >
        <Icon className="w-4 h-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-text">{title}</div>
        {message ? <div className="text-xs text-muted mt-0.5">{message}</div> : null}
      </div>

      {cta?.label && typeof cta.onClick === "function" ? (
        <button
          className="text-xs rounded-lg px-2.5 py-1.5 border border-border hover:bg-surface/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={cta.onClick}
        >
          {cta.label}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Helper to show a mentor nudge via the global toast host.
 * Accepts a simple object; gracefully degrades if custom content unsupported.
 */
export function showNudgeToast({ kind, title, message, cta, variant = "info", duration = 4500 } = {}) {
  // If your toast() supports custom React nodes, use `render`.
  // Otherwise, fall back to title + description.
  try {
    toast({
      // Many toast libraries accept `render` or `content` for custom JSX.
      // If your Toaster doesn't, it will ignore and show title/description fallback.
      render: <NudgeToastContent kind={kind} title={title} message={message} cta={cta} />,
      title: title || "Mentor nudge",
      description: message,
      variant,
      duration,
    });
  } catch {
    // Fallback (very compatible)
    toast({ title: title || "Mentor nudge", description: message, variant });
  }
}

export default NudgeToastContent;
