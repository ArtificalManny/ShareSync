// server/utils/email/routes/settings.js
const express = require('express');
const router = express.Router();

const { requireFlag } = require('../middleware/flags');
const events = require('../system/events');
const User = require('../models/User');
const Project = require('../models/Project');

function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) return res.status(401).json({ error: 'Auth required' });
  next();
}

// PATCH /users/me { discoverable: true|false }
router.patch('/users/me', requireFlag('FEATURE_DISCOVERABILITY'), requireAuth, async (req, res, next) => {
  try {
    const { discoverable } = req.body || {};
    if (typeof discoverable !== 'boolean') return res.status(400).json({ error: 'discoverable must be boolean' });
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { discoverable } }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    events.emit('profile_discover_toggle', { userId: String(user._id), on: discoverable });
    res.json({ id: String(user._id), discoverable: user.discoverable });
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id { discoverable: true|false }  (owner/manager)
router.patch('/projects/:id', requireFlag('FEATURE_DISCOVERABILITY'), requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { discoverable } = req.body || {};
    if (typeof discoverable !== 'boolean') return res.status(400).json({ error: 'discoverable must be boolean' });

    const proj = await Project.findById(id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    const isOwner = String(proj.ownerId) === String(req.user.id);
    // TODO: allow managers if you have roles
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });

    proj.discoverable = discoverable;
    await proj.save();

    events.emit('project_discover_toggle', { userId: String(req.user.id), projectId: String(proj._id), on: discoverable });
    res.json({ id: String(proj._id), discoverable: proj.discoverable });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
