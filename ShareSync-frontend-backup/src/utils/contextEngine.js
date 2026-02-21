// src/utils/contextEngine.js
/**
 * Context Engine - AI logic for adaptive navbar suggestions
 * 
 * Analyzes:
 * - Time of day (morning/afternoon/evening)
 * - User energy level (from Daily Readiness)
 * - Project phase (Shipping/Exploring/Maintaining)
 * - Day of week
 * 
 * Returns: Contextual suggestions optimized for user's current state
 */

/**
 * Get time of day context
 */
export function getTimeContext() {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    return {
      period: 'morning',
      label: 'Morning',
      icon: '🌅',
      energy: 'building', // Energy is building up
      focus: 'planning', // Best for planning and reviewing
    };
  }
  
  if (hour >= 12 && hour < 18) {
    return {
      period: 'afternoon',
      label: 'Afternoon',
      icon: '☀️',
      energy: 'peak', // Peak performance time
      focus: 'execution', // Best for getting things done
    };
  }
  
  if (hour >= 18 && hour < 22) {
    return {
      period: 'evening',
      label: 'Evening',
      icon: '🌆',
      energy: 'declining', // Energy winding down
      focus: 'review', // Best for reviewing and planning next day
    };
  }
  
  return {
    period: 'night',
    label: 'Night',
    icon: '🌙',
    energy: 'low', // Should be resting
    focus: 'rest', // Should not be working
  };
}

/**
 * Get energy level context
 * @param {number} energyScore - Daily Readiness score (0-100)
 */
export function getEnergyContext(energyScore) {
  if (energyScore >= 70) {
    return {
      level: 'high',
      label: 'High Energy',
      icon: '⚡',
      recommendation: 'tackle-hard-tasks',
      message: "You're in the zone!",
    };
  }
  
  if (energyScore >= 40) {
    return {
      level: 'moderate',
      label: 'Moderate Energy',
      icon: '🔋',
      recommendation: 'steady-progress',
      message: 'Keep a steady pace',
    };
  }
  
  return {
    level: 'low',
    label: 'Low Energy',
    icon: '🪫',
    recommendation: 'light-tasks',
    message: 'Take it easy',
  };
}

/**
 * Get project phase context
 * @param {string} season - 'Shipping' | 'Exploring' | 'Maintaining'
 */
export function getPhaseContext(season) {
  switch (season) {
    case 'Shipping':
      return {
        phase: 'shipping',
        label: 'Shipping Mode',
        icon: '🚢',
        urgency: 'high',
        mindset: 'execution',
        message: 'Ship it!',
      };
      
    case 'Exploring':
      return {
        phase: 'exploring',
        label: 'Exploring Mode',
        icon: '💡',
        urgency: 'low',
        mindset: 'discovery',
        message: 'Explore ideas',
      };
      
    case 'Maintaining':
      return {
        phase: 'maintaining',
        label: 'Maintaining Mode',
        icon: '🔧',
        urgency: 'medium',
        mindset: 'stability',
        message: 'Keep it running',
      };
      
    default:
      return {
        phase: 'neutral',
        label: 'Active',
        icon: '📋',
        urgency: 'medium',
        mindset: 'balanced',
        message: 'Stay focused',
      };
  }
}

/**
 * Get day of week context
 */
export function getDayContext() {
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;
  const isMonday = day === 1;
  const isFriday = day === 5;
  
  return {
    isWeekend,
    isMonday,
    isFriday,
    dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
  };
}

/**
 * Generate contextual suggestion based on all factors
 * 
 * @param {Object} params
 * @param {number} params.energyScore - Daily Readiness (0-100)
 * @param {string} params.projectSeason - Current project season
 * @param {Object} params.nextTask - Next priority task
 * @returns {Object} Contextual suggestion
 */
