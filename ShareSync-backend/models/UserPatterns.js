const mongoose = require('mongoose');

const userPatternsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Focus windows - when user is most productive
  focusWindows: [{
    start: Number,        // Hour (0-23)
    end: Number,          // Hour (0-23)
    productivity: Number, // Multiplier (e.g., 3.2 = 3.2x more productive)
    confidence: Number    // 0-1, how confident we are in this pattern
  }],
  
  // Peak hours - top 3 most productive hours
  peakHours: [Number],    // Array of hours (0-23)
  
  // Work patterns
  averageSessionDuration: Number,  // Minutes
  preferredTaskComplexity: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  workDays: [Number],     // Array of days (0-6, 0=Sunday)
  
  // Streak data
  consecutiveWorkDays: {
    type: Number,
    default: 0
  },
  lastWorkDay: Date,
  longestStreak: {
    type: Number,
    default: 0
  },
  
  // Energy patterns
  energyByHour: [{
    hour: Number,
    avgEnergy: Number     // Average energy level (1-5)
  }],
  
  // Task completion patterns
  avgTaskCompletionTime: Number,  // Minutes
  taskCompletionRate: Number,     // Percentage (0-100)
  
  // Work-life balance metrics
  avgHoursPerDay: Number,
  lateNightWorkDays: Number,      // Days worked after 11pm in last 30 days
  weekendWorkDays: Number,        // Weekend days worked in last 30 days
  
  // Last computation
  lastComputed: Date,
  dataPoints: Number              // Number of activity logs used
  
}, {
  timestamps: true
});

// Method: Check if patterns need recomputation
userPatternsSchema.methods.needsRecompute = function() {
  if (!this.lastComputed) return true;
  
  const hoursSinceCompute = (Date.now() - this.lastComputed.getTime()) / (1000 * 60 * 60);
  return hoursSinceCompute >= 24; // Recompute every 24 hours
};

// Method: Get current focus window
userPatternsSchema.methods.getCurrentFocusWindow = function() {
  const currentHour = new Date().getHours();
  
  return this.focusWindows.find(window => {
    if (window.start <= window.end) {
      return currentHour >= window.start && currentHour < window.end;
    } else {
      // Handle overnight windows (e.g., 23:00 - 02:00)
      return currentHour >= window.start || currentHour < window.end;
    }
  });
};

// Method: Get next focus window
userPatternsSchema.methods.getNextFocusWindow = function() {
  const currentHour = new Date().getHours();
  
  // Sort windows by start time
  const sortedWindows = [...this.focusWindows].sort((a, b) => a.start - b.start);
  
  // Find next window after current hour
  for (const window of sortedWindows) {
    if (window.start > currentHour) {
      return window;
    }
  }
  
  // If no window found, return first window (tomorrow)
  return sortedWindows[0];
};

// Static method: Get or create user patterns
userPatternsSchema.statics.getOrCreate = async function(userId) {
  let patterns = await this.findOne({ userId });
  
  if (!patterns) {
    patterns = await this.create({
      userId,
      focusWindows: [],
      peakHours: [],
      workDays: [],
      consecutiveWorkDays: 0,
      energyByHour: [],
      dataPoints: 0
    });
  }
  
  return patterns;
};

module.exports = mongoose.model('UserPatterns', userPatternsSchema);
