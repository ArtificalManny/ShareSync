import React from "react";
import { ShieldAlert } from "lucide-react";

/**
 * AuditItem
 * Renders system/audit events (what “Recent Activity” used to show).
 *
 * Props:
 *  - event: { summary?, text?, title?, action?, createdAt? }
 *  - when: formatted timestamp string (optional; computed upstream)
 */
export default function AuditItem({ event, when }) {
  const u = event || {};
  const text =
    u.summary ||
    u.text ||
    u.title ||
    (u.action ? `${u.action} performed` : "System event");
  const whenText = when || (u.createdAt ? new Date(u.createdAt).toLocaleString() : "");

  return (
    <article className="flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-slate-700 px-3 py-2 bg-white/70 dark:bg-slate-800/70">
      <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700/80">
        <ShieldAlert className="w-4 h-4" />
        System
      </span>
      <span className="text-sm text-slate-800 dark:text-slate-100 truncate" title={text}>
        {text}
      </span>
      <span className="ml-auto text-[11px] text-slate-500">{whenText}</span>
    </article>
  );
}
