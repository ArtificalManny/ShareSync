// src/components/notifications/NotificationsDropdown.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS DROPDOWN - Full notification list with actions
// Phase 9: Real-time updates via context
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Loader2,
  MessageCircle,
  UserPlus,
  Target,
  Zap,
  Trophy,
  Flame,
  AlertTriangle,
  Calendar,
  FileText,
  Settings,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';

// Native replacement for date-fns to avoid dependency errors
function formatTimeAgo(dateInput) {
  if (!dateInput) return '';
  const seconds = Math.floor((new Date() - new Date(dateInput)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return 'just now';
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ICON MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const NOTIFICATION_ICONS = {
  task_assigned: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
  task_completed: { icon: Check, color: 'text-teal-500', bg: 'bg-teal-50' },
  task_updated: { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50' },
  message_mention: { icon: MessageCircle, color: 'text-violet-500', bg: 'bg-violet-50' },
  project_invite: { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  project_ship_update: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
  project_milestone_reached: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
  xp_gained: { icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50' },
  level_up: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
  badge_earned: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
  streak_at_risk: { icon: Flame, color: 'text-red-500', bg: 'bg-red-50' },
  deadline_reminder: { icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
  system: { icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50' },
  default: { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50' },
};

function getNotificationIcon(type) {
  const key = String(type || '').toLowerCase();
  return NOTIFICATION_ICONS[key] || NOTIFICATION_ICONS.default;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationItem({ notification, onMarkRead, onRemove, onClick }) {
  const { icon: IconComponent, color, bg } = getNotificationIcon(notification.type);

  const timeAgo = notification.createdAt
    ? formatTimeAgo(notification.createdAt)
    : '';

  const handleClick = (event) => {
    if (!notification.isRead) {
      onMarkRead(notification._id || notification.id);
    }
    onClick?.(notification, event);
  };

  return (
    <div
      className={`
        group flex items-start gap-3 p-3 rounded-lg cursor-pointer
        transition-all duration-150
        ${notification.isRead
          ? 'bg-transparent hover:bg-slate-50'
          : 'bg-violet-50/70 hover:bg-violet-100/70'
        }
      `}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <IconComponent className={`w-4 h-4 ${color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${notification.isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
          {notification.body || notification.message}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          {timeAgo}
        </p>
      </div>

      {/* Actions (show on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification._id || notification.id);
            }}
            className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-slate-700 shadow-sm transition-all"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(notification._id || notification.id);
          }}
          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 shadow-sm transition-all"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════════

export default function NotificationsDropdown({
  open,
  onClose,
  widthClassName = 'w-[420px]',
  anchorClassName = 'right-0',
}) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  // Close on escape
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // NOTIFICATION ROUTE SAFETY BRIDGE V2
  // Important:
  // - "/" renders Landing.jsx in this app shell.
  // - XP/global notifications should route to /home, not /.
  // - Unknown notifications should close the dropdown without navigating.
  const safeObject = useCallback((value) => {
    if (!value) return {};

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }

    return typeof value === "object" ? value : {};
  }, []);

  const resolveNotificationRoute = useCallback((notification) => {
    const data = safeObject(notification?.data);
    const meta = safeObject(notification?.meta);

    const type = String(notification?.type || "").toLowerCase();
    const title = String(notification?.title || "").toLowerCase();
    const body = String(notification?.body || notification?.message || "").toLowerCase();

    const projectId =
      data.projectId ||
      data.project ||
      meta.projectId ||
      meta.project ||
      notification?.projectId;

    const taskId =
      data.taskId ||
      data.task ||
      meta.taskId ||
      meta.task ||
      notification?.taskId;

    const conversationId =
      data.conversationId ||
      data.conversation ||
      meta.conversationId ||
      meta.conversation ||
      notification?.conversationId;

    const rawActionUrl =
      data.actionUrl ||
      data.targetUrl ||
      data.link ||
      data.url ||
      meta.actionUrl ||
      meta.targetUrl ||
      meta.link ||
      meta.url ||
      notification?.actionUrl ||
      notification?.targetUrl ||
      notification?.link ||
      notification?.url;

    const isXpNotification =
      type.includes("xp") ||
      type.includes("experience") ||
      title.includes("xp earned") ||
      title.includes("xp") ||
      body.includes("xp for completing");

    if (projectId && taskId) {
      return `/projects/${projectId}/tasks/${taskId}`;
    }

    if (projectId) {
      return `/projects/${projectId}`;
    }

    if (conversationId) {
      return `/messages/${conversationId}`;
    }

    if (isXpNotification) {
      return "/home";
    }

    if (typeof rawActionUrl === "string") {
      const trimmedUrl = rawActionUrl.trim();

      // Never allow notification clicks to route to Landing.jsx.
      if (trimmedUrl === "/" || trimmedUrl === "") {
        return null;
      }

      // Only allow safe internal routes.
      if (trimmedUrl.startsWith("/") && !trimmedUrl.startsWith("//")) {
        return trimmedUrl;
      }
    }

    return null;
  }, [safeObject]);

  const handleNotificationClick = useCallback((notification, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const route = resolveNotificationRoute(notification);

    if (route) {
      navigate(route);
    }

    onClose();
  }, [navigate, onClose, resolveNotificationRoute]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (hasMore && !loading) {
        loadMore();
      }
    }
  }, [hasMore, loading, loadMore]);

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className={`
        absolute top-full mt-2 ${anchorClassName} ${widthClassName}
        bg-white border border-slate-200
        rounded-xl shadow-2xl shadow-slate-200/50
        z-50 overflow-hidden
        animate-in fade-in slide-in-from-top-2 duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-violet-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-500 hover:text-violet-600 hover:bg-slate-50 rounded transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div
        className="max-h-[400px] overflow-y-auto bg-white"
        onScroll={handleScroll}
      >
        {notifications.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">
              You'll see updates here when they happen
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id || notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onRemove={removeNotification}
                onClick={handleNotificationClick}
              />
            ))}

            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              </div>
            )}

            {!loading && hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-2 text-xs font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={(e) => {
            e.preventDefault();
            // navigate('/notifications'); // Disabled until the dedicated page is built
          }}
          className="w-full text-center text-xs font-medium text-slate-400 cursor-not-allowed py-1.5"
          title="Full notifications page coming soon"
        >
          View all notifications (Coming Soon)
        </button>
      </div>
    </div>
  );
}
