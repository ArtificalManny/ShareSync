/**
 * routes/analytics.js
 * Routes for analytics and insights
 * MERGED: Existing routes + Week 6 Ecosystem routes
 */

const express = require('express');
const router = express.Router();

const {
  // Existing endpoints
  getPersonalStats,
  getVelocity,
  getProductivityByTime,
  getInsights,
  getProjectStats,
  getProjectBurndown,
  getDashboard,
  // ⭐ Week 6 endpoints
  trackActivity,
  getUserPatterns,
  recomputePatterns,
  getActivitySummary,
} = require('../controllers/analyticsController');

// Require auth middleware
let requireAuth;
try { 
  requireAuth = require('../middleware/auth'); 
} catch { 
  requireAuth = require('../auth'); 
}

// All routes require authentication
router.use(requireAuth);

// ============================================
// EXISTING PERSONAL ANALYTICS ROUTES
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
// EXISTING PROJECT ANALYTICS ROUTES
// ============================================

// GET /api/analytics/project/:projectId/stats - Get project stats
router.get('/project/:projectId/stats', getProjectStats);

// GET /api/analytics/project/:projectId/burndown - Get burndown chart
router.get('/project/:projectId/burndown', getProjectBurndown);

// ============================================
// ⭐ WEEK 6: ECOSYSTEM ANALYTICS ROUTES
// ============================================

// POST /api/analytics/track-activity - Track user activity
router.post('/track-activity', trackActivity);

// GET /api/analytics/patterns - Get user behavioral patterns
router.get('/patterns', getUserPatterns);

// POST /api/analytics/recompute-patterns - Force recompute patterns
router.post('/recompute-patterns', recomputePatterns);

// GET /api/analytics/summary - Get activity summary
router.get('/summary', getActivitySummary);

module.exports = router;
