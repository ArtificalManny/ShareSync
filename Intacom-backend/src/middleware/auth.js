// backend/src/middleware/auth.js
const express = require('express');

module.exports = (req, res, next) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    req.user = JSON.parse(token);
    next();
};