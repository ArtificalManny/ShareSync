const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../src/middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Auth Route - Register failed: Email already exists:', email);
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Auth Route - User registered:', user._id, 'Token:', token);
    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (err) {
    console.error('Auth Route - Register error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('projects');
    if (!user) {
      console.log('Auth Route - Login failed: User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Auth Route - Login failed: Incorrect password for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Auth Route - User logged in:', user._id, 'Token:', token);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
        projects: user.projects,
        notifications: user.notifications,
      },
    });
  } catch (err) {
    console.error('Auth Route - Login error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('projects');
    if (!user) {
      console.log('Auth Route - /me failed: User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Auth Route - /me success for user:', user._id);
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      bannerImage: user.bannerImage,
      projects: user.projects,
      notifications: user.notifications,
    });
  } catch (err) {
    console.error('Auth Route - /me error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).populate('projects');
    console.log('Auth Route - User updated:', user._id);
    res.json(user);
  } catch (err) {
    console.error('Auth Route - Update user error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;