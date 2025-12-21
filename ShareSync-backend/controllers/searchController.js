/**
 * searchController.js
 * Handles search and filter operations
 */

const Project = require('../models/Project');
const User = require('../models/User');
const {
  createMultiFieldSearch,
  createPagination,
  createPaginationMeta,
  parseSort,
  buildTaskFilter,
  buildProjectFilter,
  buildMessageFilter,
} = require('../utils/search');

// ============================================
// GLOBAL SEARCH
// ============================================

/**
 * Global search across projects, tasks, messages
 */
exports.globalSearch = async (req, res) => {
  try {
    const { q, type, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    const pagination = createPagination(page, limit);
    const results = {
      projects: [],
      tasks: [],
      users: [],
    };
    
    // Search projects
    if (!type || type === 'projects') {
      const projectQuery = {
        $and: [
          createMultiFieldSearch(q, ['title', 'description']),
          {
            $or: [
              { owner: req.user.id },
              { 'members.user': req.user.id },
            ],
          },
        ],
      };
      
      results.projects = await Project.find(projectQuery)
        .select('title description status createdAt')
        .limit(pagination.limit)
        .sort({ createdAt: -1 });
    }
    
    // Search tasks within user's projects
    if (!type || type === 'tasks') {
      const userProjects = await Project.find({
        $or: [
          { owner: req.user.id },
          { 'members.user': req.user.id },
        ],
      });
      
      const allTasks = [];
      userProjects.forEach(project => {
        const matchingTasks = project.tasks.filter(task =>
          task.title.toLowerCase().includes(q.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(q.toLowerCase()))
        );
        
        matchingTasks.forEach(task => {
          allTasks.push({
            ...task.toObject(),
            projectId: project._id,
            projectTitle: project.title,
          });
        });
      });
      
      results.tasks = allTasks.slice(0, pagination.limit);
    }
    
    // Search users (for mentions, collaboration)
    if (!type || type === 'users') {
      const userQuery = createMultiFieldSearch(q, ['username', 'firstName', 'lastName', 'email']);
      
      results.users = await User.find(userQuery)
        .select('username firstName lastName profilePicture')
        .limit(10); // Limit users to 10
    }
    
    res.json({
      query: q,
      results,
      total: results.projects.length + results.tasks.length + results.users.length,
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// PROJECT SEARCH
// ============================================

/**
 * Search projects
 */
exports.searchProjects = async (req, res) => {
  try {
    const { q, status, privacy, page = 1, limit = 20, sort } = req.query;
    
    const query = {
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id },
      ],
    };
    
    // Text search
    if (q) {
      const textSearch = createMultiFieldSearch(q, ['title', 'description']);
      query.$and = [textSearch];
    }
    
    // Filters
    const filters = buildProjectFilter({ status, privacy });
    Object.assign(query, filters);
    
    const pagination = createPagination(page, limit);
    const sortOrder = parseSort(sort, { createdAt: -1 });
    
    const [projects, total] = await Promise.all([
      Project.find(query)
        .select('title description status privacy createdAt progress')
        .populate('owner', 'username profilePicture')
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort(sortOrder),
      Project.countDocuments(query),
    ]);
    
    res.json({
      projects,
      pagination: createPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Search projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// TASK FILTERS
// ============================================

/**
 * Filter project tasks
 */
exports.filterTasks = async (req, res) => {
  try {
    const { status, assignee, completed, effort, dueBefore, dueAfter, sort } = req.query;
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (!project.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Build filter
    const filters = buildTaskFilter({ status, assignee, completed, effort, dueBefore, dueAfter });
    
    // Filter tasks
    let tasks = project.tasks.filter(task => {
      for (const [key, value] of Object.entries(filters)) {
        if (key === 'dueDate') {
          // Handle date range
          if (value.$gte && task.dueDate < value.$gte) return false;
          if (value.$lte && task.dueDate > value.$lte) return false;
        } else {
          // Simple equality check
          if (task[key]?.toString() !== value.toString()) return false;
        }
      }
      return true;
    });
    
    // Sort
    if (sort) {
      const sortOrder = parseSort(sort);
      const sortField = Object.keys(sortOrder)[0];
      const sortDir = sortOrder[sortField];
      
      tasks.sort((a, b) => {
        if (a[sortField] < b[sortField]) return -1 * sortDir;
        if (a[sortField] > b[sortField]) return 1 * sortDir;
        return 0;
      });
    }
    
    res.json({
      tasks,
      total: tasks.length,
      filters: filters,
    });
  } catch (error) {
    console.error('Filter tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// SHIP FILTERS
// ============================================

/**
 * Filter project ships
 */
exports.filterShips = async (req, res) => {
  try {
    const { author, before, after, page = 1, limit = 20 } = req.query;
    
    const project = await Project.findById(req.params.projectId)
      .populate('ships.author', 'username profilePicture');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (!project.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Filter ships
    let ships = project.ships;
    
    if (author) {
      ships = ships.filter(s => s.author._id.toString() === author);
    }
    
    if (before) {
      const beforeDate = new Date(before);
      ships = ships.filter(s => s.timestamp < beforeDate);
    }
    
    if (after) {
      const afterDate = new Date(after);
      ships = ships.filter(s => s.timestamp > afterDate);
    }
    
    // Pagination
    const pagination = createPagination(page, limit);
    const paginatedShips = ships.slice(pagination.skip, pagination.skip + pagination.limit);
    
    res.json({
      ships: paginatedShips,
      pagination: createPaginationMeta(ships.length, page, limit),
    });
  } catch (error) {
    console.error('Filter ships error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// MESSAGE SEARCH (Optional - for future use)
// ============================================

/**
 * Search messages in a project
 */
exports.searchMessages = async (req, res) => {
  try {
    const { q, sender, type, before, after, page = 1, limit = 50 } = req.query;
    
    // Check if Message model exists
    let Message;
    try {
      Message = require('../models/Message');
    } catch (error) {
      // Message model doesn't exist yet
      return res.status(501).json({ 
        message: 'Message search not implemented yet',
        note: 'Message model not found'
      });
    }
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (!project.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = { projectId: req.params.projectId };
    
    // Text search
    if (q) {
      Object.assign(query, createMultiFieldSearch(q, ['content', 'text']));
    }
    
    // Filters
    const filters = buildMessageFilter({ sender, type, before, after });
    Object.assign(query, filters);
    
    const pagination = createPagination(page, limit);
    
    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate('sender', 'username profilePicture')
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Message.countDocuments(query),
    ]);
    
    res.json({
      messages,
      pagination: createPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;
