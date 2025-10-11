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

// Try to mount Discovery route from TS build (preferred) or local CJS wrapper as fallback
let discoveryRoutes = null;
try {
  // Prefer compiled TS output (e.g., server/routes/discovery.js)
  const mod = require('../../routes/discovery');
  discoveryRoutes = mod.default || mod; // ESM default export or CJS export
} catch (e1) {
  try {
    // Fallback to a local CJS router file if you add one at ./discovery.js
    discoveryRoutes = require('./discovery');
  } catch (e2) {
    // As a last resort, skip mounting; health route will indicate API is alive
    console.warn('[routes] Discovery route not mounted (no TS build or CJS wrapper found).');
  }
}

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
if (discoveryRoutes) {
  router.use(discoveryRoutes);   // /discovery (mounted under /api in app bootstrap)
}

module.exports = router;