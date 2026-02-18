// src/components/navigation/NotificationCenter.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CENTER (NAVBAR SLOT)
// SAFE SWAP: delegates to the new NotificationsBell dropdown (Option A).
//
// Why this is safe:
// - Keeps the same default export name used by Navbar.jsx
// - Removes socket + token complexity from the navbar layer (avoids quagmires)
// - The new bell handles unread polling + dropdown rendering
//
// If you ever need the older socket-driven version back, it’s preserved below
// (commented out) for fast rollback.
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import NotificationsBell from "../notifications/NotificationsBell";

export default function NotificationCenter() {
  return <NotificationsBell />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LEGACY VERSION (Rollback Copy)
   If you hit a weird regression, you can restore this quickly by:
   1) Deleting the delegate version above
   2) Uncommenting everything below
───────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";

// If you already have tokenUtils, use it. If not, delete these two lines and the auth header logic.
import { getAccessToken } from "../../utils/tokenUtils";

// OPTIONAL: If socket.io-client exists in your project already, this will work.
import { io } from "socket.io-client";

// ✅ API wrapper (frontend-only)
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../api/notifications";

// ✅ Optional split components
import NotificationList from "../notifications/NotificationList.jsx";

const API_BASE =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  "http://localhost:3000";

function formatTime(ts) {
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function normalizeNotification(n) {
  return {
    id: n?.id || n?._id || crypto.randomUUID(),
    title: n?.title || n?.subject || "Notification",
    body: n?.body || n?.message || "",
    ts: n?.ts || n?.createdAt || Date.now(),
    read: Boolean(n?.read),
    type: n?.type || n?.kind || "generic",
    meta: n?.meta || {},
  };
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all"); // all | unread
  const [items, setItems] = useState([]); // ✅ start empty
  const [loading, setLoading] = useState(false);

  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Derived counts
  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const visible = useMemo(() => {
    if (tab === "unread") return items.filter((n) => !n.read);
    return items;
  }, [items, tab]);

  // ✅ Fetch notifications (safe empty on failure)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await listNotifications({ limit: 25, unreadOnly: false });

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        if (!cancelled) {
          setItems(list.map(normalizeNotification));
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Realtime: listen for server pushes (if gateway is already emitting)
  useEffect(() => {
    const token = typeof getAccessToken === "function" ? getAccessToken() : null;

    const socket = io(API_BASE, {
      transports: ["websocket"],
      withCredentials: true,
      auth: token ? { token } : undefined,
    });

    const onNew = (payload) => {
      if (!payload) return;
      const n = normalizeNotification(payload);
      setItems((prev) => [n, ...prev]);
    };

    socket.on("notification:new", onNew);
    socket.on("notifications:new", onNew);
    socket.on("notification", onNew);

    return () => {
      socket.off("notification:new", onNew);
      socket.off("notifications:new", onNew);
      socket.off("notification", onNew);
      socket.disconnect();
    };
  }, []);

  const markAllRead = async () => {
    // Optimistic UI
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await markAllNotificationsAsRead();
    } catch {
      // If backend isn't ready, keep UI state. No quagmire.
    }
  };

  const toggleRead = async (id) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );

    // Best-effort backend mark read when turning to read
    const next = items.find((x) => x.id === id);
    const willBeRead = next ? !next.read : true;

    if (willBeRead) {
      try {
        await markNotificationAsRead(id);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="relative p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-all duration-200"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-energy-500 text-white text-[10px] leading-[18px] text-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-surface-1 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-text-primary">
                Notifications
              </div>
              {unreadCount > 0 && (
                <div className="text-[10px] px-2 py-0.5 rounded-full bg-energy-500/10 text-energy-500 border border-energy-500/20">
                  {unreadCount} new
                </div>
              )}
            </div>

            <button
              onClick={markAllRead}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1"
              title="Mark all read"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </div>

          <div className="px-4 py-2 flex items-center gap-2">
            <button
              onClick={() => setTab("all")}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                tab === "all"
                  ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                  : "bg-transparent text-text-tertiary border-white/[0.10] hover:border-white/[0.25]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTab("unread")}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                tab === "unread"
                  ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                  : "bg-transparent text-text-tertiary border-white/[0.10] hover:border-white/[0.25]"
              }`}
            >
              Unread
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                Loading…
              </div>
            )}

            {!loading && visible.length === 0 && (
              <div className="px-6 py-10 text-center">
                <div className="text-sm font-medium text-text-secondary">
                  No notifications yet
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  You’ll see updates here as your projects move.
                </div>
              </div>
            )}

            <NotificationList
              items={visible.map((n) => ({
                ...n,
                _displayTime: formatTime(n.ts),
              }))}
              onToggleRead={(id) => toggleRead(id)}
            />
          </div>

          <div className="px-4 py-3 border-t border-white/[0.06]">
            <button className="w-full text-xs text-text-tertiary hover:text-text-primary transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

──────────────────────────────────────────────────────────────────────────── */
