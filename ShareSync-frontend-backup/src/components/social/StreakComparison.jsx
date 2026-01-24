// src/components/social/StreakComparison.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE E: Social Proof & FOMO - Streak Comparison
// ═══════════════════════════════════════════════════════════════════════════════
//
// Visual comparison of your streak vs team average.
// Creates FOMO by showing how you compare to teammates.
//
// Key Features:
// - Visual bar comparison
// - Streak breakdown by category
// - Team leader highlight
// - "X days to catch up" messaging
// - Historical trend
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Target,
  Zap,
  Calendar,
  Award,
  ChevronRight,
} from 'lucide-react';

import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
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
    { date: '2024-01-20', streak: 8 }, // prediction
    { date: '2024-01-21', streak: 9 }, // prediction
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARISON BAR
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
      {/* Your bar */}
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
      
      {/* Compare bar */}
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
// STREAK RANK INDICATOR
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
      <div className={`text-lg font-bold ${getColor()}`}>
        #{rank}
      </div>
      <div className="text-xs text-text-tertiary">
        of {total} • {getMessage()}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MINI STREAK CHART
// ═══════════════════════════════════════════════════════════════════════════════
const MiniStreakChart = ({ history, predictDays = 2 }) => {
  const maxStreak = Math.max(...history.map(h => h.streak));
  const today = history.length - predictDays;
  
  return (
    <div className="flex items-end gap-1 h-12">
      {history.map((day, i) => {
        const height = (day.streak / maxStreak) * 100;
        const isFuture = i >= today;
        const isToday = i === today - 1;
        
        return (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={`
              flex-1 rounded-t
              ${isFuture 
                ? 'bg-brand-500/30 border border-dashed border-brand-500/50' 
                : isToday 
                  ? 'bg-brand-500' 
                  : 'bg-surface-3'
              }
            `}
            title={`${day.date}: ${day.streak} days${isFuture ? ' (projected)' : ''}`}
          />
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM LEADER CARD
// ═══════════════════════════════════════════════════════════════════════════════
const TeamLeaderCard = ({ leader, yourStreak }) => {
  const daysAway = leader.streak - yourStreak;
  const isYouLeading = daysAway <= 0;
  
  return (
    <div className={`
      p-3 rounded-xl
      ${isYouLeading 
        ? 'bg-warning-500/10 border border-warning-500/20' 
        : 'bg-surface-2 border border-white/[0.06]'
      }
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          ${isYouLeading ? 'bg-warning-500/20' : 'bg-surface-3'}
        `}>
          <Crown className={`w-4 h-4 ${isYouLeading ? 'text-warning-500' : 'text-text-tertiary'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {isYouLeading ? "You're the streak leader!" : leader.name}
          </p>
          <p className="text-xs text-text-tertiary">
            {isYouLeading 
              ? `${yourStreak} day streak` 
              : `${daysAway} days ahead of you`
            }
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
// CATCH UP MESSAGE
// ═══════════════════════════════════════════════════════════════════════════════
const CatchUpMessage = ({ yourStreak, teamAverage, teamBest }) => {
  const vsAverage = yourStreak - teamAverage;
  const vsBest = teamBest.streak - yourStreak;
  
  let message, icon, color;
  
  if (vsBest <= 0) {
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
    message = `${Math.abs(Math.round(vsAverage))} days to catch up to average`;
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function StreakComparison({
  // Data
  data = MOCK_STREAK_DATA,
  
  // Options
  showChart = true,
  showLeader = true,
  showRank = true,
  showTeamList = false,
  variant = 'default', // 'default' | 'compact' | 'detailed'
  
  // Actions
  onViewDetails,
  
  // Styling
  className = '',
}) {
  // Get momentum context
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try {
    momentumContext = useMomentumContext();
  } catch (e) {}
  
  const { glowLevel, isFireMode } = momentumContext;

  const { yourStreak, yourBestStreak, teamAverage, teamBest, teamStreaks, history } = data;
  
  // Calculate your rank
  const yourRank = useMemo(() => {
    const sorted = [...teamStreaks].sort((a, b) => b.streak - a.streak);
    return sorted.findIndex(s => s.name === 'You') + 1;
  }, [teamStreaks]);
  
  // Max streak for visualization
  const maxStreak = Math.max(yourStreak, teamBest.streak, yourBestStreak);

  // Compact variant
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
          
          {showRank && <StreakRank rank={yourRank} total={teamStreaks.length} />}
        </div>
        
        {/* Main stat */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className={`
            text-3xl font-bold tabular-nums
            ${isFireMode ? 'text-energy-500' : 'text-warning-500'}
          `}>
            {yourStreak}
          </span>
          <span className="text-sm text-text-tertiary">days</span>
          <span className="text-xs text-text-tertiary ml-auto">
            Team avg: {teamAverage.toFixed(1)}
          </span>
        </div>
        
        {/* Comparison bar */}
        <ComparisonBar
          yourValue={yourStreak}
          compareValue={teamAverage}
          maxValue={maxStreak}
          label="Team Average"
          color={isFireMode ? 'warning' : 'brand'}
        />
        
        {/* Catch up message */}
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <CatchUpMessage 
            yourStreak={yourStreak} 
            teamAverage={teamAverage} 
            teamBest={teamBest} 
          />
        </div>
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div className={`rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className={`w-5 h-5 ${isFireMode ? 'text-energy-500' : 'text-warning-500'}`} />
              <h3 className="text-lg font-semibold text-text-primary">Streak Comparison</h3>
            </div>
            
            {onViewDetails && (
              <button 
                onClick={onViewDetails}
                className="text-xs text-text-tertiary hover:text-brand-400 transition-colors flex items-center gap-1"
              >
                Full stats <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Main comparison */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">Your Streak</p>
              <p className={`text-2xl font-bold ${isFireMode ? 'text-energy-500' : 'text-warning-500'}`}>
                {yourStreak}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">Team Avg</p>
              <p className="text-2xl font-bold text-text-primary">
                {teamAverage.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">Your Best</p>
              <p className="text-2xl font-bold text-text-secondary">
                {yourBestStreak}
              </p>
            </div>
          </div>
          
          {/* Comparison bar */}
          <ComparisonBar
            yourValue={yourStreak}
            compareValue={teamAverage}
            maxValue={maxStreak}
            label="Team Average"
            color={isFireMode ? 'warning' : 'brand'}
          />
          
          {/* Chart */}
          {showChart && history && (
            <div>
              <p className="text-xs text-text-tertiary mb-2">Last 7 days (+ projection)</p>
              <MiniStreakChart history={history} predictDays={2} />
            </div>
          )}
          
          {/* Team leader */}
          {showLeader && (
            <TeamLeaderCard leader={teamBest} yourStreak={yourStreak} />
          )}
          
          {/* Team list */}
          {showTeamList && (
            <div>
              <p className="text-xs text-text-tertiary mb-2">Team Streaks</p>
              <div className="space-y-2">
                {teamStreaks.slice(0, 5).map((member, i) => (
                  <div 
                    key={i}
                    className={`
                      flex items-center justify-between p-2 rounded-lg
                      ${member.name === 'You' ? 'bg-brand-500/10' : 'bg-surface-2'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-xs text-text-tertiary">#{i + 1}</span>
                      <span className={`text-sm ${member.name === 'You' ? 'font-medium text-brand-400' : 'text-text-primary'}`}>
                        {member.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-warning-500" />
                      <span className="text-sm font-medium">{member.streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Catch up message */}
          <div className="pt-4 border-t border-white/[0.06]">
            <CatchUpMessage 
              yourStreak={yourStreak} 
              teamAverage={teamAverage} 
              teamBest={teamBest} 
            />
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${isFireMode ? 'text-energy-500' : 'text-warning-500'}`} />
          <h3 className="text-sm font-medium text-text-primary">Streak vs Team</h3>
        </div>
        
        {showRank && (
          <StreakRank rank={yourRank} total={teamStreaks.length} />
        )}
      </div>
      
      {/* Main stat */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className={`
              text-3xl font-bold tabular-nums
              ${isFireMode ? 'text-energy-500' : 'text-warning-500'}
            `}>
              {yourStreak}
            </span>
            <span className="text-sm text-text-tertiary">days</span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            Team average: {teamAverage.toFixed(1)} days
          </p>
        </div>
        
        {/* Mini chart */}
        {showChart && history && (
          <div className="w-24">
            <MiniStreakChart history={history.slice(-5)} predictDays={0} />
          </div>
        )}
      </div>
      
      {/* Comparison bar */}
      <ComparisonBar
        yourValue={yourStreak}
        compareValue={teamAverage}
        maxValue={maxStreak}
        label="Team Average"
        color={isFireMode ? 'warning' : 'brand'}
      />
      
      {/* Leader & message */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
        {showLeader && (
          <TeamLeaderCard leader={teamBest} yourStreak={yourStreak} />
        )}
        
        <CatchUpMessage 
          yourStreak={yourStreak} 
          teamAverage={teamAverage} 
          teamBest={teamBest} 
        />
      </div>
      
      {/* View details link */}
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
// MINI STREAK WIDGET (for sidebar/dashboard)
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
