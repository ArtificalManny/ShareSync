// src/components/focus/SprintCompleteModal.jsx
import React, { useEffect, useState } from "react";
import celebrate from "../../utils/celebrate";

export default function SprintCompleteModal({
  open,
  onClose,
  completedTasks = [],
  onShareToggleChange,
}) {
  const [share, setShare] = useState(false);

  useEffect(() => {
    if (open) {
      try { celebrate(); } catch {}
    }
  }, [open]);

  useEffect(() => {
    onShareToggleChange?.(share);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <div
        className="fixed z-50 inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2
                   w-[min(520px,calc(100%-2rem))] rounded-2xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Sprint complete"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Nice work! Sprint complete 🎉</h3>
          <button className="text-sm rounded-lg px-2 py-1 hover:bg-surface" onClick={onClose}>Close</button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-muted">
            Great job pushing focus. Here’s a quick summary of what changed.
          </p>

          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-3">
            <div className="text-xs text-muted mb-1">Completed tasks</div>
            {Array.isArray(completedTasks) && completedTasks.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {completedTasks.slice(0, 5).map((t, i) => (
                  <li key={t.id || t._id || i} className="truncate">{t.title || t.name || String(t)}</li>
                ))}
                {completedTasks.length > 5 && (
                  <li className="text-xs text-muted">+{completedTasks.length - 5} more…</li>
                )}
              </ul>
            ) : (
              <div className="text-sm text-muted">No task completions detected this sprint.</div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
            />
            Share to project feed (stub)
          </label>

          <div className="flex items-center gap-2 pt-1">
            <button className="btn btn--primary" onClick={onClose}>Close</button>
            <button className="btn btn--outline" onClick={onClose}>Share now</button>
          </div>
        </div>
      </div>
    </>
  );
}
