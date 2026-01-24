// src/utils/momentumCalculator.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine - Score Calculator
// ═══════════════════════════════════════════════════════════════════════════════
//
// Calculates momentum score (0-100) from user activity.
// The score decays over time, encouraging continuous engagement.
//
// SCORING MODEL:
// - Complete task:        +15 points
// - Ship project:         +30 points
// - Start focus session:  +10 points
// - Maintain streak:      +5 per day
// - Active in last 5 min: +5 points
// - Collaborate:          +5 points
//
// DECAY:
// - Base decay: -1 point per minute of inactivity
// - Idle threshold: 5 minutes
// - Decay accelerates after 30 minutes idle
//
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Activity types and their point values
 */
export const ACTIVITY_POINTS = {
  TASK_COMPLETE: 15,
  PROJECT_SHIP: 30,
  FOCUS_START: 10,
  FOCUS_COMPLETE: 20,
  STREAK_DAY: 5,
  ACTIVE_RECENT: 5,
  COLLABORATE: 5,
  COMMENT: 3,
  ASSIGN: 3,
  VIEW_PROJECT: 1,
  EDIT_TASK: 2,
};

/**
 * Decay configuration
 */
export const DECAY_CONFIG = {
  IDLE_THRESHOLD_MS: 5 * 60 * 1000,      // 5 minutes
  DECAY_RATE_PER_MIN: 1,                  // -1 point per minute
  ACCELERATED_THRESHOLD_MS: 30 * 60 * 1000, // 30 minutes
  ACCELERATED_DECAY_RATE: 2,              // -2 points per minute after 30 min
  MIN_SCORE: 0,
  MAX_SCORE: 100,
};

/**
 * Level thresholds
 */
export const LEVEL_THRESHOLDS = {
  0: { min: 0, max: 19, name: 'idle', label: 'Idle' },
  1: { min: 20, max: 39, name: 'warming', label: 'Warming Up' },
  2: { min: 40, max: 59, name: 'building', label: 'Building' },
  3: { min: 60, max: 74, name: 'flowing', label: 'In Flow' },
  4: { min: 75, max: 89, name: 'peak', label: 'Peak' },
  5: { min: 90, max: 100, name: 'fire', label: 'On Fire 🔥' },
};

/**
 * Calculate level from score
 */
export function calculateLevel(score) {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}

/**
 * Get level metadata
 */
export function getLevelMeta(level) {
  return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[0];
}

/**
 * Calculate score from activity history
 */
export function calculateScoreFromHistory(activities = [], streakDays = 0, lastActivityTime = null) {
  let score = 0;
  const now = Date.now();
  
  // Base score from streak
  score += Math.min(streakDays * ACTIVITY_POINTS.STREAK_DAY, 35); // Cap at 7 days worth
  
  // Score from recent activities (last 2 hours)
  const twoHoursAgo = now - (2 * 60 * 60 * 1000);
  const recentActivities = activities.filter(a => a.timestamp > twoHoursAgo);
  
  recentActivities.forEach(activity => {
    const points = ACTIVITY_POINTS[activity.type] || 0;
    // Decay points based on how long ago (more recent = more points)
    const ageMinutes = (now - activity.timestamp) / (60 * 1000);
    const decayMultiplier = Math.max(0.3, 1 - (ageMinutes / 120)); // Decay over 2 hours
    score += points * decayMultiplier;
  });
  
  // Active in last 5 minutes bonus
  if (lastActivityTime && (now - lastActivityTime) < DECAY_CONFIG.IDLE_THRESHOLD_MS) {
    score += ACTIVITY_POINTS.ACTIVE_RECENT;
  }
  
  // Apply idle decay
  if (lastActivityTime) {
    const idleTime = now - lastActivityTime;
    if (idleTime > DECAY_CONFIG.IDLE_THRESHOLD_MS) {
      const idleMinutes = (idleTime - DECAY_CONFIG.IDLE_THRESHOLD_MS) / (60 * 1000);
      
      if (idleTime > DECAY_CONFIG.ACCELERATED_THRESHOLD_MS) {
        // Accelerated decay after 30 minutes
        const normalMinutes = (DECAY_CONFIG.ACCELERATED_THRESHOLD_MS - DECAY_CONFIG.IDLE_THRESHOLD_MS) / (60 * 1000);
        const acceleratedMinutes = idleMinutes - normalMinutes;
        score -= normalMinutes * DECAY_CONFIG.DECAY_RATE_PER_MIN;
        score -= acceleratedMinutes * DECAY_CONFIG.ACCELERATED_DECAY_RATE;
      } else {
        score -= idleMinutes * DECAY_CONFIG.DECAY_RATE_PER_MIN;
      }
    }
  }
  
  // Clamp to valid range
  return Math.round(Math.max(DECAY_CONFIG.MIN_SCORE, Math.min(DECAY_CONFIG.MAX_SCORE, score)));
}

