// /src/components/messenger/DMList.jsx
import React from "react";
import { Plus } from "lucide-react";

function avatarFor(c) {
  // Try to show the other participant’s initials; fallback to emoji.
  const name =
    c?.title ||
    c?.name ||
    c?.otherUser?.displayName ||
    c?.otherUser?.username ||
    "DM";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return initials || "👤";
}

/**
 * DMList
 * - Renders a vertical list of conversations (DM or project).
 * - Shows unread ring/badge.
 */
export default function DMList({ conversations = [], unread = {}, activeId, onSelect, onNewDM }) {
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-2 border-b border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Direct Messages
        </div>
        <button
          type="button"
          onClick={onNewDM}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Start new DM"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* List */}
      <div role="list" className="flex-1 overflow-y-auto p-1">
        {conversations.length === 0 && (
          <div className="px-2 py-3 text-xs text-slate-500">No conversations yet.</div>
        )}
        {conversations.map((c) => {
          const id = String(c.id || c._id || "");
          const isActive = id === String(activeId || "");
          const n = Number(unread[id] || 0);
          const title =
            c.title ||
            c.name ||
            c.otherUser?.displayName ||
            c.otherUser?.username ||
            (c.kind === "project" ? c.projectTitle || "Project chat" : "Direct message");

        return (
          <button
            key={id}
            role="listitem"
            onClick={() => onSelect?.(id)}
            className={[
              "w-full text-left rounded-lg px-2 py-2 flex items-center gap-2",
              isActive
                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent",
            ].join(" ")}
          >
            <span className="relative inline-grid place-items-center h-8 w-8 rounded-full bg-slate-200/70 dark:bg-slate-700 text-[11px] font-semibold">
              {avatarFor(c)}
              {n > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] leading-[18px] text-center"
                  aria-label={`${n} unread`}
                >
                  {n > 99 ? "99+" : n}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {title}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {c.lastText || c.lastMessage?.text || "No messages yet"}
              </div>
            </div>
          </button>
        );
        })}
      </div>
    </div>
  );
}
