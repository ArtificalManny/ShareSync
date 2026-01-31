// src/components/ceremony/StreakProtection.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY MOMENTS: Streak Protection
// Protect your streak with quick wins or freezes
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  Flame, AlertTriangle, Clock, Snowflake, Zap,
  ChevronRight, CheckCircle2, X, Play, Target
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * StreakDisplay - Shows current streak status
 */
export function StreakDisplay({
  streak,
  streakStatus,
  onClick,
  size = 'md',
  className = '',
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-5 py-3',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  const isAtRisk = streakStatus?.isAtRisk;
  const shippedToday = streakStatus?.shippedToday;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 rounded-xl
        transition-all duration-200
        ${sizeClasses[size]}
        ${isAtRisk 
          ? 'bg-error-500/20 border border-error-500/30 text-error-400 animate-pulse' 
          : shippedToday
          ? 'bg-success-500/20 border border-success-500/30 text-success-400'
          : 'bg-warning-500/20 border border-warning-500/30 text-warning-400'
        }
        ${className}
      `}
    >
      <Flame className={`${iconSizes[size]} ${isAtRisk ? 'animate-bounce' : ''}`} />
      <span className={`font-bold ${textSizes[size]}`}>{streak.count}</span>
      {isAtRisk && (
        <AlertTriangle className={iconSizes[size]} />
      )}
      {shippedToday && (
        <CheckCircle2 className={iconSizes[size]} />
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK WIN CARD
// ═══════════════════════════════════════════════════════════════════════════════

function QuickWinCard({ quickWin, onSelect }) {
  const isTask = quickWin.type === 'task';
  
  return (
    <button
      onClick={() => onSelect(quickWin)}
      className="
        w-full flex items-center gap-3 p-3 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-brand-500/30
        transition-all duration-200 text-left
      "
    >
      <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center text-xl">
        {isTask ? '📋' : quickWin.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {isTask ? quickWin.task.title : quickWin.name}
        </div>
        <div className="text-xs text-text-tertiary">
          {quickWin.duration}
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-brand-400">
        <Zap className="w-3 h-3" />
        <span className="text-sm font-medium">+{quickWin.xp}</span>
      </div>
      
      <ChevronRight className="w-4 h-4 text-text-tertiary" />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK PROTECTION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * StreakProtectionModal - Alert when streak is at risk
 */
export function StreakProtectionModal({
  isOpen,
  streak,
  streakStatus,
  streakFreezes,
  quickWins = [],
  onUseFreeze,
  onSelectQuickWin,
  onClose,
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-surface-0 border border-error-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header - Warning style */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-error-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-error-500/20 flex items-center justify-center animate-pulse">
              <Flame className="w-7 h-7 text-error-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-error-400">
                🔥 {streak.count}-day streak at risk!
              </div>
              <div className="text-sm text-text-tertiary">
                Ship 1 task in the next {streakStatus.hoursRemaining} hours
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Quick wins */}
          {quickWins.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
                Quick Wins Available
              </div>
              <div className="space-y-2">
                {quickWins.map((qw, idx) => (
                  <QuickWinCard
                    key={qw.id || idx}
                    quickWin={qw}
                    onSelect={onSelectQuickWin}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-text-tertiary">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          
          {/* Streak freeze option */}
          <button
            onClick={onUseFreeze}
            disabled={streakFreezes <= 0}
            className={`
              w-full flex items-center gap-4 p-4 rounded-xl
              border transition-all duration-200
              ${streakFreezes > 0
                ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-surface-1 border-white/[0.06] opacity-50 cursor-not-allowed'
              }
            `}
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Snowflake className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-text-primary">
                Use Streak Freeze
              </div>
              <div className="text-xs text-text-tertiary">
                {streakFreezes} remaining
              </div>
            </div>
            {streakFreezes > 0 && (
              <ChevronRight className="w-5 h-5 text-cyan-400" />
            )}
          </button>
          
          {/* Dismiss */}
          <button
            onClick={onClose}
            className="w-full mt-4 py-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            I'll ship something soon
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK BANNER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * StreakRiskBanner - Persistent banner when streak is at risk
 */
export function StreakRiskBanner({
  streak,
  streakStatus,
  onProtect,
  onDismiss,
  className = '',
}) {
  if (!streakStatus?.isAtRisk) return null;
  
  return (
    <div className={`
      flex items-center gap-4 px-4 py-3 
      bg-error-500/10 border border-error-500/30 rounded-xl
      ${className}
    `}>
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-error-400 animate-bounce" />
        <span className="text-sm font-medium text-error-400">
          {streak.count}-day streak at risk!
        </span>
      </div>
      
      <div className="flex items-center gap-1 text-sm text-text-tertiary">
        <Clock className="w-4 h-4" />
        <span>{streakStatus.hoursRemaining}h left</span>
      </div>
      
      <div className="flex-1" />
      
      <button
        onClick={onProtect}
        className="px-4 py-1.5 rounded-lg bg-error-500 text-white text-sm font-medium hover:bg-error-400 transition-colors"
      >
        Protect
      </button>
      
      <button
        onClick={onDismiss}
        className="p-1.5 rounded-lg hover:bg-white/10 text-text-tertiary"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK MILESTONE CELEBRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * StreakMilestone - Celebrate streak milestones
 */
export function StreakMilestone({
  milestone,
  onClaim,
  onDismiss,
}) {
  const milestoneConfig = {
    3: { icon: '🔥', name: '3-Day Streak', reward: 50 },
    7: { icon: '💪', name: 'Week Warrior', reward: 100 },
    14: { icon: '⚡', name: 'Two Week Terror', reward: 200 },
    30: { icon: '👑', name: 'Monthly Master', reward: 500 },
  };
  
  const config = milestoneConfig[milestone];
  if (!config) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-sm bg-surface-0 border border-warning-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">{config.icon}</div>
          
          <div className="text-2xl font-bold text-warning-400 mb-2">
            {config.name}!
          </div>
          
          <div className="text-text-secondary mb-6">
            You've shipped for {milestone} days straight!
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-6 text-lg text-brand-400">
            <Zap className="w-5 h-5" />
            <span className="font-bold">+{config.reward} XP</span>
          </div>
          
          <button
            onClick={onClaim}
            className="
              w-full py-3 rounded-xl
              bg-gradient-to-r from-warning-500 to-orange-500
              text-white font-bold
              hover:from-warning-400 hover:to-orange-400
              transition-all
            "
          >
            Claim Reward!
          </button>
        </div>
      </div>
    </div>
  );
}

export default StreakProtectionModal;
