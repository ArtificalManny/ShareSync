const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Require auth middleware
let requireAuth;
try { 
  requireAuth = require('../middleware/auth'); 
} catch { 
  requireAuth = require('../auth'); 
}

// All routes require authentication
router.use(requireAuth);

// GET /api/ai/daily-plan - Get personalized daily plan
router.get('/daily-plan', aiController.getDailyPlan);

module.exports = router;
