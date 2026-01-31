// src/components/identity/ReputationSystem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY ENGINE: Reputation System
// Traits earned through consistent patterns, not self-reported
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  Award, Star, Lock, CheckCircle2, ChevronRight,
  TrendingUp, Shield, Sparkles, Eye
} from 'lucide-react';
import { REPUTATION_TRAITS } from '../../hooks/useIdentityEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// REPUTATION BADGE
// ═══════════════════════════════════════════════════════════════════════════════

function ReputationBadge({
  trait,
  isEarned,
  progress = 0,
  showProgress = true,
  size = 'md',
  onClick,
}) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };
  
  const iconSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-2xl flex flex-col items-center justify-center
        border-2 transition-all duration-300
        ${sizeClasses[size]}
        ${isEarned 
          ? 'bg-warning-500/10 border-warning-500/50 shadow-lg shadow-warning-500/20' 
          : 'bg-surface-1 border-white/[0.06] opacity-60 hover:opacity-80'
        }
      `}
      title={`${trait.name}: ${trait.description}`}
    >
      {/* Icon */}
      <span className={iconSizes[size]}>
        {isEarned ? trait.icon : '🔒'}
      </span>
      
      {/* Earned indicator */}
      {isEarned && (
        <div className="absolute -top-1 -right-1">
          <CheckCircle2 className="w-4 h-4 text-warning-400 fill-warning-400" />
        </div>
      )}
      
      {/* Progress ring (if not earned) */}
      {!isEarned && showProgress && progress > 0 && (
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="3"
            strokeDasharray={`${progress * 2.83} 283`}
            className="transition-all duration-500"
          />
        </svg>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPUTATION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function ReputationCard({
  trait,
  isEarned,
  progress = 0,
  currentValue = 0,
  isExpanded,
  onToggle,
}) {
  const threshold = trait.criteria?.threshold || 0;
  const progressPercent = Math.min(100, (currentValue / threshold) * 100);
  
  return (
    <div className={`
      rounded-xl border overflow-hidden transition-all duration-200
      ${isEarned 
        ? 'bg-warning-500/10 border-warning-500/30' 
        : 'bg-surface-1 border-white/[0.06]'
      }
    `}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        {/* Badge */}
        <div className={`
          w-14 h-14 rounded-xl flex items-center justify-center text-3xl
          ${isEarned ? 'bg-warning-500/20' : 'bg-surface-2'}
        `}>
          {isEarned ? trait.icon : '🔒'}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-text-primary">
              {trait.name}
            </span>
            {isEarned && (
              <CheckCircle2 className="w-4 h-4 text-warning-400" />
            )}
          </div>
          <div className="text-xs text-text-tertiary">
            {trait.description}
          </div>
        </div>
        
        {/* Progress or earned */}
        {isEarned ? (
          <Star className="w-6 h-6 text-warning-400 fill-warning-400" />
        ) : (
          <div className="text-right">
            <div className="text-lg font-bold text-text-primary">
              {Math.round(progressPercent)}%
            </div>
            <div className="text-xs text-text-tertiary">progress</div>
          </div>
        )}
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06]">
          {/* Progress bar */}
          <div className="mt-3 mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-tertiary">
                {currentValue} / {threshold}
              </span>
              <span className={isEarned ? 'text-warning-400' : 'text-text-tertiary'}>
                {isEarned ? 'Earned!' : `${Math.round(progressPercent)}%`}
              </span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isEarned ? 'bg-warning-500' : 'bg-brand-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          
          {/* How to earn */}
          <div className="p-3 rounded-lg bg-surface-2/50">
            <div className="text-xs text-text-tertiary mb-1">How to earn:</div>
            <div className="text-sm text-text-primary">
              {getEarnCriteria(trait)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getEarnCriteria(trait) {
  const { metric, threshold } = trait.criteria;
  
  const criteriaMap = {
    early_completions: `Complete ${threshold} tasks ahead of schedule`,
    no_revision_rate: `Maintain ${Math.round(threshold * 100)}% no-revision rate`,
    unblocks: `Unblock teammates ${threshold} times`,
    commitment_rate: `Maintain ${Math.round(threshold * 100)}% delivery rate`,
    help_given: `Help teammates ${threshold} times`,
    complex_tasks: `Complete ${threshold} complex tasks`,
    longest_streak: `Maintain a ${threshold}-day streak`,
    deadline_performance: `${Math.round(threshold * 100)}% on-time near deadlines`,
  };
  
  return criteriaMap[metric] || `Reach ${threshold} ${metric}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN REPUTATION PANEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ReputationPanel - Full reputation view
 */
