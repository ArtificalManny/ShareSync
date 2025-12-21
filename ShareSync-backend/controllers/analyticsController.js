/**
 * analyticsController.js
 * Handles analytics and insights endpoints
 */

const User = require('../models/User');
const Project = require('../models/Project');
const {
  calculatePersonalStats,
  calculateVelocity,
  getProductivityByTime,
  calculateProjectStats,
  getProjectBurndown,
  generateInsights,
} = require('../utils/analytics');

// ============================================
// PERSONAL ANALYTICS
// ============================================

/**
 * Get personal productivity stats
 */
exports.getPersonalStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const stats = await calculatePersonalStats(User, req.user.id, parseInt(days));
    
    if (!stats) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Get personal stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get velocity chart data
 */
exports.getVelocity = async (req, res) => {
  try {
    const { weeks = 8 } = req.query;
    
    const velocity = await calculateVelocity(User, req.user.id, parseInt(weeks));
    
    if (!velocity) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(velocity);
  } catch (error) {
    console.error('Get velocity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get productivity by time of day
 */
exports.getProductivityByTime = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const data = await getProductivityByTime(req.user.id, parseInt(days));
    
    res.json(data);
  } catch (error) {
    console.error('Get productivity by time error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get AI-generated insights
 */
exports.getInsights = async (req, res) => {
  try {
    const insights = await generateInsights(User, req.user.id);
    
    res.json({
      insights,
      total: insights.length,
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// PROJECT ANALYTICS
// ============================================

/**
 * Get project statistics
 */
exports.getProjectStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access
    if (!project.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const stats = await calculateProjectStats(req.params.projectId, parseInt(days));
    
    res.json(stats);
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get project burndown chart data
 */
exports.getProjectBurndown = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access
    if (!project.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const data = await getProjectBurndown(req.params.projectId, parseInt(days));
    
    res.json({
      burndown: data,
      currentRemaining: data[data.length - 1]?.remaining || 0,
    });
  } catch (error) {
    console.error('Get burndown error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get comprehensive analytics dashboard data
 */
exports.getDashboard = async (req, res) => {
  try {
    const { days = 30, weeks = 8 } = req.query;
    
    // Fetch all analytics in parallel
    const [stats, velocity, timeData, insights] = await Promise.all([
      calculatePersonalStats(User, req.user.id, parseInt(days)),
      calculateVelocity(User, req.user.id, parseInt(weeks)),
      getProductivityByTime(req.user.id, parseInt(days)),
      generateInsights(User, req.user.id),
    ]);
    
    res.json({
      stats,
      velocity,
      productivityByTime: timeData,
      insights,
      generated: new Date(),
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;
