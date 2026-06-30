// src/components/notifications/NotificationsBell.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Bell } from "lucide-react";
import NotificationsDropdown from "./NotificationsDropdown";

let useNotificationsHook = null;
try {
  const ctx = require('../../context/NotificationsContext');
  useNotificationsHook = ctx.useNotifications;
} catch (e) {}

import { fetchUnreadCount, fetchNotifications } from "../../api/notifications";

function parseUnreadCount(data) {
  if (typeof data === "number") return data;
  if (typeof data?.unread === "number") return data.unread;
  if (typeof data?.count === "number") return data.count;
  if (typeof data?.unreadCount === "number") return data.unreadCount;
  return 0;
}

function NotificationsBellWithContext({ dropdownWidthClassName = "w-[420px]" }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Phase 9.1: Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotificationsHook();
  const badgeVisible = useMemo(() => unreadCount > 0, [unreadCount]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative p-2 text-slate-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:scale-110 transition-all duration-200 focus-visible:outline-none"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="w-5 h-5" />
        {badgeVisible && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1f1f23]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Phase 9.1: Pass context props explicitly to dropdown */}
      <NotificationsDropdown 
        open={open} 
        onClose={() => setOpen(false)} 
        widthClassName={dropdownWidthClassName} 
        anchorClassName="right-0"
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
    </div>
  );
}

function NotificationsBellWithPolling({ pollMs = 20000, dropdownWidthClassName = "w-[420px]" }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [unread, setUnread] = useState(0);
  const badgeVisible = useMemo(() => unread > 0, [unread]);

  // Phase 9.1: Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshUnread = async () => {
    try {
      const data = await fetchUnreadCount();
      setUnread(parseUnreadCount(data));
    } catch {
      try {
        const data2 = await fetchNotifications({ limit: 25, unreadOnly: true });
        const list = Array.isArray(data2?.notifications) ? data2.notifications : Array.isArray(data2) ? data2 : [];
        setUnread(list.length);
      } catch {}
    }
  };

  useEffect(() => { refreshUnread(); }, []);
  useEffect(() => {
    const t = setInterval(() => { if (!open) refreshUnread(); }, pollMs);
    return () => clearInterval(t);
  }, [open, pollMs]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative p-2 text-slate-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:scale-110 transition-all duration-200 focus-visible:outline-none"
        onClick={() => { setOpen((o) => !o); if (!open) refreshUnread(); }}
      >
        <Bell className="w-5 h-5" />
        {badgeVisible && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1f1f23]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <NotificationsDropdown open={open} onClose={() => setOpen(false)} widthClassName={dropdownWidthClassName} anchorClassName="right-0" />
    </div>
  );
}

export default function NotificationsBell(props) {
  if (useNotificationsHook) {
    try { return <NotificationsBellWithContext {...props} />; } catch (e) {}
  }
  return <NotificationsBellWithPolling {...props} />;
}
