/**
 * gamification.js
 * Utility functions for XP calculation, badge awarding, and achievement tracking
 */

// ============================================
// XP CALCULATIONS
// ============================================

/**
 * Calculate XP for task completion
 */
function calculateTaskXP(task) {
  let xp = 25; // Base XP
  
  // Bonus for effort
  if (task.effort === 'high') xp += 15;
  else if (task.effort === 'medium') xp += 10;
  else xp += 5;
  
  // Bonus for on-time completion
  if (task.dueDate && new Date(task.completedAt) <= new Date(task.dueDate)) {
    xp += 10; // On-time bonus
  }
  
  // Penalty for late completion
  if (task.dueDate && new Date(task.completedAt) > new Date(task.dueDate)) {
    xp = Math.max(5, xp - 10); // Late penalty
  }
  
  return xp;
}

/**
 * Calculate XP for ship
 */
function calculateShipXP(ship, streak = 0) {
  let xp = 50; // Base XP
  
  // Streak bonus
  if (streak >= 7) xp += 25;
  if (streak >= 30) xp += 50;
  if (streak >= 100) xp += 100;
  
  return xp;
}

/**
 * Calculate XP for focus session
 */
function calculateFocusXP(session) {
  let xp = 0;
  
  // Base XP: 10 XP per 15 minutes
  xp += Math.floor(session.actualDuration / 15) * 10;
  
  // Completion bonus
  if (session.actualDuration >= session.plannedDuration) {
    xp += 25;
  }
  
  // Quality bonus
  if (session.qualityRating) {
    xp += session.qualityRating * 5; // Up to +25 XP
  }
  
  // Goal achievement bonus
  if (session.goalAchieved) {
    xp += 50;
  }
  
  // Task completion bonus
  xp += (session.tasksCompleted || 0) * 15;
  
  // Interruption penalty
  xp -= (session.interruptions || 0) * 5;
  
  return Math.max(5, xp); // Minimum 5 XP
}

/**
 * Calculate XP for project creation
 */
function calculateProjectXP() {
  return 100; // Flat rate for creating a project
}

/**
 * Calculate XP for collaboration
 */
function calculateCollaborationXP(action) {
  const xpMap = {
    'invite_member': 10,
    'join_project': 10,
    'comment': 5,
    'helpful_comment': 15,
    'code_review': 20,
    'merge_request': 30,
  };
  
  return xpMap[action] || 5;
}

// ============================================
// BADGE DEFINITIONS
// ============================================

const BADGES = {
  // Streak badges
  WEEK_WARRIOR: {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Shipped for 7 days straight',
    icon: '🔥',
    tier: 'bronze',
    requirement: (user) => user.gamification.currentStreak >= 7,
  },
  MONTHLY_MASTER: {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Shipped for 30 days straight',
    icon: '🔥',
    tier: 'silver',
    requirement: (user) => user.gamification.currentStreak >= 30,
  },
  CENTURY_SHIPPER: {
    id: 'streak-100',
    name: 'Century Shipper',
    description: 'Shipped for 100 days straight',
    icon: '🔥',
    tier: 'gold',
  },
  
  // Task badges
  TASK_MASTER: {
    id: 'tasks-100',
    name: 'Task Master',
    description: 'Completed 100 tasks',
    icon: '✅',
    tier: 'silver',
    requirement: (user) => user.gamification.stats.totalTasksCompleted >= 100,
  },
  TASK_LEGEND: {
    id: 'tasks-1000',
    name: 'Task Legend',
    description: 'Completed 1000 tasks',
    icon: '✅',
    tier: 'gold',
    requirement: (user) => user.gamification.stats.totalTasksCompleted >= 1000,
  },
  
  // Focus badges
  FOCUS_NOVICE: {
    id: 'focus-10h',
    name: 'Focus Novice',
    description: 'Completed 10 hours of focused work',
    icon: '🎯',
    tier: 'bronze',
    requirement: (user) => user.gamification.stats.totalFocusMinutes >= 600,
  },
  FOCUS_MASTER: {
    id: 'focus-100h',
    name: 'Focus Master',
    description: 'Completed 100 hours of focused work',
    icon: '🎯',
    tier: 'gold',
    requirement: (user) => user.gamification.stats.totalFocusMinutes >= 6000,
  },
  DEEP_WORK_CHAMPION: {
    id: 'focus-1000h',
    name: 'Deep Work Champion',
    description: 'Completed 1000 hours of focused work',
    icon: '🎯',
    tier: 'platinum',
    requirement: (user) => user.gamification.stats.totalFocusMinutes >= 60000,
  },
  
  // Ship badges
  FIRST_SHIP: {
    id: 'ship-1',
    name: 'First Ship',
    description: 'Shipped your first project',
    icon: '🚢',
    tier: 'bronze',
    requirement: (user) => user.gamification.stats.totalShips >= 1,
  },
  SHIPPING_MACHINE: {
    id: 'ship-100',
    name: 'Shipping Machine',
    description: 'Shipped 100 times',
    icon: '🚢',
    tier: 'gold',
    requirement: (user) => user.gamification.stats.totalShips >= 100,
  },
  
  // Level badges
  LEVEL_10: {
    id: 'level-10',
    name: 'Rising Star',
    description: 'Reached level 10',
    icon: '⭐',
    tier: 'silver',
    requirement: (user) => user.gamification.level >= 10,
  },
  LEVEL_25: {
    id: 'level-25',
    name: 'Elite Achiever',
    description: 'Reached level 25',
    icon: '⭐',
    tier: 'gold',
    requirement: (user) => user.gamification.level >= 25,
  },
  LEVEL_50: {
    id: 'level-50',
    name: 'Legendary',
    description: 'Reached level 50',
    icon: '⭐',
    tier: 'platinum',
    requirement: (user) => user.gamification.level >= 50,
  },
  
  // Quality badges
  PERFECTIONIST: {
    id: 'quality-perfect',
    name: 'Perfectionist',
    description: 'Average focus session quality of 4.5+',
    icon: '💎',
    tier: 'gold',
    requirement: (user) => user.gamification.stats.avgFocusSessionQuality >= 4.5,
  },
  ON_TIME_DELIVERY: {
    id: 'ontime-100',
    name: 'On-Time Delivery',
    description: '100% on-time task completion',
    icon: '⏰',
    tier: 'gold',
    requirement: (user) => user.gamification.stats.onTimeDeliveryRate >= 100,
  },
};

