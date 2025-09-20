const express = require('express');
const router = express.Router();

let requireAuth;
try { requireAuth = require('../middleware/auth'); } catch { requireAuth = require('../auth'); }

const {
  updateMe,
  uploadMyAvatar,
  getMyBadges,
  getMyHighlights,
  getPublicUserByUsername,
} = require('../controllers/usersController');

const { uploadAvatar } = require('../middleware/upload');

// PATCH /api/users/me -> update profile
router.patch('/me', requireAuth, updateMe);

// POST /api/users/me/avatar -> upload avatar image
router.post('/me/avatar', requireAuth, uploadAvatar.single('avatar'), uploadMyAvatar);

// GET /api/users/me/badges -> list badges
router.get('/me/badges', requireAuth, getMyBadges);

// GET /api/users/me/highlights -> list recent highlights
router.get('/me/highlights', requireAuth, getMyHighlights);

// (optional public profile)
router.get('/:username/public', getPublicUserByUsername);

module.exports = router;
