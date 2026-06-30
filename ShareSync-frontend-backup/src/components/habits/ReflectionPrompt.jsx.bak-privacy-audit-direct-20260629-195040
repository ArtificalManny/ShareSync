import React, { useState } from "react";
import { CalendarCheck2, Send, X } from "lucide-react";
import GradientText from "../ui/GradientText";

/**
 * ReflectionPrompt
 * Weekly check-in: wins + next focus.
 *
 * Props:
 *  - openInline?: boolean (renders as inline card; else lightweight modal overlay)
 *  - defaultWins?: string
 *  - defaultNext?: string
 *  - onSubmit?: ({wins, nextFocus}) => Promise|void
 *  - onClose?: () => void
 *  - className?
 */
export default function ReflectionPrompt({
  openInline = true,
  defaultWins = "",
  defaultNext = "",
  onSubmit,
  onClose,
  className = "",
}) {
  const [wins, setWins] = useState(defaultWins);
  const [nextFocus, setNextFocus] = useState(defaultNext);
  const [submitting, setSubmitting] = useState(false);

  const Body = (
    <div className={`rounded-2xl border border-border bg-surface p-4 w-[min(640px,100%)] ${className}`}>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <CalendarCheck2 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold font-display">
            <GradientText variant="ig">Weekly Reflection</GradientText>
          </h3>
        </div>
        <button
          className="p-1 rounded-md hover:bg-surface/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="w-4 h-4 text-muted" />
        </button>
      </div>

      <div className="mt-3 grid gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Wins / progress captured</label>
          <textarea
            rows={3}
            value={wins}
            onChange={(e) => setWins(e.target.value)}
            placeholder="What moved forward? Ship, unblock, learning…"
            className="w-full text-sm rounded-lg border border-border bg-surface px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Next focus</label>
          <textarea
            rows={2}
            value={nextFocus}
            onChange={(e) => setNextFocus(e.target.value)}
            placeholder="What’s the next smallest step?"
            className="w-full text-sm rounded-lg border border-border bg-surface px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="btn btn--outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Later
        </button>
        <button
          onClick={async () => {
            try {
              setSubmitting(true);
              await onSubmit?.({ wins: wins.trim(), nextFocus: nextFocus.trim() });
              onClose?.();
            } finally {
              setSubmitting(false);
            }
          }}
          className="btn btn--primary shine inline-flex items-center gap-2 disabled:opacity-60"
          disabled={submitting}
        >
          <Send className="w-4 h-4" />
          Save
        </button>
      </div>
    </div>
  );

  if (openInline) return Body;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="fixed z-50 inset-x-4 top-20 grid place-items-center">{Body}</div>
    </>
  );
}
