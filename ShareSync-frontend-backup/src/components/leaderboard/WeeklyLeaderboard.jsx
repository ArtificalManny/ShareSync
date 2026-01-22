// src/components/leaderboard/WeeklyLeaderboard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.2: Momentum Streaks - Weekly Leaderboard
// ═══════════════════════════════════════════════════════════════════════════════
//
// Full leaderboard component with category tabs and time period filters.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Flame, Zap, Users, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { useLeaderboard, LEADERBOARD_CATEGORIES, TIME_PERIODS } from '../../hooks/useLeaderboard';
import LeaderboardEntry from './LeaderboardEntry';
import { ComebackOfTheWeek } from './ComebackBadge';

/**
 * WeeklyLeaderboard - Main leaderboard component
 */
export default function WeeklyLeaderboard({ 
  defaultCategory = LEADERBOARD_CATEGORIES.STREAKS,
  showComeback = true,
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [period, setPeriod] = useState(TIME_PERIODS.WEEKLY);

  const { leaderboard, loading, error, myEntry, podium, rest } = useLeaderboard({
    category,
    period,
    limit: 10,
  });

  const categories = [
    { id: LEADERBOARD_CATEGORIES.STREAKS, label: 'Streaks', icon: Flame, color: 'text-warning' },
    { id: LEADERBOARD_CATEGORIES.SHIPS, label: 'Ships', icon: Zap, color: 'text-brand' },
    { id: LEADERBOARD_CATEGORIES.XP, label: 'XP', icon: Trophy, color: 'text-success' },
    { id: LEADERBOARD_CATEGORIES.COLLABORATORS, label: 'Team', icon: Users, color: 'text-info' },
  ];

  const periods = [
    { id: TIME_PERIODS.DAILY, label: 'Today' },
    { id: TIME_PERIODS.WEEKLY, label: 'This Week' },
    { id: TIME_PERIODS.MONTHLY, label: 'This Month' },
    { id: TIME_PERIODS.ALL_TIME, label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
                whitespace-nowrap transition-all
                ${isActive 
                  ? 'bg-brand text-white shadow-lg shadow-brand/25' 
                  : 'bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? '' : cat.color}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-text-tertiary" />
        <div className="flex items-center gap-1 bg-surface-1 rounded-lg p-1">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`
                px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${period === p.id 
                  ? 'bg-surface-3 text-text-primary' 
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-1 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 rounded-xl bg-error/10 border border-error/20 text-center">
          <p className="text-error">Failed to load leaderboard</p>
        </div>
      )}

      {/* Leaderboard */}
      {!loading && !error && (
        <>
          {/* Podium (Top 3) */}
          {podium.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {/* 2nd Place */}
              {podium[1] && (
                <PodiumCard entry={podium[1]} position={2} category={category} />
              )}
              {/* 1st Place */}
              {podium[0] && (
                <PodiumCard entry={podium[0]} position={1} category={category} />
              )}
              {/* 3rd Place */}
              {podium[2] && (
                <PodiumCard entry={podium[2]} position={3} category={category} />
              )}
            </div>
          )}

          {/* Rest of Leaderboard */}
          <div className="space-y-2">
            {rest.map(entry => (
              <LeaderboardEntry 
                key={entry.id} 
                entry={entry} 
                category={category}
              />
            ))}
          </div>

          {/* My Position (if not in top 10) */}
          {myEntry && myEntry.rank > 10 && (
            <div className="pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-text-tertiary mb-2">Your Position</p>
              <LeaderboardEntry entry={myEntry} category={category} />
            </div>
          )}
        </>
      )}

      {/* Comeback of the Week */}
      {showComeback && period === TIME_PERIODS.WEEKLY && (
        <div className="pt-6 border-t border-white/[0.06]">
          <ComebackOfTheWeek 
            winner={{
              name: 'Taylor Brooks',
              avatar: '👩‍🎤',
              username: 'taylor_pm',
              previousStreak: 45,
              daysOff: 7,
              newStreak: 21,
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Podium Card - Top 3 display
 */
function PodiumCard({ entry, position, category }) {
  const heights = { 1: 'h-40', 2: 'h-32', 3: 'h-28' };
  const medals = { 1: '🥇', 2: '��', 3: '🥉' };
  const gradients = {
    1: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
    2: 'from-slate-400/20 to-slate-500/20 border-slate-400/30',
    3: 'from-amber-600/20 to-orange-600/20 border-amber-600/30',
  };

  const getStatValue = () => {
    switch (category) {
      case LEADERBOARD_CATEGORIES.STREAKS:
        return `${entry.streak}d`;
      case LEADERBOARD_CATEGORIES.SHIPS:
        return entry.ships;
      case LEADERBOARD_CATEGORIES.XP:
        return entry.xp.toLocaleString();
      case LEADERBOARD_CATEGORIES.COLLABORATORS:
        return entry.projectsContributed;
      default:
        return '';
    }
  };

  return (
    <div className={`
      relative flex flex-col items-center justify-end
      ${heights[position]} pt-4
      ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}
    `}>
      {/* Avatar */}
      <div className={`
        absolute -top-2 w-16 h-16 rounded-2xl
        bg-gradient-to-br ${gradients[position]}
        border flex items-center justify-center text-3xl
        ${entry.isMe ? 'ring-2 ring-brand' : ''}
      `}>
        {entry.avatar}
      </div>

      {/* Pedestal */}
      <div className={`
        w-full h-full rounded-t-xl
        bg-gradient-to-b ${gradients[position]}
        border border-b-0 flex flex-col items-center justify-end pb-3
      `}>
        <span className="text-3xl mb-1">{medals[position]}</span>
        <span className={`font-semibold text-sm truncate px-2 ${entry.isMe ? 'text-brand' : 'text-text-primary'}`}>
          {entry.name}
        </span>
        <span className="text-xl font-bold text-text-primary">
          {getStatValue()}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact Leaderboard - For sidebar/dock
 */
export function CompactLeaderboard({ limit = 5, category = LEADERBOARD_CATEGORIES.STREAKS }) {
  const { leaderboard, loading, myRank } = useLeaderboard({ category, limit });

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-surface-2 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {leaderboard.map(entry => (
        <LeaderboardEntry 
          key={entry.id} 
          entry={entry} 
          category={category}
          compact
          showTrend={false}
        />
      ))}
      {myRank && myRank > limit && (
        <div className="pt-2 mt-2 border-t border-white/[0.06] text-center text-xs text-text-tertiary">
          You're #{myRank} — keep shipping!
        </div>
      )}
    </div>
  );
}