/**
 * Check and award eligible badges
 */
function checkAndAwardBadges(user) {
  const newBadges = [];
  
  Object.values(BADGES).forEach(badge => {
    // Check if user already has this badge
    const hasBadge = user.gamification.badges.some(b => b.id === badge.id);
    
    // Check if user meets requirement
    if (!hasBadge && badge.requirement && badge.requirement(user)) {
      user.awardBadge(badge);
      newBadges.push(badge);
    }
  });
  
  return newBadges;
}

// ============================================
// ACHIEVEMENT TRACKING
// ============================================

const ACHIEVEMENTS = [
  {
    id: 'tasks-10',
    name: 'Getting Started',
    description: 'Complete 10 tasks',
    target: 10,
    xpReward: 50,
    check: (user) => user.gamification.stats.totalTasksCompleted,
  },
  {
    id: 'tasks-50',
    name: 'Task Warrior',
    description: 'Complete 50 tasks',
    target: 50,
    xpReward: 100,
    check: (user) => user.gamification.stats.totalTasksCompleted,
  },
  {
    id: 'ships-10',
    name: 'Shipping Habit',
    description: 'Ship 10 times',
    target: 10,
    xpReward: 100,
    check: (user) => user.gamification.stats.totalShips,
  },
  {
    id: 'focus-5h',
    name: 'Focus Apprentice',
    description: 'Complete 5 hours of focused work',
    target: 300, // minutes
    xpReward: 75,
    check: (user) => user.gamification.stats.totalFocusMinutes,
  },
  {
    id: 'streak-3',
    name: 'Momentum Building',
    description: 'Ship 3 days in a row',
    target: 3,
    xpReward: 50,
    check: (user) => user.gamification.currentStreak,
  },
];

/**
 * Update achievement progress
 */
function updateAchievements(user) {
  const completed = [];
  
  ACHIEVEMENTS.forEach(achievement => {
    // Find existing achievement or create new
    let userAch = user.gamification.achievements.find(a => a.id === achievement.id);
    
    if (!userAch) {
      userAch = {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        progress: 0,
        target: achievement.target,
        completed: false,
        xpReward: achievement.xpReward,
      };
      user.gamification.achievements.push(userAch);
    }
    
    // Update progress
    if (!userAch.completed) {
      userAch.progress = achievement.check(user);
      
      // Check if completed
      if (userAch.progress >= userAch.target) {
        userAch.completed = true;
        userAch.completedAt = new Date();
        user.gamification.totalXP += userAch.xpReward;
        completed.push(achievement);
      }
    }
  });
  
  return completed;
}

// ============================================
// LEADERBOARD
// ============================================

/**
 * Get top users for leaderboard
 */
async function getLeaderboard(User, limit = 10, period = 'all') {
  let sortField = 'gamification.totalXP';
  
  if (period === 'weekly') {
    sortField = 'gamification.stats.shipsThisWeek';
  }
  
  const users = await User.find({
    'gamification.preferences.showOnLeaderboard': true,
  })
    .select('username profilePicture gamification.totalXP gamification.level gamification.currentStreak gamification.stats')
    .sort({ [sortField]: -1 })
    .limit(limit)
    .lean();
  
  return users.map((user, index) => ({
    rank: index + 1,
    username: user.username,
    profilePicture: user.profilePicture,
    totalXP: user.gamification.totalXP,
    level: user.gamification.level,
    streak: user.gamification.currentStreak,
    stats: user.gamification.stats,
  }));
}

/**
 * Get user's rank
 */
async function getUserRank(User, userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  
  const rank = await User.countDocuments({
    'gamification.totalXP': { $gt: user.gamification.totalXP },
    'gamification.preferences.showOnLeaderboard': true,
  });
  
  return rank + 1; // +1 because rank starts at 1
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // XP calculations
  calculateTaskXP,
  calculateShipXP,
  calculateFocusXP,
  calculateProjectXP,
  calculateCollaborationXP,
  
  // Badges
  BADGES,
  checkAndAwardBadges,
  
  // Achievements
  ACHIEVEMENTS,
  updateAchievements,
  
  // Leaderboard
  getLeaderboard,
  getUserRank,
};
