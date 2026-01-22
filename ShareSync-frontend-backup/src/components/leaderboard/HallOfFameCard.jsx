// src/components/leaderboard/HallOfFameCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.2: Momentum Streaks - Hall of Fame Card
// ═══════════════════════════════════════════════════════════════════════════════
//
// Premium card for hall of fame entries with achievements showcase.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Crown, Flame, Zap, Award, TrendingUp, Calendar } from 'lucide-react';
import StreakBadge from './StreakBadge';

/**
 * HallOfFameCard - Featured hall of fame entry
 */
export default function HallOfFameCard({ 
  user,
  category,
  rank,
  featured = false,
}) {
  const getCategoryIcon = () => {
    switch (category) {
      case 'streakers': return <Flame className="w-5 h-5 text-warning" />;
      case 'shippers': return <Zap className="w-5 h-5 text-brand" />;
      case 'collaborators': return <Award className="w-5 h-5 text-info" />;
      default: return <Crown className="w-5 h-5 text-warning" />;
    }
  };

  const getMainStat = () => {
    switch (category) {
      case 'streakers':
        return { value: user.streak, label: 'day streak', icon: Flame };
      case 'shippers':
        return { value: user.totalShips, label: 'ships', icon: Zap };
      case 'collaborators':
        return { value: user.projectsContributed, label: 'projects', icon: Award };
      default:
        return { value: user.totalXP, label: 'XP', icon: TrendingUp };
    }
  };

  const stat = getMainStat();
  const StatIcon = stat.icon;

  if (featured) {
    return (
      <div className="
        relative p-6 rounded-2xl overflow-hidden
        bg-gradient-to-br from-warning/20 via-surface-1 to-brand/20
        border border-warning/30
      ">
        {/* Crown badge */}
        <div className="absolute top-4 right-4">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-warning" />
          </div>
        </div>

        {/* Rank */}
        <div className="text-6xl font-black text-warning/30 absolute top-2 left-4">
          #{rank}
        </div>

        {/* Content */}
        <div className="relative pt-8">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-warning/25">
            {user.avatar}
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold text-text-primary text-center mb-1">
            {user.name}
          </h3>
          <p className="text-sm text-text-tertiary text-center mb-4">
            @{user.username}
          </p>

          {/* Main Stat */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2">
              <StatIcon className="w-6 h-6 text-warning" />
              <span className="text-4xl font-black text-warning">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </span>
            </div>
            <span className="text-sm text-text-secondary">{stat.label}</span>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-2 text-center">
              <div className="text-lg font-bold text-text-primary">
                {user.totalXP?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-text-tertiary">Total XP</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-2 text-center">
              <div className="text-lg font-bold text-text-primary">
                {user.achievements?.length || 0}
              </div>
              <div className="text-xs text-text-tertiary">Achievements</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      p-4 rounded-xl
      ${user.isMe 
        ? 'bg-brand/10 border-2 border-brand/30' 
        : 'bg-surface-1 border border-white/[0.06]'
      }
      hover:bg-surface-2 transition-colors
    `}>
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center font-bold
          ${rank <= 3 
            ? 'bg-gradient-to-br from-warning to-orange-500 text-white' 
            : 'bg-surface-2 text-text-tertiary'
          }
        `}>
          {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
        </div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${user.isMe ? 'bg-brand/20' : 'bg-surface-2'}
          `}>
            {user.avatar}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-semibold truncate ${user.isMe ? 'text-brand' : 'text-text-primary'}`}>
                {user.name}
              </span>
              {user.isMe && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand text-white">
                  You
                </span>
              )}
            </div>
            <span className="text-xs text-text-tertiary">@{user.username}</span>
          </div>
        </div>

        {/* Category Icon */}
        <div className="hidden sm:block">
          {getCategoryIcon()}
        </div>

        {/* Main Stat */}
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <StatIcon className="w-4 h-4 text-warning" />
            <span className="text-xl font-bold text-text-primary">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </span>
          </div>
          <span className="text-xs text-text-tertiary">{stat.label}</span>
        </div>

        {/* Achievements */}
        {user.achievements?.length > 0 && (
          <div className="hidden md:flex items-center gap-0.5">
            {user.achievements.slice(0, 3).map((_, i) => (
              <Award key={i} className="w-4 h-4 text-warning" />
            ))}
            {user.achievements.length > 3 && (
              <span className="text-xs text-text-tertiary ml-1">
                +{user.achievements.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * HallOfFamePodium - Top 3 showcase
 */
export function HallOfFamePodium({ entries, category }) {
  if (entries.length < 3) return null;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* 2nd Place */}
      <div className="order-1">
        <HallOfFameCard user={entries[1]} category={category} rank={2} />
      </div>
      {/* 1st Place */}
      <div className="order-2">
        <HallOfFameCard user={entries[0]} category={category} rank={1} featured />
      </div>
      {/* 3rd Place */}
      <div className="order-3">
        <HallOfFameCard user={entries[2]} category={category} rank={3} />
      </div>
    </div>
  );
}
