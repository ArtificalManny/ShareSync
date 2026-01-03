const ActivityLog = require('../models/ActivityLog');
const UserPatterns = require('../models/UserPatterns');

class AnalyticsService {
  
  /**
   * Track a user activity
   */
  async trackActivity(userId, action, projectId, metadata = {}) {
    try {
      const activity = await ActivityLog.create({
        userId,
        action,
        projectId,
        metadata,
        timestamp: new Date()
      });
      
      // Trigger async pattern computation if needed
      this.maybeComputePatterns(userId);
      
      return activity;
    } catch (error) {
      console.error('Error tracking activity:', error);
      throw error;
    }
  }
  
  /**
   * Get user patterns (with auto-recompute if stale)
   */
  async getUserPatterns(userId) {
    try {
      let patterns = await UserPatterns.getOrCreate(userId);
      
      // Recompute if stale
      if (patterns.needsRecompute()) {
        patterns = await this.computePatterns(userId);
      }
      
      return patterns;
    } catch (error) {
      console.error('Error getting user patterns:', error);
      throw error;
    }
  }
  
  /**
   * Compute user patterns from activity logs
   */
  async computePatterns(userId) {
    try {
      const activities = await ActivityLog.getUserActivity(userId, 30);
      
      if (activities.length < 5) {
        // Not enough data to compute meaningful patterns
        return UserPatterns.getOrCreate(userId);
      }
      
      // 1. Calculate focus windows
      const focusWindows = await this.calculateFocusWindows(userId, activities);
      
      // 2. Calculate peak hours
      const peakHours = await this.calculatePeakHours(userId, activities);
      
      // 3. Calculate work patterns
      const workPatterns = this.calculateWorkPatterns(activities);
      
      // 4. Calculate energy patterns
      const energyPatterns = this.calculateEnergyPatterns(activities);
      
      // 5. Calculate streak
      const consecutiveWorkDays = await ActivityLog.getConsecutiveWorkDays(userId);
      
      // Update user patterns
      const patterns = await UserPatterns.findOneAndUpdate(
        { userId },
        {
          focusWindows,
          peakHours,
          ...workPatterns,
          ...energyPatterns,
          consecutiveWorkDays,
          lastWorkDay: activities[0]?.timestamp || new Date(),
          longestStreak: Math.max(consecutiveWorkDays, 0),
          lastComputed: new Date(),
          dataPoints: activities.length
        },
        { new: true, upsert: true }
      );
      
      return patterns;
    } catch (error) {
      console.error('Error computing patterns:', error);
      throw error;
    }
  }
  
