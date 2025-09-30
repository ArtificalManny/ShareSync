// server/utils/email/routes/index.js
const express = require('express');
const router = express.Router();

// --- Sub-routers (all already prefix their own paths) ---
const mentorRoutes        = require('./mentor.routes');
const postsRoutes         = require('./posts');
const usersRoutes         = require('./users');
const searchRoutes        = require('./search');
const chatRoutes          = require('./chat');
const projectAdminRoutes  = require('./projects');
const settingsRoutes      = require('./settings'); // discoverability toggles

// Health (keep simple)
router.get('/health', (_req, res) => res.json({ ok: true }));

// --- API mounts ---
router.use(mentorRoutes);        // /projects/:id/velocity, /projects/:id/mentor/predict, /mentor/nudges
router.use(postsRoutes);         // /projects/:id/posts, reactions, comments
router.use(usersRoutes);         // /users/search?q=...
router.use(searchRoutes);        // /search
router.use(chatRoutes);          // /conversations, messages
router.use(projectAdminRoutes);  // /projects/:id/chat (PATCH)
router.use(settingsRoutes);      // /users/me (PATCH), /projects/:id (discoverable) (PATCH)

module.exports = router;
