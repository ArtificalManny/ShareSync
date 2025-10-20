import React, { useState, useMemo } from "react";
import { X } from "lucide-react";
import Card from "../ui/Card.jsx";
import { track } from "../../utils/telemetry";

/**
 * FocusDoneModal
 * Lightweight composer shown after a focus session finishes.
 *
 * Props:
 * - open: boolean
 * - onClose(): void
 * - onSubmit(text: string, extras?: { projectId?: string }): void
 * - project?: { id, name }
 * - suggestions?: string[] (optional quick chips)
 */
export default function FocusDoneModal({
  open,
  onClose,
  onSubmit,
  project,
  suggestions = [],
}) {
  const [text, setText] = useState("");
  const title = useMemo(
    () => (project?.name ? `What moved in “${project.name}”?` : "What moved?"),
    [project?.name]
  );

  if (!open) return null;

  const submit = () => {
    const body = text.trim();
    track("focus_update_posted", {
      len: body.length,
      projectId: project?.id,
    });
    onSubmit && onSubmit(body, { projectId: project?.id });
    setText("");
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(560px,92vw)] p-4 rounded-2xl border border-white/10 bg-[rgba(8,12,24,.85)] shadow-[0_12px_80px_rgba(0,0,0,.5)]">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            className="rounded-md p-1 border border-white/10 hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="text-xs rounded-full px-2 py-1 border border-white/10 hover:bg-white/10"
                onClick={() => setText((t) => (t ? `${t}\n${s}` : s))}
                title="Add suggestion"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={4}
          placeholder="Quick note about progress…"
          className="w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted">
            Tip: We’ll attach this to your activity feed.
          </span>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md px-3 py-1.5 text-xs border border-white/12 hover:bg-white/10"
              onClick={onClose}
            >
              Skip
            </button>
            <button
              className="rounded-md px-3 py-1.5 text-xs text-white"
              style={{
                background:
                  "linear-gradient(90deg,var(--action-primary,#4f46e5),var(--accent-aqua,#22d3ee))",
              }}
              onClick={submit}
              disabled={!text.trim()}
            >
              Post update
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
