const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, default: 'In Progress' },
  snapshot: String,
  announcements: [{
    message: String,
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['text', 'poll', 'picture'], default: 'text' },
    pollOptions: [{ option: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
    pictureUrl: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      timestamp: { type: Date, default: Date.now },
    }],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  teamActivities: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['task', 'announcement', 'file', 'comment'], default: 'task' },
  }],
  tasks: [{
    title: String,
    description: String,
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    subtasks: [{
      title: String,
      status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
      assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    }],
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      timestamp: { type: Date, default: Date.now },
    }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  files: [{
    name: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  }],
  teams: [{
    name: String,
    description: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  }],
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    taskAssignments: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    fileUploads: { type: Boolean, default: true },
  },
});

module.exports = mongoose.model('Project', projectSchema);