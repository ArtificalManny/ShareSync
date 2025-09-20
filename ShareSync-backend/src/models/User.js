const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Auth / identity
    username: { type: String, index: true, unique: false, sparse: true },
    password: { type: String }, // keep as-is if you already hash elsewhere

    // Legacy field (kept for compatibility)
    profilePic: String,

    // Profile revamp fields
    displayName: String,
    bio: String,
    publicProfile: { type: Boolean, default: false },

    // Avatar pipeline
    avatarUrl: String,
    avatarVersion: Number, // cache-buster
    avatarEmoji: String,   // optional fallback

    // Gamification
    xp: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: null },

    // Optional persisted badges (you can omit if computed in a service)
    badges: { type: [BadgeSchema], default: undefined },
  },
  { timestamps: true }
);

// Virtual for backward compat: expose `profilePicture` mirroring avatarUrl
userSchema.virtual('profilePicture').get(function () {
  return this.avatarUrl || this.profilePic || '';
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