export function generateContextualSuggestion({ energyScore = 50, projectSeason = null, nextTask = null }) {
  const time = getTimeContext();
  const energy = getEnergyContext(energyScore);
  const phase = getPhaseContext(projectSeason);
  const day = getDayContext();
  
  // ⭐ AI LOGIC - Contextual decision tree
  
  // NIGHT: Should be resting
  if (time.period === 'night') {
    return {
      type: 'rest',
      icon: '🌙',
      label: 'Time to rest',
      message: 'Come back tomorrow refreshed',
      color: 'text-slate-400',
      priority: 'info',
    };
  }
  
  // WEEKEND: Different mindset
  if (day.isWeekend) {
    return {
      type: 'weekend',
      icon: '🏖️',
      label: 'Weekend mode',
      message: 'Take a break or work at your own pace',
      color: 'text-blue-400',
      priority: 'info',
    };
  }
  
  // MONDAY MORNING: Planning mode
  if (day.isMonday && time.period === 'morning') {
    return {
      type: 'plan-week',
      icon: '📅',
      label: 'Plan your week',
      message: 'Set your goals for the week',
      color: 'text-purple-400',
      priority: 'high',
    };
  }
  
  // FRIDAY EVENING: Wrap up
  if (day.isFriday && time.period === 'evening') {
    return {
      type: 'wrap-up',
      icon: '✅',
      label: 'Wrap up the week',
      message: 'Finish strong and plan next week',
      color: 'text-green-400',
      priority: 'medium',
    };
  }
  
  // LOW ENERGY + MORNING: Review mode
  if (energy.level === 'low' && time.period === 'morning') {
    return {
      type: 'review',
      icon: '🔍',
      label: 'Review tasks',
      message: 'Take it slow this morning',
      color: 'text-yellow-400',
      priority: 'low',
    };
  }
  
  // HIGH ENERGY + AFTERNOON + SHIPPING: Execution mode
  if (energy.level === 'high' && time.period === 'afternoon' && phase.phase === 'shipping') {
    if (nextTask) {
      return {
        type: 'execute',
        icon: '🚀',
        label: `Ship: ${nextTask.title}`,
        message: "You're in the zone - ship it!",
        color: 'text-orange-500',
        priority: 'urgent',
        action: nextTask.action,
      };
    }
  }
  
  // MODERATE ENERGY + EXPLORING: Creative mode
  if (energy.level === 'moderate' && phase.phase === 'exploring') {
    return {
      type: 'explore',
      icon: '💡',
      label: 'Explore ideas',
      message: 'Perfect time for creative thinking',
      color: 'text-blue-400',
      priority: 'medium',
    };
  }
  
  // EVENING: Plan tomorrow
  if (time.period === 'evening') {
    return {
      type: 'plan-tomorrow',
      icon: '📝',
      label: 'Plan tomorrow',
      message: 'Set yourself up for success',
      color: 'text-indigo-400',
      priority: 'medium',
    };
  }
  
  // DEFAULT: Use next task if available
  if (nextTask) {
    return {
      type: 'next-task',
      icon: nextTask.icon || '📋',
      label: nextTask.label,
      message: nextTask.message || '',
      color: nextTask.color || 'text-slate-300',
      priority: nextTask.priority || 'medium',
      action: nextTask.action,
    };
  }
  
  // FALLBACK: Generic suggestion
  return {
    type: 'start-day',
    icon: time.icon,
    label: `Start your ${time.label.toLowerCase()}`,
    message: `${energy.message} - ${phase.message}`,
    color: 'text-slate-300',
    priority: 'low',
  };
}
/**
 * PHASE 3: Enhanced energy-based suggestions
 * More sophisticated logic combining energy + time + phase
 */
export function getAdvancedEnergyRecommendation({ energyScore, energyTrend, time, phase, nextTask }) {
  // VERY LOW ENERGY (<20): Force rest
  if (energyScore < 20) {
    return {
      type: 'rest',
      icon: '🛋️',
      label: 'Take a break',
      message: 'Your energy is too low to work effectively',
      color: 'text-red-500',
      priority: 'critical',
      actionable: false,
    };
  }

  // LOW ENERGY (20-40)
  if (energyScore < 40) {
    if (time.period === 'evening') {
      return {
        type: 'plan-tomorrow',
        icon: '📝',
        label: 'Plan tomorrow, then rest',
        message: 'Set up success for tomorrow',
        color: 'text-indigo-400',
        priority: 'medium',
      };
    }
    // Morning/afternoon but low energy
    return {
      type: 'light-tasks',
      icon: '🪫',
      label: 'Light tasks only',
      message: 'Save energy for later',
      color: 'text-yellow-500',
      priority: 'low',
    };
  }

  // MODERATE ENERGY (40-70) + SHIPPING DEADLINE
  if (energyScore >= 40 && energyScore < 70 && phase.phase === 'shipping') {
    if (nextTask) {
      return {
        type: 'critical-path',
        icon: '🎯',
        label: `Focus: ${nextTask.title}`,
        message: 'Critical path - shipping deadline',
        color: 'text-orange-500',
        priority: 'high',
        action: nextTask.action,
      };
    }
  }

  // HIGH ENERGY (70-80) + MORNING
  if (energyScore >= 70 && energyScore < 80 && time.period === 'morning') {
    return {
      type: 'hardest-task',
      icon: '💪',
      label: 'Start with hardest task',
      message: 'Peak morning energy',
      color: 'text-green-500',
      priority: 'high',
    };
  }

  // HIGH ENERGY (70-80) + AFTERNOON
  if (energyScore >= 70 && energyScore < 80 && time.period === 'afternoon') {
    if (phase.phase === 'shipping' && nextTask) {
      return {
        type: 'ship-feature',
        icon: '🚀',
        label: `Ship: ${nextTask.title}`,
        message: 'Perfect time to ship!',
        color: 'text-orange-500',
        priority: 'urgent',
        action: nextTask.action,
      };
    }
  }

  // VERY HIGH ENERGY (80+)
  if (energyScore >= 80) {
    if (energyTrend === 'rising') {
      return {
        type: 'momentum-mode',
        icon: '🔥',
        label: 'Ride the momentum!',
        message: 'Energy rising - maximize output',
        color: 'text-orange-600',
        priority: 'urgent',
      };
    }
    return {
      type: 'peak-performance',
      icon: '⚡',
      label: 'Peak performance mode',
      message: 'Your best work happens now',
      color: 'text-green-600',
      priority: 'urgent',
    };
  }

  // DEFAULT: Return null to use standard logic
  return null;
}