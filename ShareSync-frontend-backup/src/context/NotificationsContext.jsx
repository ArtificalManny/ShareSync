// src/context/NotificationsContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS CONTEXT - Real-time notification state management
// ⭐ FIX: Matched "new_message" spelling exactly to the backend
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocketContext } from './SocketContext';
import { fetchNotifications, fetchUnreadCount, markAsRead as apiMarkAsRead, markAllAsRead as apiMarkAllAsRead, deleteNotification as apiDeleteNotification } from '../api/notifications';

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

  const loadNotifications = useCallback(async (reset = false) => {
    if (!isAuthenticated || loading) return;
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
          const existingIds = new Set(prev.map((n) => n._id || n.id));
          const newItems = items.filter((n) => !existingIds.has(n._id || n.id));
          return [...prev, ...newItems];
        });
        offsetRef.current += items.length;
      }
      setHasMore(items.length === limit);

      const countResult = await fetchUnreadCount();
      const count = typeof countResult === 'number' ? countResult : countResult?.unread ?? countResult?.count ?? 0;
      if (mountedRef.current) setUnreadCount(count);
    } catch (error) {
      console.error('[NotificationsContext] loadNotifications error:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isAuthenticated, loading]);

  const refreshNotifications = useCallback(() => loadNotifications(true), [loadNotifications]);
  const loadMore = useCallback(() => { if (hasMore && !loading) loadNotifications(false); }, [hasMore, loading, loadNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiMarkAsRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n._id || n.id) === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {}
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    try {
      await apiDeleteNotification(notificationId);
      setNotifications((prev) => {
        const notification = prev.find((n) => (n._id || n.id) === notificationId);
        if (notification && !notification.isRead) setUnreadCount((c) => Math.max(0, c - 1));
        return prev.filter((n) => (n._id || n.id) !== notificationId);
      });
    } catch (error) {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !subscribe) return;

    // ⭐ EXACT MATCH: Listen for "new_message" from the backend controller
    const unsubMessage = subscribe('new_message', (data) => {
      console.log('💬 [NotificationsContext] Chat message received natively, updating bell!', data);
      const currentUserId = user?._id || user?.id;
      const senderId = data?.senderId || data?.sender?._id || data?.sender?.id || data?.sender;
      if (currentUserId && senderId && String(currentUserId) === String(senderId)) return;

      const newNotif = {
        _id: `msg_notif_${data?._id || data?.id || Date.now()}`,
        id: `msg_notif_${data?._id || data?.id || Date.now()}`,
        type: 'message',
        title: data?.sender?.firstName ? `Message from ${data.sender.firstName}` : 'New Message',
        message: data?.content ? (data.content.length > 40 ? data.content.substring(0, 40) + '...' : data.content) : 'You received a new direct message',
        isRead: false,
        createdAt: new Date().toISOString()
      };

      setNotifications((prev) => {
        const exists = prev.some((n) => (n._id || n.id) === (newNotif._id || newNotif.id));
        if (exists) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    });

    const unsubNewDirect = subscribe('new_notification', (data) => {
      console.log('🔔 [NotificationsContext] new_notification received:', data);
      setNotifications((prev) => {
        const exists = prev.some((n) => (n._id || n.id) === (data._id || data.id));
        if (exists) return prev;
        return [data, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    });

    const unsubNewLegacy = subscribe('notification:new', (data) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => (n._id || n.id) === (data._id || data.id));
        if (exists) return prev;
        return [data, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    });

    return () => { unsubMessage?.(); unsubNewDirect?.(); unsubNewLegacy?.(); };
  }, [isAuthenticated, subscribe, user]); 

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleFocus = () => { refreshNotifications(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, refreshNotifications]);

  useEffect(() => {
    mountedRef.current = true;
    if (isAuthenticated) loadNotifications(true);
    else { setNotifications([]); setUnreadCount(0); offsetRef.current = 0; }
    return () => { mountedRef.current = false; };
  }, [isAuthenticated]); 

  const value = { notifications, unreadCount, loading, hasMore, isConnected, refreshNotifications, loadMore, markAsRead, markAllAsRead, removeNotification };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationsProvider');
  return context;
}
export default NotificationsContext;
