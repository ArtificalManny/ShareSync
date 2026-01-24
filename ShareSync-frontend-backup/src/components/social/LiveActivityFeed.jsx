// src/components/social/LiveActivityFeed.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Live Activity Feed
// ═══════════════════════════════════════════════════════════════════════════════
//
// Real-time feed showing what teammates are accomplishing.
// Creates FOMO by showing continuous stream of productivity.
//
// Key Features:
// - Real-time updates (simulated with polling/websocket)
// - "New activity" indicator
// - Filter by activity type
// - Highlight important achievements
// - Auto-scroll for new items
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Rocket, 
  Flame, 
  Trophy,
  Filter,
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
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
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
    timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 4), // Last 4 hours
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
    <div className="flex gap-1 p-1 bg-surface-1 rounded-lg">
      {filters.map(filter => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
            transition-all duration-200
            ${activeFilter === filter.key
              ? 'bg-surface-2 text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
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
        flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-brand-500 text-white text-xs font-medium
        shadow-lg shadow-brand-500/30
        hover:bg-brand-600 transition-colors
      "
    >
      <ChevronUp className="w-3.5 h-3.5" />
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
      <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-success' : 'text-text-tertiary'}`}>
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
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
    const lastHour = activities.filter(a => 
      (now - new Date(a.timestamp)) < 1000 * 60 * 60
    );
    
    return {
      ships: lastHour.filter(a => a.type === 'ship').length,
      tasks: lastHour.filter(a => a.type === 'task_complete').length,
      total: lastHour.length,
    };
  }, [activities]);
  
  if (stats.total === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="px-4 py-2 bg-brand-500/5 border-b border-brand-500/10"
    >
      <p className="text-xs text-text-secondary">
        <span className="text-brand-400 font-medium">{stats.total} activities</span> in the last hour
        {stats.ships > 0 && <span> • {stats.ships} ships</span>}
        {stats.tasks > 0 && <span> • {stats.tasks} tasks</span>}
      </p>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function LiveActivityFeed({
  // Data
  initialActivities = [],
  
  // Options
  maxItems = 20,
  showFilters = true,
  showSummary = true,
  showHeader = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  variant = 'default', // 'default' | 'compact' | 'sidebar'
  
  // Actions
  onActivityClick,
  onLoadMore,
  
  // Styling
  className = '',
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [loading, setLoading] = useState(initialActivities.length === 0);
  const [filter, setFilter] = useState('all');
  const [newCount, setNewCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const feedRef = useRef(null);
  const lastActivityRef = useRef(null);
  
  // Get momentum context
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try {
    momentumContext = useMomentumContext();
  } catch (e) {}
  
  const { glowLevel, isFireMode } = momentumContext;

  // Initial load
  useEffect(() => {
    if (initialActivities.length === 0) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockActivities = Array.from({ length: 10 }, (_, i) => 
          generateMockActivity(`initial-${i}`)
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setActivities(mockActivities);
        setLoading(false);
      }, 1000);
    }
  }, [initialActivities]);

  // Auto-refresh for new activities
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Simulate receiving new activity (20% chance each interval)
      if (Math.random() < 0.2) {
        const newActivity = generateMockActivity();
        newActivity.timestamp = new Date();
        
        setActivities(prev => [newActivity, ...prev].slice(0, maxItems));
        
        // If user has scrolled down, show "new activity" indicator
        if (feedRef.current && feedRef.current.scrollTop > 50) {
          setNewCount(prev => prev + 1);
        }
      }
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, maxItems]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    if (filter === 'achievement') {
      return activities.filter(a => ['achievement', 'level_up', 'streak'].includes(a.type));
    }
    return activities.filter(a => a.type === filter);
  }, [activities, filter]);

  // Scroll to top when clicking "new activity" indicator
  const handleScrollToTop = () => {
    feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setNewCount(0);
  };

  // Handle scroll
  const handleScroll = () => {
    if (feedRef.current?.scrollTop === 0) {
      setNewCount(0);
    }
  };

  // Compact sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isFireMode ? 'text-energy-500' : 'text-brand-400'}`} />
            <span className="text-sm font-medium text-text-primary">Team Activity</span>
            {newCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-medium">
                {newCount}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-tertiary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          )}
        </button>
        
        {/* Content */}
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
                  <p className="text-xs text-text-tertiary text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default/compact variant
  return (
    <div className={`
      rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden
      ${isFireMode ? 'border-energy-500/10' : ''}
      ${className}
    `}>
      {/* Header */}
      {showHeader && (
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${isFireMode ? 'text-energy-500' : 'text-brand-400'}`} />
              <h3 className="text-sm font-medium text-text-primary">Team Activity</h3>
              
              {/* Live indicator */}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/10">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-success font-medium">LIVE</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ConnectionStatus isConnected={isConnected} isLoading={loading} />
              
              <button
                onClick={() => setNotifications(!notifications)}
                className={`p-1.5 rounded-lg transition-colors ${
                  notifications 
                    ? 'text-brand-400 bg-brand-500/10' 
                    : 'text-text-tertiary hover:bg-surface-2'
                }`}
                title={notifications ? 'Mute notifications' : 'Enable notifications'}
              >
                {notifications ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <FilterTabs activeFilter={filter} onFilterChange={setFilter} />
          )}
        </div>
      )}
      
      {/* Summary */}
      {showSummary && <LiveActivitySummary activities={activities} />}
      
      {/* Feed */}
      <div 
        ref={feedRef}
        onScroll={handleScroll}
        className="relative max-h-[400px] overflow-y-auto"
      >
        {/* New activity indicator */}
        <AnimatePresence>
          {newCount > 0 && (
            <NewActivityIndicator count={newCount} onClick={handleScrollToTop} />
          )}
        </AnimatePresence>
        
        {/* Activity list */}
        <div className="p-2 space-y-1">
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
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No activity yet</p>
              <p className="text-xs text-text-tertiary mt-1">
                Be the first to ship something!
              </p>
            </div>
          )}
        </div>
        
        {/* Load more */}
        {onLoadMore && filteredActivities.length >= maxItems && (
          <div className="p-3 border-t border-white/[0.06]">
            <button
              onClick={onLoadMore}
              className="w-full py-2 rounded-lg bg-surface-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI FEED (for embedding in other components)
// ═══════════════════════════════════════════════════════════════════════════════
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
