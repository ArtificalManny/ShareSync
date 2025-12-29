/**
 * userController.js
 * Handles user-related operations including gamification and momentum
 */

const User = require('../models/User');
const Project = require('../models/Project');
const Ship = require('../models/Ship'); // You'll need to create this model or use embedded ships
const {
  checkAndAwardBadges,
  updateAchievements,
  getLeaderboard,
  getUserRank,
} = require('../utils/gamification');

// ============================================
// GET USER PROFILE
// ============================================

/**
 * Get current user's profile
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check privacy settings
    if (!user.publicProfile && req.user.id !== user._id.toString()) {
      return res.status(403).json({ message: 'Profile is private' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// GAMIFICATION STATS
// ============================================

/**
 * Get user's gamification stats
 */
exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check and award any new badges
    const newBadges = checkAndAwardBadges(user);
    
    // Update achievements
    const completedAchievements = updateAchievements(user);
    
    // Save if changes were made
    if (newBadges.length > 0 || completedAchievements.length > 0) {
      await user.save();
    }
    
    // Get user's rank
    const rank = await getUserRank(User, req.user.id);
    
    res.json({
      xp: user.gamification.totalXP,
      level: user.gamification.level,
      xpToNextLevel: user.gamification.xpToNextLevel,
      xpProgress: (user.gamification.totalXP / user.gamification.xpToNextLevel) * 100,
      streak: user.gamification.currentStreak,
      longestStreak: user.gamification.longestStreak,
      badges: user.gamification.badges,
      achievements: user.gamification.achievements,
      stats: user.gamification.stats,
      rank,
      newBadges,
      completedAchievements,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get leaderboard
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', limit = 10 } = req.query;
    
    const leaderboard = await getLeaderboard(User, parseInt(limit), period);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user's badges
 */
exports.getBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      badges: user.gamification.badges,
      total: user.gamification.badges.length,
    });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user's achievements
 */
exports.getAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update achievements before returning
    updateAchievements(user);
    await user.save();
    
    const completed = user.gamification.achievements.filter(a => a.completed);
    const inProgress = user.gamification.achievements.filter(a => !a.completed);
    
    res.json({
      achievements: user.gamification.achievements,
      completed: completed.length,
      total: user.gamification.achievements.length,
      completedList: completed,
      inProgress: inProgress,
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// UPDATE PREFERENCES
// ============================================

/**
 * Update gamification preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { showOnLeaderboard, shareStats, notifyOnLevelUp, notifyOnBadge } = req.body;
    
    if (showOnLeaderboard !== undefined) {
      user.gamification.preferences.showOnLeaderboard = showOnLeaderboard;
    }
    if (shareStats !== undefined) {
      user.gamification.preferences.shareStats = shareStats;
    }
    if (notifyOnLevelUp !== undefined) {
      user.gamification.preferences.notifyOnLevelUp = notifyOnLevelUp;
    }
    if (notifyOnBadge !== undefined) {
      user.gamification.preferences.notifyOnBadge = notifyOnBadge;
    }
    
    await user.save();
    
    res.json({
      message: 'Preferences updated',
      preferences: user.gamification.preferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// AWARD XP (Admin/System use)
// ============================================

/**
 * Award XP to user (called by other controllers)
 */
exports.awardXP = async (userId, amount, reason) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`User ${userId} not found for XP award`);
      return null;
    }
    
    await user.addXP(amount, reason);
    
    // Check for new badges
    checkAndAwardBadges(user);
    
    // Update achievements
    updateAchievements(user);
    
    await user.save();
    
    console.log(`✨ Awarded ${amount} XP to ${user.username} for ${reason}`);
    
    return user;
  } catch (error) {
    console.error('Award XP error:', error);
    return null;
  }
};

// ============================================
// 🚀 PHASE 1: MOMENTUM INDEX
// ============================================

/**
 * Calculate user's momentum index (0-100)
 * @route GET /api/users/momentum
 */