  /**
   * Calculate focus windows (2-hour blocks of high productivity)
   */
  async calculateFocusWindows(userId, activities) {
    const hourlyActivity = await ActivityLog.getActivityByHour(userId, 30);
    
    if (hourlyActivity.length < 3) return [];
    
    // Calculate average activity count
    const avgCount = hourlyActivity.reduce((sum, h) => sum + h.count, 0) / hourlyActivity.length;
    
    // Find high-productivity hours (above average)
    const productiveHours = hourlyActivity
      .filter(h => h.count > avgCount * 1.2)
      .sort((a, b) => b.count - a.count);
    
    // Group into windows
    const windows = [];
    let currentWindow = null;
    
    for (const hour of productiveHours) {
      if (!currentWindow) {
        currentWindow = {
          start: hour._id,
          end: hour._id + 1,
          productivity: hour.count / avgCount,
          confidence: Math.min(hour.count / 10, 1)
        };
      } else if (hour._id === currentWindow.end || hour._id === currentWindow.end + 1) {
        // Extend window
        currentWindow.end = hour._id + 1;
        currentWindow.productivity = (currentWindow.productivity + hour.count / avgCount) / 2;
      } else {
        // Start new window
        windows.push(currentWindow);
        currentWindow = {
          start: hour._id,
          end: hour._id + 1,
          productivity: hour.count / avgCount,
          confidence: Math.min(hour.count / 10, 1)
        };
      }
    }
    
    if (currentWindow) windows.push(currentWindow);
    
    // Return top 2 windows
    return windows
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 2);
  }
  
  /**
   * Calculate peak hours (top 3 most productive hours)
   */
  async calculatePeakHours(userId, activities) {
    const hourlyActivity = await ActivityLog.getActivityByHour(userId, 30);
    
    return hourlyActivity
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h._id);
  }
  
  /**
   * Calculate general work patterns
   */
  calculateWorkPatterns(activities) {
    const sessions = activities.filter(a => a.action === 'session_start' || a.action === 'session_end');
    
    // Calculate average session duration
    let totalDuration = 0;
    let sessionCount = 0;
    
    for (let i = 0; i < sessions.length - 1; i += 2) {
      if (sessions[i].action === 'session_start' && sessions[i + 1].action === 'session_end') {
        const duration = (sessions[i + 1].timestamp - sessions[i].timestamp) / (1000 * 60);
        totalDuration += duration;
        sessionCount++;
      }
    }
    
    const averageSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 45;
    
    // Calculate preferred task complexity
    const complexityCount = { low: 0, medium: 0, high: 0 };
    activities.forEach(a => {
      if (a.metadata?.complexity) {
        complexityCount[a.metadata.complexity]++;
      }
    });
    
    const preferredTaskComplexity = Object.entries(complexityCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';
    
    // Calculate work days
    const daySet = new Set();
    activities.forEach(a => {
      daySet.add(a.timestamp.getDay());
    });
    const workDays = Array.from(daySet);
    
    // Calculate avg hours per day
    const dayMap = new Map();
    activities.forEach(a => {
      const day = a.timestamp.toDateString();
      dayMap.set(day, (dayMap.get(day) || 0) + (a.metadata?.duration || 0));
    });
    
    const avgHoursPerDay = dayMap.size > 0
      ? Array.from(dayMap.values()).reduce((sum, h) => sum + h, 0) / dayMap.size / 60
      : 0;
    
    // Count late night work (after 11pm)
    const lateNightWorkDays = activities.filter(a => 
      a.timestamp.getHours() >= 23 || a.timestamp.getHours() < 5
    ).length;
    
    // Count weekend work
    const weekendWorkDays = activities.filter(a => {
      const day = a.timestamp.getDay();
      return day === 0 || day === 6;
    }).length;
    
    return {
      averageSessionDuration: Math.round(averageSessionDuration),
      preferredTaskComplexity,
      workDays,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      lateNightWorkDays,
      weekendWorkDays
    };
  }
  
  /**
   * Calculate energy patterns by hour
   */
  calculateEnergyPatterns(activities) {
    const energyByHour = {};
    
    activities.forEach(a => {
      if (a.metadata?.energy) {
        const hour = a.timestamp.getHours();
        if (!energyByHour[hour]) {
          energyByHour[hour] = { sum: 0, count: 0 };
        }
        energyByHour[hour].sum += a.metadata.energy;
        energyByHour[hour].count++;
      }
    });
    
    const energyArray = Object.entries(energyByHour).map(([hour, data]) => ({
      hour: parseInt(hour),
      avgEnergy: Math.round((data.sum / data.count) * 10) / 10
    }));
    
    return { energyByHour: energyArray };
  }
  
  /**
   * Maybe compute patterns (async, don't wait)
   */
  maybeComputePatterns(userId) {
    // Run in background
    setImmediate(async () => {
      try {
        const patterns = await UserPatterns.findOne({ userId });
        if (!patterns || patterns.needsRecompute()) {
          await this.computePatterns(userId);
        }
      } catch (error) {
        console.error('Background pattern computation failed:', error);
      }
    });
  }
  
  /**
   * Get activity summary
   */
  async getActivitySummary(userId, days = 30) {
    const activities = await ActivityLog.getUserActivity(userId, days);
    
    const summary = {
      totalActivities: activities.length,
      shipCount: activities.filter(a => a.action === 'ship').length,
      taskCount: activities.filter(a => a.action === 'task_complete').length,
      projectsActive: new Set(activities.map(a => a.projectId?.toString()).filter(Boolean)).size,
      avgActivitiesPerDay: Math.round(activities.length / days * 10) / 10,
      streak: await ActivityLog.getConsecutiveWorkDays(userId)
    };
    
    return summary;
  }
}

module.exports = new AnalyticsService();
