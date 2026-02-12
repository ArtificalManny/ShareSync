// src/components/notifications/NotificationItem.jsx
import React from "react";

export default function NotificationItem({ item, onToggleRead }) {
  const n = item || {};
  const read = Boolean(n.read);

  return (
    <button
      type="button"
      onClick={() => onToggleRead?.(n.id)}
      className={[
        "w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-2 transition-colors border-t border-white/[0.04]",
        !read ? "bg-surface-0/40" : "",
      ].join(" ")}
      title="Click to toggle read"
    >
      <div
        className={[
          "mt-1 w-2 h-2 rounded-full",
          !read ? "bg-energy-500" : "bg-white/10",
        ].join(" ")}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-text-primary truncate">
            {n.title || "Notification"}
          </div>
          <div className="text-[10px] text-text-tertiary shrink-0">
            {n._displayTime || ""}
          </div>
        </div>

        {n.body ? (
          <div className="text-xs text-text-tertiary mt-1 line-clamp-2">
            {n.body}
          </div>
        ) : null}

        {/* Optional follower notification hint line */}
        {n?.type && String(n.type).includes("follow") && n?.meta?.projectName ? (
          <div className="text-[11px] text-text-tertiary mt-1">
            Project: <span className="text-text-secondary">{n.meta.projectName}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}
