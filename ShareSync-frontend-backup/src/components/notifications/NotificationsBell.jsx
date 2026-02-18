// src/components/notifications/NotificationsBell.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import NotificationsDropdown from "./NotificationsDropdown";
import { fetchUnreadCount, fetchNotifications } from "../../api/notifications";

// Safe normalization: backend might return { unread }, { count }, or a number
function parseUnreadCount(data) {
  if (typeof data === "number") return data;
  if (typeof data?.unread === "number") return data.unread;
  if (typeof data?.count === "number") return data.count;
  if (typeof data?.unreadCount === "number") return data.unreadCount;
  return 0;
}

export default function NotificationsBell({
  pollMs = 20000,
  dropdownWidthClassName = "w-[420px]",
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const badgeVisible = useMemo(() => unread > 0, [unread]);

  const refreshUnread = async () => {
    try {
      const data = await fetchUnreadCount();
      const next = parseUnreadCount(data);
      setUnread(next);
      return;
    } catch {
      // fallback: compute unread by fetching list (cheap-ish, limit 25)
      try {
        const data2 = await fetchNotifications({ limit: 25, unreadOnly: true });
        const list = Array.isArray(data2?.notifications) ? data2.notifications : Array.isArray(data2) ? data2 : [];
        setUnread(list.length);
      } catch {
        // fail closed
      }
    }
  };

  useEffect(() => {
    refreshUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      // Don’t spam while dropdown is open — you can adjust if you want live updating
      if (!open) refreshUnread();
    }, pollMs);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pollMs]);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-all duration-200"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => {
          setOpen((o) => !o);
          // when opening, refresh count so the dot is accurate
          // (we do NOT clear unread automatically)
          if (!open) refreshUnread();
        }}
      >
        <Bell className="w-4 h-4" />
        {badgeVisible ? (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-energy-500 rounded-full ring-2 ring-surface-0" />
        ) : null}
      </button>

      <NotificationsDropdown
        open={open}
        onClose={() => setOpen(false)}
        widthClassName={dropdownWidthClassName}
        anchorClassName="right-0"
      />
    </div>
  );
}
