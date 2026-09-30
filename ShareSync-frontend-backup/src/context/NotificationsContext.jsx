// src/context/NotificationsContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS CONTEXT - Real-time notification state management
// ⭐ THE FIX: Unified Listeners for split-brain namespaces (new_notification & notification:new)
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
  // notifications-recoverable-error-v1
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const offsetRef = useRef(0);
  const mountedRef = useRef(true);

  // openshare-native-banner-live-dedupe-v1
  // The backend may emit the same logical notification under multiple
  // socket event aliases. Keep a short-lived fingerprint cache so one
  // notification produces one unread increment and one foreground banner.
  const recentLiveNotificationKeysRef = useRef(new Map());

  // ─────────────────────────────────────────────────────────────────────────────
  // INITIAL LOAD
  // ─────────────────────────────────────────────────────────────────────────────

  const loadNotifications = useCallback(async (reset = false) => {
    if (!isAuthenticated) return;
    if (loading) return;

    setLoading(true);
    setError("");

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

      if (mountedRef.current) {
        const offline =
          typeof navigator !== 'undefined' &&
          navigator.onLine === false;

        const status = error?.response?.status;

        const message = offline
          ? "You're offline. Notifications will refresh when you're back online."
          : status >= 500
            ? "Notifications are temporarily unavailable."
            : error?.response?.data?.message ||
              "We couldn't load your notifications.";

        setError(message);
      }
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
    // openshare-notification-runtime-probe-v1
    if (typeof window !== "undefined") {
      window.__openshareNotificationContextProbe = {
        effectRan: true,
        checkedAt: new Date().toISOString(),
        isAuthenticated: Boolean(isAuthenticated),
        hasSubscribe: typeof subscribe === "function",
        isConnected: Boolean(isConnected),
        subscribedEvents: [],
      };
    }

    if (!isAuthenticated || !subscribe) return;

    // ⭐ THE SURGICAL FIX: A unified handler that catches everything
    // openshare-native-banner-live-bridge-v1
    const handleIncomingNotification = (data) => {
      if (!data || typeof data !== "object") return;

      const rawId =
        data._id ||
        data.id ||
        null;

      const fingerprint = rawId
        ? `id:${String(rawId)}`
        : [
            String(data.type || ""),
            String(data.title || ""),
            String(data.body || data.message || ""),
            String(data.createdAt || data.timestamp || ""),
          ].join("|");

      const now = Date.now();
      const previousSeenAt =
        recentLiveNotificationKeysRef.current.get(
          fingerprint
        );

      // notification:new / new_notification /
      // notificationCreated can all represent the same event.
      if (
        previousSeenAt &&
        now - previousSeenAt < 15000
      ) {
        console.log(
          "🔕 [NotificationsContext] Duplicate live notification suppressed",
          fingerprint
        );
        return;
      }

      recentLiveNotificationKeysRef.current.set(
        fingerprint,
        now
      );

      // Keep the dedupe cache bounded.
      for (
        const [key, seenAt]
        of recentLiveNotificationKeysRef.current
      ) {
        if (now - seenAt > 60000) {
          recentLiveNotificationKeysRef.current.delete(
            key
          );
        }
      }

      console.log(
        "🔔 [NotificationsContext] Live notification caught!",
        data
      );

      setNotifications((prev) => {
        const exists = prev.some(
          (n) =>
            (n._id || n.id) ===
            (data._id || data.id)
        );

        if (exists) return prev;

        return [data, ...prev];
      });

      setUnreadCount((prev) => prev + 1);

      // Foreground custom banner belongs to the native app only.
      // Background/closed-app delivery will later be handled by APNs.
      const nativeForeground =
        typeof window !== "undefined" &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        window.Capacitor?.isNativePlatform?.() === true;

      if (nativeForeground) {
        window.dispatchEvent(
          new CustomEvent(
            "openshare:notification-banner",
            {
              detail: data,
            }
          )
        );
      }
    };

    // openshare-notification-event-aliases-v2
    // Funnel every notification event name currently used by OpenShare
    // through the same deduplicated foreground-notification handler.
    const notificationEventNames = [
      "notification:new",
      "notifications:new",
      "notification",
      "new_notification",
      "notificationCreated",
      "message_notification",
    ];

    const unsubscribeNotificationEvents =
      notificationEventNames.map((eventName) => {
        console.log(
          `[NotificationsContext] subscribing: ${eventName}`
        );

        return subscribe(
          eventName,
          handleIncomingNotification
        );
      });

    if (
      typeof window !== "undefined" &&
      window.__openshareNotificationContextProbe
    ) {
      window.__openshareNotificationContextProbe = {
        ...window.__openshareNotificationContextProbe,
        subscribedEvents: [...notificationEventNames],
        subscriptionCount: notificationEventNames.length,
        subscriptionsInstalledAt: new Date().toISOString(),
      };
    }

    // Listen for read updates
    const unsubRead = subscribe('notification:read', (data) => {
      if (data?.all) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } else if (data?.id) {
        setNotifications((prev) =>
          prev.map((n) => ((n._id || n.id) === data.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });

    // Listen for count updates
    const unsubCount = subscribe('notification:count', (data) => {
      if (typeof data?.unread === 'number') setUnreadCount(data.unread);
    });

    // Listen for deleted notifications
    const unsubDeleted = subscribe('notification:deleted', (data) => {
      if (data?.id) {
        setNotifications((prev) => {
          const notification = prev.find((n) => (n._id || n.id) === data.id);
          if (notification && !notification.isRead) setUnreadCount((c) => Math.max(0, c - 1));
          return prev.filter((n) => (n._id || n.id) !== data.id);
        });
      }
    });

    return () => {
      unsubscribeNotificationEvents.forEach(
        (unsubscribe) => {
          unsubscribe?.();
        }
      );
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
      setError("");
      offsetRef.current = 0;
    }

    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────────

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
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
