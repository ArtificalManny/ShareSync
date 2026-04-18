// src/components/social/LiveActivityFeed.jsx
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Rocket,
  Flame,
  Trophy,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

import ActivityFeedItem, { ActivityFeedItemSkeleton } from './ActivityFeedItem';
import * as MomentumModule from '../../contexts/MomentumContext';

/* ─────────────────────────────────────────────────────────────────────────
   SAFE MOMENTUM CONTEXT
───────────────────────────────────────────────────────────────────────── */
const useSafeMomentumContext =
  MomentumModule.useMomentumContext ||
  (() => ({
    glowLevel: 2,
    isFireMode: false,
  }));

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR (kept for fallback mode)
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_USERS = [
  { id: '1', name: 'Sarah Chen', avatar: null, isOnline: true },
  { id: '2', name: 'Alex Rivera', avatar: null, isOnline: true },
  { id: '3', name: 'Jordan Park', avatar: null, isOnline: false },
  { id: '4', name: 'Morgan Lee', avatar: null, isOnline: true },
  { id: '5', name: 'Taylor Kim', avatar: null, isOnline: false },
  { id: '6', name: 'Casey Zhang', avatar: null, isOnline: true },
];

const MOCK_PROJECTS = [
  'ShareSync v2', 'API Integration', 'Mobile App', 'Dashboard Redesign',
  'User Analytics', 'Performance Optimization', 'Security Audit',
];

const MOCK_TASKS = [
  'Fix login bug', 'Write documentation', 'Review PR #142', 'Update tests',
  'Design landing page', 'Implement dark mode', 'Add notifications',
];

const MOCK_ACHIEVEMENTS = [
  'Speed Demon', 'Streak Master', 'Early Bird', 'Night Owl',
  'Team Player', 'Ship Captain', 'Bug Hunter', 'Code Ninja',
];

