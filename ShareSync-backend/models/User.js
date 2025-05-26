const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: 'https://via.placeholder.com/150' },
  bannerImage: { type: String, default: 'https://via.placeholder.com/1200x300' },
  profileVisibility: { type: String, default: 'public' },
  theme: { type: String, default: 'dark' },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
  },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
});

module.exports = mongoose.model('User', userSchema);