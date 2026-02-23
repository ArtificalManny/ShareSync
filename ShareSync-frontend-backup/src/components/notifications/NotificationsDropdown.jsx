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
import { formatDistanceToNow } from 'date-fns';

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ICON MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const NOTIFICATION_ICONS = {
  task_assigned: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  task_completed: { icon: Check, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  task_updated: { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  message_mention: { icon: MessageCircle, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  project_invite: { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  project_ship_update: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  project_milestone_reached: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  xp_gained: { icon: Zap, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  level_up: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  badge_earned: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  streak_at_risk: { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
  deadline_reminder: { icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  system: { icon: Settings, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  default: { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-500/10' },
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
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : '';

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification._id || notification.id);
    }
    onClick?.(notification);
  };

  return (
    <div
      className={`
        group flex items-start gap-3 p-3 rounded-lg cursor-pointer
        transition-all duration-150
        ${notification.isRead
          ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/5'
          : 'bg-violet-50/50 dark:bg-violet-500/5 hover:bg-violet-50 dark:hover:bg-violet-500/10'
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
          <p className={`text-sm ${notification.isRead ? 'text-slate-600 dark:text-zinc-400' : 'text-slate-800 dark:text-zinc-200 font-medium'}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 line-clamp-2">
          {notification.body || notification.message}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-1">
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
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
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
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500"
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

  const handleNotificationClick = useCallback((notification) => {
    // Navigate based on notification data
    const data = notification.data || {};

    if (data.projectId && data.taskId) {
      navigate(`/projects/${data.projectId}/tasks/${data.taskId}`);
    } else if (data.projectId) {
      navigate(`/projects/${data.projectId}`);
    } else if (data.conversationId) {
      navigate(`/messages/${data.conversationId}`);
    }

    onClose();
  }, [navigate, onClose]);

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
        bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/50
        z-50 overflow-hidden
        animate-in fade-in slide-in-from-top-2 duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Notifications</h3>
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
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div
        className="max-h-[400px] overflow-y-auto"
        onScroll={handleScroll}
      >
        {notifications.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400">No notifications yet</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
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
                className="w-full py-2 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/20">
        <button
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="w-full text-center text-xs text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors py-1"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}
