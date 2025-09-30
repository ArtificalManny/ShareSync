// server/utils/email/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, index: true },
    fullName: { type: String, trim: true },
    email: { type: String, trim: true, index: true },
    avatarUrl: { type: String, trim: true },

    // NEW
    discoverable: { type: Boolean, default: false, index: true },
  },
  { versionKey: false, timestamps: true }
);

// Text index for global search
UserSchema.index({ username: 'text', fullName: 'text' });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
