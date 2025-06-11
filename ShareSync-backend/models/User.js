const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  age: { type: Number },
  bannerPicture: { type: String, default: 'https://via.placeholder.com/1200x300' },
  job: { type: String },
  school: { type: String },
  projects: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String },
      status: { type: String, default: 'Not Started' },
      category: { type: String, enum: ['School', 'Job', 'Personal'], default: 'Personal' },
      posts: [
        {
          type: { type: String, enum: ['announcement', 'poll', 'picture'], required: true },
          content: { type: String, required: true },
          author: { type: String, required: true },
          timestamp: { type: String, default: new Date().toISOString() },
          comments: [
            {
              author: { type: String, required: true },
              content: { type: String, required: true },
              timestamp: { type: String, default: new Date().toISOString() },
              likes: [{ type: String }],
              shares: [{ type: String }],
            },
          ],
          options: [{ type: String }], // For polls
          votes: [{ user: String, option: String }], // For polls
        },
      ],
      activityLog: [
        {
          message: { type: String, required: true },
          timestamp: { type: String, default: new Date().toISOString() },
          user: { type: String },
          action: { type: String },
        },
      ],
      members: [
        {
          email: { type: String, required: true },
          role: { type: String, default: 'Member' },
          profilePicture: { type: String },
        },
      ],
      tasks: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          description: { type: String },
          assignedTo: { type: String, default: 'Unassigned' },
          status: { type: String, default: 'Not Started' },
          subtasks: [
            {
              id: { type: String, required: true },
              title: { type: String, required: true },
              status: { type: String, default: 'Not Started' },
              comments: [
                {
                  author: { type: String, required: true },
                  content: { type: String, required: true },
                  timestamp: { type: String, default: new Date().toISOString() },
                  likes: [{ type: String }],
                  shares: [{ type: String }],
                },
              ],
            },
          ],
          comments: [
            {
              author: { type: String, required: true },
              content: { type: String, required: true },
              timestamp: { type: String, default: new Date().toISOString() },
              likes: [{ type: String }],
              shares: [{ type: String }],
            },
          ],
        },
      ],
      tasksCompleted: { type: Number, default: 0 },
      totalTasks: { type: Number, default: 0 },
      teams: [
        {
          name: { type: String, required: true },
          description: { type: String },
          members: [{ email: String, role: String }],
        },
      ],
      files: [
        {
          name: { type: String, required: true },
          url: { type: String, required: true },
          uploadedBy: { type: String, required: true },
          timestamp: { type: String, default: new Date().toISOString() },
          status: { type: String, enum: ['Approved', 'Pending'], default: 'Approved' },
        },
      ],
      settings: {
        notifications: {
          email: { type: Boolean, default: true },
          sms: { type: Boolean, default: true },
          inApp: { type: Boolean, default: true },
        },
      },
      suggestions: [
        {
          content: { type: String, required: true },
          author: { type: String, required: true },
          timestamp: { type: String, default: new Date().toISOString() },
        },
      ],
    },
  ],
  notifications: [
    {
      message: { type: String, required: true },
      timestamp: { type: String, default: new Date().toISOString() },
      read: { type: Boolean, default: false },
    },
  ],
});

const User = mongoose.model('User', UserSchema);

module.exports = User;