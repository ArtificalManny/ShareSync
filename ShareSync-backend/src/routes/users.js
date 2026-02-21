const express = require('express');
const router = express.Router();

let requireAuth;
try { requireAuth = require('../middleware/auth'); } catch { requireAuth = require('../auth'); }

const {
  updateMe,
  uploadMyAvatar,
  getMyBadges,
  getMyHighlights,
  getPublicUserByUsername,
} = require('../controllers/usersController');

const {
  getMe,
  getUserById,
  getStats,
  getLeaderboard,
  getBadges,
  getAchievements,
  updatePreferences,
} = require('../../controllers/userController');

const { uploadAvatar } = require('../middleware/upload');

// ============================================
// PROFILE ENDPOINTS
// ============================================

// PATCH /api/users/me -> update profile
router.patch('/me', requireAuth, updateMe);

// GET /api/users/me/profile -> get full profile
router.get('/me/profile', requireAuth, getMe);

// GET /api/users/:id -> get user by ID
router.get('/:id', requireAuth, getUserById);

// POST /api/users/me/avatar -> upload avatar image
router.post('/me/avatar', requireAuth, uploadAvatar.single('avatar'), uploadMyAvatar);

// GET /api/users/me/highlights -> list recent highlights
router.get('/me/highlights', requireAuth, getMyHighlights);

// (optional public profile)
router.get('/:username/public', getPublicUserByUsername);

// ============================================
// GAMIFICATION ENDPOINTS
// ============================================

// GET /api/users/me/stats -> get gamification stats
router.get('/me/stats', requireAuth, getStats);

// GET /api/users/leaderboard -> get leaderboard
router.get('/leaderboard', requireAuth, getLeaderboard);

// GET /api/users/me/badges -> list badges
router.get('/me/badges', requireAuth, getBadges);

// GET /api/users/me/achievements -> get achievements
router.get('/me/achievements', requireAuth, getAchievements);

// PUT /api/users/me/preferences -> update gamification preferences
router.put('/me/preferences', requireAuth, updatePreferences);

// ============================================
// ✅ DAILY GOALS ENDPOINTS
// ============================================

// GET /api/users/me/goals -> get today's goals
router.get('/me/goals', requireAuth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const today = new Date().toDateString();
    const todayGoals = user.dailyGoals.goals.filter(g => 
      new Date(g.date).toDateString() === today
    );
    
    res.json({
      goals: todayGoals,
      totalGoals: todayGoals.length,
      completed: todayGoals.filter(g => g.completed).length,
      streak: user.dailyGoals.goalCompletionStreak,
      longestStreak: user.dailyGoals.longestGoalStreak,
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/me/goals -> add a daily goal
router.post('/me/goals', requireAuth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.addDailyGoal(req.body);
    await user.save();
    
    res.json({
      message: 'Goal added',
      goals: user.dailyGoals.goals,
    });
  } catch (error) {
    console.error('Add goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/me/goals/:goalId -> update goal progress
router.put('/me/goals/:goalId', requireAuth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { progress } = req.body;
    user.updateGoalProgress(req.params.goalId, progress);
    await user.save();
    
    res.json({
      message: 'Goal updated',
      goal: user.dailyGoals.goals.id(req.params.goalId),
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/goals/history -> get goal history
router.get('/me/goals/history', requireAuth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { days = 30 } = req.query;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const history = user.dailyGoals.history.filter(h => h.date >= cutoff);
    
    res.json({
      history,
      totalDays: history.length,
      avgCompletionRate: history.reduce((sum, h) => sum + h.completionRate, 0) / history.length || 0,
    });
  } catch (error) {
    console.error('Get goal history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ✅ ENERGY TRACKING ENDPOINTS
// ============================================

// POST /api/users/me/energy -> log energy level
router.post('/me/energy', requireAuth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { energyLevel, mood, context } = req.body;
    
    user.logEnergy(energyLevel, mood, context);
    await user.save();
    
    res.json({
      message: 'Energy logged',
      currentEnergy: user.energyLog.currentEnergy,
      entry: user.energyLog.entries[user.energyLog.entries.length - 1],
    });
  } catch (error) {
    console.error('Log energy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/energy -> get current energy & recent entries
router.get('/me/energy', requireAuth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get today's entries
    const today = new Date().toDateString();
    const todayEntries = user.energyLog.entries.filter(e => 
      new Date(e.timestamp).toDateString() === today
    );
    
    res.json({
      currentEnergy: user.energyLog.currentEnergy,
      lastUpdate: user.energyLog.lastEnergyUpdate,
      todayEntries,
      totalEntriesToday: todayEntries.length,
    });
  } catch (error) {
    console.error('Get energy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/energy/insights -> get AI insights
router.get('/me/energy/insights', requireAuth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate fresh insights
    user.generateEnergyInsights();
    await user.save();
    
    res.json({
      insights: user.energyLog.insights,
      avgEnergy: user.energyLog.insights.averageEnergy,
      peakHours: user.energyLog.insights.peakHours,
      recommendations: user.energyLog.insights.recommendations,
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/energy/history -> get energy history
router.get('/me/energy/history', requireAuth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { days = 7 } = req.query;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const summaries = user.energyLog.dailySummaries.filter(s => s.date >= cutoff);
    
    res.json({
      summaries,
      totalDays: summaries.length,
      avgEnergy: summaries.reduce((sum, s) => sum + s.avgEnergy, 0) / summaries.length || 0,
    });
  } catch (error) {
    console.error('Get energy history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// 🚀 PHASE 1: MOMENTUM & NARRATIVE ENDPOINTS
// ============================================

const { calculateMomentumIndex, getWeeklyNarrative } = require('../../controllers/userController');

// GET /api/users/momentum -> get momentum index
router.get('/momentum', requireAuth, calculateMomentumIndex);

// GET /api/users/weekly-narrative -> get weekly narrative
router.get('/weekly-narrative', requireAuth, getWeeklyNarrative);

module.exports = router;