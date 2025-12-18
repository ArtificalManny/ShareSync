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

  // ✅ Public profile toggle
  publicProfile: { type: Boolean, default: false },

  // ============================================
  // ✅ GAMIFICATION SYSTEM
  // ============================================
  gamification: {
    // XP & Levels
    totalXP: { type: Number, default: 0, index: true },
    level: { type: Number, default: 1, index: true },
    xpToNextLevel: { type: Number, default: 100 },
    
    // Streaks
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastShipDate: { type: Date },
    lastActivityDate: { type: Date },
    
    // Badges
    badges: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        icon: { type: String },
        earnedAt: { type: Date, default: Date.now },
        tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
      }
    ],
    
    // Statistics
    stats: {
      totalShips: { type: Number, default: 0 },
      totalTasksCompleted: { type: Number, default: 0 },
      totalFocusMinutes: { type: Number, default: 0 },
      totalFocusSessions: { type: Number, default: 0 },
      totalProjects: { type: Number, default: 0 },
      totalCollaborations: { type: Number, default: 0 },
      
      // Weekly stats
      shipsThisWeek: { type: Number, default: 0 },
      tasksThisWeek: { type: Number, default: 0 },
      focusMinutesThisWeek: { type: Number, default: 0 },
      
      // Quality metrics
      avgTaskCompletionTime: { type: Number, default: 0 }, // hours
      avgFocusSessionQuality: { type: Number, default: 0 }, // 1-5
      onTimeDeliveryRate: { type: Number, default: 100 }, // percentage
    },
    
    // Achievements
    achievements: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        progress: { type: Number, default: 0 },
        target: { type: Number, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        xpReward: { type: Number, default: 0 },
      }
    ],
    
    // Leaderboard
    rank: { type: Number }, // Overall rank
    weeklyRank: { type: Number }, // Weekly leaderboard
    
    // Preferences
    preferences: {
      showOnLeaderboard: { type: Boolean, default: true },
      shareStats: { type: Boolean, default: true },
      notifyOnLevelUp: { type: Boolean, default: true },
      notifyOnBadge: { type: Boolean, default: true },
    },
  },

  // ============================================
  // PROJECTS (KEPT AS IS)
  // ============================================
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
          options: [{ type: String }],
          votes: [{ user: String, option: String }],
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
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// ============================================
// ✅ INSTANCE METHODS
// ============================================

/**
 * Add XP and check for level up
 */
UserSchema.methods.addXP = function(amount, reason) {
  this.gamification.totalXP += amount;
  
  // Check for level up
  while (this.gamification.totalXP >= this.gamification.xpToNextLevel) {
    this.gamification.level += 1;
    this.gamification.xpToNextLevel = this.calculateXPForNextLevel();
    
    console.log(`🎉 ${this.username} leveled up to ${this.gamification.level}!`);
    
    // Award level-up badge if applicable
    if (this.gamification.level % 5 === 0) {
      this.awardBadge({
        id: `level-${this.gamification.level}`,
        name: `Level ${this.gamification.level} Achiever`,
        description: `Reached level ${this.gamification.level}`,
        icon: '🏆',
        tier: this.gamification.level >= 20 ? 'platinum' : 
              this.gamification.level >= 10 ? 'gold' : 'silver',
      });
    }
  }
  
  return this.save();
};

/**
 * Calculate XP needed for next level (exponential growth)
 */
UserSchema.methods.calculateXPForNextLevel = function() {
  return Math.floor(100 * Math.pow(1.5, this.gamification.level - 1));
};

/**
 * Award a badge
 */
UserSchema.methods.awardBadge = function(badge) {
  // Check if badge already exists
  const exists = this.gamification.badges.some(b => b.id === badge.id);
  
  if (!exists) {
    this.gamification.badges.push({
      ...badge,
      earnedAt: new Date(),
    });
    
    console.log(`🎖️ ${this.username} earned badge: ${badge.name}`);
    
    // Award XP for badge (optional)
    if (badge.tier === 'platinum') this.gamification.totalXP += 100;
    else if (badge.tier === 'gold') this.gamification.totalXP += 50;
    else if (badge.tier === 'silver') this.gamification.totalXP += 25;
    else this.gamification.totalXP += 10;
  }
  
  return this;
};

/**
 * Update streak
 */
UserSchema.methods.updateStreak = function() {
  const today = new Date().toDateString();
  const lastShip = this.gamification.lastShipDate?.toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (lastShip === yesterday) {
    // Continue streak
    this.gamification.currentStreak += 1;
  } else if (!lastShip || lastShip !== today) {
    // Reset streak (or start new one)
    this.gamification.currentStreak = 1;
  }
  // If lastShip === today, streak stays the same
  
  // Update longest streak
  if (this.gamification.currentStreak > this.gamification.longestStreak) {
    this.gamification.longestStreak = this.gamification.currentStreak;
    
    // Award streak badges
    if (this.gamification.longestStreak === 7) {
      this.awardBadge({
        id: 'streak-7',
        name: 'Week Warrior',
        description: '7-day shipping streak',
        icon: '🔥',
        tier: 'bronze',
      });
    } else if (this.gamification.longestStreak === 30) {
      this.awardBadge({
        id: 'streak-30',
        name: 'Monthly Master',
        description: '30-day shipping streak',
        icon: '🔥',
        tier: 'silver',
      });
    } else if (this.gamification.longestStreak === 100) {
      this.awardBadge({
        id: 'streak-100',
        name: 'Century Shipper',
        description: '100-day shipping streak',
        icon: '🔥',
        tier: 'gold',
      });
    }
  }
  
  this.gamification.lastShipDate = new Date();
  return this;
};

/**
 * Record a ship
 */
UserSchema.methods.recordShip = function() {
  this.gamification.stats.totalShips += 1;
  this.gamification.stats.shipsThisWeek += 1;
  this.updateStreak();
  return this;
};

/**
 * Record task completion
 */
UserSchema.methods.recordTaskCompletion = function() {
  this.gamification.stats.totalTasksCompleted += 1;
  this.gamification.stats.tasksThisWeek += 1;
  return this;
};

/**
 * Record focus session
 */
UserSchema.methods.recordFocusSession = function(duration, quality) {
  this.gamification.stats.totalFocusSessions += 1;
  this.gamification.stats.totalFocusMinutes += duration;
  this.gamification.stats.focusMinutesThisWeek += duration;
  
  // Update average quality
  const totalSessions = this.gamification.stats.totalFocusSessions;
  const currentAvg = this.gamification.stats.avgFocusSessionQuality;
  this.gamification.stats.avgFocusSessionQuality = 
    ((currentAvg * (totalSessions - 1)) + quality) / totalSessions;
  
  return this;
};

/**
 * Reset weekly stats (call this on Monday 00:00)
 */
UserSchema.methods.resetWeeklyStats = function() {
  this.gamification.stats.shipsThisWeek = 0;
  this.gamification.stats.tasksThisWeek = 0;
  this.gamification.stats.focusMinutesThisWeek = 0;
  return this.save();
};

// ============================================
// INDEXES
// ============================================
UserSchema.index({ 'gamification.totalXP': -1 }); // Leaderboard
UserSchema.index({ 'gamification.level': -1 });
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
