// server/utils/email/routes/users.js
const express = require('express');
const router = express.Router();

// Swap this stub with your real model when ready:
// const User = require('../models/User');

router.get('/users/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ items: [] });

    // --- Real implementation (when you have a User model) ---
    // const rows = await User.find(
    //   { username: new RegExp('^' + escapeRegex(q), 'i') },
    //   { _id: 1, username: 1, name: 1, avatarUrl: 1 }
    // ).limit(20).lean();
    // return res.json({
    //   items: rows.map(u => ({
    //     id: String(u._id),
    //     username: u.username,
    //     name: u.name || null,
    //     avatarUrl: u.avatarUrl || null,
    //   })),
    // });

    // --- Stub (no-op) ---
    return res.json({ items: [] });
  } catch (err) {
    next(err);
  }
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = router;
