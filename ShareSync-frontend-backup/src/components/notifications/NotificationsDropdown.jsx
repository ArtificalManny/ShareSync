// src/components/notifications/NotificationsDropdown.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import NotificationItem from "./NotificationItem";
import {
  fetchNotifications,
  markNotificationRead,
  markAllRead,
} from "../../api/notifications";

function normalizeNotification(raw) {
  const n = raw || {};
  const id = n.id || n._id || n.notificationId || "";
  const createdAt = n.createdAt || n.updatedAt || n.time || null;

  const read =
    typeof n.isRead === "boolean"
      ? n.isRead
      : typeof n.read === "boolean"
        ? n.read
        : false;

  // simple time label
  let displayTime = "";
  try {
    if (createdAt) {
      const d = new Date(createdAt);
      if (!Number.isNaN(d.getTime())) {
        displayTime = d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      }
    }
  } catch {}

  return {
    ...n,
    id,
    read,
    _displayTime: n._displayTime || displayTime,
  };
}

export default function NotificationsDropdown({
  open,
  onClose,
  widthClassName = "w-[420px]",
  anchorClassName = "right-0",
  limit = 25,
}) {
  const ref = useRef(null);

  const [tab, setTab] = useState("all"); // "all" | "unread"
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const unreadOnly = tab === "unread";

  const normalizedItems = useMemo(() => {
    return (items || []).map(normalizeNotification);
  }, [items]);

  const computedUnread = useMemo(() => {
    return normalizedItems.reduce((acc, n) => acc + (!n.read ? 1 : 0), 0);
  }, [normalizedItems]);

  // Keep local unreadCount in sync with what we see
  useEffect(() => {
    setUnreadCount(computedUnread);
  }, [computedUnread]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications({ limit, unreadOnly });
      // backend commonly returns: { notifications, total, unread }
      const list = Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data) ? data : [];
      setItems(list);

      if (typeof data?.unread === "number") setUnreadCount(data.unread);
    } catch (e) {
      // fail closed: show empty state
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Load whenever opened or tab changes (while open)
  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  const handleToggleRead = async (id) => {
    if (!id) return;
    try {
      await markNotificationRead(id);
      // optimistic update
      setItems((prev) =>
        (prev || []).map((n) => {
          const nid = n?.id || n?._id;
          if (String(nid) !== String(id)) return n;
          // backend uses isRead — keep both updated for UI compatibility
          return { ...n, isRead: true, read: true };
        })
      );
    } catch {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setItems((prev) => (prev || []).map((n) => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`absolute ${anchorClassName} mt-2 ${widthClassName} rounded-2xl border border-white/[0.08] bg-surface-1 shadow-2xl z-[120] overflow-hidden`}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-text-primary">Notifications</div>

          <button
            type="button"
            onClick={handleMarkAll}
            className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            title="Mark all as read"
          >
            ✓ Mark all read
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={[
              "px-3 py-1.5 rounded-full text-xs border transition-colors",
              tab === "all"
                ? "bg-surface-2 border-white/[0.12] text-text-primary"
                : "bg-transparent border-white/[0.06] text-text-tertiary hover:text-text-primary hover:border-white/[0.12]",
            ].join(" ")}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setTab("unread")}
            className={[
              "px-3 py-1.5 rounded-full text-xs border transition-colors",
              tab === "unread"
                ? "bg-surface-2 border-white/[0.12] text-text-primary"
                : "bg-transparent border-white/[0.06] text-text-tertiary hover:text-text-primary hover:border-white/[0.12]",
            ].join(" ")}
          >
            Unread
            {unreadCount > 0 ? (
              <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-energy-500/20 text-energy-400 text-[10px]">
                {unreadCount}
              </span>
            ) : null}
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Close notifications"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-auto">
        {loading ? (
          <div className="px-4 py-6 text-sm text-text-tertiary">Loading…</div>
        ) : normalizedItems.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="text-sm font-medium text-text-secondary">No notifications yet</div>
            <div className="text-xs text-text-tertiary mt-1">
              You’ll see updates here as your projects move.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {normalizedItems.map((n) => (
              <NotificationItem key={n.id} item={n} onToggleRead={handleToggleRead} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-surface-1/60">
        <button
          type="button"
          onClick={() => {
            // optional: you can wire this to /notifications page later
            onClose?.();
          }}
          className="w-full text-center text-xs text-text-tertiary hover:text-text-primary transition-colors"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}
