// ShareSync-backend/src/api/users.routes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; // adjust path to your user model

const router = express.Router();

// Simple Bearer auth middleware
function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub || payload.id || payload._id; // allow different token shapes
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// GET /api/users/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(401).json({ message: 'User not found' });

    // sanitize
    const { password, refreshToken, ...safe } = user;
    res.json(safe);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch me' });
  }
});

export default router;
