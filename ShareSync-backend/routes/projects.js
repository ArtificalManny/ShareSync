const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.userId = user.userId;
    next();
  });
};

router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('projects');
    res.json(user.projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const project = new Project({ ...req.body, admin: user.email });
    await project.save();
    user.projects.push(project._id);
    await user.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;