exports.calculateMomentumIndex = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get daily goal (default to 5 ships)
    const dailyGoal = user.dailyShipsGoal || 5;
    
    // Count ships today using Project model
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });
    
    let todayShips = 0;
    projects.forEach(project => {
      const shipsToday = project.ships.filter(ship => {
        return ship.author.toString() === userId && 
               new Date(ship.createdAt) >= today;
      });
      todayShips += shipsToday.length;
    });
    
    // Calculate focus time (if you have focus sessions tracked)
    const focusMinutes = 0; // TODO: Implement focus session tracking
    
    // Count unique projects touched today
    const projectsTouched = projects.filter(project => {
      return project.ships.some(ship => 
        ship.author.toString() === userId && 
        new Date(ship.createdAt) >= today
      );
    }).length;
    
    // Check streak status
    const streakProtected = todayShips > 0;
    const currentStreak = user.gamification?.currentStreak || 0;
    
    // Time-of-day multiplier
    const currentHour = new Date().getHours();
    const userPeakHours = await getUserPeakHours(userId);
    const isInPeakHours = userPeakHours.includes(currentHour);
    
    // ====================================
    // MOMENTUM INDEX FORMULA (0-100)
    // ====================================
    
    const factors = {
      // 30 points: Progress toward daily ship goal
      shipsProgress: Math.min((todayShips / dailyGoal) * 30, 30),
      
      // 25 points: Focus time (target: 2 hours = 120 min)
      focusTime: Math.min((focusMinutes / 120) * 25, 25),
      
      // 20 points: Project diversity
      projectActivity: Math.min((projectsTouched / 3) * 20, 20),
      
      // 15 points: Streak health
      streakHealth: streakProtected ? 15 : 0,
      
      // 10 points: Working during peak hours
      timingBonus: isInPeakHours ? 10 : 0
    };
    
    const momentumIndex = Math.round(
      Object.values(factors).reduce((sum, val) => sum + val, 0)
    );
    
    // Generate contextual message
    let status = 'Getting started';
    let message = 'Just getting warmed up';
    
    if (momentumIndex >= 80) {
      status = 'On fire';
      message = "You're crushing it today";
    } else if (momentumIndex >= 60) {
      status = 'Strong';
      message = "Solid progress - you're on track";
    } else if (momentumIndex >= 40) {
      status = 'Building';
      message = 'Momentum is building';
    } else if (momentumIndex >= 20) {
      status = 'Starting';
      message = 'One small win will shift the day';
    }
    
    // Compare to user's average
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
    const avgForThisDayOfWeek = await getAverageForDayOfWeek(userId, dayOfWeek);
    
    let comparison = '';
    if (momentumIndex > avgForThisDayOfWeek + 10) {
      comparison = `You're ahead of your usual ${dayOfWeek}`;
    } else if (momentumIndex < avgForThisDayOfWeek - 10) {
      comparison = `One more task will match your ${dayOfWeek} average`;
    }
    
    return res.json({
      momentumIndex,
      status,
      message,
      comparison,
      breakdown: {
        shipsToday: todayShips,
        shipsGoal: dailyGoal,
        focusMinutes: Math.round(focusMinutes),
        projectsTouched,
        streakProtected,
        currentStreak
      }
    });
    
  } catch (error) {
    console.error('Error calculating momentum:', error);
    res.status(500).json({ error: 'Failed to calculate momentum' });
  }
};

// Helper: Get user's peak hours based on historical data
async function getUserPeakHours(userId) {
  try {
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });
    
    const hourCounts = {};
    projects.forEach(project => {
      project.ships.forEach(ship => {
        if (ship.author.toString() === userId) {
          const hour = new Date(ship.createdAt).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
    });
    
    // Return top 3 hours
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  } catch (error) {
    console.error('Error getting peak hours:', error);
    return [14, 15, 16]; // Default to 2-4pm
  }
}

// Helper: Get average momentum for a specific day of week
async function getAverageForDayOfWeek(userId, dayName) {
  try {
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
    
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });
    
    const samples = [];
    
    // Get last 8 weeks of this day
    for (let i = 0; i < 8; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - (7 * i) - (targetDate.getDay() - dayIndex));
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      let shipsCount = 0;
      projects.forEach(project => {
        const dayShips = project.ships.filter(ship => {
          const shipDate = new Date(ship.createdAt);
          return ship.author.toString() === userId &&
                 shipDate >= targetDate &&
                 shipDate < nextDay;
        });
        shipsCount += dayShips.length;
      });
      
      samples.push(shipsCount);
    }
    
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    return Math.round((avg / 5) * 100); // Normalize to 0-100 scale
  } catch (error) {
    console.error('Error getting day average:', error);
    return 50; // Default to middle
  }
}

