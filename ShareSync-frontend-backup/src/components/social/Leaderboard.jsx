// src/components/social/Leaderboard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Leaderboard
// ═══════════════════════════════════════════════════════════════════════════════
//
// Weekly/monthly leaderboard showing team rankings.
// Creates healthy competition and FOMO.
//
// Key Features:
// - Time period tabs (This Week, This Month, All Time)
// - Sort by metric (XP, Ships, Streak)
// - Highlight current user's position
// - Show "You're X XP behind #Y" message
// - Podium view for top 3
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Calendar,
  Zap,
  Rocket,
  Flame,
  TrendingUp,
  ChevronRight,
  Crown,
  Medal,
  Award,
  Target,
  Users,
} from 'lucide-react';

import LeaderboardRow, { LeaderboardRowSkeleton } from './LeaderboardRow';
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_LEADERBOARD = [
  { id: '1', user: { name: 'Sarah Chen', title: 'Product Designer', isOnline: true }, stats: { xp: 2450, ships: 12, streak: 14 }, change: 2 },
  { id: '2', user: { name: 'Alex Rivera', title: 'Backend Engineer', isOnline: true }, stats: { xp: 2320, ships: 15, streak: 7 }, change: 0 },
  { id: '3', user: { name: 'Jordan Park', title: 'Frontend Developer', isOnline: false }, stats: { xp: 2180, ships: 11, streak: 21 }, change: -1 },
  { id: 'you', user: { name: 'You', title: 'Software Developer', isOnline: true }, stats: { xp: 1950, ships: 9, streak: 7 }, change: 1 },
  { id: '5', user: { name: 'Morgan Lee', title: 'DevOps Engineer', isOnline: true }, stats: { xp: 1820, ships: 8, streak: 5 }, change: -2 },
  { id: '6', user: { name: 'Taylor Kim', title: 'QA Engineer', isOnline: false }, stats: { xp: 1650, ships: 7, streak: 3 }, change: 0 },
  { id: '7', user: { name: 'Casey Zhang', title: 'Data Scientist', isOnline: true }, stats: { xp: 1540, ships: 6, streak: 9 }, change: 3 },
  { id: '8', user: { name: 'Riley Johnson', title: 'UX Researcher', isOnline: false }, stats: { xp: 1420, ships: 5, streak: 2 }, change: -1 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PERIOD TABS
// ═══════════════════════════════════════════════════════════════════════════════
const PeriodTabs = ({ activePeriod, onPeriodChange }) => {
  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];
  
  return (
    <div className="flex gap-1 p-1 bg-surface-1 rounded-lg">
      {periods.map(period => (
        <button
          key={period.key}
          onClick={() => onPeriodChange(period.key)}
          className={`
            px-3 py-1.5 rounded-md text-xs font-medium
            transition-all duration-200
            ${activePeriod === period.key
              ? 'bg-surface-2 text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SORT TABS
// ═══════════════════════════════════════════════════════════════════════════════
const SortTabs = ({ activeSort, onSortChange }) => {
  const sorts = [
    { key: 'xp', label: 'XP', icon: Zap, color: 'text-brand-400' },
    { key: 'ships', label: 'Ships', icon: Rocket, color: 'text-cyan-400' },
    { key: 'streak', label: 'Streak', icon: Flame, color: 'text-warning-500' },
  ];
  
  return (
    <div className="flex gap-2">
      {sorts.map(sort => (
        <button
          key={sort.key}
          onClick={() => onSortChange(sort.key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-200
            ${activeSort === sort.key
              ? `bg-surface-2 ${sort.color}`
              : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-1'
            }
          `}
        >
          <sort.icon className="w-3.5 h-3.5" />
          {sort.label}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PODIUM VIEW (Top 3)
// ═══════════════════════════════════════════════════════════════════════════════
const PodiumView = ({ topThree }) => {
  if (topThree.length < 3) return null;
  
  const [first, second, third] = topThree;
  
  const PodiumPlace = ({ entry, position }) => {
    const configs = {
      1: { height: 'h-28', color: 'from-yellow-400 to-yellow-600', icon: Crown, ring: 'ring-yellow-500/30' },
      2: { height: 'h-20', color: 'from-slate-300 to-slate-500', icon: Medal, ring: 'ring-slate-400/30' },
      3: { height: 'h-16', color: 'from-amber-600 to-amber-800', icon: Award, ring: 'ring-amber-600/30' },
    };
    
    const config = configs[position];
    const Icon = config.icon;
    const isYou = entry.id === 'you';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: position * 0.1 }}
        className={`flex flex-col items-center ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}`}
      >
        {/* Avatar with ring */}
        <div className="relative mb-2">
          <div className={`
            w-14 h-14 rounded-full bg-gradient-to-br ${config.color}
            flex items-center justify-center text-white font-bold text-lg
            ring-4 ${config.ring}
            ${isYou ? 'ring-brand-500' : ''}
          `}>
            {entry.user.name.charAt(0)}
          </div>
          <div className={`
            absolute -bottom-1 -right-1 w-6 h-6 rounded-full
            bg-gradient-to-br ${config.color}
            flex items-center justify-center
            shadow-lg
          `}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        
        {/* Name */}
        <p className={`text-sm font-medium mb-1 ${isYou ? 'text-brand-400' : 'text-text-primary'}`}>
          {entry.user.name}
          {isYou && <span className="text-xs text-brand-300"> (You)</span>}
        </p>
        
        {/* XP */}
        <p className="text-xs text-text-tertiary mb-2">
          {entry.stats.xp?.toLocaleString()} XP
        </p>
        
        {/* Podium */}
        <div className={`
          w-20 ${config.height} rounded-t-lg
          bg-gradient-to-t ${config.color} opacity-20
          flex items-end justify-center pb-2
        `}>
          <span className="text-2xl font-bold text-white opacity-50">
            {position}
          </span>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="flex items-end justify-center gap-4 py-6 mb-6 border-b border-white/[0.06]">
      <PodiumPlace entry={second} position={2} />
      <PodiumPlace entry={first} position={1} />
      <PodiumPlace entry={third} position={3} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// YOUR POSITION CARD
// ═══════════════════════════════════════════════════════════════════════════════
const YourPositionCard = ({ yourEntry, aheadEntry, behindXP }) => {
  if (!yourEntry) return null;
  
  const yourRank = yourEntry.rank;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              You're #{yourRank}
            </p>
            {aheadEntry && behindXP > 0 && (
              <p className="text-xs text-text-secondary">
                <span className="text-brand-400 font-medium">{behindXP} XP</span> behind {aheadEntry.user.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-bold text-brand-400 tabular-nums">
            {yourEntry.stats.xp?.toLocaleString()} XP
          </p>
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Rocket className="w-3 h-3 text-cyan-400" />
              {yourEntry.stats.ships}
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-warning-500" />
              {yourEntry.stats.streak}d
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Leaderboard({
  // Data
  data = MOCK_LEADERBOARD,
  currentUserId = 'you',
  
  // Options
  showPodium = true,
  showYourPosition = true,
  showPeriodTabs = true,
  showSortTabs = true,
  maxVisible = 10,
  variant = 'default', // 'default' | 'compact' | 'sidebar'
  
  // Actions
  onUserClick,
  onViewAll,
  
  // Styling
  className = '',
}) {
  const [period, setPeriod] = useState('week');
  const [sortBy, setSortBy] = useState('xp');
  const [loading, setLoading] = useState(false);
  
  // Get momentum context
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try {
    momentumContext = useMomentumContext();
  } catch (e) {}
  
  const { glowLevel, isFireMode } = momentumContext;

  // Sort and rank data
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aVal = a.stats[sortBy] || 0;
      const bVal = b.stats[sortBy] || 0;
      return bVal - aVal;
    });
    
    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [data, sortBy]);

  // Find current user
  const yourEntry = sortedData.find(e => e.id === currentUserId);
  const yourRank = yourEntry?.rank || 0;
  
  // Find person ahead
  const aheadEntry = yourRank > 1 ? sortedData[yourRank - 2] : null;
  const behindXP = aheadEntry ? (aheadEntry.stats.xp || 0) - (yourEntry?.stats.xp || 0) : 0;

  // Top 3 for podium
  const topThree = sortedData.slice(0, 3);
  
  // Visible entries (excluding top 3 if showing podium)
  const visibleEntries = showPodium 
    ? sortedData.slice(3, maxVisible) 
    : sortedData.slice(0, maxVisible);

  // Compact sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className={`w-4 h-4 ${isFireMode ? 'text-energy-500' : 'text-warning-500'}`} />
              <h3 className="text-sm font-medium text-text-primary">Leaderboard</h3>
            </div>
            {onViewAll && (
              <button 
                onClick={onViewAll}
                className="text-xs text-text-tertiary hover:text-brand-400 transition-colors"
              >
                View all
              </button>
            )}
          </div>
        </div>
        
        {/* Top entries */}
        <div className="p-2 space-y-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <LeaderboardRowSkeleton key={i} variant="compact" />
            ))
          ) : (
            sortedData.slice(0, 5).map((entry, i) => (
              <LeaderboardRow
                key={entry.id}
                rank={entry.rank}
                user={entry.user}
                stats={entry.stats}
                change={entry.change}
                isYou={entry.id === currentUserId}
                variant="compact"
                showStats={false}
                showTrend={false}
                index={i}
                onClick={() => onUserClick?.(entry)}
              />
            ))
          )}
        </div>
        
        {/* Your position (if not in top 5) */}
        {yourEntry && yourRank > 5 && (
          <div className="px-2 pb-2">
            <div className="border-t border-white/[0.06] pt-2 mt-1">
              <LeaderboardRow
                rank={yourRank}
                user={yourEntry.user}
                stats={yourEntry.stats}
                change={yourEntry.change}
                isYou={true}
                variant="compact"
                showStats={false}
                showTrend={false}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default full leaderboard
  return (
    <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${isFireMode ? 'text-energy-500' : 'text-warning-500'}`} />
            <h3 className="text-lg font-semibold text-text-primary">Leaderboard</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-2 text-xs text-text-tertiary">
              <Users className="w-3 h-3 inline mr-1" />
              {data.length} members
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {showSortTabs && (
              <SortTabs activeSort={sortBy} onSortChange={setSortBy} />
            )}
            {showPeriodTabs && (
              <PeriodTabs activePeriod={period} onPeriodChange={setPeriod} />
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Your position card */}
        {showYourPosition && yourEntry && (
          <YourPositionCard 
            yourEntry={yourEntry}
            aheadEntry={aheadEntry}
            behindXP={behindXP}
          />
        )}
        
        {/* Podium */}
        {showPodium && topThree.length >= 3 && (
          <PodiumView topThree={topThree} />
        )}
        
        {/* List */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <LeaderboardRowSkeleton key={i} />
            ))
          ) : visibleEntries.length > 0 ? (
            visibleEntries.map((entry, i) => (
              <LeaderboardRow
                key={entry.id}
                rank={entry.rank}
                user={entry.user}
                stats={entry.stats}
                change={entry.change}
                isYou={entry.id === currentUserId}
                variant={entry.id === currentUserId ? 'highlight' : 'default'}
                index={i}
                onClick={() => onUserClick?.(entry)}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No rankings yet</p>
              <p className="text-xs text-text-tertiary mt-1">
                Start shipping to climb the leaderboard!
              </p>
            </div>
          )}
        </div>
        
        {/* View all button */}
        {onViewAll && sortedData.length > maxVisible && (
          <button
            onClick={onViewAll}
            className="
              w-full mt-4 py-2.5 rounded-lg
              bg-surface-2 text-sm text-text-secondary
              hover:text-text-primary hover:bg-surface-3
              transition-colors flex items-center justify-center gap-2
            "
          >
            View all {sortedData.length} members
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI LEADERBOARD (for dashboard widgets)
// ═══════════════════════════════════════════════════════════════════════════════
export function MiniLeaderboard({ 
  data = MOCK_LEADERBOARD,
  currentUserId = 'you',
  maxVisible = 5,
  onViewAll,
  className = '' 
}) {
  return (
    <Leaderboard
      data={data}
      currentUserId={currentUserId}
      showPodium={false}
      showYourPosition={false}
      showPeriodTabs={false}
      showSortTabs={false}
      maxVisible={maxVisible}
      variant="sidebar"
      onViewAll={onViewAll}
      className={className}
    />
  );
}
