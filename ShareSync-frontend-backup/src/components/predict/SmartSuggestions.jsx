// src/components/predict/SmartSuggestions.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICT ENGINE: Smart Suggestions
// AI-powered suggestions for tasks
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { 
  Lightbulb, Clock, Scissors, User, Zap, ChevronRight,
  CheckCircle2, X, MessageCircle, AlertCircle, ThumbsUp,
  ThumbsDown, ArrowRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// SUGGESTION TYPE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const SUGGESTION_CONFIG = {
  similar_task: {
    icon: Lightbulb,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  estimation_warning: {
    icon: Clock,
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
  },
  split_task: {
    icon: Scissors,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  assignee_suggestion: {
    icon: User,
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
    borderColor: 'border-brand-500/30',
  },
  priority_boost: {
    icon: Zap,
    color: 'text-error-400',
    bgColor: 'bg-error-500/10',
    borderColor: 'border-error-500/30',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

function ConfidenceIndicator({ confidence }) {
  const percentage = Math.round(confidence * 100);
  const color = percentage >= 80 ? 'text-success-400' : percentage >= 60 ? 'text-warning-400' : 'text-text-tertiary';
  
  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1 rounded-full bg-surface-3 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            percentage >= 80 ? 'bg-success-500' : percentage >= 60 ? 'bg-warning-500' : 'bg-text-tertiary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-[10px] ${color}`}>{percentage}%</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE SUGGESTION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onFeedback,
  showActions = true,
}) {
  const config = SUGGESTION_CONFIG[suggestion.type] || SUGGESTION_CONFIG.similar_task;
  const Icon = config.icon;
  
  return (
    <div className={`
      p-4 rounded-xl border transition-all duration-200
      ${config.bgColor} ${config.borderColor}
    `}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${config.bgColor}
        `}>
          {suggestion.icon ? (
            <span className="text-xl">{suggestion.icon}</span>
          ) : (
            <Icon className={`w-5 h-5 ${config.color}`} />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className={`text-sm font-medium ${config.color}`}>
              {suggestion.title}
            </div>
            <ConfidenceIndicator confidence={suggestion.confidence} />
          </div>
          
          <p className="text-sm text-text-secondary mb-3">
            {suggestion.description}
          </p>
          
          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAccept?.(suggestion)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium
                  ${config.bgColor} ${config.color}
                  hover:opacity-80 transition-opacity
                  flex items-center gap-1
                `}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Apply</span>
              </button>
              
              <button
                onClick={() => onDismiss?.(suggestion)}
                className="px-3 py-1.5 rounded-lg text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-colors"
              >
                Dismiss
              </button>
              
              {/* Feedback buttons */}
              {onFeedback && (
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => onFeedback(suggestion, 'helpful')}
                    className="p-1.5 rounded hover:bg-surface-2 text-text-tertiary hover:text-success-400 transition-colors"
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onFeedback(suggestion, 'not_helpful')}
                    className="p-1.5 rounded hover:bg-surface-2 text-text-tertiary hover:text-error-400 transition-colors"
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMILAR TASK DETAIL
// ═══════════════════════════════════════════════════════════════════════════════

function SimilarTaskDetail({
  suggestion,
  onContact,
  onViewTask,
}) {
  return (
    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-cyan-400">Similar Task Found</span>
      </div>
      
      <p className="text-sm text-text-secondary mb-4">
        {suggestion.description}
      </p>
      
      <div className="flex gap-2">
        <button
          onClick={onContact}
          className="flex-1 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Ask for Advice</span>
        </button>
        <button
          onClick={onViewTask}
          className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary text-sm hover:bg-surface-3 transition-colors"
        >
          View Task
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTIMATION WARNING
// ═══════════════════════════════════════════════════════════════════════════════

function EstimationWarning({
  suggestion,
  onAdjust,
  onKeep,
}) {
  return (
    <div className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/30">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-warning-400" />
        <span className="text-sm font-medium text-warning-400">Estimation Check</span>
      </div>
      
      <p className="text-sm text-text-secondary mb-4">
        {suggestion.description}
      </p>
      
      <div className="flex gap-2">
        <button
          onClick={() => onAdjust?.(suggestion.action?.suggested)}
          className="flex-1 py-2 rounded-lg bg-warning-500 text-white text-sm font-medium hover:bg-warning-400 transition-colors"
        >
          Adjust Estimate
        </button>
        <button
          onClick={onKeep}
          className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary text-sm hover:bg-surface-3 transition-colors"
        >
          Keep Current
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SMART SUGGESTIONS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SmartSuggestionsPanel - Full suggestions view for a task
 */
export function SmartSuggestionsPanel({
  task,
  suggestions = [],
  onAcceptSuggestion,
  onDismissSuggestion,
  onFeedback,
  className = '',
}) {
  const [dismissedIds, setDismissedIds] = useState(new Set());
  
  const visibleSuggestions = suggestions.filter((_, idx) => !dismissedIds.has(idx));
  
  const handleDismiss = useCallback((suggestion, idx) => {
    setDismissedIds(prev => new Set([...prev, idx]));
    onDismissSuggestion?.(suggestion);
  }, [onDismissSuggestion]);
  
  if (visibleSuggestions.length === 0) return null;
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] bg-surface-1">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-medium text-text-primary">
            Smart Suggestions
          </span>
          <span className="text-xs text-text-tertiary">
            ({visibleSuggestions.length})
          </span>
        </div>
      </div>
      
      {/* Suggestions list */}
      <div className="p-4 space-y-3">
        {suggestions.map((suggestion, idx) => {
          if (dismissedIds.has(idx)) return null;
          
          return (
            <SuggestionCard
              key={idx}
              suggestion={suggestion}
              onAccept={onAcceptSuggestion}
              onDismiss={(s) => handleDismiss(s, idx)}
              onFeedback={onFeedback}
            />
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE SUGGESTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * InlineSuggestion - Compact suggestion for task cards
 */
export function InlineSuggestion({
  suggestion,
  onAccept,
  onDismiss,
  className = '',
}) {
  const config = SUGGESTION_CONFIG[suggestion.type] || SUGGESTION_CONFIG.similar_task;
  
  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-lg
      ${config.bgColor} ${config.borderColor} border
      ${className}
    `}>
      <span className="text-sm">{suggestion.icon || '💡'}</span>
      <span className={`text-xs flex-1 truncate ${config.color}`}>
        {suggestion.title}
      </span>
      <button
        onClick={() => onAccept?.(suggestion)}
        className={`text-xs ${config.color} hover:underline`}
      >
        Apply
      </button>
      <button
        onClick={() => onDismiss?.(suggestion)}
        className="text-text-tertiary hover:text-text-secondary"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUGGESTION BADGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SuggestionBadge - Shows suggestion count on task cards
 */
export function SuggestionBadge({
  count,
  onClick,
  className = '',
}) {
  if (count === 0) return null;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2 py-0.5 rounded-full
        bg-brand-500/10 text-brand-400
        hover:bg-brand-500/20 transition-colors
        ${className}
      `}
    >
      <Lightbulb className="w-3 h-3" />
      <span className="text-[10px] font-medium">{count}</span>
    </button>
  );
}

export default SmartSuggestionsPanel;
