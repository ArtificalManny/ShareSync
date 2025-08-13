// /src/components/project/RisksPanel.jsx
import React, { useMemo } from "react";

export default function RisksPanel({ project }) {
  const { overdue, ownerless, stale } = useMemo(() => {
    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
    const now = Date.now();
    const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < now && t.status !== "Completed");
    const ownerless = tasks.filter((t) => !t.assigneeId);
    const last = project.lastActivityAt ? new Date(project.lastActivityAt).getTime() : 0;
    const stale = !last || now - last > 7 * 24 * 60 * 60 * 1000;
    return { overdue, ownerless, stale };
  }, [project]);

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-ink-900 dark:text-white mb-2">Risks & Blockers</h3>
      <ul className="space-y-2 text-sm">
        <li>
          <span className="font-medium">Overdue:</span> {overdue.length}
        </li>
        <li>
          <span className="font-medium">No owner:</span> {ownerless.length}
        </li>
        <li>
          <span className="font-medium">Stale (7d+):</span> {stale ? "Yes" : "No"}
        </li>
      </ul>
    </section>
  );
}
