const User = require('../models/User');
const { saveAvatarBuffer } = require('../utils/storage');

// Small helper to emit socket updates
function emitUserUpdated(req, userId, patch) {
  try {
    const io = req.app.get('io');
    if (io) io.to(`user:${userId}`).emit('user:updated', patch);
  } catch { /* no-op */ }
}

// Allowlist for PATCH /me
const ALLOW_PATCH = new Set(['displayName', 'bio', 'publicProfile', 'avatarEmoji', 'avatarUrl']);

exports.updateMe = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const patch = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      if (ALLOW_PATCH.has(k)) patch[k] = v;
    }

    // If client sets avatarUrl directly (rare), bump version
    if (Object.prototype.hasOwnProperty.call(patch, 'avatarUrl')) {
      patch.avatarVersion = Date.now();
    }

    const doc = await User.findByIdAndUpdate(userId, patch, { new: true });
    if (!doc) return res.status(404).json({ message: 'User not found' });

    emitUserUpdated(req, userId, patch);
    return res.json({ ok: true, user: doc });
  } catch (e) {
    next(e);
  }
};

exports.uploadMyAvatar = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'Missing avatar' });

    const { buffer, mimetype } = req.file;

    const { url } = await saveAvatarBuffer(userId, buffer, mimetype);
    const avatarVersion = Date.now();

    await User.findByIdAndUpdate(
      userId,
      { avatarUrl: url, avatarVersion, avatarEmoji: null },
      { new: true }
    );

    emitUserUpdated(req, userId, { avatarUrl: url, avatarVersion });

    return res.status(201).json({ url });
  } catch (e) {
    next(e);
  }
};

// Simple, local badge computation (replace with a service if desired)
function computeBadges(user) {
  const defs = [
    { id: 'streak_7', name: '1-week Streak', icon: '🔥', earned: (u) => (u.streakDays || 0) >= 7 },
    { id: 'streak_30', name: 'Marathon', icon: '🏃', earned: (u) => (u.streakDays || 0) >= 30 },
    { id: 'xp_1000', name: 'Level Up', icon: '✨', earned: (u) => (u.xp || 0) >= 1000 },
  ];
  return defs.map((d) => ({
    id: d.id,
    name: d.name,
    icon: d.icon,
    earned: d.earned(user),
    earnedAt: d.earned(user) ? (user.badges?.find?.(b => b.id === d.id)?.earnedAt || new Date()) : null,
  }));
}

exports.getMyBadges = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const badges = computeBadges(user);
    return res.json(badges);
  } catch (e) {
    next(e);
  }
};

// Placeholder highlights (replace with real Activity/Task queries)
exports.getMyHighlights = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // TODO: query your Activities/Tasks collections
    const highlights = []; // [{ id, type, title, at, meta }]
    return res.json(highlights);
  } catch (e) {
    next(e);
  }
};

exports.getPublicUserByUsername = async (req, res, next) => {
  try {
    const username = String(req.params.username || '').trim();
    if (!username) return res.status(400).json({ message: 'Missing username' });

    const user = await User.findOne({ username }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.publicProfile === false) {
      return res.status(403).json({ message: 'Profile is private', publicProfile: false });
    }

    // Sanitize
    const pub = {
      _id: String(user._id),
      username: user.username,
      displayName: user.displayName || user.username,
      bio: user.bio || '',
      publicProfile: Boolean(user.publicProfile),
      avatarUrl: user.avatarUrl || user.profilePic || '',
      avatarEmoji: user.avatarEmoji || null,
      xp: user.xp || 0,
      streakDays: user.streakDays || 0,
      longestStreak: user.longestStreak || 0,
      lastActiveAt: user.lastActiveAt || null,
    };

    return res.json(pub);
  } catch (e) {
    next(e);
  }
};
