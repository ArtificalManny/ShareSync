// src/components/identity/GrowthQuests.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY ENGINE: Growth Quests
// Challenges that help you develop specific skills
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  Target, Clock, Star, Zap, CheckCircle2, ChevronRight,
  Gift, TrendingUp, Calendar, Award, Play, Lock
} from 'lucide-react';
import { GROWTH_QUESTS, QUEST_TYPES, SKILLS } from '../../hooks/useIdentityEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// QUEST TYPE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const QUEST_TYPE_CONFIG = {
  [QUEST_TYPES.DAILY]: {
    color: 'text-success-400',
    bgColor: 'bg-success-500/10',
    borderColor: 'border-success-500/30',
    label: 'Daily',
    icon: Clock,
  },
  [QUEST_TYPES.WEEKLY]: {
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
    borderColor: 'border-brand-500/30',
    label: 'Weekly',
    icon: Calendar,
  },
  [QUEST_TYPES.MONTHLY]: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Monthly',
    icon: Star,
  },
  [QUEST_TYPES.SPECIAL]: {
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
    label: 'Special',
    icon: Zap,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUEST CARD
// ═══════════════════════════════════════════════════════════════════════════════

function QuestCard({
  quest,
  isActive,
  onStart,
  onClaim,
  isExpanded,
  onToggle,
}) {
  const typeConfig = QUEST_TYPE_CONFIG[quest.type] || QUEST_TYPE_CONFIG[QUEST_TYPES.WEEKLY];
  const TypeIcon = typeConfig.icon;
  const skill = SKILLS[quest.skill];
  
  const progressPercent = quest.progress !== undefined 
    ? (quest.progress / quest.target) * 100 
    : 0;
  const isComplete = progressPercent >= 100;
  
  return (
    <div className={`
      rounded-xl border overflow-hidden transition-all duration-200
      ${isActive 
        ? `${typeConfig.bgColor} ${typeConfig.borderColor}` 
        : 'bg-surface-1 border-white/[0.06]'
      }
      ${isComplete ? 'ring-2 ring-success-500/30' : ''}
    `}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Icon */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${typeConfig.bgColor}
        `}>
          {skill?.icon ? (
            <span className="text-2xl">{skill.icon}</span>
          ) : (
            <Target className={`w-6 h-6 ${typeConfig.color}`} />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`
              px-2 py-0.5 rounded-full text-[10px] font-medium
              ${typeConfig.bgColor} ${typeConfig.color}
            `}>
              {typeConfig.label}
            </span>
            {isComplete && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-success-500/20 text-success-400">
                Complete!
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-text-primary truncate">
            {quest.name}
          </div>
          <div className="text-xs text-text-tertiary truncate">
            {quest.description}
          </div>
        </div>
        
        {/* Progress or start */}
        {isActive ? (
          <div className="text-right">
            <div className={`text-lg font-bold ${isComplete ? 'text-success-400' : typeConfig.color}`}>
              {quest.progress}/{quest.target}
            </div>
            <div className="text-xs text-text-tertiary">progress</div>
          </div>
        ) : (
          <ChevronRight className="w-5 h-5 text-text-tertiary" />
        )}
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06]">
          {/* Progress bar (if active) */}
          {isActive && (
            <div className="mb-4 mt-3">
              <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete ? 'bg-success-500' : typeConfig.barColor || 'bg-brand-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Rewards */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-warning-400" />
              <span className="text-sm text-text-primary">+{quest.xpReward} XP</span>
            </div>
            {skill && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                <span className="text-sm text-text-primary">
                  +{quest.skillProgress} {skill.name}
                </span>
              </div>
            )}
          </div>
          
          {/* Action button */}
          {isActive && isComplete ? (
            <button
              onClick={() => onClaim?.(quest)}
              className="
                w-full py-3 rounded-xl
                bg-success-500 text-white font-medium
                hover:bg-success-400 transition-colors
                flex items-center justify-center gap-2
              "
            >
              <Gift className="w-4 h-4" />
              <span>Claim Rewards</span>
            </button>
          ) : !isActive ? (
            <button
              onClick={() => onStart?.(quest)}
              className={`
                w-full py-3 rounded-xl font-medium
                ${typeConfig.bgColor} ${typeConfig.color}
                hover:opacity-80 transition-opacity
                flex items-center justify-center gap-2
              `}
            >
              <Play className="w-4 h-4" />
              <span>Start Quest</span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GROWTH QUESTS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GrowthQuestsPanel - Quest management UI
 */
export function GrowthQuestsPanel({
  activeQuests = [],
  onStartQuest,
  onClaimReward,
  className = '',
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, daily, weekly, monthly
  
  // Separate active and available quests
  const activeQuestIds = new Set(activeQuests.map(q => q.id));
  
  const availableQuests = useMemo(() => {
    return Object.values(GROWTH_QUESTS)
      .filter(q => !activeQuestIds.has(q.id))
      .filter(q => filter === 'all' || q.type === filter);
  }, [activeQuestIds, filter]);
  
  const filteredActiveQuests = useMemo(() => {
    return activeQuests.filter(q => filter === 'all' || q.type === filter);
  }, [activeQuests, filter]);
  
  // Count ready to claim
  const readyToClaim = activeQuests.filter(q => q.progress >= q.target).length;
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-surface-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Growth Quests
              </div>
              <div className="text-sm text-text-tertiary">
                Challenges that build your skills
              </div>
            </div>
          </div>
          
          {readyToClaim > 0 && (
            <div className="px-3 py-1 rounded-full bg-success-500/20 text-success-400 text-sm font-medium animate-pulse">
              {readyToClaim} ready to claim!
            </div>
          )}
        </div>
      </div>
      
      {/* Filter tabs */}
      <div className="px-4 py-2 border-b border-white/[0.06] flex gap-2">
        {['all', 'daily', 'weekly', 'monthly'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1 rounded-lg text-xs font-medium transition-colors
              ${filter === f 
                ? 'bg-brand-500/10 text-brand-400' 
                : 'text-text-tertiary hover:text-text-secondary'
              }
            `}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {/* Active quests */}
        {filteredActiveQuests.length > 0 && (
          <div>
            <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
              Active Quests ({filteredActiveQuests.length})
            </div>
            <div className="space-y-3">
              {filteredActiveQuests.map(quest => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  isActive
                  onClaim={onClaimReward}
                  isExpanded={expandedId === quest.id}
                  onToggle={() => setExpandedId(expandedId === quest.id ? null : quest.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Available quests */}
        {availableQuests.length > 0 && (
          <div>
            <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
              Available Quests ({availableQuests.length})
            </div>
            <div className="space-y-3">
              {availableQuests.map(quest => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  isActive={false}
                  onStart={onStartQuest}
                  isExpanded={expandedId === quest.id}
                  onToggle={() => setExpandedId(expandedId === quest.id ? null : quest.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {filteredActiveQuests.length === 0 && availableQuests.length === 0 && (
          <div className="py-8 text-center">
            <Award className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <div className="text-sm text-text-tertiary">
              No quests available in this category
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI QUEST WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniQuestWidget - Compact quest preview for dashboard
 */
export function MiniQuestWidget({
  activeQuests = [],
  onClick,
  className = '',
}) {
  const nextToComplete = activeQuests
    .map(q => ({ ...q, progressPercent: (q.progress / q.target) * 100 }))
    .sort((a, b) => b.progressPercent - a.progressPercent)[0];
  
  const readyCount = activeQuests.filter(q => q.progress >= q.target).length;
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 transition-colors
        text-left group
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-medium text-text-primary">Active Quests</span>
        </div>
        <div className="flex items-center gap-2">
          {readyCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-success-500/20 text-success-400 text-xs font-medium">
              {readyCount} ready
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
      
      {nextToComplete ? (
        <div>
          <div className="text-sm text-text-primary mb-2 truncate">
            {nextToComplete.name}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${nextToComplete.progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-text-tertiary">
              {nextToComplete.progress}/{nextToComplete.target}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-text-tertiary">
          No active quests. Start one!
        </div>
      )}
    </button>
  );
}

export default GrowthQuestsPanel;
