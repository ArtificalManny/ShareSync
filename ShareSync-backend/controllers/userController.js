/**
 * userController.js
 * Handles user-related operations including gamification
 */

const User = require('../models/User');
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
      newBadges, // Badges just earned
      completedAchievements, // Achievements just completed
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

module.exports = exports;
