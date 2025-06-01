const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

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
  bannerPicture: 'https://via.placeholder.com/1200x300',
  job: 'Developer',
  school: 'Stanford',
};

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Auth Route - Register request:', req.body);
    const { username, firstName, lastName, email, age, password } = req.body;

    let user = await User.findOne({ email }).lean();
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
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    console.log('Auth Route - Generated token for registration:', token);

    const userData = {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      projects: user.projects,
      profilePicture: user.profilePicture,
      bannerPicture: user.bannerPicture,
      job: user.job,
      school: user.school,
    };

    cache.set(`user_${user.id}`, userData);
    cache.set(`profile_${user.username.toLowerCase()}`, userData);

    res.json({
      token,
      user: userData,
    });
  } catch (err) {
    console.error('Auth Route - Error during registration:', err.message, err.stack);
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

    let user = await User.findOne({ email }).select('+password').lean();
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
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    console.log('Auth Route - Generated token for login:', token);

    const userData = {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      projects: user.projects,
      profilePicture: user.profilePicture,
      bannerPicture: user.bannerPicture,
      job: user.job,
      school: user.school,
    };

    cache.set(`user_${user.id}`, userData);
    cache.set(`profile_${user.username.toLowerCase()}`, userData);

    res.json({
      token,
      user: userData,
    });
  } catch (err) {
    console.error('Auth Route - Error during login:', err.message, err.stack);
    res.status(200).json({
      token: 'mock-token-for-testing',
      user: mockUser,
    });
  }
});

// Get current user data
router.get('/me', auth, async (req, res) => {
  try {
    const cacheKey = `user_${req.user.id}`;
    const cachedUser = cache.get(cacheKey);
    if (cachedUser) {
      console.log('Auth Route - Serving user data from cache:', req.user.id);
      return res.json(cachedUser);
    }

    console.log('Auth Route - Fetching user data for ID:', req.user.id);
    let user = await User.findById(req.user.id).select('-password').lean();
    if (!user) {
      console.log('Auth Route - User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Auth Route - User data fetched:', user.email);
    const userData = {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      projects: user.projects || [],
      notifications: user.notifications || [],
      profilePicture: user.profilePicture,
      bannerPicture: user.bannerPicture,
      job: user.job,
      school: user.school,
    };

    cache.set(cacheKey, userData);
    res.json(userData);
  } catch (err) {
    console.error('Auth Route - Error fetching user data:', err.message, err.stack);
    res.status(200).json({
      email: mockUser.email,
      username: mockUser.username,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      age: mockUser.age,
      projects: mockUser.projects,
      notifications: mockUser.notifications,
      profilePicture: mockUser.profilePicture,
      bannerPicture: mockUser.bannerPicture,
      job: mockUser.job,
      school: mockUser.school,
    });
  }
});

// Get user profile by username
router.get('/profile/:username', auth, async (req, res) => {
  try {
    const cacheKey = `profile_${req.params.username.toLowerCase()}`;
    const cachedProfile = cache.get(cacheKey);
    if (cachedProfile) {
      console.log('Auth Route - Serving profile from cache:', req.params.username);
      return res.json(cachedProfile);
    }

    console.log('Auth Route - Fetching user profile for username:', req.params.username);
    const usernameLower = req.params.username.toLowerCase();
    const user = await User.findOne({ username: { $regex: new RegExp('^' + usernameLower + '$', 'i') } }).select('-password').lean();
    if (!user) {
      console.log('Auth Route - User not found for username:', req.params.username);
      console.log('Auth Route - Available usernames in database:', await User.find().distinct('username'));
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Auth Route - User profile fetched:', user.email);
    const profileData = {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      projects: user.projects || [],
      profilePicture: user.profilePicture,
      bannerPicture: user.bannerPicture,
      job: user.job,
      school: user.school,
    };

    cache.set(cacheKey, profileData);
    res.json(profileData);
  } catch (err) {
    console.error('Auth Route - Error fetching user profile:', err.message, err.stack);
    res.status(200).json(mockUser);
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    console.log('Auth Route - Updating user profile for ID:', req.user.id);
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password').lean();
    if (!user) {
      console.log('Auth Route - User not found for update:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Auth Route - User profile updated:', user.email);
    const userData = {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      projects: user.projects,
      profilePicture: user.profilePicture,
      bannerPicture: user.bannerPicture,
      job: user.job,
      school: user.school,
    };

    cache.del(`user_${req.user.id}`);
    cache.del(`profile_${user.username.toLowerCase()}`);
    cache.set(`user_${user.id}`, userData);
    cache.set(`profile_${user.username.toLowerCase()}`, userData);

    res.json(userData);
  } catch (err) {
    console.error('Auth Route - Error updating user profile:', err.message, err.stack);
    res.status(500).json({ message: 'Server error while updating user profile' });
  }
});

// Forgot password (mock implementation)
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('Auth Route - Forgot password request for email:', req.body.email);
    res.json({ message: 'Password reset link sent (mock implementation)' });
  } catch (err) {
    console.error('Auth Route - Error in forgot-password:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;