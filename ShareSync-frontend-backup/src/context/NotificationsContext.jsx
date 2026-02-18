// src/context/NotificationsContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS CONTEXT (Optional Shared State)
// - Keeps global unread count + notifications list in one place
// - Loads initial list from API
// - Listens to SocketContext event relay: 'notification:new'
// - Safe-by-default: if backend/socket isn't ready, UI stays stable
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notifications';
import { useSocketEvent } from './SocketContext';

const NotificationsContext = createContext(null);

function safeId(n) {
  return n?.id || n?._id || null;
}

function normalizeNotification(n) {
  const id = safeId(n) || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  return {
    id,
    title: n?.title || n?.subject || 'Notification',
    body: n?.body || n?.message || '',
    ts: n?.ts || n?.createdAt || Date.now(),
    read: Boolean(n?.read),
    type: n?.type || n?.kind || 'generic',
    meta: n?.meta || {},
    raw: n,
  };
}

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([]);       // normalized
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const unreadCount = useMemo(
    () => items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
    [items],
  );

  const refresh = useCallback(async ({ limit = 25, unreadOnly = false } = {}) => {
    setLoading(true);
    try {
      const data = await listNotifications({ limit, unreadOnly });
      const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setItems(list.map(normalizeNotification));
      setLoadedOnce(true);
    } catch {
      // Keep stable; do not throw
      setItems((prev) => (loadedOnce ? prev : []));
      setLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  }, [loadedOnce]);

  // Initial load
  useEffect(() => {
    refresh({ limit: 25, unreadOnly: false });
  }, [refresh]);

  // Realtime push from socket: 'notification:new'
  useSocketEvent('notification:new', (payload) => {
    if (!payload) return;
    const n = normalizeNotification(payload);

    setItems((prev) => {
      // Avoid duplicates if server re-sends or page refreshes
      if (prev.some((x) => x.id === n.id)) return prev;
      // Put newest on top
      return [n, ...prev];
    });
  });

  const markRead = useCallback(async (id) => {
    if (!id) return;

    // Optimistic
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    try {
      await markNotificationAsRead(id);
    } catch {
      // Best effort: keep optimistic state to avoid UI flicker/quagmire
    }
  }, []);

  const toggleRead = useCallback(async (id) => {
    if (!id) return;

    let willBeRead = true;

    setItems((prev) => {
      const next = prev.map((n) => {
        if (n.id !== id) return n;
        const newRead = !n.read;
        willBeRead = newRead;
        return { ...n, read: newRead };
      });
      return next;
    });

    // Only call backend when turning read => true
    if (willBeRead) {
      try {
        await markNotificationAsRead(id);
      } catch {
        // ignore
      }
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await markAllNotificationsAsRead();
    } catch {
      // keep optimistic state
    }
  }, []);

  const value = useMemo(() => ({
    items,
    unreadCount,
    loading,
    loadedOnce,

    // actions
    refresh,
    markRead,
    toggleRead,
    markAllRead,

    // low-level setter (rarely needed)
    setItems,
  }), [items, unreadCount, loading, loadedOnce, refresh, markRead, toggleRead, markAllRead]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);

  // Safe fallback
  if (!ctx) {
    return {
      items: [],
      unreadCount: 0,
      loading: false,
      loadedOnce: false,
      refresh: async () => {},
      markRead: async () => {},
      toggleRead: async () => {},
      markAllRead: async () => {},
      setItems: () => {},
    };
  }

  return ctx;
}

export default NotificationsContext;
