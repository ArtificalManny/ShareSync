const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  job: String,
  school: String,
  profilePicture: String,
  bannerPicture: String,
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    taskAssignments: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    fileUploads: { type: Boolean, default: true },
  },
});

module.exports = mongoose.model('User', userSchema);