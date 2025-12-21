/**
 * routes/search.js
 * Routes for search and filtering
 */

const express = require('express');
const router = express.Router();

const {
  globalSearch,
  searchProjects,
  filterTasks,
  filterShips,
  searchMessages,
} = require('../controllers/searchController');

// Require auth middleware
let requireAuth;
try { requireAuth = require('../middleware/auth'); } catch { requireAuth = require('../auth'); }

// All routes require authentication
router.use(requireAuth);

// ============================================
// SEARCH ROUTES
// ============================================

// GET /api/search?q=hello&type=projects&page=1&limit=20
// Global search across projects, tasks, users
router.get('/', globalSearch);

// GET /api/search/projects?q=design&status=Active&page=1
// Search and filter projects
router.get('/projects', searchProjects);

// GET /api/search/projects/:projectId/tasks?status=todo&assignee=userId
// Filter tasks within a project
router.get('/projects/:projectId/tasks', filterTasks);

// GET /api/search/projects/:projectId/ships?author=userId&after=2025-01-01
// Filter ships within a project
router.get('/projects/:projectId/ships', filterShips);

// GET /api/search/projects/:projectId/messages?q=hello&sender=userId
// Search messages within a project (if Message model exists)
router.get('/projects/:projectId/messages', searchMessages);

module.exports = router;
