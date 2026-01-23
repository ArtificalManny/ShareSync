// src/hooks/useLivingCard.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE B: Living Cards - State Calculation Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// This hook analyzes task/project data and returns the appropriate "living" state.
// Cards should feel alive - responding to their content, not just displaying it.
//
// STATES:
// • idle       → Default, calm state
// • priority   → High priority, needs attention (amber pulse)
// • completing → Near completion >80% (cyan shimmer)
// • completed  → Just finished (success burst)
// • stale      → No activity 7+ days (desaturated, nudge action)
// • blocked    → Has blockers (red accent, shake on hover)
// • active     → Currently being worked on (breathing)
// • live       → Real-time activity (cyan glow)
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';

/**
 * Calculate the number of days since a date
 */
const daysSince = (date) => {
  if (!date) return Infinity;
  const now = new Date();
  const then = new Date(date);
  const diffTime = Math.abs(now - then);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate the number of days until a date
 */
const daysUntil = (date) => {
  if (!date) return Infinity;
  const now = new Date();
  const then = new Date(date);
  const diffTime = then - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Determine the living state of a card based on its data
 */
export const calculateLivingState = (data = {}) => {
  const {
    // Task/Project properties
    progress = 0,
    priority = 'normal', // 'low' | 'normal' | 'high' | 'urgent'
    status = 'active', // 'active' | 'completed' | 'blocked' | 'archived'
    lastActivity = null, // Date of last activity
    dueDate = null, // Due date
    completedAt = null, // When it was completed
    isBlocked = false,
    blockers = [],
    isLive = false, // Real-time activity happening
    assignee = null,
    
    // Override state directly if needed
    forceState = null,
  } = data;

  // Allow manual override
  if (forceState) {
    return forceState;
  }

  // Calculate derived values
  const daysSinceActivity = daysSince(lastActivity);
  const daysUntilDue = daysUntil(dueDate);
  const isComplete = status === 'completed' || progress >= 100;
  const isJustCompleted = isComplete && completedAt && daysSince(completedAt) < 1;
  const isNearCompletion = !isComplete && progress >= 80;
  const isStale = daysSinceActivity > 7 && !isComplete;
  const isOverdue = daysUntilDue < 0 && !isComplete;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 2 && !isComplete;
  const hasBlockers = isBlocked || (blockers && blockers.length > 0);
  const isHighPriority = priority === 'high' || priority === 'urgent';

  // Determine state (order matters - first match wins)
  
  // Live activity takes precedence
  if (isLive) {
    return 'live';
  }

  // Just completed - celebration moment
  if (isJustCompleted) {
    return 'completed';
  }

  // Blocked items need immediate attention
  if (hasBlockers) {
    return 'blocked';
  }

  // Overdue is critical
  if (isOverdue) {
    return 'overdue';
  }

  // High priority or due soon
  if (isHighPriority || isDueSoon) {
    return 'priority';
  }

  // Near completion - encourage finishing
  if (isNearCompletion) {
    return 'completing';
  }

  // Stale items need a nudge
  if (isStale) {
    return 'stale';
  }

  // Completed (not just completed)
  if (isComplete) {
    return 'done';
  }

  // Default active state
  return 'idle';
};

/**
 * Get CSS classes for a living state
 */
export const getLivingStateClasses = (state) => {
  const stateClasses = {
    idle: 'living-card--idle',
    priority: 'living-card--priority',
    completing: 'living-card--completing',
    completed: 'living-card--completed',
    done: 'living-card--done',
    stale: 'living-card--stale',
    blocked: 'living-card--blocked',
    active: 'living-card--active',
    live: 'living-card--live',
    overdue: 'living-card--overdue',
  };

  return stateClasses[state] || stateClasses.idle;
};

/**
 * Get state metadata (for tooltips, badges, etc.)
 */
export const getLivingStateMeta = (state) => {
  const stateMeta = {
    idle: {
      label: null,
      icon: null,
      color: 'text-secondary',
      tooltip: null,
    },
    priority: {
      label: 'Priority',
      icon: 'alert-triangle',
      color: 'warning',
      tooltip: 'High priority - needs attention',
    },
    completing: {
      label: 'Almost there!',
      icon: 'trending-up',
      color: 'cyan',
      tooltip: 'So close to completion!',
    },
    completed: {
      label: 'Just shipped!',
      icon: 'check-circle',
      color: 'success',
      tooltip: 'Completed moments ago',
    },
    done: {
      label: 'Done',
      icon: 'check',
      color: 'success',
      tooltip: 'Completed',
    },
    stale: {
      label: 'Needs attention',
      icon: 'clock',
      color: 'text-tertiary',
      tooltip: 'No activity in 7+ days',
    },
    blocked: {
      label: 'Blocked',
      icon: 'x-circle',
      color: 'error',
      tooltip: 'Has blockers preventing progress',
    },
    active: {
      label: 'In progress',
      icon: 'play',
      color: 'brand',
      tooltip: 'Currently being worked on',
    },
    live: {
      label: 'Live',
      icon: 'radio',
      color: 'cyan',
      tooltip: 'Real-time activity',
    },
    overdue: {
      label: 'Overdue',
      icon: 'alert-circle',
      color: 'error',
      tooltip: 'Past due date',
    },
  };

  return stateMeta[state] || stateMeta.idle;
};

/**
 * Main hook - combines state calculation with CSS classes and metadata
 */
export function useLivingCard(data = {}) {
  return useMemo(() => {
    const state = calculateLivingState(data);
    const className = getLivingStateClasses(state);
    const meta = getLivingStateMeta(state);
    
    // Calculate additional properties
    const progress = data.progress || 0;
    const isComplete = state === 'completed' || state === 'done';
    const needsAttention = ['priority', 'blocked', 'overdue', 'stale'].includes(state);
    const isPositive = ['completing', 'completed', 'done'].includes(state);
    
    return {
      // Core state
      state,
      className,
      meta,
      
      // Derived flags
      isComplete,
      needsAttention,
      isPositive,
      isLive: state === 'live',
      isBlocked: state === 'blocked',
      isStale: state === 'stale',
      isPriority: state === 'priority',
      isCompleting: state === 'completing',
      
      // For data attributes
      dataAttributes: {
        'data-living-state': state,
        'data-needs-attention': needsAttention ? 'true' : undefined,
        'data-progress': progress,
      },
      
      // Helper to get all props for a card element
      getCardProps: (additionalClasses = '') => ({
        className: `living-card ${className} ${additionalClasses}`.trim(),
        'data-living-state': state,
        'data-needs-attention': needsAttention ? 'true' : undefined,
      }),
    };
  }, [
    data.progress,
    data.priority,
    data.status,
    data.lastActivity,
    data.dueDate,
    data.completedAt,
    data.isBlocked,
    data.blockers,
    data.isLive,
    data.forceState,
  ]);
}

export default useLivingCard;
