// src/utils/statsCalculator.js
// ═══════════════════════════════════════════════════════════════════════════════
// STATS CALCULATOR - Streaks, rankings, productivity metrics
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate current streak from activity dates
 * @param {Array} activities - Array of activities with completedAt timestamps
 * @param {string} timestampKey - Key for timestamp (default: 'completedAt')
 * @returns {object} Streak info { current, longest, startDate, isActive }
 */
export function calculateStreak(activities, timestampKey = 'completedAt') {
  if (!activities || activities.length === 0) {
    return { current: 0, longest: 0, startDate: null, isActive: false };
  }

  // Get unique dates (as YYYY-MM-DD strings)
  const uniqueDates = [...new Set(
    activities
      .filter(a => a[timestampKey])
      .map(a => new Date(a[timestampKey]).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a)); // Most recent first

  if (uniqueDates.length === 0) {
    return { current: 0, longest: 0, startDate: null, isActive: false };
  }

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  // Check if streak is currently active
  const isActive = uniqueDates[0] === today || uniqueDates[0] === yesterday;
  
  // Calculate current streak
  let currentStreak = 0;
  let streakStartDate = null;
  
  if (isActive) {
    let checkDate = new Date(uniqueDates[0]);
    
    for (const dateStr of uniqueDates) {
      const activityDate = new Date(dateStr);
      const diffDays = Math.round((checkDate - activityDate) / 86400000);
      
      if (diffDays <= 1) {
        currentStreak++;
        streakStartDate = dateStr;
        checkDate = activityDate;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    const diffDays = Math.round((current - next) / 86400000);
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    current: currentStreak,
    longest: Math.max(longestStreak, currentStreak),
    startDate: streakStartDate,
    isActive,
    lastActivityDate: uniqueDates[0],
  };
}

/**
 * Get streak tier based on days
 * @param {number} days - Streak days
 * @returns {object} Tier info { tier, name, emoji, color, nextTier }
 */
export function getStreakTier(days) {
  const tiers = [
    { min: 100, tier: 5, name: 'Legendary', emoji: '👑', color: 'gold' },
    { min: 50, tier: 4, name: 'Epic', emoji: '💎', color: 'purple' },
    { min: 30, tier: 3, name: 'Fire', emoji: '🔥', color: 'orange' },
    { min: 14, tier: 2, name: 'Hot', emoji: '🌟', color: 'yellow' },
    { min: 7, tier: 1, name: 'Warming Up', emoji: '⚡', color: 'blue' },
    { min: 0, tier: 0, name: 'Starting', emoji: '🌱', color: 'green' },
  ];

  for (let i = 0; i < tiers.length; i++) {
    if (days >= tiers[i].min) {
      const nextTier = i > 0 ? tiers[i - 1] : null;
      return {
        ...tiers[i],
        daysToNext: nextTier ? nextTier.min - days : 0,
        nextTier,
      };
    }
  }
  
  return tiers[tiers.length - 1];
}

/**
 * Calculate user ranking in a leaderboard
 * @param {Array} users - Array of user objects with score/points
 * @param {string} userId - Current user's ID
 * @param {string} scoreKey - Key for score (default: 'points')
 * @returns {object} Ranking info
 */
export function calculateRanking(users, userId, scoreKey = 'points') {
  if (!users || users.length === 0) {
    return { rank: 0, total: 0, percentile: 0, isTop10: false, isTop3: false };
  }

  // Sort by score descending
  const sorted = [...users].sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0));
  
  const rank = sorted.findIndex(u => u._id === userId || u.id === userId) + 1;
  const total = sorted.length;
  const percentile = total > 0 ? Math.round(((total - rank) / total) * 100) : 0;

  return {
    rank,
    total,
    percentile,
    isTop10: rank <= 10 && rank > 0,
    isTop3: rank <= 3 && rank > 0,
    isFirst: rank === 1,
    score: rank > 0 ? sorted[rank - 1][scoreKey] : 0,
  };
}

/**
 * Calculate productivity score (0-100)
 * @param {object} metrics - User metrics
 * @returns {object} Productivity score breakdown
 */
export function calculateProductivityScore(metrics) {
  const {
    tasksCompleted = 0,
    tasksTarget = 10,
    focusMinutes = 0,
    focusTarget = 120,
    streakDays = 0,
    streakTarget = 7,
    collaborations = 0,
    collaborationTarget = 3,
  } = metrics;

  // Calculate individual scores (capped at Available)
  const taskScore = Math.min((tasksCompleted / tasksTarget) * 100, 100);
  const focusScore = Math.min((focusMinutes / focusTarget) * 100, 100);
  const streakScore = Math.min((streakDays / streakTarget) * 100, 100);
  const collabScore = Math.min((collaborations / collaborationTarget) * 100, 100);

  // Weighted average
  const weights = { tasks: 0.35, focus: 0.30, streak: 0.25, collab: 0.10 };
  const overallScore = 
    taskScore * weights.tasks +
    focusScore * weights.focus +
    streakScore * weights.streak +
    collabScore * weights.collab;

  return {
    overall: Math.round(overallScore),
    breakdown: {
      tasks: { score: Math.round(taskScore), value: tasksCompleted, target: tasksTarget },
      focus: { score: Math.round(focusScore), value: focusMinutes, target: focusTarget },
      streak: { score: Math.round(streakScore), value: streakDays, target: streakTarget },
      collaboration: { score: Math.round(collabScore), value: collaborations, target: collaborationTarget },
    },
    grade: getProductivityGrade(overallScore),
  };
}

/**
 * Get productivity grade from score
 * @param {number} score - Productivity score (0-100)
 * @returns {object} Grade info
 */
export function getProductivityGrade(score) {
  if (score >= 95) return { grade: 'A+', label: 'Outstanding', color: 'success' };
  if (score >= 90) return { grade: 'A', label: 'Excellent', color: 'success' };
  if (score >= 85) return { grade: 'A-', label: 'Great', color: 'success' };
  if (score >= 80) return { grade: 'B+', label: 'Very Good', color: 'brand' };
  if (score >= 75) return { grade: 'B', label: 'Good', color: 'brand' };
  if (score >= 70) return { grade: 'B-', label: 'Solid', color: 'brand' };
  if (score >= 65) return { grade: 'C+', label: 'Fair', color: 'warning' };
  if (score >= 60) return { grade: 'C', label: 'Average', color: 'warning' };
  if (score >= 55) return { grade: 'C-', label: 'Below Average', color: 'warning' };
  return { grade: 'D', label: 'Needs Work', color: 'error' };
}

/**
 * Calculate momentum score
 * @param {object} data - Activity data
 * @returns {object} Momentum calculation
 */
export function calculateMomentum(data) {
  const {
    todayTasks = 0,
    yesterdayTasks = 0,
    weekTasks = 0,
    prevWeekTasks = 0,
    streakDays = 0,
  } = data;

  // Daily momentum (today vs yesterday)
  const dailyChange = yesterdayTasks > 0 
    ? ((todayTasks - yesterdayTasks) / yesterdayTasks) * 100 
    : todayTasks > 0 ? 100 : 0;

  // Weekly momentum
  const weeklyChange = prevWeekTasks > 0 
    ? ((weekTasks - prevWeekTasks) / prevWeekTasks) * 100 
    : weekTasks > 0 ? 100 : 0;

  // Streak bonus
  const streakMultiplier = 1 + (Math.min(streakDays, 30) * 0.02); // Max 60% bonus

  // Combined momentum score
  const baseScore = (dailyChange * 0.4 + weeklyChange * 0.6);
  const momentum = Math.round(baseScore * streakMultiplier);

  return {
    score: momentum,
    daily: { change: Math.round(dailyChange), today: todayTasks, yesterday: yesterdayTasks },
    weekly: { change: Math.round(weeklyChange), current: weekTasks, previous: prevWeekTasks },
    streakMultiplier: Math.round(streakMultiplier * 100) / 100,
    trend: momentum > 10 ? 'up' : momentum < -10 ? 'down' : 'stable',
  };
}

/**
 * Calculate XP from activities
 * @param {object} activities - Activity counts
 * @returns {object} XP breakdown
 */
export function calculateXP(activities) {
  const xpValues = {
    taskCompleted: 10,
    focusSessionCompleted: 25,
    streakDay: 5,
    collaborationSession: 15,
    projectMilestone: 50,
    weeklyGoalMet: 100,
  };

  const breakdown = {};
  let total = 0;

  Object.entries(activities).forEach(([key, count]) => {
    if (xpValues[key] && count > 0) {
      const xp = xpValues[key] * count;
      breakdown[key] = { count, xpPer: xpValues[key], total: xp };
      total += xp;
    }
  });

  // Calculate level (each level requires 10% more XP)
  let level = 1;
  let xpForNextLevel = 100;
  let remainingXP = total;

  while (remainingXP >= xpForNextLevel) {
    remainingXP -= xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(xpForNextLevel * 1.1);
  }

  return {
    total,
    level,
    currentLevelXP: remainingXP,
    xpToNextLevel: xpForNextLevel,
    progress: Math.round((remainingXP / xpForNextLevel) * 100),
    breakdown,
  };
}

/**
 * Get level title based on XP level
 * @param {number} level - User level
 * @returns {object} Title info
 */
export function getLevelTitle(level) {
  const titles = [
    { min: 50, title: 'Grand Master', emoji: '👑' },
    { min: 40, title: 'Master', emoji: '🏆' },
    { min: 30, title: 'Expert', emoji: '💎' },
    { min: 25, title: 'Veteran', emoji: '⭐' },
    { min: 20, title: 'Pro', emoji: '🔥' },
    { min: 15, title: 'Skilled', emoji: '💪' },
    { min: 10, title: 'Intermediate', emoji: '🎯' },
    { min: 5, title: 'Apprentice', emoji: '📚' },
    { min: 1, title: 'Novice', emoji: '🌱' },
  ];

  for (const t of titles) {
    if (level >= t.min) return t;
  }
  return titles[titles.length - 1];
}

/**
 * Calculate weekly stats summary
 * @param {Array} tasks - Tasks completed this week
 * @param {Array} focusSessions - Focus sessions this week
 * @param {object} streak - Streak data
 * @returns {object} Weekly summary
 */
export function calculateWeeklySummary(tasks, focusSessions = [], streak = {}) {
  const totalTasks = tasks.length;
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration || 25), 0);
  
  // Tasks by day
  const tasksByDay = new Array(7).fill(0);
  tasks.forEach(task => {
    if (task.completedAt) {
      const day = new Date(task.completedAt).getDay();
      tasksByDay[day]++;
    }
  });

  // Best day
  const bestDayIndex = tasksByDay.indexOf(Math.max(...tasksByDay));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Average per day
  const avgPerDay = totalTasks / 7;

  return {
    totalTasks,
    totalFocusMinutes,
    totalFocusHours: Math.round(totalFocusMinutes / 60 * 10) / 10,
    focusSessions: focusSessions.length,
    avgTasksPerDay: Math.round(avgPerDay * 10) / 10,
    bestDay: {
      name: dayNames[bestDayIndex],
      count: tasksByDay[bestDayIndex],
      index: bestDayIndex,
    },
    tasksByDay,
    streak: streak.current || 0,
  };
}

/**
 * Compare two periods
 * @param {object} current - Current period metrics
 * @param {object} previous - Previous period metrics
 * @param {Array} keys - Keys to compare
 * @returns {object} Comparison results
 */
export function comparePeriods(current, previous, keys = ['tasks', 'focusMinutes']) {
  const comparison = {};

  keys.forEach(key => {
    const curr = current[key] || 0;
    const prev = previous[key] || 0;
    const diff = curr - prev;
    const percentChange = prev > 0 ? Math.round((diff / prev) * 100) : curr > 0 ? 100 : 0;

    comparison[key] = {
      current: curr,
      previous: prev,
      diff,
      percentChange,
      improved: diff > 0,
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
    };
  });

  return comparison;
}

export default {
  calculateStreak,
  getStreakTier,
  calculateRanking,
  calculateProductivityScore,
  getProductivityGrade,
  calculateMomentum,
  calculateXP,
  getLevelTitle,
  calculateWeeklySummary,
  comparePeriods,
};
