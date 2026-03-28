// src/components/social/LiveActivityFeed.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// LIVE FEED - Phase 2 Polish (Gebbia-Grade Visuals)
// Features: Tactile card surfaces, standard grid, live glowing indicators.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Rocket, Flame, Trophy, Bell, BellOff,
  ChevronDown, ChevronUp, Sparkles, RefreshCw, Wifi, WifiOff,
} from 'lucide-react';

import ActivityFeedItem, { ActivityFeedItemSkeleton } from './ActivityFeedItem';
import * as MomentumModule from '../../contexts/MomentumContext';

const useSafeMomentumContext =
  MomentumModule.useMomentumContext ||
  (() => ({ glowLevel: 2, isFireMode: false }));

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER TABS
// ═══════════════════════════════════════════════════════════════════════════════
const FilterTabs = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { key: 'all', label: 'All', icon: Activity },
    { key: 'ship', label: 'Ships', icon: Rocket },
    { key: 'streak', label: 'Streaks', icon: Flame },
    { key: 'achievement', label: 'Badges', icon: Trophy },
  ];

  return (
    <div className="flex gap-1.5 p-1.5 bg-surface-secondary rounded-xl border border-border-default/50">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200
            ${activeFilter === filter.key
              ? 'bg-surface-primary text-text-primary shadow-sm border border-border-default'
              : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-primary/50 border border-transparent'
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
        absolute top-4 left-1/2 -translate-x-1/2 z-10
        flex items-center gap-2 px-4 py-2 rounded-full
        bg-brand text-white text-[12px] font-bold uppercase tracking-wider
        shadow-lg shadow-brand-500/30 border border-brand-400
        hover:bg-brand-600 hover:-translate-y-0.5 transition-all
      "
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
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-tertiary uppercase tracking-widest">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${isConnected ? 'text-success' : 'text-text-tertiary'}`}>
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
      className="px-6 py-3 bg-brand-subtle border-b border-brand-200"
    >
      <p className="text-[12px] font-bold text-brand-600 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span><strong className="text-brand font-black">{stats.total} activities</strong> in the last hour</span>
        {stats.ships > 0 && <span className="text-brand-400">• {stats.ships} ships</span>}
      </p>
    </motion.div>
  );
};

// ... [Normalization logic remains unchanged as it's data processing, not UI] ...
function normalizeInjected(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr.map((a, idx) => {
    const rawType = String(a?.type || 'activity').toLowerCase();
    let type = 'task_complete';
    if (rawType.includes('ship')) type = 'ship';
    else if (rawType.includes('streak')) type = 'streak';
    else if (rawType.includes('achievement')) type = 'achievement';
    else if (rawType.includes('level')) type = 'level_up';
    else if (rawType.includes('focus')) type = 'focus';
    else if (rawType.includes('milestone')) type = 'milestone';

    const baseId = a?.id || a?._id || `tmp-${Date.now()}-${idx}`;
    return {
      id: String(baseId), type,
      user: { id: a?.raw?.actorId || a?.raw?.userId || a?.actorName || 'user', name: a?.actorName || 'Someone', avatar: a?.raw?.avatar || null, isOnline: true },
      timestamp: new Date(a?.createdAt || a?.timestamp || Date.now()),
      target: a?.projectName || a?.raw?.target || a?.raw?.projectName || null,
      description: a?.raw?.description || a?.description || null,
      reactions: a?.raw?.reactions ?? a?.reactions ?? 0, comments: a?.raw?.comments ?? a?.comments ?? 0, raw: a,
    };
  });
}

