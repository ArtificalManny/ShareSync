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
  projects: [
    {
      id: String,
      title: String,
      description: String,
      status: String,
      posts: [
        {
          id: String,
          user: String,
          profilePicture: String,
          content: String,
          timestamp: String,
          likes: Number,
        },
      ],
      comments: [
        {
          id: String,
          postId: String,
          user: String,
          content: String,
          timestamp: String,
        },
      ],
      activityLog: [
        {
          message: String,
          timestamp: String,
        },
      ],
      members: [
        {
          email: String,
          role: String,
          profilePicture: String,
        },
      ],
      tasks: [
        {
          title: String,
          description: String,
          assignedTo: String,
          status: String,
        },
      ],
      tasksCompleted: Number,
      totalTasks: Number,
    },
  ],
  notifications: [
    {
      message: String,
      timestamp: String,
    },
  ],
  profilePicture: String,
});

module.exports = mongoose.model('User', userSchema);