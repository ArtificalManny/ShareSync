import React, { useEffect, useMemo, useState, useCallback } from "react";
import SectionHeader from "../ui/SectionHeader.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import {
  X, Bell, Clock, AtSign, CheckCircle2, Mail, UserRoundPlus, MoreHorizontal,
} from "lucide-react";
import { defaultClient as notifications } from "../../services/notifications";
import useOptimisticMutation from "../../hooks/useOptimisticMutation";

const typeMeta = {
  assignment: { icon: <UserRoundPlus className="w-4 h-4 text-indigo-600" />, label: "Assignment" },
  mention: { icon: <AtSign className="w-4 h-4 text-emerald-600" />, label: "Mention" },
  due_soon: { icon: <Clock className="w-4 h-4 text-amber-600" />, label: "Due soon" },
  system: { icon: <Mail className="w-4 h-4 text-slate-600" />, label: "Update" },
};

function ItemRow({ item, onDone, onSnooze }) {
  const meta = typeMeta[item.type] || typeMeta.system;
  const tsLabel = useMemo(() => {
    try {
      const d = new Date(item.ts || item.createdAt || Date.now());
      return d.toLocaleString();
    } catch { return ""; }
  }, [item.ts, item.createdAt]);

  return (
    <div className="rounded-xl border border-border bg-surface p-3 hover:bg-surface/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {meta.icon}
            <div className="text-xs rounded-full border border-border px-2 py-[2px]">{meta.label}</div>
            {!item.read && <span className="ml-1 h-2 w-2 rounded-full bg-indigo-500" aria-label="unread" />}
          </div>
          <div className="mt-1 text-sm font-semibold truncate">{item.title || "Notification"}</div>
          {item.body && <div className="mt-0.5 text-sm text-muted line-clamp-2">{item.body}</div>}
          <div className="mt-1 text-[11px] text-muted">{tsLabel}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-surface"
            onClick={() => onSnooze?.(item, 60)}
            title="Snooze 1h"
          >
            Snooze
          </button>
          <button
            className="rounded-lg bg-grad-blue text-white px-2.5 py-1.5 text-xs hover:opacity-95"
            onClick={() => onDone?.(item)}
            title="Mark done"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InboxDrawer({ open, onClose }) {
  const [items, setItems] = useState([]);
  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  useEffect(() => {
    if (!open) return;

    // initial load
    notifications.fetchLatest().then(() => {
      setItems(notifications.getItems());
    });

    const unsub = notifications.subscribe((rows) => setItems(rows));
    notifications.start(); // begin polling or WS
    return () => {
      unsub();
      notifications.stop();
    };
  }, [open]);

  // Optimistic: mark done
  const { mutate: markDone } = useOptimisticMutation({
    apply: ({ item }) => {
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, read: true } : x)));
      return () => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, read: false } : x)));
    },
    request: ({ vars }) => ({
      url: `/api/notifications/${vars.item.id}/read`,
      method: "POST",
    }),
  });

  const { mutate: snooze } = useOptimisticMutation({
    apply: ({ item, minutes }) => {
      const until = Date.now() + minutes * 60 * 1000;
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, snoozeUntil: until } : x)));
      return () => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, snoozeUntil: undefined } : x)));
    },
    request: ({ vars }) => ({
      url: `/api/notifications/${vars.item.id}/snooze`,
      method: "POST",
      body: { minutes: vars.minutes },
    }),
  });

  const onDone = useCallback((item) => markDone({ item }), [markDone]);
  const onSnooze = useCallback((item, minutes = 60) => snooze({ item, minutes }), [snooze]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 z-50 h-full w-[min(420px,90vw)] bg-surface border-l border-border shadow-xl px-4 py-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Inbox"
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <SectionHeader icon="Bell">Inbox</SectionHeader>
            {unread > 0 && (
              <span className="ml-2 text-xs rounded-full border border-indigo-200 bg-indigo-50 px-2 py-[2px] text-indigo-700">
                {unread} new
              </span>
            )}
          </div>
          <button
            className="rounded-lg p-2 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {items.length === 0 ? (
            <EmptyState
              icon="📬"
              title="Zero inbox, zero stress"
              subtitle="We’ll collect assignments, mentions, and due-soon tasks here."
            />
          ) : (
            items
              .filter((i) => !i.snoozeUntil || i.snoozeUntil < Date.now())
              .map((item) => (
                <ItemRow key={item.id} item={item} onDone={onDone} onSnooze={onSnooze} />
              ))
          )}
        </div>
      </aside>
    </>
  );
}
