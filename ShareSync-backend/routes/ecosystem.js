const express = require('express');
const router = express.Router();
const ecosystemController = require('../controllers/ecosystemController');

// Require auth middleware
let requireAuth;
try { 
  requireAuth = require('../middleware/auth'); 
} catch { 
  requireAuth = require('../auth'); 
}

// All routes require authentication
router.use(requireAuth);

// GET /api/ecosystem/status - Get ecosystem status bar data
router.get('/status', ecosystemController.getEcosystemStatus);

// GET /api/ecosystem/burnout-status - Get burnout analysis
router.get('/burnout-status', ecosystemController.getBurnoutStatus);

module.exports = router;
