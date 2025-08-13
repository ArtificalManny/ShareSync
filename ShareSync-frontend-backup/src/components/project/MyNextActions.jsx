// /src/components/project/MyNextActions.jsx
import React, { useMemo } from "react";

export default function MyNextActions({ tasks = [], meId, onPatchTask }) {
  const mine = useMemo(() => {
    const list = tasks.filter((t) => !meId || !t.assigneeId || String(t.assigneeId) === String(meId));
    return list.slice(0, 5);
  }, [tasks, meId]);

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-ink-900 dark:text-white mb-2">My Next Actions</h3>
      <ul className="space-y-2">
        {mine.map((t) => (
          <li key={t._id} className="flex items-center justify-between">
            <span className="text-sm">{t.title}</span>
            {t.status !== "Completed" ? (
              <button
                onClick={() => onPatchTask?.(t._id, { status: "Completed" })}
                className="rounded-lg bg-green-500 text-white text-xs px-2 py-1"
              >
                Mark done
              </button>
            ) : (
              <span className="text-xs text-green-600">Done</span>
            )}
          </li>
        ))}
      </ul>
      {mine.length === 0 && <p className="text-sm text-slate-500">No tasks assigned.</p>}
    </section>
  );
}
