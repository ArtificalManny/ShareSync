const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  age: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  projects: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String, default: 'No description' },
      status: { type: String, default: 'Not Started' },
      posts: [
        {
          id: { type: String, required: true },
          user: { type: String, required: true },
          profilePicture: { type: String, default: 'https://via.placeholder.com/150' },
          content: { type: String, required: true },
          timestamp: { type: String, required: true },
          likes: { type: Number, default: 0 },
        },
      ],
      comments: [
        {
          id: { type: String, required: true },
          postId: { type: String, required: true },
          user: { type: String, required: true },
          content: { type: String, required: true },
          timestamp: { type: String, required: true },
        },
      ],
      activityLog: [
        {
          message: { type: String, required: true },
          timestamp: { type: String, required: true },
        },
      ],
      members: [
        {
          email: { type: String, required: true },
          role: { type: String, default: 'Member' },
          profilePicture: { type: String, default: 'https://via.placeholder.com/150' },
        },
      ],
      tasks: [
        {
          title: { type: String, required: true },
          description: { type: String, default: 'No description' },
          assignedTo: { type: String, default: 'Unassigned' },
          status: { type: String, default: 'Not Started' },
        },
      ],
      tasksCompleted: { type: Number, default: 0 },
      totalTasks: { type: Number, default: 0 },
    },
  ],
  notifications: [
    {
      message: { type: String, required: true },
      timestamp: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model('User', userSchema);