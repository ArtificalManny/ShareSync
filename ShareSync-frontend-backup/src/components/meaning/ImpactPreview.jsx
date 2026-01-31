// src/components/meaning/ImpactPreview.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEANING LAYER: Impact Preview
// Shows what completing a task will accomplish - the ripple effects
// "Completing this will unblock 3 teammates, move Beta 2% closer..."
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { 
  Zap, Users, TrendingUp, Unlock, Clock, Trophy,
  Target, Sparkles, ArrowRight, ChevronRight, Gift,
  Flame, Star, Shield
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPACT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

const IMPACT_TYPES = {
  unblock: {
    icon: Unlock,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    label: 'Unblocks',
    format: (count) => `${count} teammate${count !== 1 ? 's' : ''}`,
  },
  progress: {
    icon: TrendingUp,
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
    label: 'Moves',
    format: (value, target) => `${target} ${value}% closer`,
  },
  momentum: {
    icon: Zap,
    color: 'text-warning-500',
    bgColor: 'bg-warning-500/10',
    label: 'Adds',
    format: (value) => `+${value} momentum`,
  },
  xp: {
    icon: Star,
    color: 'text-success-400',
    bgColor: 'bg-success-500/10',
    label: 'Earns',
    format: (value) => `+${value} XP`,
  },
  streak: {
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    label: 'Protects',
    format: (value) => `${value}-day streak`,
  },
  badge: {
    icon: Trophy,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    label: 'Unlocks',
    format: (badge) => badge,
  },
  time: {
    icon: Clock,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    label: 'Saves',
    format: (value) => `~${value} hours of waiting`,
  },
  team: {
    icon: Users,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    label: 'Helps',
    format: (names) => names.join(', '),
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE IMPACT ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function ImpactItem({ 
  type, 
  value, 
  target,
  highlight = false,
  size = 'default',
}) {
  const config = IMPACT_TYPES[type];
  if (!config) return null;
  
  const Icon = config.icon;
  const formattedValue = config.format(value, target);
  
  const sizeClasses = {
    small: 'text-[10px]',
    default: 'text-xs',
    large: 'text-sm',
  };
  
  return (
    <div className={`
      flex items-center gap-2
      ${highlight ? 'animate-pulse' : ''}
    `}>
      <div className={`
        flex items-center justify-center rounded-lg
        ${config.bgColor}
        ${size === 'small' ? 'w-6 h-6' : size === 'large' ? 'w-10 h-10' : 'w-8 h-8'}
      `}>
        <Icon className={`
          ${config.color}
          ${size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4'}
        `} />
      </div>
      <div className={`${sizeClasses[size]} text-text-secondary`}>
        <span className="text-text-tertiary">{config.label} </span>
        <span className={`font-medium ${config.color}`}>{formattedValue}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPACT PREVIEW CARD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ImpactPreview - Shows all impacts of completing a task
 * 
 * @param {Object} props
 * @param {Object} props.task - Task being previewed
 * @param {Array} props.impacts - Array of impact objects
 * @param {string} props.variant - 'card' | 'inline' | 'tooltip'
 * @param {boolean} props.showHeader - Show "Completing this will..." header
 */
export function ImpactPreview({
  task,
  impacts = [],
  variant = 'card',
  showHeader = true,
  className = '',
}) {
  // Calculate total XP from all impacts
  const totalXP = useMemo(() => {
    return impacts
      .filter(i => i.type === 'xp')
      .reduce((sum, i) => sum + (i.value || 0), 0);
  }, [impacts]);
  
  // Filter to show most important impacts
  const displayImpacts = useMemo(() => {
    // Prioritize: unblock > progress > momentum > xp > others
    const priority = ['unblock', 'progress', 'momentum', 'xp', 'streak', 'badge', 'time', 'team'];
    return [...impacts].sort((a, b) => 
      priority.indexOf(a.type) - priority.indexOf(b.type)
    ).slice(0, 4);
  }, [impacts]);
  
  if (impacts.length === 0) return null;
  
  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 flex-wrap ${className}`}>
        {displayImpacts.slice(0, 3).map((impact, idx) => (
          <ImpactItem 
            key={`${impact.type}-${idx}`}
            type={impact.type}
            value={impact.value}
            target={impact.target}
            size="small"
          />
        ))}
        {impacts.length > 3 && (
          <span className="text-[10px] text-text-tertiary">
            +{impacts.length - 3} more
          </span>
        )}
      </div>
    );
  }
  
  // Tooltip variant
  if (variant === 'tooltip') {
    return (
      <div className={`
        p-3 rounded-xl
        bg-surface-1 border border-white/[0.08]
        shadow-xl
        ${className}
      `}>
        {showHeader && (
          <div className="text-[10px] font-medium text-brand-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Completing this will...
          </div>
        )}
        <div className="space-y-2">
          {displayImpacts.map((impact, idx) => (
            <ImpactItem 
              key={`${impact.type}-${idx}`}
              type={impact.type}
              value={impact.value}
              target={impact.target}
              size="small"
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Card variant (default)
  return (
    <div className={`
      p-4 rounded-xl
      bg-surface-1 border border-white/[0.06]
      ${className}
    `}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">
                Completing this will...
              </div>
              {task?.title && (
                <div className="text-xs text-text-tertiary truncate max-w-[200px]">
                  {task.title}
                </div>
              )}
            </div>
          </div>
          {totalXP > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success-500/10">
              <Zap className="w-3 h-3 text-success-400" />
              <span className="text-xs font-medium text-success-400">+{totalXP}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {displayImpacts.map((impact, idx) => (
          <ImpactItem 
            key={`${impact.type}-${idx}`}
            type={impact.type}
            value={impact.value}
            target={impact.target}
            highlight={impact.highlight}
          />
        ))}
      </div>
      
      {impacts.length > displayImpacts.length && (
        <button className="
          mt-3 w-full py-2 text-xs text-text-tertiary
          hover:text-text-secondary transition-colors
          flex items-center justify-center gap-1
        ">
          <span>See all {impacts.length} impacts</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKING IMPACT PREVIEW - Who's waiting on this
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BlockingImpact - Shows who's blocked by this task
 */
export function BlockingImpact({
  blockedTasks = [],
  blockedUsers = [],
  className = '',
}) {
  if (blockedTasks.length === 0 && blockedUsers.length === 0) return null;
  
  return (
    <div className={`
      p-3 rounded-xl
      bg-warning-500/5 border border-warning-500/20
      ${className}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <Unlock className="w-4 h-4 text-warning-500" />
        <span className="text-xs font-medium text-warning-500">
          {blockedUsers.length > 0 
            ? `${blockedUsers.length} teammate${blockedUsers.length !== 1 ? 's' : ''} waiting`
            : `${blockedTasks.length} task${blockedTasks.length !== 1 ? 's' : ''} blocked`
          }
        </span>
      </div>
      
      {/* Blocked users avatars */}
      {blockedUsers.length > 0 && (
        <div className="flex items-center gap-1 ml-6">
          {blockedUsers.slice(0, 4).map((user, idx) => (
            <div
              key={user.id || idx}
              className="w-6 h-6 rounded-full bg-surface-2 border-2 border-surface-1 -ml-2 first:ml-0 flex items-center justify-center"
              title={user.name}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full rounded-full" />
              ) : (
                <span className="text-[10px] font-medium text-text-tertiary">
                  {user.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
          ))}
          {blockedUsers.length > 4 && (
            <span className="text-[10px] text-text-tertiary ml-1">
              +{blockedUsers.length - 4}
            </span>
          )}
        </div>
      )}
      
      {/* Blocked tasks list */}
      {blockedTasks.length > 0 && blockedUsers.length === 0 && (
        <div className="ml-6 space-y-1">
          {blockedTasks.slice(0, 3).map((task, idx) => (
            <div key={task.id || idx} className="text-xs text-text-tertiary truncate">
              • {task.title}
            </div>
          ))}
          {blockedTasks.length > 3 && (
            <div className="text-xs text-text-tertiary">
              +{blockedTasks.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS IMPACT - How much this moves the needle
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ProgressImpact - Shows progress contribution
 */
export function ProgressImpact({
  currentProgress = 0,
  afterProgress = 0,
  targetName = 'Goal',
  className = '',
}) {
  const improvement = afterProgress - currentProgress;
  
  if (improvement <= 0) return null;
  
  return (
    <div className={`
      p-3 rounded-xl
      bg-brand-500/5 border border-brand-500/20
      ${className}
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-medium text-brand-400">
            {targetName}
          </span>
        </div>
        <span className="text-xs font-medium text-success-400">
          +{improvement.toFixed(1)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div className="h-full flex">
          {/* Current progress */}
          <div 
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${currentProgress}%` }}
          />
          {/* New progress (animated) */}
          <div 
            className="h-full bg-brand-400 animate-pulse"
            style={{ width: `${improvement}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-1 text-[10px] text-text-tertiary">
        <span>{currentProgress.toFixed(0)}%</span>
        <span>→ {afterProgress.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REWARD PREVIEW - XP and badges to be earned
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RewardPreview - Shows XP and potential badges
 */
export function RewardPreview({
  xp = 0,
  bonusXP = 0,
  potentialBadges = [],
  streakBonus = false,
  className = '',
}) {
  const totalXP = xp + bonusXP;
  
  if (totalXP === 0 && potentialBadges.length === 0) return null;
  
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl
      bg-gradient-to-r from-success-500/10 to-brand-500/10
      border border-success-500/20
      ${className}
    `}>
      {/* XP */}
      {totalXP > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-success-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-success-400">
              +{totalXP} XP
            </div>
            {bonusXP > 0 && (
              <div className="text-[10px] text-success-400/70">
                includes +{bonusXP} bonus
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Divider */}
      {totalXP > 0 && potentialBadges.length > 0 && (
        <div className="w-px h-8 bg-white/[0.1]" />
      )}
      
      {/* Potential badges */}
      {potentialBadges.length > 0 && (
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-purple-400" />
          <div className="text-xs text-text-secondary">
            May unlock: <span className="text-purple-400 font-medium">
              {potentialBadges[0]}
            </span>
            {potentialBadges.length > 1 && (
              <span className="text-text-tertiary"> +{potentialBadges.length - 1}</span>
            )}
          </div>
        </div>
      )}
      
      {/* Streak bonus indicator */}
      {streakBonus && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] text-orange-400">Streak</span>
        </div>
      )}
    </div>
  );
}

export default ImpactPreview;
