const ActivityLog = require('../models/ActivityLog');
const UserPatterns = require('../models/UserPatterns');

class BurnoutService {
  
  /**
   * Analyze user for burnout signals
   */
  async analyzeBurnout(userId) {
    try {
      const patterns = await UserPatterns.findOne({ userId });
      
      if (!patterns) {
        return {
          level: 'low',
          signals: {},
          riskScore: 0,
          recommendation: null
        };
      }
      
      // Get activity from last 30 days
      const activities = await ActivityLog.getUserActivity(userId, 30);
      
      // Calculate signals
      const signals = {
        workStreak: patterns.consecutiveWorkDays >= 14,
        longHours: patterns.avgHoursPerDay > 8,
        energyDeclining: await this.isEnergyDeclining(userId),
        taskCompletionRate: patterns.taskCompletionRate < 60,
        lateNightWork: patterns.lateNightWorkDays >= 5,
        weekendWork: patterns.weekendWorkDays >= 4
      };
      
      // Calculate risk score
      const riskScore = Object.values(signals).filter(Boolean).length;
      
      // Determine level
      let level = 'low';
      if (riskScore >= 3) level = 'high';
      else if (riskScore >= 2) level = 'medium';
      
      // Get recommendation
      const recommendation = this.getRecommendation(level, signals);
      
      // Get detailed stats
      const stats = {
        consecutiveDays: patterns.consecutiveWorkDays,
        avgHoursPerDay: patterns.avgHoursPerDay,
        lateNightDays: patterns.lateNightWorkDays,
        weekendDays: patterns.weekendWorkDays,
        taskCompletionRate: patterns.taskCompletionRate || 0
      };
      
      return {
        level,
        signals,
        riskScore,
        recommendation,
        stats,
        analyzedAt: new Date()
      };
    } catch (error) {
      console.error('Error analyzing burnout:', error);
      throw error;
    }
  }
  
  /**
   * Check if user's energy is declining
   */
  async isEnergyDeclining(userId) {
    try {
      const activities = await ActivityLog.find({
        userId,
        'metadata.energy': { $exists: true }
      })
      .sort({ timestamp: -1 })
      .limit(20);
      
      if (activities.length < 10) return false;
      
      // Split into recent and older
      const recent = activities.slice(0, 10);
      const older = activities.slice(10, 20);
      
      const recentAvg = recent.reduce((sum, a) => sum + a.metadata.energy, 0) / recent.length;
      const olderAvg = older.reduce((sum, a) => sum + a.metadata.energy, 0) / older.length;
      
      // Energy is declining if recent average is 0.5+ lower than older average
      return recentAvg < (olderAvg - 0.5);
    } catch (error) {
      console.error('Error checking energy trend:', error);
      return false;
    }
  }
  
  /**
   * Get recommendation based on burnout level
   */
  getRecommendation(level, signals) {
    if (level === 'high') {
      const tips = [
        'Take a full recovery day this weekend',
        'Schedule breaks every 2 hours',
        'Set a hard stop time at 6 PM',
        'Delegate some tasks to teammates',
        'Consider taking a short vacation'
      ];
      
      return {
        title: 'High Burnout Risk Detected',
        message: 'You\'ve been working unsustainably. Take action now to prevent burnout.',
        action: tips[Math.floor(Math.random() * tips.length)],
        tips: [
          'Block off recovery time in your calendar',
          'Set realistic expectations with your team',
          'Focus on sleep and exercise this week',
          'Consider talking to a manager or mentor'
        ]
      };
    }
    
    if (level === 'medium') {
      const tips = [
        'Schedule a recovery day this week',
        'Set boundaries on evening work',
        'Take more frequent breaks',
        'Review your workload with your team'
      ];
      
      return {
        title: 'Moderate Burnout Risk',
        message: 'Your work pace is unsustainable. Make some changes to prevent burnout.',
        action: tips[Math.floor(Math.random() * tips.length)],
        tips: [
          'Aim for 7-8 hours of sleep per night',
          'Take at least one full day off this week',
          'Set a "no work after 8 PM" rule',
          'Practice stress-relief activities daily'
        ]
      };
    }
    
    return null; // No recommendation for low risk
  }
  
  /**
   * Get all users at risk of burnout
   */
  async getUsersAtRisk() {
    try {
      // Get all users with patterns
      const patterns = await UserPatterns.find({
        $or: [
          { consecutiveWorkDays: { $gte: 14 } },
          { avgHoursPerDay: { $gt: 8 } },
          { lateNightWorkDays: { $gte: 5 } },
          { weekendWorkDays: { $gte: 4 } }
        ]
      }).populate('userId', 'name email');
      
      const usersAtRisk = [];
      
      for (const pattern of patterns) {
        const analysis = await this.analyzeBurnout(pattern.userId._id);
        
        if (analysis.level === 'high' || analysis.level === 'medium') {
          usersAtRisk.push({
            user: pattern.userId,
            analysis
          });
        }
      }
      
      return usersAtRisk;
    } catch (error) {
      console.error('Error getting users at risk:', error);
      return [];
    }
  }
}

module.exports = new BurnoutService();
