// /ShareSync-backend/src/api/user.js
const express = require('express');
const router = express.Router();

// Reuse the in-memory user from server.js through a tiny singleton.
// In real code, you’d pull from DB/services instead.
const store = {
  user: {
    _id: 'u_1',
    username: 'manny',
    firstName: 'Manny',
    lastName: '',
    bio: 'Trying to ship daily.',
    publicProfile: true,
    profilePicture: '',
    appearance: { theme: 'system' },
    notifications: { emailActivity: true, emailDigest: true },
    lastLogin: new Date().toISOString(),
  },
};

// ---------- helpers ----------
const publicShape = (u) => {
  const { notifications, ...rest } = u;
  return rest;
};

// ---------- owner endpoints ----------
router.get(['/user/me', '/users/me', '/me', '/auth/me'], (req, res) => {
  res.json(store.user);
});

router.patch(['/user/me', '/users/me'], (req, res) => {
  const patch = req.body || {};
  const u = store.user;

  if (typeof patch.firstName === 'string') u.firstName = patch.firstName;
  if (typeof patch.lastName === 'string') u.lastName = patch.lastName;
  if (typeof patch.bio === 'string') u.bio = patch.bio;
  if (typeof patch.publicProfile === 'boolean') u.publicProfile = patch.publicProfile;
  if (patch.appearance && typeof patch.appearance === 'object') {
    u.appearance = { ...u.appearance, ...patch.appearance };
  }

  res.json(u);
});

router.patch(
  ['/user/me/notifications', '/users/me/notifications'],
  (req, res) => {
    const patch = req.body || {};
    store.user.notifications = { ...store.user.notifications, ...patch };
    res.json({ ok: true, notifications: store.user.notifications });
  }
);

// ---------- public profiles ----------
router.get(
  ['/user/public/:username', '/users/public/:username', '/profile/public/:username'],
  (req, res) => {
    const { username } = req.params;
    if (username !== store.user.username) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!store.user.publicProfile) {
      return res.status(403).json({ message: 'Profile is private' });
    }
    return res.json(publicShape(store.user));
  }
);

module.exports = router;