function dedupeAndSort(items, maxItems) {
  const map = new Map();
  for (const item of items) {
    if (!item?.id) continue;
    const existing = map.get(item.id);
    if (!existing) map.set(item.id, item);
    else {
      const a = new Date(existing.timestamp).getTime();
      const b = new Date(item.timestamp).getTime();
      map.set(item.id, b >= a ? item : existing);
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, maxItems);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function LiveActivityFeed({
  initialActivities = [], injectedItems = null,
  maxItems = 20, showFilters = true, showSummary = true, showHeader = true,
  autoRefresh = true, refreshInterval = 30000, variant = 'default',
  onActivityClick, onLoadMore, className = '',
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

  const injectedNormalized = useMemo(() => {
    if (!usingInjected) return [];
    return normalizeInjected(injectedItems);
  }, [usingInjected, injectedItems]);

  const baseNormalized = useMemo(() => {
    const arr = Array.isArray(initialActivities) ? initialActivities : [];
    const already = arr.every((a) => a && a.user && a.timestamp);
    if (already) return arr;
    return normalizeInjected(arr);
  }, [initialActivities]);

  const displayedActivities = useMemo(() => {
    if (usingInjected) return dedupeAndSort([...baseNormalized, ...injectedNormalized], maxItems);
    return dedupeAndSort(activities, maxItems);
  }, [usingInjected, baseNormalized, injectedNormalized, activities, maxItems]);

  useEffect(() => {
    if (usingInjected) { setLoading(false); return; }
    if (initialActivities.length === 0) { setLoading(false); }
  }, [initialActivities, usingInjected]);

  useEffect(() => {
    if (!usingInjected) return;
    const topId = displayedActivities?.[0]?.id || null;
    const prevTop = prevTopIdRef.current;
    if (!prevTop) { prevTopIdRef.current = topId; return; }
    if (topId && topId !== prevTop) {
      if (feedRef.current && feedRef.current.scrollTop > 50) setNewCount((prev) => prev + 1);
      prevTopIdRef.current = topId;
    }
  }, [usingInjected, displayedActivities]);

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return displayedActivities;
    if (filter === 'achievement') return displayedActivities.filter((a) => ['achievement', 'level_up', 'streak'].includes(a.type));
    return displayedActivities.filter((a) => a.type === filter);
  }, [displayedActivities, filter]);

  const handleScrollToTop = () => { feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); setNewCount(0); };
  const handleScroll = () => { if (feedRef.current?.scrollTop === 0) setNewCount(0); };

  if (variant === 'sidebar') {
    return (
      <div className={`card-surface overflow-hidden ${className}`}>
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-5 hover:bg-surface-secondary transition-colors">
          <div className="flex items-center gap-2.5">
            <Activity className={`w-4 h-4 ${isFireMode ? 'text-warning' : 'text-brand'}`} />
            <span className="text-[14px] font-black text-text-primary tracking-tight">Team Activity</span>
            {newCount > 0 && <span className="px-2 py-0.5 rounded-full bg-brand text-white text-[10px] font-bold shadow-sm">{newCount}</span>}
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-3 pb-4 max-h-[350px] overflow-y-auto space-y-1">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <ActivityFeedItemSkeleton key={i} variant="compact" />)
                ) : filteredActivities.length > 0 ? (
                  filteredActivities.slice(0, 5).map((activity, i) => (
                    <ActivityFeedItem key={activity.id} activity={activity} variant="compact" showReactions={false} isNew={i === 0 && newCount > 0} onClick={() => onActivityClick?.(activity)} />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider">No recent activity</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`card-surface overflow-hidden ${isFireMode ? 'border-warning-200 ring-1 ring-warning-200/50' : ''} ${className}`}>
      {showHeader && (
        <div className="p-6 border-b border-border-default">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isFireMode ? 'bg-warning-subtle' : 'bg-brand-subtle'}`}>
                 <Activity className={`w-4 h-4 ${isFireMode ? 'text-warning' : 'text-brand'}`} />
              </div>
              <h3 className="text-[16px] font-black text-text-primary tracking-tight">Team Activity</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success-subtle border border-success-200 shadow-sm ml-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-glow-success" />
                <span className="text-[10px] text-success font-black tracking-widest uppercase">Live</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ConnectionStatus isConnected={isConnected} isLoading={loading} />
              <button onClick={() => setNotifications(!notifications)} className={`p-2 rounded-xl transition-colors ${notifications ? 'text-brand bg-brand-subtle' : 'text-text-tertiary hover:bg-surface-secondary'}`} title={notifications ? 'Mute notifications' : 'Enable notifications'}>
                {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {showFilters && <FilterTabs activeFilter={filter} onFilterChange={setFilter} />}
        </div>
      )}

      {showSummary && <LiveActivitySummary activities={displayedActivities} />}

      <div ref={feedRef} onScroll={handleScroll} className="relative max-h-[500px] overflow-y-auto bg-surface-secondary/20">
        <AnimatePresence>
          {newCount > 0 && <NewActivityIndicator count={newCount} onClick={handleScrollToTop} />}
        </AnimatePresence>

        <div className="p-3 space-y-1.5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <ActivityFeedItemSkeleton key={i} variant={variant === 'compact' ? 'compact' : 'default'} />)
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity, index) => (
              <ActivityFeedItem key={activity.id} activity={activity} variant={variant === 'compact' ? 'compact' : 'default'} isNew={index === 0 && newCount > 0} animate={index < 5} onClick={() => onActivityClick?.(activity)} />
            ))
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-10 h-10 text-text-tertiary mx-auto mb-4 opacity-50" />
              <p className="text-[15px] font-bold text-text-primary tracking-tight">No activity yet</p>
              <p className="text-[13px] font-medium text-text-secondary mt-1">Be the first to ship something today!</p>
            </div>
          )}
        </div>

        {onLoadMore && filteredActivities.length >= maxItems && (
          <div className="p-4 border-t border-border-default bg-surface-primary">
            <button onClick={onLoadMore} className="w-full py-2.5 rounded-xl bg-surface-secondary text-[13px] font-bold text-text-secondary hover:text-text-primary hover:border-brand-200 border border-transparent transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
              Load older activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MiniActivityFeed({ maxItems = 3, className = '' }) {
  return (
    <LiveActivityFeed maxItems={maxItems} showFilters={false} showSummary={false} showHeader={false} variant="compact" className={className} />
  );
}
