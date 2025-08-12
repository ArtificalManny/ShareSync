const express = require('express');
const router = express.Router();
const { Project } = require('../models/project.model');
const { optionalAuth } = require('../middleware/optionalAuth');

router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      category = '',
      status = 'Not Started',
      privacy = 'Private',
      members = [],
    } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const ownerId =
      (req.user && (req.user.id || req.user._id)) ||
      req.body.ownerId ||
      'dev-user';

    const doc = await Project.create({
      title,
      description,
      category,
      status,
      privacy,
      members: Array.isArray(members) ? members : [],
      ownerId,
      lastActivityAt: new Date(),
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error('[projects] create error', err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

module.exports = router;
