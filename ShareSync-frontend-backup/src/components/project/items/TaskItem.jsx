import React from "react";
import { ClipboardList, CheckCircle2, PencilLine } from "lucide-react";

/**
 * TaskItem
 * Renders task-related activity (created/updated/completed).
 *
 * Props:
 *  - event: { type?, title?, meta?, status?, createdAt? }
 *  - when: formatted timestamp string (optional; computed upstream)
 */
export default function TaskItem({ event, when }) {
  const u = event || {};
  const t = (u.type || "").toLowerCase();
  const title = u.title || u.meta?.title || u.text || "Task";
  const whenText = when || (u.createdAt ? new Date(u.createdAt).toLocaleString() : "");

  const icon = t.includes("completed")
    ? <CheckCircle2 className="w-4 h-4" />
    : t.includes("updated")
      ? <PencilLine className="w-4 h-4" />
      : <ClipboardList className="w-4 h-4" />;

  const badge =
    t.includes("completed")
      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900/60"
      : t.includes("updated")
        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-900/60"
        : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-900/60";

  const label =
    t.includes("completed")
      ? `Task completed: ${title}`
      : t.includes("updated")
        ? `Task updated: ${title}`
        : `Task created: ${title}`;

  return (
    <article className="flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-slate-700 px-3 py-2 bg-white/70 dark:bg-slate-800/70">
      <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 border ${badge}`}>
        {icon}
        Task
      </span>
      <span className="text-sm text-slate-800 dark:text-slate-100 truncate" title={label}>
        {label}
      </span>
      <span className="ml-auto text-[11px] text-slate-500">{whenText}</span>
    </article>
  );
}
