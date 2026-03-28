// src/components/social/Leaderboard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Leaderboard (Premium Podium)
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

const PeriodTabs = ({ activePeriod, onPeriodChange }) => (
  <div className="flex gap-1.5 p-1.5 bg-surface-secondary rounded-xl border border-border-default">
    {[{key: 'week', label: 'This Week'}, {key: 'month', label: 'This Month'}, {key: 'all', label: 'All Time'}].map(p => (
      <button key={p.key} onClick={() => onPeriodChange(p.key)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activePeriod === p.key ? 'bg-surface-primary text-text-primary shadow-sm border border-border-default' : 'text-text-tertiary hover:text-text-secondary'}`}>
        {p.label}
      </button>
    ))}
  </div>
);

const SortTabs = ({ activeSort, onSortChange }) => {
  const sorts = [
    { key: 'xp', label: 'XP', icon: Zap, color: 'text-brand', bg: 'bg-brand-subtle' },
    { key: 'ships', label: 'Ships', icon: Rocket, color: 'text-info-600', bg: 'bg-info-subtle' },
    { key: 'streak', label: 'Streak', icon: Flame, color: 'text-warning', bg: 'bg-warning-subtle' },
  ];
  return (
    <div className="flex gap-2">
      {sorts.map(s => (
        <button key={s.key} onClick={() => onSortChange(s.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${activeSort === s.key ? `${s.bg} ${s.color} border border-${s.color.split('-')[1]}-200` : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary border border-transparent'}`}>
          <s.icon className="w-3.5 h-3.5" /> {s.label}
        </button>
      ))}
    </div>
  );
};

const PodiumView = ({ topThree }) => {
  if (topThree.length < 3) return null;
  const [first, second, third] = topThree;
  
  const PodiumPlace = ({ entry, position }) => {
    const configs = {
      1: { height: 'h-32', color: 'from-amber-400 to-amber-600', icon: Crown, ring: 'ring-amber-300', shadow: 'shadow-amber-500/40' },
      2: { height: 'h-24', color: 'from-slate-300 to-slate-500', icon: Medal, ring: 'ring-slate-300', shadow: 'shadow-slate-500/30' },
      3: { height: 'h-20', color: 'from-orange-400 to-orange-700', icon: Award, ring: 'ring-orange-300', shadow: 'shadow-orange-600/30' },
    };
    const c = configs[position];
    const isYou = entry.id === 'you';
    
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: position * 0.1 }} className={`flex flex-col items-center flex-1 ${position === 1 ? 'order-2 z-10' : position === 2 ? 'order-1' : 'order-3'}`}>
        <div className="relative mb-3">
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-black text-xl ring-4 ${c.ring} shadow-lg ${c.shadow} ${isYou ? 'ring-brand animate-pulse' : ''}`}>
            {entry.user.name.charAt(0)}
          </div>
          <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md border-2 border-surface-primary`}>
            <c.icon className="w-4 h-4 text-white drop-shadow-sm" />
          </div>
        </div>
        <p className={`text-[13px] font-black tracking-tight mb-1 truncate w-full text-center px-2 ${isYou ? 'text-brand' : 'text-text-primary'}`}>
          {entry.user.name.split(' ')[0]} {isYou && <span className="text-[10px] text-brand-400 uppercase">You</span>}
        </p>
        <p className="text-[12px] font-bold text-text-secondary mb-3 tabular-nums">{entry.stats.xp?.toLocaleString()} XP</p>
        <div className={`w-full max-w-[100px] ${c.height} rounded-t-2xl bg-gradient-to-t ${c.color} opacity-[0.15] flex items-start justify-center pt-4 border-t-4 border-white/20`}>
          <span className="text-3xl font-black text-text-primary opacity-40">{position}</span>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="flex items-end justify-center gap-2 md:gap-4 pt-6 px-4 mb-8">
      <PodiumPlace entry={second} position={2} />
      <PodiumPlace entry={first} position={1} />
      <PodiumPlace entry={third} position={3} />
    </div>
  );
};

