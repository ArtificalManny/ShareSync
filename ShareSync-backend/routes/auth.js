const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Mock user data for testing if MongoDB is down
const mockUser = {
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  age: 25,
  projects: [],
  notifications: [],
  profilePicture: 'https://via.placeholder.com/150',
};

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Auth Route - Register request:', req.body);
    const { username, firstName, lastName, email, age, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      console.log('Auth Route - User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ username, firstName, lastName, email, age, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    console.log('Auth Route - User registered:', user);

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        projects: user.projects,
      },
    });
  } catch (err) {
    console.error('Auth Route - Error during registration:', err.message);
    // Mock response if MongoDB is down
    res.status(200).json({
      token: 'mock-token-for-testing',
      user: mockUser,
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Auth Route - Login request:', req.body);
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      console.log('Auth Route - Invalid credentials for email:', email);
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Auth Route - Password mismatch for email:', email);
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log('Auth Route - User logged in:', user.email);
    res.json({
      token,
      user: {
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        projects: user.projects,
      },
    });
  } catch (err) {
    console.error('Auth Route - Error during login:', err.message);
    // Mock response if MongoDB is down
    res.status(200).json({
      token: 'mock-token-for-testing',
      user: mockUser,
    });
  }
});

// Get user data
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Auth Route - Fetching user data for ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('Auth Route - User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Auth Route - User data fetched:', user.email);
    res.json(user);
  } catch (err) {
    console.error('Auth Route - Error fetching user data:', err.message);
    // Mock response if MongoDB is down
    res.status(200).json(mockUser);
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    console.log('Auth Route - Updating user profile for ID:', req.user.id);
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    if (!user) {
      console.log('Auth Route - User not found for update:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Auth Route - User profile updated:', user.email);
    res.json(user);
  } catch (err) {
    console.error('Auth Route - Error updating user profile:', err.message);
    // Mock response if MongoDB is down
    res.status(200).json(mockUser);
  }
});

// Forgot password (mock implementation)
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('Auth Route - Forgot password request for email:', req.body.email);
    // Mock response
    res.json({ message: 'Password reset link sent (mock implementation)' });
  } catch (err) {
    console.error('Auth Route - Error in forgot-password:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;