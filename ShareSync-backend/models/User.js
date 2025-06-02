const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  job: { type: String },
  school: { type: String },
  profilePicture: { type: String, default: 'https://via.placeholder.com/150' },
  bannerPicture: { type: String, default: 'https://via.placeholder.com/1200x300' },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  points: { type: Number, default: 0 }, // Add points field for gamification
});

module.exports = mongoose.model('User', userSchema);