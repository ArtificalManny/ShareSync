// src/routes/uploads.js
const express = require('express');
const router = express.Router();

let requireAuth;
try { requireAuth = require('../middleware/auth'); } catch { requireAuth = require('../auth'); }

const { uploadAvatar } = require('../middleware/upload');
const { uploadMyAvatar } = require('../controllers/usersController');

// Legacy alias to keep older FE endpoints working:
// POST /api/uploads/avatar  (field name: "avatar")
router.post('/avatar', requireAuth, uploadAvatar.single('avatar'), uploadMyAvatar);

module.exports = router;
