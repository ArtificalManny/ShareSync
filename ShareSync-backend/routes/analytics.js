/**
 * routes/analytics.js
 * Routes for analytics and insights
 */

const express = require('express');
const router = express.Router();

const {
  getPersonalStats,
  getVelocity,
  getProductivityByTime,
  getInsights,
  getProjectStats,
  getProjectBurndown,
  getDashboard,
} = require('../controllers/analyticsController');

// Require auth middleware
let requireAuth;
try { requireAuth = require('../middleware/auth'); } catch { requireAuth = require('../auth'); }

// All routes require authentication
router.use(requireAuth);

// ============================================
// PERSONAL ANALYTICS ROUTES
// ============================================

// GET /api/analytics/dashboard - Get comprehensive dashboard
router.get('/dashboard', getDashboard);

// GET /api/analytics/stats - Get personal stats
router.get('/stats', getPersonalStats);

// GET /api/analytics/velocity - Get velocity chart data
router.get('/velocity', getVelocity);

// GET /api/analytics/productivity-time - Get productivity by time of day
router.get('/productivity-time', getProductivityByTime);

// GET /api/analytics/insights - Get AI insights
router.get('/insights', getInsights);

// ============================================
// PROJECT ANALYTICS ROUTES
// ============================================

// GET /api/analytics/project/:projectId/stats - Get project stats
router.get('/project/:projectId/stats', getProjectStats);

// GET /api/analytics/project/:projectId/burndown - Get burndown chart
router.get('/project/:projectId/burndown', getProjectBurndown);

module.exports = router;
