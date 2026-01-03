const Project = require('../models/Project');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const burnoutService = require('../services/burnoutService');

/**
 * Get ecosystem status (mission control stats)
 * GET /api/ecosystem/status
 */
exports.getEcosystemStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get active projects (activity in last 7 days)
    const activeProjects = await Project.countDocuments({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ],
      updatedAt: { $gte: last7Days },
      status: { $ne: 'completed' }
    });
    
    // Get ships today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const shipsToday = await ActivityLog.countDocuments({
      userId,
      action: 'ship',
      timestamp: { $gte: todayStart }
    });
    
    // Get users on streaks (simplified - would need User model with streak field)
    const onStreaks = 2; // Placeholder
    
    // Get projects at risk
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ],
      status: { $ne: 'completed' },
      deadline: { $exists: true }
    });
    
    let atRisk = 0;
    for (const project of projects) {
      const daysUntilDeadline = Math.ceil((new Date(project.deadline) - now) / (1000 * 60 * 60 * 24));
      const totalTasks = project.tasks?.length || 0;
      const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      if (daysUntilDeadline <= 3 && progress < 50) {
        atRisk++;
      }
    }
    
    // Get revenue this month (placeholder)
    const revenue = 0; // Would need Payment model
    
    // Calculate team momentum
    const recentActivity = await ActivityLog.countDocuments({
      userId,
      timestamp: { $gte: last7Days }
    });
    
    const momentum = recentActivity > 50 ? 'high' : recentActivity > 20 ? 'medium' : 'low';
    
    res.json({
      success: true,
      status: {
        activeProjects,
        shipsToday,
        onStreaks,
        atRisk,
        revenue,
        momentum
      }
    });
  } catch (error) {
    console.error('Error getting ecosystem status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get ecosystem status' 
    });
  }
};

/**
 * Get burnout status for user
 * GET /api/ecosystem/burnout-status
 */
exports.getBurnoutStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const analysis = await burnoutService.analyzeBurnout(userId);
    
    res.json({
      success: true,
      burnout: analysis
    });
  } catch (error) {
    console.error('Error getting burnout status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get burnout status' 
    });
  }
};

module.exports = exports;
