const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // ⭐ PHONE VERIFICATION FIELDS (NEW)
  phoneNumber: { type: String },
  isPhoneVerified: { type: Boolean, default: false },

  profilePicture: { type: String, default: '' },
  age: { type: Number },
  bannerPicture: { type: String, default: 'https://via.placeholder.com/1200x300' },
  job: { type: String },
  school: { type: String },

  // ✅ Public profile toggle
  publicProfile: { type: Boolean, default: false },

  // ✅ Priority 3.2: Activity sharing for Momentum Contagion
  activitySharingEnabled: { type: Boolean, default: true },

  // ✅ Priority 4.1: Persona Mode (Cross-Age Appeal System)
  persona: { type: String, enum: ['student', 'creator', 'professional', 'teamlead'], default: 'creator' },

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
  // ✅ DAILY GOALS SYSTEM
  // ============================================
  dailyGoals: {
    // Current active goals
    goals: [
      {
        id: { type: String, required: true },
        type: { type: String, enum: ['ship', 'task', 'focus', 'custom'], required: true },
        title: { type: String, required: true },
        description: { type: String },
        target: { type: Number, default: 1 }, // How many to complete
        progress: { type: Number, default: 0 }, // Current progress
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        date: { type: Date, default: Date.now }, // Which day this goal is for
        xpReward: { type: Number, default: 25 },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      }
    ],
    
    // Goal history for analytics
    history: [
      {
        date: { type: Date, required: true },
        goalsSet: { type: Number, default: 0 },
        goalsCompleted: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 }, // percentage
        totalXPEarned: { type: Number, default: 0 },
      }
    ],
    
    // Settings
    settings: {
      autoGenerateGoals: { type: Boolean, default: true },
      dailyGoalCount: { type: Number, default: 3 }, // How many goals per day
      notifyOnGoalCompletion: { type: Boolean, default: true },
      resetTime: { type: String, default: '00:00' }, // When to reset daily goals
    },
    
    // Streaks
    goalCompletionStreak: { type: Number, default: 0 }, // Days in a row completing all goals
    longestGoalStreak: { type: Number, default: 0 },
    lastGoalCompletionDate: { type: Date },
  },

  // ============================================
  // ✅ ENERGY TRACKING SYSTEM
  // ============================================
  energyLog: {
    // Current energy state
    currentEnergy: { type: Number, default: 100, min: 0, max: 100 }, // 0-100 scale
    lastEnergyUpdate: { type: Date, default: Date.now },
    
    // Energy entries (hourly tracking)
    entries: [
      {
        timestamp: { type: Date, default: Date.now },
        energyLevel: { type: Number, required: true, min: 0, max: 100 },
        mood: { type: String, enum: ['exhausted', 'tired', 'neutral', 'good', 'energized'] },
        context: {
          timeOfDay: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'] },
          afterActivity: { type: String }, // e.g., 'focus_session', 'break', 'meeting'
          notes: { type: String },
        },
      }
    ],
    
    // Daily summaries
    dailySummaries: [
      {
        date: { type: Date, required: true },
        avgEnergy: { type: Number, default: 0 },
        peakEnergy: { type: Number, default: 0 },
        lowestEnergy: { type: Number, default: 0 },
        peakTime: { type: String }, // Time when energy was highest
        totalEntries: { type: Number, default: 0 },
        mood: { type: String },
      }
    ],
    
    // AI Insights
    insights: {
      peakHours: [{ type: String }], // e.g., ['09:00', '14:00']
      lowHours: [{ type: String }],
      bestDaysOfWeek: [{ type: String }], // e.g., ['Monday', 'Wednesday']
      averageEnergy: { type: Number, default: 100 },
      recommendations: [{ type: String }], // AI-generated suggestions
      lastUpdated: { type: Date },
    },
    
    // Settings
    settings: {
      trackEnergy: { type: Boolean, default: true },
      remindToLog: { type: Boolean, default: true },
      reminderInterval: { type: Number, default: 4 }, // hours
      useAIInsights: { type: Boolean, default: true },
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
  
  // ============================================
  // ✅ NOTIFICATIONS
  // ============================================
  notifications: [
    {
      message: { type: String, required: true },
      type: { 
        type: String, 
        enum: [
          'task_assigned', 'task_completed', 'task_comment', 'task_due_soon',
          'project_invite', 'member_joined', 'member_left',
          'ship_created', 'mention',
          'badge_earned', 'level_up', 'streak_milestone', 'achievement_complete',
          'system_update', 'welcome'
        ]
      },
      data: { type: Object }, // Additional data about the notification
      metadata: { type: Object }, // Links, IDs, etc.
      timestamp: { type: String, default: new Date().toISOString() },
      read: { type: Boolean, default: false },
    },
  ],
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// ============================================
// ✅ INSTANCE METHODS - GAMIFICATION
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
        icon: '��',
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
// ✅ INSTANCE METHODS - DAILY GOALS
// ============================================

/**
 * Add a daily goal
 */
UserSchema.methods.addDailyGoal = function(goal) {
  const newGoal = {
    id: goal.id || `goal-${Date.now()}`,
    type: goal.type,
    title: goal.title,
    description: goal.description,
    target: goal.target || 1,
    progress: 0,
    completed: false,
    date: new Date(),
    xpReward: goal.xpReward || 25,
    priority: goal.priority || 'medium',
  };
  
  this.dailyGoals.goals.push(newGoal);
  return this;
};

/**
 * Update goal progress
 */
UserSchema.methods.updateGoalProgress = function(goalId, progress) {
  const goal = this.dailyGoals.goals.id(goalId);
  
  if (goal) {
    goal.progress = progress;
    
    // Check if goal is now completed
    if (progress >= goal.target && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date();
      
      // Award XP
      this.addXP(goal.xpReward, `Completed daily goal: ${goal.title}`);
      
      console.log(`✅ ${this.username} completed goal: ${goal.title}`);
    }
  }
  
  return this;
};

/**
 * Reset daily goals (call this at midnight)
 */
UserSchema.methods.resetDailyGoals = function() {
  const today = new Date().toDateString();
  const goalsToday = this.dailyGoals.goals.filter(g => 
    new Date(g.date).toDateString() === today
  );
  
  // Archive today's goals to history
  if (goalsToday.length > 0) {
    const completed = goalsToday.filter(g => g.completed).length;
    const completionRate = (completed / goalsToday.length) * 100;
    const totalXP = goalsToday.filter(g => g.completed).reduce((sum, g) => sum + g.xpReward, 0);
    
    this.dailyGoals.history.push({
      date: new Date(),
      goalsSet: goalsToday.length,
      goalsCompleted: completed,
      completionRate,
      totalXPEarned: totalXP,
    });
    
    // Update goal completion streak
    if (completed === goalsToday.length) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const lastCompletion = this.dailyGoals.lastGoalCompletionDate?.toDateString();
      
      if (lastCompletion === yesterday) {
        this.dailyGoals.goalCompletionStreak += 1;
      } else {
        this.dailyGoals.goalCompletionStreak = 1;
      }
      
      if (this.dailyGoals.goalCompletionStreak > this.dailyGoals.longestGoalStreak) {
        this.dailyGoals.longestGoalStreak = this.dailyGoals.goalCompletionStreak;
      }
      
      this.dailyGoals.lastGoalCompletionDate = new Date();
    } else {
      this.dailyGoals.goalCompletionStreak = 0;
    }
  }
  
  // Clear goals for new day
  this.dailyGoals.goals = [];
  
  return this;
};

// ============================================
// ✅ INSTANCE METHODS - ENERGY TRACKING
// ============================================

/**
 * Log energy level
 */
UserSchema.methods.logEnergy = function(energyLevel, mood, context) {
  const entry = {
    timestamp: new Date(),
    energyLevel: Math.max(0, Math.min(100, energyLevel)), // Clamp to 0-100
    mood: mood || 'neutral',
    context: {
      timeOfDay: this.getTimeOfDay(),
      afterActivity: context?.afterActivity,
      notes: context?.notes,
    },
  };
  
  this.energyLog.entries.push(entry);
  this.energyLog.currentEnergy = energyLevel;
  this.energyLog.lastEnergyUpdate = new Date();
  
  // Keep only last 30 days of entries
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  this.energyLog.entries = this.energyLog.entries.filter(e => 
    e.timestamp > thirtyDaysAgo
  );
  
  console.log(`⚡ ${this.username} logged energy: ${energyLevel}`);
  
  return this;
};

/**
 * Generate daily summary
 */
UserSchema.methods.generateDailySummary = function() {
  const today = new Date().toDateString();
  const todayEntries = this.energyLog.entries.filter(e => 
    new Date(e.timestamp).toDateString() === today
  );
  
  if (todayEntries.length === 0) return this;
  
  const energyLevels = todayEntries.map(e => e.energyLevel);
  const avgEnergy = energyLevels.reduce((sum, e) => sum + e, 0) / energyLevels.length;
  const peakEnergy = Math.max(...energyLevels);
  const lowestEnergy = Math.min(...energyLevels);
  
  // Find peak time
  const peakEntry = todayEntries.find(e => e.energyLevel === peakEnergy);
  const peakTime = peakEntry ? new Date(peakEntry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
  
  // Most common mood
  const moods = todayEntries.map(e => e.mood);
  const mood = moods.sort((a, b) =>
    moods.filter(m => m === a).length - moods.filter(m => m === b).length
  ).pop();
  
  this.energyLog.dailySummaries.push({
    date: new Date(),
    avgEnergy: Math.round(avgEnergy),
    peakEnergy,
    lowestEnergy,
    peakTime,
    totalEntries: todayEntries.length,
    mood,
  });
  
  // Keep only last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  this.energyLog.dailySummaries = this.energyLog.dailySummaries.filter(s => 
    s.date > ninetyDaysAgo
  );
  
  return this;
};

/**
 * Generate AI insights from energy data
 */
UserSchema.methods.generateEnergyInsights = function() {
  const entries = this.energyLog.entries;
  
  if (entries.length < 7) {
    // Not enough data yet
    return this;
  }
  
  // Find peak hours (hours with highest average energy)
  const hourlyEnergy = {};
  entries.forEach(e => {
    const hour = new Date(e.timestamp).getHours();
    if (!hourlyEnergy[hour]) hourlyEnergy[hour] = [];
    hourlyEnergy[hour].push(e.energyLevel);
  });
  
  const hourlyAverages = Object.entries(hourlyEnergy).map(([hour, levels]) => ({
    hour,
    avg: levels.reduce((sum, l) => sum + l, 0) / levels.length,
  }));
  
  hourlyAverages.sort((a, b) => b.avg - a.avg);
  
  const peakHours = hourlyAverages.slice(0, 3).map(h => `${h.hour}:00`);
  const lowHours = hourlyAverages.slice(-3).map(h => `${h.hour}:00`);
  
  // Calculate overall average
  const avgEnergy = entries.reduce((sum, e) => sum + e.energyLevel, 0) / entries.length;
  
  // Generate recommendations
  const recommendations = [];
  if (avgEnergy < 60) {
    recommendations.push('Consider taking more breaks throughout the day');
    recommendations.push('Try scheduling deep work during your peak energy hours');
  }
  if (peakHours.length > 0) {
    recommendations.push(`Schedule important tasks during ${peakHours[0]}-${peakHours[1]}`);
  }
  if (lowHours.length > 0) {
    recommendations.push(`Avoid demanding work during ${lowHours[0]}-${lowHours[1]}`);
  }
  
  this.energyLog.insights = {
    peakHours,
    lowHours,
    averageEnergy: Math.round(avgEnergy),
    recommendations,
    lastUpdated: new Date(),
  };
  
  return this;
};

/**
 * Get time of day
 */
UserSchema.methods.getTimeOfDay = function() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// ============================================
// INDEXES
// ============================================
UserSchema.index({ 'gamification.totalXP': -1 }); // Leaderboard
UserSchema.index({ 'gamification.level': -1 });
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ 'dailyGoals.goals.date': -1 }); // Quick lookup of today's goals
UserSchema.index({ 'energyLog.lastEnergyUpdate': -1 }); // Recent energy logs

const User = mongoose.model('User', UserSchema);

module.exports = User;