/**
 * Create an activity record
 */
export function createActivity(type, metadata = {}) {
  return {
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    points: ACTIVITY_POINTS[type] || 0,
    ...metadata,
  };
}

/**
 * Calculate progress to next level
 */
export function calculateProgressToNextLevel(score) {
  const currentLevel = calculateLevel(score);
  const levelMeta = getLevelMeta(currentLevel);
  const nextLevelMeta = getLevelMeta(Math.min(currentLevel + 1, 5));
  
  if (currentLevel === 5) {
    // Already at max level
    return {
      currentLevel,
      nextLevel: 5,
      progress: 1,
      pointsToNext: 0,
      isMaxLevel: true,
    };
  }
  
  const levelRange = nextLevelMeta.min - levelMeta.min;
  const progressInLevel = score - levelMeta.min;
  const progress = progressInLevel / levelRange;
  
  return {
    currentLevel,
    nextLevel: currentLevel + 1,
    progress: Math.min(1, Math.max(0, progress)),
    pointsToNext: nextLevelMeta.min - score,
    isMaxLevel: false,
  };
}

/**
 * Get contextual message based on score and recent activity
 */
export function getMomentumMessage(score, recentActivityCount = 0, streakDays = 0) {
  const level = calculateLevel(score);
  
  // Level-specific messages with variations
  const messages = {
    0: [
      "Ready when you are",
      "Take your time",
      "Let's get started",
      "Your runway is clear",
    ],
    1: [
      "Warming up...",
      "Getting into it",
      "Building momentum",
      "Nice start!",
    ],
    2: [
      "You're rolling now",
      "Good pace!",
      "Keep it going",
      "Momentum building",
    ],
    3: [
      "You're in the zone!",
      "Flow state achieved",
      "Crushing it!",
      "On a roll!",
    ],
    4: [
      "Peak performance!",
      "You're unstoppable!",
      "Incredible focus!",
      "Machine mode!",
    ],
    5: [
      "🔥 ON FIRE!",
      "🔥 Legendary!",
      "🔥 Absolutely crushing it!",
      "🔥 You're a shipping machine!",
    ],
  };
  
  // Add streak context
  const baseMessages = messages[level];
  let message = baseMessages[Math.floor(Math.random() * baseMessages.length)];
  
  // Streak bonus messages
  if (streakDays >= 7 && level >= 3) {
    const streakMessages = [
      `${streakDays} day streak!`,
      `Week-long fire!`,
      `${streakDays} days strong!`,
    ];
    message += ` • ${streakMessages[Math.floor(Math.random() * streakMessages.length)]}`;
  }
  
  return message;
}

/**
 * Calculate estimated time to next level
 */
export function estimateTimeToNextLevel(score, averagePointsPerMinute = 0.5) {
  const progress = calculateProgressToNextLevel(score);
  
  if (progress.isMaxLevel || progress.pointsToNext <= 0) {
    return null;
  }
  
  const minutesToNext = progress.pointsToNext / averagePointsPerMinute;
  
  if (minutesToNext < 5) {
    return "A few tasks away";
  } else if (minutesToNext < 15) {
    return "About 10-15 minutes";
  } else if (minutesToNext < 30) {
    return "About 20-30 minutes";
  } else if (minutesToNext < 60) {
    return "Under an hour";
  } else {
    return "Keep shipping!";
  }
}

/**
 * Calculate momentum change rate
 */
export function calculateMomentumTrend(scoreHistory = []) {
  if (scoreHistory.length < 2) {
    return { trend: 'stable', rate: 0 };
  }
  
  // Look at last 5 scores
  const recentScores = scoreHistory.slice(-5);
  const firstScore = recentScores[0];
  const lastScore = recentScores[recentScores.length - 1];
  const change = lastScore - firstScore;
  
  if (change > 10) {
    return { trend: 'rising', rate: change };
  } else if (change < -10) {
    return { trend: 'falling', rate: change };
  } else {
    return { trend: 'stable', rate: change };
  }
}

export default {
  ACTIVITY_POINTS,
  DECAY_CONFIG,
  LEVEL_THRESHOLDS,
  calculateLevel,
  getLevelMeta,
  calculateScoreFromHistory,
  createActivity,
  calculateProgressToNextLevel,
  getMomentumMessage,
  estimateTimeToNextLevel,
  calculateMomentumTrend,
};