// ============================================
// 🚀 PHASE 1: WEEKLY NARRATIVE
// ============================================

/**
 * Get weekly narrative for user
 * @route GET /api/users/weekly-narrative
 */
exports.getWeeklyNarrative = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get start of this week (Monday)
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
    thisWeekStart.setHours(0, 0, 0, 0);
    
    // Get start of last week
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });
    
    // Count this week's ships
    let thisWeekShips = 0;
    let lastWeekShips = 0;
    const dayHourCounts = {};
    
    projects.forEach(project => {
      project.ships.forEach(ship => {
        if (ship.author.toString() !== userId) return;
        
        const shipDate = new Date(ship.createdAt);
        
        if (shipDate >= thisWeekStart) {
          thisWeekShips++;
          
          // Track peak time
          const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][shipDate.getDay()];
          const hour = shipDate.getHours();
          const timeSlot = `${hour}-${hour + 1}`;
          const key = `${day} ${timeSlot}`;
          dayHourCounts[key] = (dayHourCounts[key] || 0) + 1;
        } else if (shipDate >= lastWeekStart && shipDate < thisWeekStart) {
          lastWeekShips++;
        }
      });
    });
    
    const shipsDelta = thisWeekShips - lastWeekShips;
    const shipsDirection = shipsDelta > 0 ? 'up' : shipsDelta < 0 ? 'down' : 'flat';
    
    // Find peak time
    const peakTime = Object.entries(dayHourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'various times';
    
    // Predictive insight
    const dayOfWeek = new Date().getDay();
    const daysLeftInWeek = 7 - dayOfWeek;
    const avgShipsPerDay = thisWeekShips / (dayOfWeek || 1);
    const projectedWeekTotal = Math.round(avgShipsPerDay * 7);
    
    const userWeeklyAvg = await getWeeklyAverage(userId);
    const willBeatAverage = projectedWeekTotal > userWeeklyAvg;
    
    let prediction = '';
    if (willBeatAverage) {
      const shipsNeeded = Math.max(0, userWeeklyAvg - thisWeekShips + 1);
      prediction = `If you ship ${shipsNeeded} more task${shipsNeeded !== 1 ? 's' : ''} this week, you'll beat your usual average`;
    } else {
      const shipsNeeded = Math.ceil((userWeeklyAvg - thisWeekShips) / (daysLeftInWeek || 1));
      prediction = `${shipsNeeded} task${shipsNeeded !== 1 ? 's' : ''} per day will get you to your weekly average`;
    }
    
    const narrative = {
      shipCount: {
        thisWeek: thisWeekShips,
        lastWeek: lastWeekShips,
        delta: shipsDelta,
        direction: shipsDirection,
        text: shipsDirection === 'up' 
          ? `You've shipped ${thisWeekShips} tasks (↑+${shipsDelta} vs last week)` 
          : shipsDirection === 'down'
          ? `You've shipped ${thisWeekShips} tasks (↓${Math.abs(shipsDelta)} vs last week)`
          : `You've shipped ${thisWeekShips} tasks (same as last week)`
      },
      peakTime: {
        window: peakTime,
        text: `Most work happened ${peakTime}`
      },
      prediction: {
        text: prediction,
        projectedTotal: projectedWeekTotal,
        willBeatAverage
      }
    };
    
    return res.json(narrative);
    
  } catch (error) {
    console.error('Error generating narrative:', error);
    res.status(500).json({ error: 'Failed to generate narrative' });
  }
};

// Helper: Get user's weekly average
async function getWeeklyAverage(userId) {
  try {
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });
    
    let totalShips = 0;
    projects.forEach(project => {
      const recentShips = project.ships.filter(ship => 
        ship.author.toString() === userId &&
        new Date(ship.createdAt) >= eightWeeksAgo
      );
      totalShips += recentShips.length;
    });
    
    return Math.round(totalShips / 8);
  } catch (error) {
    console.error('Error getting weekly average:', error);
    return 5; // Default
  }
}

module.exports = exports;
