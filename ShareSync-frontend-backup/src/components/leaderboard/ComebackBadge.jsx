// src/components/leaderboard/ComebackBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.2: Momentum Streaks - Comeback Badge
// ═══════════════════════════════════════════════════════════════════════════════
//
// Celebrates users who recovered from streak breaks.
// "Comeback of the Week" feature.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { TrendingUp, Award, Zap, RefreshCw } from 'lucide-react';

/**
 * ComebackBadge - Shows comeback achievement
 */
export default function ComebackBadge({ 
  previousStreak,
  daysOff,
  newStreak,
  size = 'md',
}) {
  const comebackScore = Math.round((newStreak / (daysOff + 1)) * 10);
  const isImpressive = comebackScore >= 5 || newStreak >= previousStreak * 0.5;

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div className={`
      inline-flex items-center gap-2 rounded-lg font-medium
      ${isImpressive 
        ? 'bg-success/10 text-success border border-success/20' 
        : 'bg-surface-2 text-text-secondary'
      }
      ${sizes[size]}
    `}>
      <RefreshCw className="w-4 h-4" />
      <span>Comeback</span>
      {isImpressive && <Zap className="w-3 h-3" />}
    </div>
  );
}

/**
 * ComebackCard - Full card showing comeback story
 */
export function ComebackCard({ 
  user,
  previousStreak,
  daysOff,
  newStreak,
  rank,
}) {
  const comebackRatio = newStreak / Math.max(1, daysOff);
  const recoveryPercent = Math.min(100, Math.round((newStreak / previousStreak) * 100));

  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06] hover:border-success/30 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Rank */}
        {rank && (
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center font-bold
            ${rank === 1 ? 'bg-success/20 text-success' : 'bg-surface-2 text-text-tertiary'}
          `}>
            #{rank}
          </div>
        )}

        {/* User */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{user.avatar}</span>
          <div>
            <h4 className="font-semibold text-text-primary">{user.name}</h4>
            <p className="text-xs text-text-tertiary">@{user.username}</p>
          </div>
        </div>

        {/* Badge */}
        <ComebackBadge 
          previousStreak={previousStreak}
          daysOff={daysOff}
          newStreak={newStreak}
          size="sm"
        />
      </div>

      {/* Story */}
      <div className="p-3 rounded-lg bg-surface-2 mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-text-tertiary text-xs mb-1">Was</div>
            <div className="font-bold text-warning">{previousStreak}d</div>
          </div>
          <div className="text-text-tertiary">→</div>
          <div className="text-center">
            <div className="text-text-tertiary text-xs mb-1">Break</div>
            <div className="font-bold text-error">{daysOff}d</div>
          </div>
          <div className="text-text-tertiary">→</div>
          <div className="text-center">
            <div className="text-text-tertiary text-xs mb-1">Now</div>
            <div className="font-bold text-success">{newStreak}d</div>
          </div>
        </div>
      </div>

      {/* Recovery Progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-tertiary">Recovery Progress</span>
          <span className="text-success font-medium">{recoveryPercent}%</span>
        </div>
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-success to-brand rounded-full transition-all"
            style={{ width: `${recoveryPercent}%` }}
          />
        </div>
      </div>

      {/* Motivation */}
      {recoveryPercent >= 100 && (
        <div className="flex items-center gap-2 text-xs text-success mt-3">
          <Award className="w-4 h-4" />
          <span>Fully recovered and stronger! 🎉</span>
        </div>
      )}
    </div>
  );
}

/**
 * ComebackOfTheWeek - Featured comeback
 */
export function ComebackOfTheWeek({ winner }) {
  if (!winner) return null;

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-success/10 to-brand/10 border border-success/20">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-success" />
        <h3 className="text-lg font-bold text-text-primary">
          Comeback of the Week
        </h3>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-success to-brand flex items-center justify-center text-3xl">
          {winner.avatar}
        </div>
        <div>
          <h4 className="text-xl font-bold text-text-primary">{winner.name}</h4>
          <p className="text-text-secondary">
            Broke a {winner.previousStreak}d streak, came back stronger with {winner.newStreak}d!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-surface-1">
          <div className="text-2xl font-bold text-warning">{winner.previousStreak}</div>
          <div className="text-xs text-text-tertiary">Previous Streak</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-surface-1">
          <div className="text-2xl font-bold text-error">{winner.daysOff}</div>
          <div className="text-xs text-text-tertiary">Days Off</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-surface-1">
          <div className="text-2xl font-bold text-success">{winner.newStreak}</div>
          <div className="text-xs text-text-tertiary">New Streak</div>
        </div>
      </div>
    </div>
  );
}
