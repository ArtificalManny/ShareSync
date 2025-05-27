const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  admin: {
    type: String,
    required: true,
  },
  members: [
    {
      email: String,
      role: { type: String, default: 'member' },
      profilePicture: { type: String, default: 'https://via.placeholder.com/150' },
    },
  ],
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  },
  tasksCompleted: {
    type: Number,
    default: 0,
  },
  totalTasks: {
    type: Number,
    default: 0,
  },
  tasks: [
    {
      title: String,
      description: String,
      assignedTo: String,
      status: { type: String, default: 'Not Started' },
    },
  ],
  announcements: [
    {
      id: String,
      user: String,
      profilePicture: String,
      content: String,
      timestamp: Date,
      likes: { type: Number, default: 0 },
      comments: [
        {
          id: String,
          user: String,
          content: String,
          timestamp: Date,
        },
      ],
    },
  ],
  posts: [
    {
      id: String,
      user: String,
      profilePicture: String,
      content: String,
      timestamp: Date,
      likes: { type: Number, default: 0 },
    },
  ],
  comments: [
    {
      id: String,
      postId: String,
      user: String,
      content: String,
      timestamp: Date,
    },
  ],
  activityLog: [
    {
      message: String,
      timestamp: Date,
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);