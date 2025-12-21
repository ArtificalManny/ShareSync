/**
 * analytics.js
 * Analytics calculation and aggregation utilities
 */

// ============================================
// PERSONAL ANALYTICS
// ============================================

/**
 * Calculate personal productivity stats
 */
async function calculatePersonalStats(User, userId, days = 30) {
  const user = await User.findById(userId);
  if (!user) return null;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let focusSessions = [];
  let totalFocusMinutes = 0;
  let avgSessionDuration = 0;
  let avgQuality = 0;

  // Try to load FocusSession model if it exists
  try {
    const FocusSession = require('mongoose').model('FocusSession');
    focusSessions = await FocusSession.find({
      userId,
      startTime: { $gte: cutoffDate },
      status: 'completed',
    });

    totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.actualDuration, 0);
    avgSessionDuration = focusSessions.length > 0 
      ? totalFocusMinutes / focusSessions.length 
      : 0;
    avgQuality = focusSessions.filter(s => s.qualityRating).length > 0
      ? focusSessions.reduce((sum, s) => sum + (s.qualityRating || 0), 0) / focusSessions.filter(s => s.qualityRating).length
      : 0;
  } catch (error) {
    // FocusSession model doesn't exist yet, use stats from user
    totalFocusMinutes = user.gamification.stats.totalFocusMinutes || 0;
    focusSessions = [];
  }

  return {
    totalTasks: user.gamification.stats.totalTasksCompleted,
    totalShips: user.gamification.stats.totalShips,
    totalFocusTime: Math.round(totalFocusMinutes),
    totalFocusSessions: focusSessions.length || user.gamification.stats.totalFocusSessions || 0,
    currentStreak: user.gamification.currentStreak,
    longestStreak: user.gamification.longestStreak,
    level: user.gamification.level,
    totalXP: user.gamification.totalXP,
    
    // Time period specific
    periodStats: {
      days,
      focusSessions: focusSessions.length,
      focusMinutes: Math.round(totalFocusMinutes),
      avgSessionDuration: Math.round(avgSessionDuration),
      avgQuality: Math.round(avgQuality * 10) / 10,
    },
  };
}

/**
 * Calculate velocity (tasks/ships per week over time)
 */
async function calculateVelocity(User, userId, weeks = 8) {
  const user = await User.findById(userId);
  if (!user) return null;

  const Project = require('../models/Project');
  
  // Get all projects where user is a member
  const projects = await Project.find({
    $or: [
      { owner: userId },
      { 'members.user': userId },
    ],
  });

  const weeklyData = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7) - 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - (i * 7));

    let tasksCompleted = 0;
    let shipsCreated = 0;

    projects.forEach(project => {
      // Count tasks completed in this week
      const weekTasks = project.tasks.filter(t => 
        t.completed && 
        t.completedAt >= weekStart && 
        t.completedAt < weekEnd &&
        t.completedBy && t.completedBy.toString() === userId
      );
      tasksCompleted += weekTasks.length;

      // Count ships in this week
      const weekShips = project.ships.filter(s =>
        s.timestamp >= weekStart &&
        s.timestamp < weekEnd &&
        s.author.toString() === userId
      );
      shipsCreated += weekShips.length;
    });

    weeklyData.push({
      week: `Week ${weeks - i}`,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      tasks: tasksCompleted,
      ships: shipsCreated,
    });
  }

  // Calculate average and trend
  const avgTasks = weeklyData.reduce((sum, w) => sum + w.tasks, 0) / weeks;
  const avgShips = weeklyData.reduce((sum, w) => sum + w.ships, 0) / weeks;
  
  // Simple trend: compare last 4 weeks to previous 4 weeks
  const recentAvg = weeklyData.slice(-4).reduce((sum, w) => sum + w.tasks, 0) / 4;
  const previousAvg = weeklyData.slice(0, 4).reduce((sum, w) => sum + w.tasks, 0) / 4;
  const trend = recentAvg > previousAvg ? 'up' : recentAvg < previousAvg ? 'down' : 'stable';

  return {
    weeklyData,
    avgTasksPerWeek: Math.round(avgTasks * 10) / 10,
    avgShipsPerWeek: Math.round(avgShips * 10) / 10,
    trend,
    trendChange: Math.round((recentAvg - previousAvg) * 10) / 10,
  };
}

/**
 * Get productivity by time of day
 */
async function getProductivityByTime(userId, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let sessions = [];
  
  try {
    const FocusSession = require('mongoose').model('FocusSession');
    sessions = await FocusSession.find({
      userId,
      startTime: { $gte: cutoffDate },
      status: 'completed',
    });
  } catch (error) {
    // FocusSession model doesn't exist yet
    sessions = [];
  }

  // Group by hour
  const hourlyData = Array(24).fill(0).map((_, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    sessions: 0,
    totalMinutes: 0,
    avgQuality: 0,
  }));

  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    hourlyData[hour].sessions += 1;
    hourlyData[hour].totalMinutes += session.actualDuration;
    if (session.qualityRating) {
      hourlyData[hour].avgQuality += session.qualityRating;
    }
  });

  // Calculate averages
  hourlyData.forEach(data => {
    if (data.sessions > 0) {
      data.avgQuality = Math.round((data.avgQuality / data.sessions) * 10) / 10;
    }
  });

  // Find peak hours (top 3)
  const sortedByMinutes = [...hourlyData].sort((a, b) => b.totalMinutes - a.totalMinutes);
  const peakHours = sortedByMinutes.slice(0, 3).filter(h => h.sessions > 0).map(h => h.hour);

  return {
    hourlyData,
    peakHours,
  };
}

