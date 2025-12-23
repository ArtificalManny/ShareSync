const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ====================================================================
// REGISTER - WITH EMAIL VERIFICATION
// ====================================================================
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (NOT verified yet)
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationCodeExpiry,
    });

    await user.save();

    // Send verification email (for now, just log it)
    console.log(`📧 VERIFICATION CODE for ${email}: ${verificationCode}`);
    // TODO: Actually send email here

    // Return userId and email (NO TOKEN YET)
    res.status(201).json({
      userId: user._id,
      email: user.email,
      message: 'Verification code sent to email',
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ====================================================================
// VERIFY EMAIL
// ====================================================================
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, code } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Check if code expired
    if (new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ message: 'Verification code expired' });
    }

    // Check if code matches
    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    // Generate JWT token
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Return token and user
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ====================================================================
// LOGIN
// ====================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// ✅ NEW: VERIFY TOKEN (FOR APP STARTUP)
// ====================================================================
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      valid: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        gamification: user.gamification,
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

// ====================================================================
// GET CURRENT USER
// ====================================================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Auth Route - Get current user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ====================================================================
// UPDATE USER PROFILE
// ====================================================================
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Auth Route - Update user profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ====================================================================
// GET USER PROFILE BY USERNAME
// ====================================================================
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
