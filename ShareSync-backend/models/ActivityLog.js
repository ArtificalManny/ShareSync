const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['ship', 'task', 'session_start', 'session_end', 'project_view', 'task_complete', 'task_create'],
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    duration: Number,        // Session duration in minutes
    complexity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    completionTime: Number,  // Time to complete task in minutes
    energy: {                // User-reported energy level
      type: Number,
      min: 1,
      max: 5
    },
    taskId: mongoose.Schema.Types.ObjectId,
    shipDescription: String,
    xp: Number
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
activityLogSchema.index({ projectId: 1, timestamp: -1 });

// Virtual for hour of day
activityLogSchema.virtual('hourOfDay').get(function() {
  return this.timestamp.getHours();
});

// Virtual for day of week
activityLogSchema.virtual('dayOfWeek').get(function() {
  return this.timestamp.getDay(); // 0 = Sunday, 6 = Saturday
});

// Static method: Get user activity for date range
activityLogSchema.statics.getUserActivity = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    timestamp: { $gte: startDate }
  }).sort({ timestamp: -1 });
};

// Static method: Get activity by hour
activityLogSchema.statics.getActivityByHour = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $hour: '$timestamp' },
        count: { $sum: 1 },
        avgDuration: { $avg: '$metadata.duration' },
        actions: { $push: '$action' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method: Get consecutive work days
activityLogSchema.statics.getConsecutiveWorkDays = async function(userId) {
  const activities = await this.find({
    userId,
    action: { $in: ['ship', 'task_complete', 'session_start'] }
  }).sort({ timestamp: -1 }).limit(365);
  
  if (!activities.length) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Group activities by day
  const dayMap = new Map();
  activities.forEach(activity => {
    const dayKey = new Date(activity.timestamp).toDateString();
    dayMap.set(dayKey, true);
  });
  
  // Count consecutive days
  while (dayMap.has(currentDate.toDateString())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
