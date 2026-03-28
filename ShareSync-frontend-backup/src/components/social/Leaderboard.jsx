// src/components/social/Leaderboard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: Social Proof & FOMO - Premium Leaderboard
// - Upgraded Podium with Gold/Silver/Bronze gradients and heavy font weighting.
// - High-Contrast Gallery Walk typography.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Zap, Rocket, Flame, TrendingUp, ChevronRight, Crown, Medal, Award, Target, Users } from 'lucide-react';
import LeaderboardRow, { LeaderboardRowSkeleton } from './LeaderboardRow';
import { useMomentumContext } from '../../contexts/MomentumContext';

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

const PeriodTabs = ({ activePeriod, onPeriodChange }) => {
  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];
  return (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
      {periods.map(period => (
        <button
          key={period.key}
          onClick={() => onPeriodChange(period.key)}
          className={`
            px-3 py-1.5 rounded-md text-[12px] font-bold tracking-wide
            transition-all duration-200
            ${activePeriod === period.key
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

const SortTabs = ({ activeSort, onSortChange }) => {
  const sorts = [
    { key: 'xp', label: 'XP', icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-200' },
    { key: 'ships', label: 'Ships', icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200' },
    { key: 'streak', label: 'Streak', icon: Flame, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200' },
  ];
  return (
    <div className="flex gap-2">
      {sorts.map(sort => (
        <button
          key={sort.key}
          onClick={() => onSortChange(sort.key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wide border
            transition-all duration-200
            ${activeSort === sort.key
              ? `${sort.bg} ${sort.color}`
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-white/5'
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

const PodiumView = ({ topThree }) => {
  if (topThree.length < 3) return null;
  const [first, second, third] = topThree;
  
  const PodiumPlace = ({ entry, position }) => {
    // Gold, Silver, Bronze premium gradients
    const configs = {
      1: { height: 'h-32', color: 'from-[#FDE68A] via-[#F59E0B] to-[#D97706]', icon: Crown, ring: 'ring-[#FEF3C7]' },
      2: { height: 'h-24', color: 'from-[#E2E8F0] via-[#94A3B8] to-[#64748B]', icon: Medal, ring: 'ring-[#F8FAFC]' },
      3: { height: 'h-16', color: 'from-[#FDBA74] via-[#EA580C] to-[#C2410C]', icon: Award, ring: 'ring-[#FFEDD5]' },
    };
    
    const config = configs[position];
    const Icon = config.icon;
    const isYou = entry.id === 'you';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: position * 0.1 }}
        className={`flex flex-col items-center ${position === 1 ? 'order-2 z-10' : position === 2 ? 'order-1' : 'order-3'}`}
      >
        <div className="relative mb-3 group">
          <div className={`
            w-16 h-16 rounded-full bg-gradient-to-br ${config.color}
            flex items-center justify-center text-white font-black text-xl
            ring-4 ${config.ring} shadow-lg transition-transform duration-300 group-hover:-translate-y-1
            ${isYou ? 'ring-violet-400' : ''}
          `}>
            {entry.user.name.charAt(0)}
          </div>
          <div className={`
            absolute -bottom-2 -right-2 w-7 h-7 rounded-full
            bg-gradient-to-br ${config.color}
            flex items-center justify-center
            shadow-md border-[3px] border-white dark:border-[#1f1f23]
          `}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        
        <p className={`text-[13px] font-black tracking-tight mb-1 ${isYou ? 'text-violet-600 dark:text-violet-400' : 'text-slate-900 dark:text-white'}`}>
          {entry.user.name.split(' ')[0]}
          {isYou && <span className="text-[10px] text-violet-500 ml-1">(You)</span>}
        </p>
        
        <p className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-widest">
          {entry.stats.xp?.toLocaleString()} XP
        </p>
        
        <div className={`
          w-24 ${config.height} rounded-t-2xl border-t border-x border-white/40
          bg-gradient-to-t ${config.color} opacity-90
          flex items-end justify-center pb-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]
        `}>
          <span className="text-3xl font-black text-white drop-shadow-md">
            {position}
          </span>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4 pt-6 mt-4 mb-8">
      <PodiumPlace entry={second} position={2} />
      <PodiumPlace entry={first} position={1} />
      <PodiumPlace entry={third} position={3} />
    </div>
  );
};

const YourPositionCard = ({ yourEntry, aheadEntry, behindXP }) => {
  if (!yourEntry) return null;
  const yourRank = yourEntry.rank;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-violet-200 dark:border-violet-500/20 mb-8 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1f1f23] shadow-sm flex items-center justify-center border border-violet-100 dark:border-white/5">
            <Target className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">
              You're #{yourRank}
            </p>
            {aheadEntry && behindXP > 0 && (
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                <span className="text-violet-700 dark:text-violet-400 font-bold">{behindXP} XP</span> behind {aheadEntry.user.name.split(' ')[0]}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-[24px] font-black text-violet-600 dark:text-violet-400 tabular-nums leading-none mb-1.5">
            {yourEntry.stats.xp?.toLocaleString()} XP
          </p>
          <div className="flex items-center justify-end gap-3 text-[12px] font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Rocket className="w-3.5 h-3.5 text-blue-500" />
              {yourEntry.stats.ships}
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {yourEntry.stats.streak}d
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Leaderboard({
  data = MOCK_LEADERBOARD,
  currentUserId = 'you',
  showPodium = true,
  showYourPosition = true,
  showPeriodTabs = true,
  showSortTabs = true,
  maxVisible = 10,
  variant = 'default',
  onUserClick,
  onViewAll,
  className = '',
}) {
  const [period, setPeriod] = useState('week');
  const [sortBy, setSortBy] = useState('xp');
  const [loading, setLoading] = useState(false);
  
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try { momentumContext = useMomentumContext(); } catch (e) {}
  const { isFireMode } = momentumContext;

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => (b.stats[sortBy] || 0) - (a.stats[sortBy] || 0));
    return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [data, sortBy]);

  const yourEntry = sortedData.find(e => e.id === currentUserId);
  const yourRank = yourEntry?.rank || 0;
  const aheadEntry = yourRank > 1 ? sortedData[yourRank - 2] : null;
  const behindXP = aheadEntry ? (aheadEntry.stats.xp || 0) - (yourEntry?.stats.xp || 0) : 0;
  const topThree = sortedData.slice(0, 3);
  const visibleEntries = showPodium ? sortedData.slice(3, maxVisible) : sortedData.slice(0, maxVisible);

  if (variant === 'sidebar') {
    return (
      <div className={`rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-[0_2px_12px_rgba(139,92,246,0.04)] overflow-hidden ${className}`}>
        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className={`w-4 h-4 ${isFireMode ? 'text-amber-500' : 'text-violet-500'}`} />
              <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">Leaderboard</h3>
            </div>
            {onViewAll && (
              <button onClick={onViewAll} className="text-[11px] font-bold text-slate-500 hover:text-violet-600 uppercase tracking-widest transition-colors">
                View all
              </button>
            )}
          </div>
        </div>
        
        <div className="p-2 space-y-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <LeaderboardRowSkeleton key={i} variant="compact" />)
          ) : (
            sortedData.slice(0, 5).map((entry, i) => (
              <LeaderboardRow
                key={entry.id} rank={entry.rank} user={entry.user} stats={entry.stats} change={entry.change}
                isYou={entry.id === currentUserId} variant="compact" showStats={false} showTrend={false} index={i}
                onClick={() => onUserClick?.(entry)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-[0_4px_24px_rgba(139,92,246,0.06)] overflow-hidden ${className}`}>
      <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center shadow-sm">
              <Trophy className={`w-6 h-6 ${isFireMode ? 'text-amber-500' : 'text-violet-600 dark:text-violet-400'}`} />
            </div>
            <div>
              <h3 className="text-[20px] font-black text-slate-900 dark:text-white tracking-tight">Leaderboard</h3>
              <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5 mt-1 uppercase tracking-widest">
                <Users className="w-3.5 h-3.5" />
                {data.length} members
              </span>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            {showSortTabs && <SortTabs activeSort={sortBy} onSortChange={setSortBy} />}
            {showPeriodTabs && <PeriodTabs activePeriod={period} onPeriodChange={setPeriod} />}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {showYourPosition && yourEntry && (
          <YourPositionCard yourEntry={yourEntry} aheadEntry={aheadEntry} behindXP={behindXP} />
        )}
        
        {showPodium && topThree.length >= 3 && <PodiumView topThree={topThree} />}
        
        <div className="space-y-2 mt-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <LeaderboardRowSkeleton key={i} />)
          ) : visibleEntries.length > 0 ? (
            visibleEntries.map((entry, i) => (
              <LeaderboardRow
                key={entry.id} rank={entry.rank} user={entry.user} stats={entry.stats} change={entry.change}
                isYou={entry.id === currentUserId} variant={entry.id === currentUserId ? 'highlight' : 'default'} index={i}
                onClick={() => onUserClick?.(entry)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-[15px] font-bold text-slate-800 dark:text-white">No rankings yet</p>
              <p className="text-[13px] font-medium text-slate-500 mt-1">Start shipping to climb the leaderboard!</p>
            </div>
          )}
        </div>
        
        {onViewAll && sortedData.length > maxVisible && (
          <button
            onClick={onViewAll}
            className="w-full mt-6 py-4 rounded-xl font-bold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[13px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            View all {sortedData.length} members
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function MiniLeaderboard({ 
  data = MOCK_LEADERBOARD,
  currentUserId = 'you',
  maxVisible = 5,
  onViewAll,
  className = '' 
}) {
  return (
    <Leaderboard
      data={data} currentUserId={currentUserId} showPodium={false} showYourPosition={false} showPeriodTabs={false} showSortTabs={false} maxVisible={maxVisible} variant="sidebar" onViewAll={onViewAll} className={className}
    />
  );
}