export function ReputationPanel({
  earnedReputation = [],
  reputationMetrics = {},
  userName = 'User',
  className = '',
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, earned, progress
  
  // Process all traits with progress
  const allTraits = useMemo(() => {
    return Object.values(REPUTATION_TRAITS).map(trait => {
      const isEarned = earnedReputation.some(e => e.id === trait.id);
      const currentValue = reputationMetrics[trait.criteria.metric] || 0;
      const progress = Math.min(100, (currentValue / trait.criteria.threshold) * 100);
      
      return {
        ...trait,
        isEarned,
        currentValue,
        progress,
      };
    });
  }, [earnedReputation, reputationMetrics]);
  
  const filteredTraits = useMemo(() => {
    if (filter === 'earned') return allTraits.filter(t => t.isEarned);
    if (filter === 'progress') return allTraits.filter(t => !t.isEarned && t.progress > 0);
    return allTraits;
  }, [allTraits, filter]);
  
  const earnedCount = allTraits.filter(t => t.isEarned).length;
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-warning-500/10 to-amber-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-warning-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Reputation
              </div>
              <div className="text-sm text-text-tertiary">
                {userName} is known for
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-warning-400">
              {earnedCount}/{allTraits.length}
            </div>
            <div className="text-xs text-text-tertiary">traits earned</div>
          </div>
        </div>
      </div>
      
      {/* Earned badges showcase */}
      {earnedCount > 0 && (
        <div className="px-6 py-4 border-b border-white/[0.06] bg-surface-1/50">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {allTraits.filter(t => t.isEarned).map(trait => (
              <ReputationBadge
                key={trait.id}
                trait={trait}
                isEarned
                size="md"
                onClick={() => setExpandedId(expandedId === trait.id ? null : trait.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Filter tabs */}
      <div className="px-4 py-2 border-b border-white/[0.06] flex gap-2">
        {['all', 'earned', 'progress'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1 rounded-lg text-xs font-medium transition-colors
              ${filter === f 
                ? 'bg-warning-500/10 text-warning-400' 
                : 'text-text-tertiary hover:text-text-secondary'
              }
            `}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Trait list */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {filteredTraits.map(trait => (
          <ReputationCard
            key={trait.id}
            trait={trait}
            isEarned={trait.isEarned}
            progress={trait.progress}
            currentValue={trait.currentValue}
            isExpanded={expandedId === trait.id}
            onToggle={() => setExpandedId(expandedId === trait.id ? null : trait.id)}
          />
        ))}
        
        {filteredTraits.length === 0 && (
          <div className="py-8 text-center">
            <Shield className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <div className="text-sm text-text-tertiary">
              {filter === 'earned' 
                ? 'No traits earned yet. Keep working!'
                : 'No traits in progress'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI REPUTATION BADGES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniReputationBadges - Compact badge display for profiles
 */
export function MiniReputationBadges({
  earnedReputation = [],
  maxShow = 5,
  onClick,
  className = '',
}) {
  const earned = earnedReputation.filter(r => r.earned || r.isEarned);
  
  if (earned.length === 0) return null;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex -space-x-2">
        {earned.slice(0, maxShow).map(rep => {
          const trait = REPUTATION_TRAITS[rep.id] || rep;
          return (
            <div
              key={rep.id}
              className="w-8 h-8 rounded-full bg-warning-500/20 border-2 border-surface-0 flex items-center justify-center text-lg"
              title={trait.name}
            >
              {trait.icon}
            </div>
          );
        })}
      </div>
      {earned.length > maxShow && (
        <span className="text-xs text-text-tertiary">
          +{earned.length - maxShow}
        </span>
      )}
      {onClick && (
        <button
          onClick={onClick}
          className="text-xs text-brand-400 hover:text-brand-300"
        >
          View all
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROFILE REPUTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ProfileReputation - Reputation section for public profiles
 */
export function ProfileReputation({
  userName,
  earnedReputation = [],
  onViewFull,
  className = '',
}) {
  const earned = earnedReputation.filter(r => r.earned || r.isEarned);
  
  if (earned.length === 0) return null;
  
  return (
    <div className={`
      p-4 rounded-xl
      bg-surface-1 border border-white/[0.06]
      ${className}
    `}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-warning-400" />
          <span className="text-sm font-medium text-text-primary">
            {userName} is known for
          </span>
        </div>
        {onViewFull && (
          <button
            onClick={onViewFull}
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            <span>View all</span>
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {earned.map(rep => {
          const trait = REPUTATION_TRAITS[rep.id] || rep;
          return (
            <div
              key={rep.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-500/10 border border-warning-500/30"
            >
              <span className="text-lg">{trait.icon}</span>
              <span className="text-sm text-warning-400">{trait.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ReputationPanel;
