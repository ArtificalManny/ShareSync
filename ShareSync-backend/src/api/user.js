// /ShareSync-backend/src/api/user.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure upload dir exists
const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (_req, file, cb) => {
    const base = Date.now().toString(36);
    const ext = path.extname(file?.originalname || '.png') || '.png';
    cb(null, `${base}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

// Reuse an in-memory user (dev only)
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
router.get(['/user/me', '/users/me', '/me', '/auth/me'], (_req, res) => {
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
  if (patch.notifications && typeof patch.notifications === 'object') {
    u.notifications = { ...u.notifications, ...patch.notifications };
  }

  res.json(u);
});

// Avatar upload (dev mirror of Nest endpoint)
router.post(['/user/me/avatar', '/users/me/avatar'], upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `/uploads/avatars/${req.file.filename}`;
  store.user.profilePicture = url;
  // In dev router we don’t have sockets here; FE will refresh via polling or next GET /users/me
  res.json({ ok: true, profilePicture: url });
});

router.patch(['/user/me/notifications', '/users/me/notifications'], (req, res) => {
  const patch = req.body || {};
  store.user.notifications = { ...store.user.notifications, ...patch };
  res.json({ ok: true, notifications: store.user.notifications });
});

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
