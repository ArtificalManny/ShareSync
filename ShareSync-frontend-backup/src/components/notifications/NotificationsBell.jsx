// src/components/notifications/NotificationsBell.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS BELL - Icon with unread badge and dropdown
// Phase 9: Enhanced with context-based real-time updates
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import NotificationsDropdown from "./NotificationsDropdown";

// Try to use context first, fall back to API polling
let useNotificationsHook = null;
try {
  const ctx = require('../../context/NotificationsContext');
  useNotificationsHook = ctx.useNotifications;
} catch (e) {
  // Context not available, will use API polling
}

// API imports for fallback
import { fetchUnreadCount, fetchNotifications } from "../../api/notifications";

// Safe normalization: backend might return { unread }, { count }, or a number
function parseUnreadCount(data) {
  if (typeof data === "number") return data;
  if (typeof data?.unread === "number") return data.unread;
  if (typeof data?.count === "number") return data.count;
  if (typeof data?.unreadCount === "number") return data.unreadCount;
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT-BASED BELL (preferred)
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationsBellWithContext({ dropdownWidthClassName = "w-[420px]" }) {
  const [open, setOpen] = useState(false);
  const { unreadCount, refreshNotifications } = useNotificationsHook();

  const badgeVisible = useMemo(() => unreadCount > 0, [unreadCount]);

  const handleToggle = useCallback(() => {
    setOpen((o) => !o);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
        aria-label="Notifications"
        title="Notifications"
        onClick={handleToggle}
      >
        <Bell className="w-5 h-5" />
        {badgeVisible && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1f1f23]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
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

// ═══════════════════════════════════════════════════════════════════════════════
// POLLING-BASED BELL (fallback)
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationsBellWithPolling({
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
      // Don't spam while dropdown is open
      if (!open) refreshUnread();
    }, pollMs);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pollMs]);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => {
          setOpen((o) => !o);
          // when opening, refresh count so the dot is accurate
          if (!open) refreshUnread();
        }}
      >
        <Bell className="w-5 h-5" />
        {badgeVisible && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1f1f23]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
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

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT: Auto-select based on context availability
// ═══════════════════════════════════════════════════════════════════════════════

export default function NotificationsBell(props) {
  // If context hook is available, use context-based bell
  if (useNotificationsHook) {
    try {
      return <NotificationsBellWithContext {...props} />;
    } catch (e) {
      // Context might not be in provider tree, fall back
      console.warn('[NotificationsBell] Context not available, using polling fallback');
    }
  }

  // Fall back to polling-based bell
  return <NotificationsBellWithPolling {...props} />;
}