// ============================================
// PROJECT ANALYTICS
// ============================================

/**
 * Calculate project statistics
 */
async function calculateProjectStats(projectId, days = 30) {
  const Project = require('../models/Project');
  
  const project = await Project.findById(projectId)
    .populate('members.user', 'username profilePicture');
  
  if (!project) return null;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Task statistics
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.completed).length;
  const recentTasks = project.tasks.filter(t => t.createdAt >= cutoffDate);
  const recentCompleted = project.tasks.filter(t => 
    t.completed && t.completedAt >= cutoffDate
  );

  // On-time delivery rate
  const tasksWithDueDate = project.tasks.filter(t => t.completed && t.dueDate);
  const onTimeTasks = tasksWithDueDate.filter(t => 
    new Date(t.completedAt) <= new Date(t.dueDate)
  );
  const onTimeRate = tasksWithDueDate.length > 0
    ? Math.round((onTimeTasks.length / tasksWithDueDate.length) * 100)
    : 100;

  // Average completion time
  const completedWithTime = project.tasks.filter(t => t.completed && t.estimatedTime);
  const avgCompletionTime = completedWithTime.length > 0
    ? Math.round(completedWithTime.reduce((sum, t) => sum + t.estimatedTime, 0) / completedWithTime.length)
    : 0;

  // Ship frequency
  const recentShips = project.ships.filter(s => s.timestamp >= cutoffDate);
  const shipsPerWeek = (recentShips.length / days) * 7;

  // Member contributions
  const memberStats = project.members.map(member => ({
    userId: member.user._id,
    username: member.user.username,
    profilePicture: member.user.profilePicture,
    role: member.role,
    tasksCreated: member.contributionStats.tasksCreated,
    tasksCompleted: member.contributionStats.tasksCompleted,
    shipsCreated: member.contributionStats.shipsCreated,
    lastActive: member.lastActive,
  }));

  return {
    overview: {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalShips: project.ships.length,
      totalMembers: project.members.length + 1, // +1 for owner
    },
    periodStats: {
      days,
      tasksCreated: recentTasks.length,
      tasksCompleted: recentCompleted.length,
      ships: recentShips.length,
      shipsPerWeek: Math.round(shipsPerWeek * 10) / 10,
      tasksPerDay: Math.round((recentCompleted.length / days) * 10) / 10,
    },
    quality: {
      onTimeDeliveryRate: onTimeRate,
      avgCompletionTime, // minutes
    },
    members: memberStats,
  };
}

/**
 * Get project burndown data
 */
async function getProjectBurndown(projectId, days = 30) {
  const Project = require('../models/Project');
  
  const project = await Project.findById(projectId);
  if (!project) return null;

  const dailyData = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    // Count remaining tasks at end of this day
    const remainingTasks = project.tasks.filter(t => 
      !t.completed || (t.completedAt && t.completedAt >= nextDate)
    ).length;

    dailyData.push({
      date: date.toISOString().split('T')[0],
      remaining: remainingTasks,
      total: project.tasks.length,
    });
  }

  return dailyData;
}

/**
 * Generate AI insights
 */
async function generateInsights(User, userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  const insights = [];

  // Streak insights
  if (user.gamification.currentStreak >= 7) {
    insights.push({
      type: 'achievement',
      message: `🔥 You're on a ${user.gamification.currentStreak}-day streak! Keep the momentum going!`,
      priority: 'high',
    });
  } else if (user.gamification.currentStreak === 0) {
    insights.push({
      type: 'suggestion',
      message: 'Ship something today to start a new streak!',
      priority: 'medium',
    });
  }

  // Energy insights
  if (user.energyLog && user.energyLog.insights && user.energyLog.insights.peakHours && user.energyLog.insights.peakHours.length > 0) {
    insights.push({
      type: 'tip',
      message: `⚡ Your peak energy hours are ${user.energyLog.insights.peakHours.slice(0, 2).join(', ')}. Schedule important work then!`,
      priority: 'medium',
    });
  }

  // XP insights
  const xpToNextLevel = user.gamification.xpToNextLevel - user.gamification.totalXP;
  if (xpToNextLevel <= 50 && xpToNextLevel > 0) {
    insights.push({
      type: 'motivation',
      message: `🎯 Only ${xpToNextLevel} XP until level ${user.gamification.level + 1}!`,
      priority: 'high',
    });
  }

  // Focus quality
  const avgQuality = user.gamification.stats.avgFocusSessionQuality;
  if (avgQuality >= 4.5) {
    insights.push({
      type: 'achievement',
      message: `💎 Your focus sessions average ${avgQuality.toFixed(1)}★ quality - excellent!`,
      priority: 'low',
    });
  } else if (avgQuality > 0 && avgQuality < 3) {
    insights.push({
      type: 'suggestion',
      message: 'Try shorter focus sessions or eliminate distractions to improve quality.',
      priority: 'medium',
    });
  }

  // Weekly performance
  const weeklyTasks = user.gamification.stats.tasksThisWeek;
  if (weeklyTasks >= 20) {
    insights.push({
      type: 'achievement',
      message: `🚀 ${weeklyTasks} tasks this week - you're crushing it!`,
      priority: 'medium',
    });
  }

  return insights;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  calculatePersonalStats,
  calculateVelocity,
  getProductivityByTime,
  calculateProjectStats,
  getProjectBurndown,
  generateInsights,
};
