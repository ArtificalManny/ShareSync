/**
 * routes/members.js
 * Routes for project member management
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params from parent router

const {
  getMembers,
  addMember,
  updateMember,
  removeMember,
  getMember,
} = require('../controllers/membersController');

// Require auth middleware
let requireAuth;
try { requireAuth = require('../middleware/auth'); } catch { requireAuth = require('../auth'); }

// All routes require authentication
router.use(requireAuth);

// ============================================
// MEMBER ROUTES
// ============================================

// GET /api/projects/:projectId/members - List all members
router.get('/', getMembers);

// POST /api/projects/:projectId/members - Add member
router.post('/', addMember);

// GET /api/projects/:projectId/members/:userId - Get specific member
router.get('/:userId', getMember);

// PUT /api/projects/:projectId/members/:userId - Update member role/permissions
router.put('/:userId', updateMember);

// DELETE /api/projects/:projectId/members/:userId - Remove member
router.delete('/:userId', removeMember);

module.exports = router;
