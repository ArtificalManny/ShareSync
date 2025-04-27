const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Received login request:', { email });
    const user = await User.findOne({ email });
    console.log('UserService: Finding user by email:', email);
    console.log('UserService: Find result:', user);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, profilePicture: user.profilePicture }, token });
  } catch (error) {
    console.error('Auth Route - Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ firstName, lastName, username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    console.error('Auth Route - Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/forgot-password', (req, res) => {
  res.json({ message: 'Reset link sent (placeholder)' });
});

router.post('/reset-password/:token', (req, res) => {
  res.json({ message: 'Password reset successful (placeholder)' });
});

module.exports = router;