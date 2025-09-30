// server/utils/email/routes/projects.js
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const events = require('../system/events');

// Optional: gate behind a feature flag
// const { requireFlag } = require('../middleware/flags');

function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) return res.status(401).json({ error: 'Auth required' });
  next();
}

/**
 * PATCH /projects/:id/chat
 * Body: { chatEnabled: boolean }
 * Only owner (or admin, if you have roles) can toggle.
 */
router.patch('/projects/:id/chat', requireAuth, /*requireFlag('FEATURE_CHAT'),*/ async (req, res, next) => {
  try {
    const { id } = req.params;
    const { chatEnabled } = req.body || {};
    if (typeof chatEnabled !== 'boolean') {
      return res.status(400).json({ error: 'chatEnabled must be boolean' });
    }

    const proj = await Project.findById(id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const isOwner = String(proj.ownerId) === String(req.user.id);
    // TODO: if you have roles, allow "manager/admin" here
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });

    proj.chatEnabled = chatEnabled;
    await proj.save();

    // analytics/telemetry
    events.emit('project_chat_toggle', {
      userId: String(req.user.id),
      projectId: String(proj._id),
      on: chatEnabled,
    });

    res.json({ id: String(proj._id), chatEnabled: proj.chatEnabled });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
