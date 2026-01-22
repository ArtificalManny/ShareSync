// src/components/leaderboard/StreakBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.2: Momentum Streaks - Streak Badge
// ═══════════════════════════════════════════════════════════════════════════════
//
// Visual badge showing streak milestones with fire intensity.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Flame } from 'lucide-react';

// Streak milestone tiers
export const STREAK_TIERS = {
  STARTING: { min: 1, max: 6, label: 'Starting', color: 'text-text-tertiary', bg: 'bg-surface-2' },
  WARMING: { min: 7, max: 13, label: 'Warming Up', color: 'text-warning', bg: 'bg-warning/10' },
  HOT: { min: 14, max: 29, label: 'Hot', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  BLAZING: { min: 30, max: 59, label: 'Blazing', color: 'text-orange-500', bg: 'bg-orange-500/20' },
  INFERNO: { min: 60, max: 99, label: 'Inferno', color: 'text-red-500', bg: 'bg-red-500/20' },
  LEGENDARY: { min: 100, max: Infinity, label: 'Legendary', color: 'text-brand', bg: 'bg-brand/20' },
};

function getStreakTier(days) {
  return Object.values(STREAK_TIERS).find(tier => days >= tier.min && days <= tier.max) || STREAK_TIERS.STARTING;
}

/**
 * StreakBadge - Shows streak with visual intensity
 */
export default function StreakBadge({ 
  days, 
  size = 'md',
  showLabel = false,
  showFlame = true,
  animate = true,
}) {
  const tier = getStreakTier(days);
  
  const sizes = {
    sm: { badge: 'px-2 py-0.5 text-xs', icon: 'w-3 h-3', flames: 1 },
    md: { badge: 'px-3 py-1 text-sm', icon: 'w-4 h-4', flames: 2 },
    lg: { badge: 'px-4 py-1.5 text-base', icon: 'w-5 h-5', flames: 3 },
  };

  const s = sizes[size] || sizes.md;
  
  // Number of flame icons based on tier
  const flameCount = Math.min(
    Math.ceil((days / 30)),
    s.flames
  );

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full font-semibold
      ${tier.bg} ${tier.color} ${s.badge}
      ${animate && days >= 30 ? 'animate-pulse' : ''}
    `}>
      {showFlame && (
        <div className="flex">
          {[...Array(flameCount)].map((_, i) => (
            <Flame 
              key={i} 
              className={`${s.icon} ${i > 0 ? '-ml-1.5' : ''}`}
              style={{ opacity: 1 - (i * 0.2) }}
            />
          ))}
        </div>
      )}
      <span className="tabular-nums">{days}d</span>
      {showLabel && (
        <span className="text-xs opacity-75 ml-1">{tier.label}</span>
      )}
    </div>
  );
}

/**
 * StreakMilestone - Larger milestone celebration
 */
export function StreakMilestone({ days, userName }) {
  const tier = getStreakTier(days);
  const milestones = [7, 14, 30, 60, 100, 365];
  const isMilestone = milestones.includes(days);

  if (!isMilestone) return null;

  const messages = {
    7: 'One week strong! 💪',
    14: 'Two weeks of fire! 🔥',
    30: 'Monthly champion! 🏆',
    60: 'Two months unstoppable! ⚡',
    100: 'LEGENDARY SHIPPER! 🚀',
    365: 'ONE YEAR STREAK! 👑',
  };

  return (
    <div className={`
      p-6 rounded-2xl text-center
      ${tier.bg} border border-${tier.color.replace('text-', '')}/20
    `}>
      <div className="text-6xl mb-4">
        {days >= 100 ? '👑' : days >= 60 ? '🔥' : days >= 30 ? '��' : '⚡'}
      </div>
      <h3 className={`text-2xl font-bold ${tier.color} mb-2`}>
        {days} Day Streak!
      </h3>
      <p className="text-text-secondary">
        {messages[days]}
      </p>
      {userName && (
        <p className="text-sm text-text-tertiary mt-2">
          Achieved by {userName}
        </p>
      )}
    </div>
  );
}

/**
 * StreakProgress - Shows progress to next milestone
 */
export function StreakProgress({ currentStreak, compact = false }) {
  const milestones = [7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > currentStreak) || currentStreak + 10;
  const prevMilestone = [...milestones].reverse().find(m => m <= currentStreak) || 0;
  
  const progress = ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
  const daysToNext = nextMilestone - currentStreak;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-warning to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-text-tertiary tabular-nums">
          {daysToNext}d to {nextMilestone}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-secondary">Next milestone</span>
        <StreakBadge days={nextMilestone} size="sm" />
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-gradient-to-r from-warning to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-text-tertiary text-center">
        {daysToNext} days to go!
      </p>
    </div>
  );
}
