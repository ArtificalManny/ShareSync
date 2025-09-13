// /src/components/project/ProjectIconPicker.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSelect: ({ kind: 'emoji'|'svg', value: string } | null) => void
 */
const EMOJIS = [
  "🚀","✨","🔥","🧭","🎯","📈","⚙️","🧪","💡","🛠️",
  "📦","🧩","🌱","🏁","🏗️","🧠","🤝","🌀","🔧","💎"
];

const SVGS = [
  { key: "rocket", label: "Rocket" },
  { key: "bolt",   label: "Bolt"   },
  { key: "target", label: "Target" },
];

export default function ProjectIconPicker({ open, onClose, onSelect }) {
  const [tab, setTab] = useState("emoji");

  useEffect(() => {
    if (!open) return;
    setTab("emoji");
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed z-50 inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-[min(520px,calc(100%-2rem))] rounded-2xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Choose project icon"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Choose project icon</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface" aria-label="Close picker">
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm ${tab === "emoji" ? "bg-indigo-50 text-indigo-700" : "text-muted"}`}
              onClick={() => setTab("emoji")}
            >
              Emoji
            </button>
            <button
              className={`px-3 py-1.5 text-sm ${tab === "svg" ? "bg-indigo-50 text-indigo-700" : "text-muted"}`}
              onClick={() => setTab("svg")}
            >
              Preset SVGs
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === "emoji" ? (
            <div className="grid grid-cols-8 gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => onSelect?.({ kind: "emoji", value: e })}
                  className="h-10 rounded-lg bg-white dark:bg-slate-900 border border-border hover:bg-slate-50 dark:hover:bg-slate-800 text-xl"
                  title={e}
                >
                  {e}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {SVGS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onSelect?.({ kind: "svg", value: s.key })}
                  className="flex items-center justify-center gap-2 h-10 rounded-lg bg-white dark:bg-slate-900 border border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                  title={s.label}
                >
                  <span className="text-indigo-600">
                    {s.key === "rocket" && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path d="M12 2c3 0 6 2 8 4l-6 6-2-2-6 6-2-2 6-6-2-2 6-6z" fill="currentColor"/></svg>
                    )}
                    {s.key === "bolt" && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path d="M13 2L3 14h7l-1 8 11-12h-7l0-8z" fill="currentColor"/></svg>
                    )}
                    {s.key === "target" && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                      </svg>
                    )}
                  </span>
                  <span className="text-sm">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onSelect?.(null)}
              className="text-sm rounded-lg border border-border px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Remove icon"
            >
              Remove icon
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm rounded-lg border border-border px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
