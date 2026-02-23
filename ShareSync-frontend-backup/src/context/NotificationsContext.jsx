// src/context/NotificationsContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS CONTEXT - Real-time notification state management
// Phase 9: WebSocket integration for live notifications
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocketContext } from './SocketContext';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
} from '../api/notifications';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { subscribe, isConnected } = useSocketContext();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const offsetRef = useRef(0);
  const mountedRef = useRef(true);

  // ─────────────────────────────────────────────────────────────────────────────
  // INITIAL LOAD
  // ─────────────────────────────────────────────────────────────────────────────

  const loadNotifications = useCallback(async (reset = false) => {
    if (!isAuthenticated) return;
    if (loading) return;

    setLoading(true);

    try {
      const offset = reset ? 0 : offsetRef.current;
      const limit = 25;

      const result = await fetchNotifications({ limit, offset });
      const items = result?.notifications || result?.items || [];

      if (!mountedRef.current) return;

      if (reset) {
        setNotifications(items);
        offsetRef.current = items.length;
      } else {
        setNotifications((prev) => {
          // Dedupe by ID
          const existingIds = new Set(prev.map((n) => n._id || n.id));
          const newItems = items.filter((n) => !existingIds.has(n._id || n.id));
          return [...prev, ...newItems];
        });
        offsetRef.current += items.length;
      }

      setHasMore(items.length === limit);

      // Also update unread count
      const countResult = await fetchUnreadCount();
      const count =
        typeof countResult === 'number'
          ? countResult
          : countResult?.unread ?? countResult?.count ?? 0;

      if (mountedRef.current) {
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('[NotificationsContext] loadNotifications error:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, loading]);

  const refreshNotifications = useCallback(() => {
    return loadNotifications(true);
  }, [loadNotifications]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadNotifications(false);
    }
  }, [hasMore, loading, loadNotifications]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiMarkAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[NotificationsContext] markAsRead error:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('[NotificationsContext] markAllAsRead error:', error);
    }
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    try {
      await apiDeleteNotification(notificationId);

      setNotifications((prev) => {
        const notification = prev.find((n) => (n._id || n.id) === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => (n._id || n.id) !== notificationId);
      });
    } catch (error) {
      console.error('[NotificationsContext] removeNotification error:', error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBSOCKET LISTENERS
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || !subscribe) return;

    // Listen for new notifications
    const unsubNew = subscribe('notification:new', (data) => {
      console.log('[NotificationsContext] notification:new received:', data);

      setNotifications((prev) => {
        // Avoid duplicates
        const exists = prev.some((n) => (n._id || n.id) === (data._id || data.id));
        if (exists) return prev;
        return [data, ...prev];
      });

      setUnreadCount((prev) => prev + 1);
    });

    // Listen for read updates (from other tabs/devices)
    const unsubRead = subscribe('notification:read', (data) => {
      console.log('[NotificationsContext] notification:read received:', data);

      if (data?.all) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      } else if (data?.id) {
        setNotifications((prev) =>
          prev.map((n) =>
            (n._id || n.id) === data.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });

    // Listen for count updates
    const unsubCount = subscribe('notification:count', (data) => {
      console.log('[NotificationsContext] notification:count received:', data);
      if (typeof data?.unread === 'number') {
        setUnreadCount(data.unread);
      }
    });

    // Listen for deleted notifications
    const unsubDeleted = subscribe('notification:deleted', (data) => {
      console.log('[NotificationsContext] notification:deleted received:', data);
      if (data?.id) {
        setNotifications((prev) => {
          const notification = prev.find((n) => (n._id || n.id) === data.id);
          if (notification && !notification.isRead) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => (n._id || n.id) !== data.id);
        });
      }
    });

    return () => {
      unsubNew?.();
      unsubRead?.();
      unsubCount?.();
      unsubDeleted?.();
    };
  }, [isAuthenticated, subscribe]);

  // ─────────────────────────────────────────────────────────────────────────────
  // INITIAL LOAD ON AUTH
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    if (isAuthenticated) {
      loadNotifications(true);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      offsetRef.current = 0;
    }

    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────────

  const value = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    isConnected,
    refreshNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

export default NotificationsContext;
