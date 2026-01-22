// src/components/leaderboard/LeaderboardEntry.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.2: Momentum Streaks - Leaderboard Entry Row
// ═══════════════════════════════════════════════════════════════════════════════
//
// Individual row in the leaderboard with rank, user, and stats.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, Flame, Zap, Users } from 'lucide-react';
import StreakBadge from './StreakBadge';
import { LEADERBOARD_CATEGORIES } from '../../hooks/useLeaderboard';

/**
 * LeaderboardEntry - Single leaderboard row
 */
export default function LeaderboardEntry({ 
  entry,
  category = LEADERBOARD_CATEGORIES.STREAKS,
  showTrend = true,
  compact = false,
}) {
  const { 
    rank, 
    name, 
    avatar, 
    username,
    isMe, 
    trend, 
    previousRank,
    achievements = [],
  } = entry;

  // Rank display
  const rankDisplay = () => {
    if (rank === 1) return { text: '🥇', class: 'text-yellow-400' };
    if (rank === 2) return { text: '🥈', class: 'text-slate-300' };
    if (rank === 3) return { text: '🥉', class: 'text-amber-600' };
    return { text: `#${rank}`, class: 'text-text-tertiary' };
  };

  // Trend icon
  const trendIcon = () => {
    const rankChange = previousRank - rank;
    if (rankChange > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (rankChange < 0) return <TrendingDown className="w-4 h-4 text-error" />;
    return <Minus className="w-4 h-4 text-text-tertiary" />;
  };

  // Stats based on category
  const renderStats = () => {
    switch (category) {
      case LEADERBOARD_CATEGORIES.STREAKS:
        return (
          <div className="flex items-center gap-3">
            <StreakBadge days={entry.streak} size={compact ? 'sm' : 'md'} />
            {!compact && entry.longestStreak && (
              <span className="text-xs text-text-tertiary">
                Best: {entry.longestStreak}d
              </span>
            )}
          </div>
        );
      
      case LEADERBOARD_CATEGORIES.SHIPS:
        return (
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand" />
            <span className="font-semibold text-text-primary">{entry.ships}</span>
            <span className="text-xs text-text-tertiary">ships</span>
            {!compact && entry.avgShipsPerDay && (
              <span className="text-xs text-text-tertiary ml-2">
                ({entry.avgShipsPerDay}/day)
              </span>
            )}
          </div>
        );
      
      case LEADERBOARD_CATEGORIES.XP:
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-brand">{entry.xp.toLocaleString()}</span>
            <span className="text-xs text-text-tertiary">XP</span>
            {!compact && entry.level && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                Lv {entry.level}
              </span>
            )}
          </div>
        );
      
      case LEADERBOARD_CATEGORIES.COLLABORATORS:
        return (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-info" />
            <span className="font-semibold text-text-primary">{entry.projectsContributed}</span>
            <span className="text-xs text-text-tertiary">projects</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className={`
        flex items-center gap-3 p-2 rounded-lg
        ${isMe ? 'bg-brand/10 border border-brand/20' : 'hover:bg-surface-2'}
        transition-colors
      `}>
        {/* Rank */}
        <div className={`w-8 text-center font-bold ${rankDisplay().class}`}>
          {rankDisplay().text}
        </div>

        {/* Avatar */}
        <span className="text-xl">{avatar}</span>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm truncate ${isMe ? 'text-brand font-medium' : 'text-text-primary'}`}>
            {name}
          </span>
        </div>

        {/* Stats */}
        {renderStats()}
      </div>
    );
  }

  return (
    <div className={`
      flex items-center gap-4 p-4 rounded-xl
      ${isMe 
        ? 'bg-brand/10 border-2 border-brand/30 shadow-lg shadow-brand/5' 
        : 'bg-surface-1 border border-white/[0.06] hover:bg-surface-2'
      }
      transition-all duration-200
    `}>
      {/* Rank */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
        ${rank <= 3 ? 'bg-gradient-to-br from-warning to-orange-500 text-white' : 'bg-surface-2'}
        ${rankDisplay().class}
      `}>
        {rankDisplay().text}
      </div>

      {/* Avatar & Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl
          ${isMe ? 'bg-brand/20 ring-2 ring-brand' : 'bg-surface-2'}
        `}>
          {avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold truncate ${isMe ? 'text-brand' : 'text-text-primary'}`}>
              {name}
            </span>
            {isMe && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand text-white">
                You
              </span>
            )}
          </div>
          <span className="text-xs text-text-tertiary">@{username}</span>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="hidden md:flex items-center gap-1">
          {achievements.slice(0, 3).map((_, i) => (
            <Award key={i} className="w-4 h-4 text-warning" />
          ))}
          {achievements.length > 3 && (
            <span className="text-xs text-text-tertiary">+{achievements.length - 3}</span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="text-right">
        {renderStats()}
      </div>

      {/* Trend */}
      {showTrend && (
        <div className="w-8 flex justify-center">
          {trendIcon()}
        </div>
      )}
    </div>
  );
}
