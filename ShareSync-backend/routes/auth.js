const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password, job, school, profilePicture, bannerPicture } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      firstName,
      lastName,
      username,
      email,
      password: await bcrypt.hash(password, 10),
      job,
      school,
      profilePicture: profilePicture || 'https://via.placeholder.com/150',
      bannerPicture: bannerPicture || 'https://via.placeholder.com/1200x300',
      projects: [],
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Auth Route - Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user });
  } catch (error) {
    console.error('Auth Route - Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Auth Route - Get current user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Auth Route - Update user profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile by username
router.get('/profile/:username', authMiddleware, async (req, res) => {
  try {
    console.log('Auth Route - Fetching profile for username:', req.params.username);
    const user = await User.findOne({ username: req.params.username }).select('-password');
    if (!user) {
      console.log('Auth Route - User not found for username:', req.params.username);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Auth Route - Profile fetched successfully:', user.email);
    res.json(user);
  } catch (error) {
    console.error('Auth Route - Get user profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;