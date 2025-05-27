const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    default: 'John',
  },
  lastName: {
    type: String,
    default: 'Doe',
  },
  profilePicture: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  bannerImage: {
    type: String,
    default: 'https://via.placeholder.com/1200x300',
  },
  projects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
  ],
  notifications: [
    {
      message: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);