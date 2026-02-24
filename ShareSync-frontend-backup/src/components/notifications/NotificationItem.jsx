// src/components/notifications/NotificationItem.jsx
// CLEANED: Replaced hover:bg-surface-2 and text-text-tertiary with proper Tailwind

import React from "react";

export default function NotificationItem({ item, onToggleRead }) {
  const n = item || {};
  const read = Boolean(n.read);

  return (
    <button
      type="button"
      onClick={() => onToggleRead?.(n.id)}
      className={[
        "w-full text-left px-4 py-3 flex gap-3 transition-colors border-t border-slate-100 dark:border-white/5",
        read ? "hover:bg-black/5 dark:hover:bg-white/5" : "bg-violet-50/50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20",
      ].join(" ")}
      title="Click to toggle read"
    >
      <div
        className={[
          "mt-1 w-2 h-2 rounded-full flex-shrink-0",
          !read ? "bg-violet-500" : "bg-slate-200 dark:bg-white/10",
        ].join(" ")}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className={`text-sm truncate ${read ? 'text-slate-600 dark:text-zinc-400' : 'text-slate-800 dark:text-zinc-200 font-medium'}`}>
            {n.title || "Notification"}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
            {n._displayTime || ""}
          </div>
        </div>

        {n.body ? (
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
            {n.body}
          </div>
        ) : null}

        {n?.type && String(n.type).includes("follow") && n?.meta?.projectName ? (
          <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Project: <span className="text-slate-600 dark:text-zinc-300">{n.meta.projectName}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}
