const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id });
    res.json(projects);
  } catch (error) {
    console.error('Projects Route - Get error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const project = new Project({ userId: req.user.id, title, description, category, status: 'In Progress' });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Projects Route - Create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/announcements', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    project.announcements.push({ message: req.body.message, postedBy: req.user.id, timestamp: new Date() });
    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Projects Route - Announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/snapshot', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    project.snapshot = req.body.snapshot;
    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Projects Route - Snapshot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/status', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    project.status = req.body.status;
    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Projects Route - Status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;