const generateMockActivity = (id) => {
  const types = ['ship', 'streak', 'level_up', 'achievement', 'task_complete', 'focus', 'milestone'];
  const type = types[Math.floor(Math.random() * types.length)];
  const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];

  const activity = {
    id: id || String(Date.now()),
    type,
    user,
    timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 4),
    reactions: Math.floor(Math.random() * 5),
    comments: Math.floor(Math.random() * 3),
  };

  switch (type) {
    case 'ship':
      activity.target = MOCK_PROJECTS[Math.floor(Math.random() * MOCK_PROJECTS.length)];
      activity.description = 'Successfully deployed to production';
      break;
    case 'streak':
      activity.value = Math.floor(Math.random() * 20) + 5;
      break;
    case 'level_up':
      activity.value = Math.floor(Math.random() * 10) + 2;
      break;
    case 'achievement':
      activity.target = MOCK_ACHIEVEMENTS[Math.floor(Math.random() * MOCK_ACHIEVEMENTS.length)];
      break;
    case 'task_complete':
      activity.target = MOCK_TASKS[Math.floor(Math.random() * MOCK_TASKS.length)];
      break;
    case 'focus':
      activity.description = '25 minute focus session';
      break;
    case 'milestone':
      activity.target = `${Math.floor(Math.random() * 100) + 10} tasks completed`;
      break;
  }

  return activity;
};

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER TABS
// ═══════════════════════════════════════════════════════════════════════════════
const FilterTabs = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { key: 'all', label: 'All', icon: Activity },
    { key: 'ship', label: 'Ships', icon: Rocket },
    { key: 'streak', label: 'Streaks', icon: Flame },
    { key: 'achievement', label: 'Achievements', icon: Trophy },
  ];

  return (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold
            transition-all duration-200
            ${activeFilter === filter.key
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-white/5'
            }
          `}
        >
          <filter.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{filter.label}</span>
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEW ACTIVITY INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════
const NewActivityIndicator = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={onClick}
      className="
        absolute top-2 left-1/2 -translate-x-1/2 z-10
        flex items-center gap-2 px-4 py-2 rounded-full
        text-white text-xs font-bold tracking-wide
        shadow-lg hover:-translate-y-0.5 transition-all duration-200
      "
      style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}
    >
      <ChevronUp className="w-4 h-4" />
      {count} new {count === 1 ? 'activity' : 'activities'}
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTION STATUS
// ═══════════════════════════════════════════════════════════════════════════════
const ConnectionStatus = ({ isConnected, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${isConnected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-zinc-500'}`}>
      {isConnected ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE ACTIVITY SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
const LiveActivitySummary = ({ activities }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const lastHour = activities.filter((a) => (now - new Date(a.timestamp)) < 1000 * 60 * 60);

    return {
      ships: lastHour.filter((a) => a.type === 'ship').length,
      tasks: lastHour.filter((a) => a.type === 'task_complete').length,
      total: lastHour.length,
    };
  }, [activities]);

  if (stats.total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="px-5 py-2.5 bg-violet-50 dark:bg-violet-500/10 border-b border-violet-100 dark:border-violet-500/20"
    >
      <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
        <span className="text-violet-700 dark:text-violet-400 font-bold">{stats.total} activities</span> in the last hour
        {stats.ships > 0 && <span> • {stats.ships} ships</span>}
        {stats.tasks > 0 && <span> • {stats.tasks} tasks</span>}
      </p>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Normalize injected activity (from useHomeRealtime) -> ActivityFeedItem shape
// Expected injected item: { id, type, actorName, projectName, createdAt, raw }
// Output:
// { id, type, user: { name }, timestamp, target, description, reactions, comments }
function normalizeInjected(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr.map((a, idx) => {
    const rawType = String(a?.type || 'activity').toLowerCase();

    let type = 'task_complete';
    if (rawType.includes('ship') || rawType.includes('project_ship')) type = 'ship';
    else if (rawType.includes('streak')) type = 'streak';
    else if (rawType.includes('achievement')) type = 'achievement';
    else if (rawType.includes('level')) type = 'level_up';
    else if (rawType.includes('focus')) type = 'focus';
    else if (rawType.includes('milestone')) type = 'milestone';
    else if (rawType.includes('announcement')) type = 'announcement';
    else if (rawType.includes('comment') || rawType.includes('thread') || rawType.includes('message_sent')) type = 'comment';
    else if (rawType.includes('avatar') || rawType.includes('profile')) type = 'profile_update';
    else if (rawType.includes('task_created') || rawType.includes('task.created')) type = 'task_created';
    else if (rawType.includes('task_updated') || rawType.includes('task.updated') || rawType.includes('task.moved') || rawType.includes('task_moved')) type = 'task_updated';
    else if (rawType.includes('task_completed') || rawType.includes('task.completed') || rawType.includes('completed') || rawType.includes('task_complete')) type = 'task_complete';
    else if (rawType.includes('task_deleted') || rawType.includes('task.deleted')) type = 'task_deleted';
    else if (rawType.includes('member_added') || rawType.includes('join')) type = 'join';
    else if (rawType.includes('file') || rawType.includes('upload')) type = 'file_upload';
    else if (rawType.includes('user.updated') || rawType.includes('user.avatar') || rawType.includes('user.profile')) type = 'profile_update';

    const baseId = a?.id || a?._id || `tmp-${Date.now()}-${idx}`;

    return {
      id: String(baseId),
      type,
      user: {
        id: a?.raw?.actorId || a?.raw?.userId || a?.actorName || 'user',
        name: a?.actorName || (a?.raw?.userId?.firstName ? `${a.raw.userId.firstName} ${a.raw.userId.lastName || ''}`.trim() : null) || (a?.userId?.firstName ? `${a.userId.firstName} ${a.userId.lastName || ''}`.trim() : null) || 'Someone',
        avatar: a?.raw?.avatar || null,
        isOnline: true,
      },
      timestamp: new Date(a?.createdAt || a?.timestamp || Date.now()),
      target: a?.raw?.payload?.snapshot?.title || a?.raw?.raw?.payload?.snapshot?.title || a?.raw?.taskTitle || a?.raw?.raw?.taskTitle || a?.raw?.target || null,
      description: a?.projectName || a?.raw?.projectName || a?.raw?.description || a?.description || null,
      reactions: a?.raw?.reactions ?? a?.reactions ?? 0,
      comments: a?.raw?.comments ?? a?.comments ?? 0,
      raw: a,
    };
  });
}

function dedupeAndSort(items, maxItems) {
  const map = new Map();
  for (const item of items) {
    if (!item?.id) continue;
    // keep the newest version if duplicates
    const existing = map.get(item.id);
    if (!existing) map.set(item.id, item);
    else {
      const a = new Date(existing.timestamp).getTime();
      const b = new Date(item.timestamp).getTime();
      map.set(item.id, b >= a ? item : existing);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxItems);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function LiveActivityFeed({
  // Data
  initialActivities = [],
  injectedItems = null, // ✅ real-time injection (array)

  // Options
  maxItems = 20,
  showFilters = true,
  showSummary = true,
  showHeader = true,
  autoRefresh = true,
  refreshInterval = 30000,
  variant = 'default',

  // Actions
  onActivityClick,
  onLoadMore,

  // Styling
  className = '',
}) {
  const usingInjected = Array.isArray(injectedItems);

  const [activities, setActivities] = useState(initialActivities);
  const [loading, setLoading] = useState(!usingInjected && initialActivities.length === 0);
  const [filter, setFilter] = useState('all');
  const [newCount, setNewCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  const feedRef = useRef(null);
  const prevTopIdRef = useRef(null);

  const { isFireMode } = useSafeMomentumContext();

  // Normalize injected
  const injectedNormalized = useMemo(() => {
    if (!usingInjected) return [];
    return normalizeInjected(injectedItems);
  }, [usingInjected, injectedItems]);

  // Normalize initialActivities too
  const baseNormalized = useMemo(() => {
    const arr = Array.isArray(initialActivities) ? initialActivities : [];
    const already = arr.every((a) => a && a.user && a.timestamp);
    if (already) return arr;
    return normalizeInjected(arr);
  }, [initialActivities]);

  // Build displayed list
  const displayedActivities = useMemo(() => {
    if (usingInjected) {
      return dedupeAndSort([...baseNormalized, ...injectedNormalized], maxItems);
    }
    return dedupeAndSort(activities, maxItems);
  }, [usingInjected, baseNormalized, injectedNormalized, activities, maxItems]);

  // Initial load (mock fallback only)
  useEffect(() => {
    if (usingInjected) {
      setLoading(false);
      return;
    }

    if (initialActivities.length === 0) {
      setLoading(true);
      setTimeout(() => {
        const mockActivities = Array.from({ length: 10 }, (_, i) =>
          generateMockActivity(`initial-${i}`)
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setActivities(mockActivities);
        setLoading(false);
      }, 800);
    } else {
      setLoading(false);
    }
  }, [initialActivities, usingInjected]);

  // Auto-refresh (mock only)
  useEffect(() => {
    if (!autoRefresh) return;
    if (usingInjected) return; 

    const interval = setInterval(() => {
      if (Math.random() < 0.2) {
        const newActivity = generateMockActivity();
        newActivity.timestamp = new Date();

        setActivities((prev) => [newActivity, ...prev].slice(0, maxItems));

        if (feedRef.current && feedRef.current.scrollTop > 50) {
          setNewCount((prev) => prev + 1);
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, maxItems, usingInjected]);

  // ✅ New activity indicator for injected mode
  useEffect(() => {
    if (!usingInjected) return;

    const topId = displayedActivities?.[0]?.id || null;
    const prevTop = prevTopIdRef.current;

    if (!prevTop) {
      prevTopIdRef.current = topId;
      return;
    }

    if (topId && topId !== prevTop) {
      if (feedRef.current && feedRef.current.scrollTop > 50) {
        setNewCount((prev) => prev + 1);
      }
      prevTopIdRef.current = topId;
    }
  }, [usingInjected, displayedActivities]);

  // Filter
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return displayedActivities;
    if (filter === 'achievement') {
      return displayedActivities.filter((a) => ['achievement', 'level_up', 'streak'].includes(a.type));
    }
    return displayedActivities.filter((a) => a.type === filter);
  }, [displayedActivities, filter]);

  const handleScrollToTop = () => {
    feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setNewCount(0);
  };

  const handleScroll = () => {
    if (feedRef.current?.scrollTop === 0) {
      setNewCount(0);
    }
  };

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className={`bg-white dark:bg-[#1f1f23] rounded-xl border border-slate-200 dark:border-white/10 shadow-[0_2px_12px_rgba(139,92,246,0.04)] overflow-hidden ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-transparent dark:border-white/5"
        >
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isFireMode ? 'text-amber-500' : 'text-violet-500'}`} />
            <span className="text-[14px] font-bold text-slate-800 dark:text-white">Team Activity</span>
            {newCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-bold">
                {newCount}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-2 pb-3 max-h-[300px] overflow-y-auto space-y-1">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <ActivityFeedItemSkeleton key={i} variant="compact" />
                  ))
                ) : filteredActivities.length > 0 ? (
                  filteredActivities.slice(0, 5).map((activity, i) => (
                    <ActivityFeedItem
                      key={activity.id}
                      activity={activity}
                      variant="compact"
                      showReactions={false}
                      isNew={i === 0 && newCount > 0}
                      onClick={() => onActivityClick?.(activity)}
                    />
                  ))
                ) : (
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 text-center py-4">No recent activity</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default/compact
  return (
    <div
      className={`
        bg-white dark:bg-[#1f1f23] rounded-xl border border-slate-200 dark:border-white/10 shadow-[0_4px_24px_rgba(139,92,246,0.06)] overflow-hidden
        ${isFireMode ? 'ring-1 ring-amber-500/20' : ''}
        ${className}
      `}
    >
      {showHeader && (
        <div className="p-5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className={`w-5 h-5 ${isFireMode ? 'text-amber-500' : 'text-violet-500'}`} />
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight">Team Activity</h3>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase tracking-widest">LIVE</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ConnectionStatus isConnected={isConnected} isLoading={loading} />

              <button
                onClick={() => setNotifications(!notifications)}
                className={`p-2 rounded-xl transition-all ${
                  notifications ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
                title={notifications ? 'Mute notifications' : 'Enable notifications'}
              >
                {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showFilters && <FilterTabs activeFilter={filter} onFilterChange={setFilter} />}
        </div>
      )}

      {showSummary && <LiveActivitySummary activities={displayedActivities} />}

      <div ref={feedRef} onScroll={handleScroll} className="relative max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {newCount > 0 && <NewActivityIndicator count={newCount} onClick={handleScrollToTop} />}
        </AnimatePresence>

        <div className="p-3 space-y-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <ActivityFeedItemSkeleton key={i} variant={variant === 'compact' ? 'compact' : 'default'} />
            ))
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity, index) => (
              <ActivityFeedItem
                key={activity.id}
                activity={activity}
                variant={variant === 'compact' ? 'compact' : 'default'}
                isNew={index === 0 && newCount > 0}
                animate={index < 5}
                onClick={() => onActivityClick?.(activity)}
              />
            ))
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-[15px] font-bold text-slate-800 dark:text-white mb-1">No activity yet</p>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Be the first to ship something and build momentum!</p>
            </div>
          )}
        </div>

        {onLoadMore && filteredActivities.length >= maxItems && (
          <div className="p-4 border-t border-slate-200 dark:border-white/10 text-center">
            <button
              onClick={onLoadMore}
              className="px-6 py-2 rounded-xl bg-slate-50 dark:bg-white/5 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5"
            >
              Load more activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MiniActivityFeed({ maxItems = 3, className = '' }) {
  return (
    <LiveActivityFeed
      maxItems={maxItems}
      showFilters={false}
      showSummary={false}
      showHeader={false}
      variant="compact"
      className={className}
    />
  );
}