const YourPositionCard = ({ yourEntry, aheadEntry, behindXP }) => {
  if (!yourEntry) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-brand-subtle border border-brand-200 mb-8 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-primary border border-brand-100 flex items-center justify-center shadow-sm">
            <Target className="w-6 h-6 text-brand" />
          </div>
          <div>
            <p className="text-[15px] font-black text-text-primary tracking-tight">You're #{yourEntry.rank}</p>
            {aheadEntry && behindXP > 0 && (
              <p className="text-[12px] font-medium text-text-secondary mt-0.5">
                <span className="text-brand font-bold">{behindXP} XP</span> behind {aheadEntry.user.name.split(' ')[0]}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-brand tabular-nums tracking-tight">{yourEntry.stats.xp?.toLocaleString()} XP</p>
          <div className="flex items-center justify-end gap-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider mt-1">
            <span className="flex items-center gap-1"><Rocket className="w-3 h-3 text-info-500" />{yourEntry.stats.ships}</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-warning" />{yourEntry.stats.streak}d</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Leaderboard({ data = MOCK_LEADERBOARD, currentUserId = 'you', showPodium = true, showYourPosition = true, showPeriodTabs = true, showSortTabs = true, maxVisible = 10, variant = 'default', onUserClick, onViewAll, className = '' }) {
  const [period, setPeriod] = useState('week');
  const [sortBy, setSortBy] = useState('xp');
  const [loading, setLoading] = useState(false);
  
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try { momentumContext = useMomentumContext(); } catch (e) {}
  const { isFireMode } = momentumContext;

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => (b.stats[sortBy] || 0) - (a.stats[sortBy] || 0)).map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [data, sortBy]);

  const yourEntry = sortedData.find(e => e.id === currentUserId);
  const yourRank = yourEntry?.rank || 0;
  const aheadEntry = yourRank > 1 ? sortedData[yourRank - 2] : null;
  const behindXP = aheadEntry ? (aheadEntry.stats.xp || 0) - (yourEntry?.stats.xp || 0) : 0;
  const topThree = sortedData.slice(0, 3);
  const visibleEntries = showPodium ? sortedData.slice(3, maxVisible) : sortedData.slice(0, maxVisible);

  if (variant === 'sidebar') {
    return (
      <div className={`card-surface overflow-hidden ${className}`}>
        <div className="p-5 border-b border-border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className={`w-4 h-4 ${isFireMode ? 'text-warning' : 'text-brand'}`} />
              <h3 className="text-[14px] font-black text-text-primary tracking-tight">Leaderboard</h3>
            </div>
            {onViewAll && <button onClick={onViewAll} className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider hover:text-brand transition-colors">View all</button>}
          </div>
        </div>
        <div className="p-3 space-y-1.5 bg-surface-primary">
          {loading ? Array.from({ length: 5 }).map((_, i) => <LeaderboardRowSkeleton key={i} variant="compact" />)
            : sortedData.slice(0, 5).map((entry, i) => <LeaderboardRow key={entry.id} rank={entry.rank} user={entry.user} stats={entry.stats} change={entry.change} isYou={entry.id === currentUserId} variant="compact" showStats={false} showTrend={false} index={i} onClick={() => onUserClick?.(entry)} />)}
        </div>
        {yourEntry && yourRank > 5 && (
          <div className="px-3 pb-3 bg-surface-primary">
            <div className="border-t border-border-default pt-3 mt-1">
              <LeaderboardRow rank={yourRank} user={yourEntry.user} stats={yourEntry.stats} change={yourEntry.change} isYou={true} variant="compact" showStats={false} showTrend={false} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`card-surface overflow-hidden ${className}`}>
      <div className="p-6 border-b border-border-default">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-subtle rounded-xl flex items-center justify-center border border-brand-200 shadow-sm">
              <Trophy className={`w-6 h-6 ${isFireMode ? 'text-warning' : 'text-brand'}`} />
            </div>
            <div>
              <h3 className="text-[20px] font-black text-text-primary tracking-tight">Live Rankings</h3>
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider flex items-center mt-1">
                <Users className="w-3.5 h-3.5 inline mr-1.5" /> {data.length} members competing
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {showSortTabs && <SortTabs activeSort={sortBy} onSortChange={setSortBy} />}
            {showPeriodTabs && <PeriodTabs activePeriod={period} onPeriodChange={setPeriod} />}
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-surface-primary">
        {showYourPosition && yourEntry && <YourPositionCard yourEntry={yourEntry} aheadEntry={aheadEntry} behindXP={behindXP} />}
        {showPodium && topThree.length >= 3 && <PodiumView topThree={topThree} />}
        
        <div className="space-y-2">
          {loading ? Array.from({ length: 5 }).map((_, i) => <LeaderboardRowSkeleton key={i} />)
            : visibleEntries.length > 0 ? visibleEntries.map((entry, i) => (
              <LeaderboardRow key={entry.id} rank={entry.rank} user={entry.user} stats={entry.stats} change={entry.change} isYou={entry.id === currentUserId} variant={entry.id === currentUserId ? 'highlight' : 'default'} index={i} onClick={() => onUserClick?.(entry)} />
            )) : (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
              <p className="text-[15px] font-bold text-text-primary tracking-tight">No rankings yet</p>
              <p className="text-[13px] text-text-secondary mt-1">Start shipping to climb the leaderboard!</p>
            </div>
          )}
        </div>
        
        {onViewAll && sortedData.length > maxVisible && (
          <button onClick={onViewAll} className="w-full mt-6 py-3.5 rounded-xl font-bold bg-surface-secondary border border-border-default text-[13px] text-text-secondary hover:text-brand hover:border-brand-200 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5">
            View all {sortedData.length} members <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function MiniLeaderboard({ data = MOCK_LEADERBOARD, currentUserId = 'you', maxVisible = 5, onViewAll, className = '' }) {
  return <Leaderboard data={data} currentUserId={currentUserId} showPodium={false} showYourPosition={false} showPeriodTabs={false} showSortTabs={false} maxVisible={maxVisible} variant="sidebar" onViewAll={onViewAll} className={className} />;
}
