// src/components/social/StreakComparison.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.5: Ship Streaks Redesign
//
// CHANGES FROM PREVIOUS VERSION:
// 1. Import StreakFlameVisual from social/StreakFlame (new)
// 2. Rewrote CatchUpMessage with honest 4-case logic
// 3. Added StreakFlameVisual in both compact + default variants
// 4. ALL existing sub-components preserved exactly as-is
//
// ZERO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  Crown,
  Target,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { useMomentumContext } from '../../contexts/MomentumContext';

// ✅ Priority 3.5: Animated flame visualization
import StreakFlameVisual, { getTier, getTierConfig } from './StreakFlame';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_STREAK_DATA = {
  yourStreak: 7,
  yourBestStreak: 14,
  teamAverage: 4.2,
  teamBest: { name: 'Jordan Park', streak: 21 },
  teamStreaks: [
    { name: 'Jordan Park', streak: 21 },
    { name: 'Sarah Chen', streak: 14 },
    { name: 'You', streak: 7 },
    { name: 'Alex Rivera', streak: 7 },
    { name: 'Morgan Lee', streak: 5 },
    { name: 'Taylor Kim', streak: 3 },
    { name: 'Casey Zhang', streak: 2 },
  ],
  history: [
    { date: '2024-01-15', streak: 3 },
    { date: '2024-01-16', streak: 4 },
    { date: '2024-01-17', streak: 5 },
    { date: '2024-01-18', streak: 6 },
    { date: '2024-01-19', streak: 7 },
    { date: '2024-01-20', streak: 8 },
    { date: '2024-01-21', streak: 9 },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARISON BAR (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
const ComparisonBar = ({ yourValue, compareValue, maxValue, label, color = 'brand' }) => {
  const yourPercent = Math.min((yourValue / maxValue) * 100, 100);
  const comparePercent = Math.min((compareValue / maxValue) * 100, 100);

  const colors = {
    brand: 'bg-brand-500',
    warning: 'bg-warning-500',
    success: 'bg-success',
    cyan: 'bg-cyan-500',
  };

  return (
    <div className="space-y-2">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">You</span>
          <span className="text-xs font-medium text-text-primary">{yourValue} days</span>
        </div>
        <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${yourPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full ${colors[color]} rounded-full`}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-tertiary">{label}</span>
          <span className="text-xs text-text-tertiary">{compareValue} days</span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${comparePercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="h-full bg-surface-3 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK RANK (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
const StreakRank = ({ rank, total }) => {
  const getColor = () => {
    if (rank === 1) return 'text-warning-500';
    if (rank <= 3) return 'text-brand-400';
    return 'text-text-secondary';
  };

  const getMessage = () => {
    if (rank === 1) return "You're leading! 👑";
    if (rank <= 3) return "Top 3! Keep it up!";
    if (rank <= Math.ceil(total / 2)) return "Above average";
    return "Room to grow";
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`text-lg font-bold ${getColor()}`}>#{rank}</div>
      <div className="text-xs text-text-tertiary">
        of {total} • {getMessage()}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM LEADER CARD (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
const TeamLeaderCard = ({ leader, yourStreak }) => {
  const daysAway = leader.streak - yourStreak;
  const isYouLeading = daysAway <= 0;

  return (
    <div
      className={`
      p-3 rounded-xl
      ${isYouLeading ? 'bg-warning-500/10 border border-warning-500/20' : 'bg-surface-2 border border-white/[0.06]'}
    `}
    >
      <div className="flex items-center gap-3">
        <div className={`${isYouLeading ? 'bg-warning-500/20' : 'bg-surface-3'} w-8 h-8 rounded-lg flex items-center justify-center`}>
          <Crown className={`w-4 h-4 ${isYouLeading ? 'text-warning-500' : 'text-text-tertiary'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {isYouLeading ? "You're the streak leader!" : leader.name}
          </p>
          <p className="text-xs text-text-tertiary">
            {isYouLeading ? `${yourStreak} day streak` : `${daysAway} days ahead of you`}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Flame className="w-4 h-4 text-warning-500" />
          <span className="text-sm font-bold text-warning-500">{leader.streak}</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CATCH-UP MESSAGE — ✅ REWRITTEN for honest 4-case logic (Priority 3.5)
// ═══════════════════════════════════════════════════════════════════════════════
const CatchUpMessage = ({ yourStreak, teamAverage, teamBest }) => {
  const vsAverage = yourStreak - teamAverage;
  const vsBest = (teamBest?.streak ?? 0) - yourStreak;

  let message, icon, color;

  // ── CASE 1: Both zero — be honest, encourage start ──
  if (yourStreak === 0 && teamAverage === 0) {
    message = "Start your first streak today! Complete 1 task to begin.";
    icon = Sparkles;
    color = 'text-text-secondary';
  }
  // ── CASE 2: You're at zero but team is active — motivate ──
  else if (yourStreak === 0 && teamAverage > 0) {
    message = "Your team is on fire — join the streak!";
    icon = Flame;
    color = 'text-warning-500';
  }
  // ── CASE 3+: You have a streak — compare honestly ──
  else if (vsBest <= 0) {
    message = "You're the streak champion! 👑";
    icon = Crown;
    color = 'text-warning-500';
  } else if (vsAverage >= 3) {
    message = `${Math.round(vsAverage)} days above team average!`;
    icon = TrendingUp;
    color = 'text-success';
  } else if (vsAverage >= 0) {
    message = "You're beating the average!";
    icon = TrendingUp;
    color = 'text-brand-400';
  } else {
    message = `${Math.abs(Math.round(vsAverage))} more days to catch up!`;
    icon = Target;
    color = 'text-text-secondary';
  }

  const Icon = icon;

  return (
    <div className={`flex items-center gap-2 text-sm ${color}`}>
      <Icon className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT (preserved — with StreakFlameVisual added)
// ═══════════════════════════════════════════════════════════════════════════════
export default function StreakComparison({
  // Data (legacy)
  data = MOCK_STREAK_DATA,

  // ✅ New direct props (real-time friendly)
  userStreakDays = null,
  teamAvgDays = null,
  rankText = null,

  // Options
  showChart = true,
  showLeader = true,
  showRank = true,
  showTeamList = false,
  variant = 'default',

  // Actions
  onViewDetails,

  // Styling
  className = '',
}) {
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try {
    momentumContext = useMomentumContext();
  } catch (e) {}
  const { glowLevel, isFireMode } = momentumContext;

  // Build an effective data object if direct props are provided.
  const effectiveData = useMemo(() => {
    if (typeof userStreakDays === 'number' && typeof teamAvgDays === 'number') {
      const your = userStreakDays;
      const avg = teamAvgDays;

      // Minimal synthetic team set so rank UI still works.
      const teamStreaks = [
        { name: 'Leader', streak: Math.max(your + 3, Math.ceil(avg + 4)) },
        { name: 'Teammate', streak: Math.max(1, Math.ceil(avg)) },
        { name: 'You', streak: your },
      ].sort((a, b) => b.streak - a.streak);

      const teamBest = teamStreaks[0];

      return {
        yourStreak: your,
        yourBestStreak: Math.max(your, data?.yourBestStreak ?? your),
        teamAverage: avg,
        teamBest,
        teamStreaks,
        history: data?.history ?? null,
      };
    }
    return data;
  }, [userStreakDays, teamAvgDays, data]);

  const { yourStreak, yourBestStreak, teamAverage, teamBest, teamStreaks, history } = effectiveData;

  const yourRank = useMemo(() => {
    const sorted = [...teamStreaks].sort((a, b) => b.streak - a.streak);
    const idx = sorted.findIndex((s) => s.name === 'You');
    return idx >= 0 ? idx + 1 : 1;
  }, [teamStreaks]);

  const maxStreak = Math.max(yourStreak, teamBest?.streak ?? yourStreak, yourBestStreak);

  // ═════════════════════════════════════════════════════════════════════════
  // COMPACT VARIANT
  // ═════════════════════════════════════════════════════════════════════════
  if (variant === 'compact') {
    return (
      <div
        onClick={onViewDetails}
        className={`
          p-4 rounded-xl bg-surface-1 border border-white/[0.06]
          ${onViewDetails ? 'cursor-pointer hover:bg-surface-2' : ''}
          transition-colors
          ${className}
        `}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${isFireMode ? 'text-energy-500' : 'text-warning-500'}`} />
            <span className="text-sm font-medium text-text-primary">Your Streak</span>
          </div>

          {showRank && (
            rankText ? (
              <div className="text-xs text-text-tertiary">{rankText}</div>
            ) : (
              <StreakRank rank={yourRank} total={teamStreaks.length} />
            )
          )}
        </div>

        {/* ✅ Priority 3.5: Flame visual + streak count side by side */}
        <div className="flex items-center gap-3 mb-3">
          <StreakFlameVisual streak={yourStreak} size={44} showBadge={false} />
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold tabular-nums ${isFireMode ? 'text-energy-500' : 'text-warning-500'}`}>
                {yourStreak}
              </span>
              <span className="text-sm text-text-tertiary">days</span>
            </div>
            <span className="text-xs text-text-tertiary">Team avg: {Number(teamAverage).toFixed(1)}</span>
          </div>
        </div>

        <ComparisonBar
          yourValue={yourStreak}
          compareValue={teamAverage}
          maxValue={maxStreak || 1}
          label="Team Average"
          color={isFireMode ? 'warning' : 'brand'}
        />

        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <CatchUpMessage yourStreak={yourStreak} teamAverage={teamAverage} teamBest={teamBest} />
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // DEFAULT VARIANT
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${isFireMode ? 'text-energy-500' : 'text-warning-500'}`} />
          <h3 className="text-sm font-medium text-text-primary">Streak vs Team</h3>
        </div>

        {showRank && (
          rankText ? (
            <div className="text-xs text-text-tertiary">{rankText}</div>
          ) : (
            <StreakRank rank={yourRank} total={teamStreaks.length} />
          )
        )}
      </div>

      {/* ✅ Priority 3.5: Flame visual + stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StreakFlameVisual streak={yourStreak} size={52} showBadge={true} showLabel={true} />
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold tabular-nums ${isFireMode ? 'text-energy-500' : 'text-warning-500'}`}>
                {yourStreak}
              </span>
              <span className="text-sm text-text-tertiary">days</span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">Team average: {Number(teamAverage).toFixed(1)} days</p>
          </div>
        </div>

        {/* Chart area (uses history if provided) — unchanged */}
        {showChart && history && (
          <div className="w-24">
            <div className="h-10 bg-surface-2 rounded-lg" />
          </div>
        )}
      </div>

      <ComparisonBar
        yourValue={yourStreak}
        compareValue={teamAverage}
        maxValue={maxStreak || 1}
        label="Team Average"
        color={isFireMode ? 'warning' : 'brand'}
      />

      <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
        {showLeader && <TeamLeaderCard leader={teamBest} yourStreak={yourStreak} />}
        <CatchUpMessage yourStreak={yourStreak} teamAverage={teamAverage} teamBest={teamBest} />
      </div>

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="
            w-full mt-4 py-2 rounded-lg
            text-xs text-text-tertiary hover:text-brand-400
            transition-colors flex items-center justify-center gap-1
          "
        >
          View full comparison <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI VARIANT EXPORT (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
export function MiniStreakComparison({ data = MOCK_STREAK_DATA, onViewDetails, className = '' }) {
  return (
    <StreakComparison
      data={data}
      showChart={false}
      showLeader={false}
      showRank={false}
      variant="compact"
      onViewDetails={onViewDetails}
      className={className}
    />
  );
}
