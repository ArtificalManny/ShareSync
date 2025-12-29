// backend/controllers/projectController.js
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ]
    })
    .populate('owner', 'firstName lastName profilePicture')
    .populate('members.user', 'firstName lastName profilePicture')
    .sort({ updatedAt: -1 });

    // ⭐ PHASE 1: Add team balance to each project
    const projectsWithBalance = await Promise.all(
      projects.map(async (project) => {
        const balance = await calculateTeamBalance(project._id, req.user.id);
        return {
          ...project.toObject(),
          teamBalance: balance
        };
      })
    );

    res.json(projectsWithBalance);
  } catch (error) {
    console.error('[getProjects] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName profilePicture')
      .populate('members.user', 'firstName lastName profilePicture')
      .populate('tasks.assignee', 'firstName lastName profilePicture')
      .populate('tasks.createdBy', 'firstName lastName')
      .populate('ships.author', 'firstName lastName profilePicture');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    const isOwner = project.owner._id.toString() === req.user.id;
    const isMember = project.members?.some(m => m.user._id.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('[getProject] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { title, description, status, privacy } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const project = await Project.create({
      title,
      description,
      status: status || 'Active',
      privacy: privacy || 'private',
      owner: req.user.id
    });

    await project.populate('owner', 'firstName lastName profilePicture');

    res.status(201).json(project);
  } catch (error) {
    console.error('[createProject] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner can update
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can update project' });
    }

    const { title, description, status, privacy } = req.body;

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (privacy) project.privacy = privacy;

    await project.save();
    await project.populate('owner', 'firstName lastName profilePicture');

    res.json(project);
  } catch (error) {
    console.error('[updateProject] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can delete project' });
    }

    await project.deleteOne();

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('[deleteProject] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================
// TASKS ENDPOINTS
// ============================================

// @desc    Get all tasks for project
// @route   GET /api/projects/:id/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('tasks.assignee', 'firstName lastName profilePicture')
      .populate('tasks.createdBy', 'firstName lastName');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project.tasks);
  } catch (error) {
    console.error('[getTasks] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create task
// @route   POST /api/projects/:id/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { title, description, assignee, dueDate, effort, estimatedTime } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = project.addTask({
      title,
      description,
      assignee,
      dueDate,
      effort,
      estimatedTime,
      createdBy: req.user.id
    });

    await project.save();
    await project.populate('tasks.assignee', 'firstName lastName profilePicture');
    await project.populate('tasks.createdBy', 'firstName lastName');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('task:created', task);
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('[createTask] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/projects/:id/tasks/:taskId
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const updates = req.body;
    const task = project.updateTask(req.params.taskId, updates);

    await project.save();
    await project.populate('tasks.assignee', 'firstName lastName profilePicture');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('task:updated', task);
    }

    res.json(task);
  } catch (error) {
    console.error('[updateTask] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Complete task
// @route   POST /api/projects/:id/tasks/:taskId/complete
// @access  Private
exports.completeTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = project.updateTask(req.params.taskId, {
      completed: true,
      completedAt: new Date(),
      completedBy: req.user.id,
      status: 'done'
    });

    await project.save();

    // Award XP to user
    const user = await User.findById(req.user.id);
    if (user && user.gamification) {
      user.gamification.totalXP = (user.gamification.totalXP || 0) + 25;
      await user.save();
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('task:completed', {
        task,
        xpAwarded: 25
      });
    }

    res.json({ task, xpAwarded: 25 });
  } catch (error) {
    console.error('[completeTask] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/projects/:id/tasks/:taskId
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.deleteTask(req.params.taskId);
    await project.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('task:deleted', {
        taskId: req.params.taskId
      });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('[deleteTask] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================
// SHIPS ENDPOINTS
// ============================================

// @desc    Get all ships for project
// @route   GET /api/projects/:id/ships
// @access  Private
exports.getShips = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('ships.author', 'firstName lastName profilePicture');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project.ships);
  } catch (error) {
    console.error('[getShips] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create ship
// @route   POST /api/projects/:id/ships
// @access  Private
exports.createShip = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { description, relatedTask } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'Ship description is required' });
    }

    const xpAwarded = 50;

    const ship = project.addShip({
      description,
      author: req.user.id,
      relatedTask,
      xpAwarded
    });

    await project.save();
    await project.populate('ships.author', 'firstName lastName profilePicture');

    // Award XP to user
    const user = await User.findById(req.user.id);
    if (user && user.gamification) {
      user.gamification.totalXP = (user.gamification.totalXP || 0) + xpAwarded;
      
      // Update streak
      const today = new Date().toDateString();
      const lastShip = user.gamification.lastShipDate 
        ? new Date(user.gamification.lastShipDate).toDateString()
        : null;

      if (lastShip !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastShip === yesterday) {
          // Continue streak
          user.gamification.currentStreak = (user.gamification.currentStreak || 0) + 1;
        } else if (!lastShip) {
          // Start new streak
          user.gamification.currentStreak = 1;
        } else {
          // Streak broken
          user.gamification.currentStreak = 1;
        }

        // Update longest streak
        if (user.gamification.currentStreak > (user.gamification.longestStreak || 0)) {
          user.gamification.longestStreak = user.gamification.currentStreak;
        }

        user.gamification.lastShipDate = new Date();
      }

      await user.save();
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('ship:created', {
        ship,
        xpAwarded,
        streak: user?.gamification?.currentStreak || 0
      });
    }

    res.status(201).json({
      ship,
      xpAwarded,
      streak: user?.gamification?.currentStreak || 0
    });
  } catch (error) {
    console.error('[createShip] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete ship
// @route   DELETE /api/projects/:id/ships/:shipId
// @access  Private
exports.deleteShip = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const shipIndex = project.ships.findIndex(
      s => s._id.toString() === req.params.shipId
    );

    if (shipIndex === -1) {
      return res.status(404).json({ message: 'Ship not found' });
    }

    const ship = project.ships[shipIndex];

    // Only author or owner can delete
    if (ship.author.toString() !== req.user.id && project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    project.ships.splice(shipIndex, 1);
    await project.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('ship:deleted', {
        shipId: req.params.shipId
      });
    }

    res.json({ message: 'Ship deleted' });
  } catch (error) {
    console.error('[deleteShip] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============================================
// 🚀 PHASE 1: TEAM BALANCE & QUIET PROJECTS
// ============================================

/**
 * Calculate team balance for a project
 * Helper function used by getProjects
 */
async function calculateTeamBalance(projectId, userId) {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return {
        status: 'unknown',
        message: 'Project not found',
        distribution: []
      };
    }
    
    // Get ships from last week
    const recentShips = project.ships.filter(ship => 
      new Date(ship.createdAt) >= weekAgo
    );
    
    if (recentShips.length === 0) {
      return {
        status: 'quiet',
        message: 'No activity this week',
        distribution: []
      };
    }
    
    // Count contributions per user
    const contributions = {};
    recentShips.forEach(ship => {
      const authorId = ship.author.toString();
      contributions[authorId] = (contributions[authorId] || 0) + 1;
    });
    
    // Calculate percentages
    const distribution = Object.entries(contributions).map(([userId, count]) => ({
      userId,
      ships: count,
      percentage: Math.round((count / recentShips.length) * 100)
    })).sort((a, b) => b.ships - a.ships);
    
    // Determine balance status
    const top2Percentage = distribution
      .slice(0, 2)
      .reduce((sum, user) => sum + user.percentage, 0);
    
    let status, message;
    
    if (top2Percentage > 80) {
      status = 'heavy';
      message = '⚠️ 2 people carrying most work';
    } else if (top2Percentage > 60) {
      status = 'moderate';
      message = '⚡ Work somewhat concentrated';
    } else {
      status = 'balanced';
      message = '✅ Work well distributed';
    }
    
    return {
      status,
      message,
      distribution
    };
  } catch (error) {
    console.error('Error calculating team balance:', error);
    return {
      status: 'error',
      message: 'Could not calculate balance',
      distribution: []
    };
  }
}

/**
 * Get quiet projects (no activity in 3+ days)
 * @route GET /api/projects/quiet
 */
exports.getQuietProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ],
      status: { $ne: 'Completed' } // Exclude completed projects
    });
    
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    const quietProjects = [];
    
    for (const project of projects) {
      // Get most recent ship
      const sortedShips = project.ships.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      const lastShip = sortedShips[0];
      const isQuiet = !lastShip || new Date(lastShip.createdAt) < threeDaysAgo;
      
      if (isQuiet) {
        const daysSinceActivity = lastShip 
          ? Math.floor((Date.now() - new Date(lastShip.createdAt)) / (1000 * 60 * 60 * 24))
          : 999;
        
        // Generate quick win suggestion
        const quickWin = await generateQuickWin(project);
        
        quietProjects.push({
          _id: project._id,
          title: project.title,
          daysSinceActivity,
          quickWin
        });
      }
    }
    
    return res.json({
      count: quietProjects.length,
      projects: quietProjects
    });
    
  } catch (error) {
    console.error('Error finding quiet projects:', error);
    res.status(500).json({ error: 'Failed to find quiet projects' });
  }
};

/**
 * Generate quick win suggestion for a project
 * Helper function
 */
async function generateQuickWin(project) {
  try {
    // Simple heuristics for quick wins
    const suggestions = [
      'Update README (2 min)',
      'Review pending tasks (5 min)',
      'Add one small task (3 min)',
      'Check in with team (1 min)',
      'Document one decision (4 min)',
      'Update project status (2 min)',
      'Review last week\'s progress (5 min)',
      'Set next milestone (3 min)'
    ];
    
    // Return random suggestion
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  } catch (error) {
    console.error('Error generating quick win:', error);
    return 'Quick check-in (2 min)';
  }
}

module.exports = exports;
