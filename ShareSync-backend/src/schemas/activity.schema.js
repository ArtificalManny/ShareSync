const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'task_created',
      'task_completed',
      'task_deleted',
      'file_uploaded',
      'file_deleted',
      'message_sent',
      'payment_sent',
      'email_exchanged',
      'member_added',
      'member_removed',
      'announcement_created',
      'project_shipped',
      'comment_added'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible JSON object
    default: {}
  },
  metadata: {
    taskTitle: String,
    fileName: String,
    fileSize: Number,
    recipientName: String,
    amount: Number,
    messagePreview: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for fast queries
activitySchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
