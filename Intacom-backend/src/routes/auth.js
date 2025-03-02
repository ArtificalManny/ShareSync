// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        res.cookie('userToken', JSON.stringify({ username: user.username, profilePic: user.profilePic }), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ user, token: 'mock-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

router.post('/register', async (req, res) => {
    const { username, password, profilePic } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ error: 'Username taken' });
    }
    const newUser = new User({ username, password, profilePic: profilePic || 'default-profile.jpg' });
    await newUser.save();
    res.cookie('userToken', JSON.stringify({ username: newUser.username, profilePic: newUser.profilePic }), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json(newUser);
});

router.get('/user', (req, res) => {
    const token = req.cookies.userToken;
    if (token) {
        const user = JSON.parse(token);
        res.json(user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('userToken');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;