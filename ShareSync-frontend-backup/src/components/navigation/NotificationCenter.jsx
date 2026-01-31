// src/components/navigation/NotificationCenter.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE N: Smart Notification Center with Digest Mode
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bell, X, Check, CheckCheck, Settings, Clock, 
  Rocket, Users, Target, AlertTriangle, MessageSquare,
  Zap, Archive, Filter, Volume2, VolumeX
} from 'lucide-react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

const NOTIFICATION_TYPES = {
  ship: {
    icon: Rocket,
    color: 'text-brand',
    bg: 'bg-brand/10',
    label: 'Ship',
  },
  mention: {
    icon: MessageSquare,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    label: 'Mention',
  },
  assignment: {
    icon: Target,
    color: 'text-warning',
    bg: 'bg-warning/10',
    label: 'Assigned',
  },
  team: {
    icon: Users,
    color: 'text-success',
    bg: 'bg-success/10',
    label: 'Team',
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-error-500',
    bg: 'bg-error-500/10',
    label: 'Alert',
  },
  streak: {
    icon: Zap,
    color: 'text-warning',
    bg: 'bg-warning/10',
    label: 'Streak',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getMockNotifications() {
  const now = Date.now();
  return [
    {
      id: 'n1',
      type: 'ship',
      title: 'Sarah shipped API v2',
      body: 'The new API endpoints are live!',
      timestamp: now - 5 * 60 * 1000,
      read: false,
      project: { name: 'ShareSync', color: '#7C3AED' },
    },
    {
      id: 'n2',
      type: 'mention',
      title: 'Alex mentioned you',
      body: '"@Manny can you review the PR?"',
      timestamp: now - 30 * 60 * 1000,
      read: false,
      project: { name: 'ShareSync', color: '#7C3AED' },
    },
    {
      id: 'n3',
      type: 'assignment',
      title: 'New task assigned',
      body: 'Implement focus mode timer',
      timestamp: now - 2 * 60 * 60 * 1000,
      read: true,
      project: { name: 'ShareSync', color: '#7C3AED' },
    },
    {
      id: 'n4',
      type: 'streak',
      title: 'Streak at risk!',
      body: 'Ship 1 task in the next 4 hours to protect your 7-day streak',
      timestamp: now - 3 * 60 * 60 * 1000,
      read: false,
      urgent: true,
    },
    {
      id: 'n5',
      type: 'team',
      title: 'New team member',
      body: 'Jordan joined the ShareSync project',
      timestamp: now - 24 * 60 * 60 * 1000,
      read: true,
      project: { name: 'ShareSync', color: '#7C3AED' },
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationItem({ notification, onRead, onArchive, onClick }) {
  const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.team;
  const Icon = config.icon;

  const timeAgo = formatTimeAgo(notification.timestamp);

  return (
    <div 
      className={`
        group flex gap-3 p-3 rounded-xl transition-all cursor-pointer
        ${notification.read 
          ? 'bg-transparent hover:bg-surface-2/50' 
          : 'bg-surface-2/50 hover:bg-surface-2'
        }
        ${notification.urgent ? 'ring-1 ring-warning/30' : ''}
      `}
      onClick={() => onClick?.(notification)}
    >
      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center shrink-0
        ${config.bg}
      `}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`
            text-sm font-medium truncate
            ${notification.read ? 'text-text-secondary' : 'text-text-primary'}
          `}>
            {notification.title}
          </p>
          
          {/* Unread dot */}
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />
          )}
        </div>
        
        {notification.body && (
          <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1.5">
          {notification.project && (
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ 
                backgroundColor: `${notification.project.color}20`,
                color: notification.project.color,
              }}
            >
              {notification.project.name}
            </span>
          )}
          <span className="text-[10px] text-text-tertiary">{timeAgo}</span>
        </div>
      </div>

      {/* Actions (on hover) */}
      <div className="
        flex items-center gap-1 opacity-0 group-hover:opacity-100
        transition-opacity shrink-0
      ">
        {!notification.read && (
          <button
            onClick={(e) => { e.stopPropagation(); onRead?.(notification.id); }}
            className="p-1.5 rounded-lg hover:bg-surface-3 transition-colors"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onArchive?.(notification.id); }}
          className="p-1.5 rounded-lg hover:bg-surface-3 transition-colors"
          title="Archive"
        >
          <Archive className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread
  const [muted, setMuted] = useState(false);
  const panelRef = useRef(null);

  // Load notifications
  useEffect(() => {
    setNotifications(getMockNotifications());
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  // Keyboard shortcut
  useKeyboardShortcut('cmd+shift+n', () => setIsOpen(o => !o), {
    id: 'toggle-notifications',
    description: 'Toggle notifications',
    category: 'General',
  });

  // Counts
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, [notifications]
  );

  // Filtered
  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications;
  }, [notifications, filter]);

  // Grouped by date
  const grouped = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const groups = { today: [], yesterday: [], older: [] };
    
    filteredNotifications.forEach(n => {
      const date = new Date(n.timestamp).toDateString();
      if (date === today) groups.today.push(n);
      else if (date === yesterday) groups.yesterday.push(n);
      else groups.older.push(n);
    });
    
    return groups;
  }, [filteredNotifications]);

  // Actions
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const archiveNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-lg transition-colors
          ${isOpen ? 'bg-surface-2 text-text-primary' : 'hover:bg-surface-2 text-text-tertiary hover:text-text-secondary'}
        `}
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1
            min-w-[18px] h-[18px] px-1
            flex items-center justify-center
            rounded-full bg-brand text-white
            text-[10px] font-bold
          ">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="
          absolute top-full right-0 mt-2
          w-[400px] max-h-[600px]
          bg-surface-1 border border-white/[0.08] rounded-2xl
          shadow-2xl shadow-black/50
          overflow-hidden
          animate-in fade-in slide-in-from-top-2 duration-200
          z-50
        ">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Mute toggle */}
              <button
                onClick={() => setMuted(!muted)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${muted ? 'bg-warning/10 text-warning' : 'hover:bg-surface-2 text-text-tertiary'}
                `}
                title={muted ? 'Unmute notifications' : 'Mute notifications'}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Settings */}
              <button
                className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"
                title="Notification settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === 'all' 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                }
              `}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === 'unread' 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                }
              `}
            >
              Unread
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="
                  ml-auto flex items-center gap-1
                  px-2 py-1.5 rounded-lg
                  text-xs text-text-tertiary
                  hover:text-text-secondary hover:bg-surface-2
                  transition-colors
                "
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[450px]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
                <p className="text-text-tertiary">No notifications</p>
                <p className="text-xs text-text-tertiary mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="p-2 space-y-4">
                {/* Today */}
                {grouped.today.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 mb-1">
                      Today
                    </p>
                    <div className="space-y-1">
                      {grouped.today.map(n => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onRead={markAsRead}
                          onArchive={archiveNotification}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Yesterday */}
                {grouped.yesterday.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 mb-1">
                      Yesterday
                    </p>
                    <div className="space-y-1">
                      {grouped.yesterday.map(n => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onRead={markAsRead}
                          onArchive={archiveNotification}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Older */}
                {grouped.older.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 mb-1">
                      Earlier
                    </p>
                    <div className="space-y-1">
                      {grouped.older.map(n => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onRead={markAsRead}
                          onArchive={archiveNotification}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/[0.06] bg-surface-2/30">
            <button className="
              w-full py-2 rounded-lg
              text-xs text-text-tertiary
              hover:text-text-secondary hover:bg-surface-2
              transition-colors
            ">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
