/**
 * Real-time Ecosystem Service
 * Broadcasts events via Socket.IO
 */

class RealtimeService {
  constructor() {
    this.io = null;
  }
  
  /**
   * Initialize Socket.IO instance
   */
  setIO(io) {
    this.io = io;
    console.log('✅ Real-time service initialized');
  }
  
  /**
   * Broadcast ship event
   */
  broadcastShip(shipData) {
    if (!this.io) return;
    
    const { userId, projectId, userName, shipDescription, xp } = shipData;
    
    // Emit to project room
    if (projectId) {
      this.io.to(`project:${projectId}`).emit('team:ship', {
        userId,
        userName,
        shipDescription,
        xp,
        timestamp: new Date()
      });
    }
    
    // Emit to user's personal room
    this.io.to(`user:${userId}`).emit('personal:ship', {
      shipDescription,
      xp,
      timestamp: new Date()
    });
    
    console.log(`📡 Broadcasted ship: ${shipDescription} by ${userName}`);
  }
  
  /**
   * Broadcast task completion
   */
  broadcastTaskComplete(taskData) {
    if (!this.io) return;
    
    const { userId, projectId, userName, taskTitle, xp } = taskData;
    
    if (projectId) {
      this.io.to(`project:${projectId}`).emit('team:task-complete', {
        userId,
        userName,
        taskTitle,
        xp,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Broadcast milestone reached
   */
  broadcastMilestone(milestoneData) {
    if (!this.io) return;
    
    const { userId, type, count, badge } = milestoneData;
    
    this.io.to(`user:${userId}`).emit('user:milestone', {
      type,
      count,
      badge,
      message: `You hit a ${count}-${type} milestone!`,
      timestamp: new Date()
    });
    
    console.log(`🎉 Milestone: ${type} - ${count} for user ${userId}`);
  }
  
  /**
   * Broadcast streak update
   */
  broadcastStreak(streakData) {
    if (!this.io) return;
    
    const { userId, days, milestone } = streakData;
    
    this.io.to(`user:${userId}`).emit('user:streak', {
      days,
      milestone,
      message: `${days}-day streak! Keep it going!`,
      timestamp: new Date()
    });
  }
  
  /**
   * Broadcast project risk alert
   */
  broadcastRiskAlert(riskData) {
    if (!this.io) return;
    
    const { userId, projectId, projectName, deadline, progress } = riskData;
    
    this.io.to(`user:${userId}`).emit('project:risk', {
      projectId,
      projectName,
      deadline,
      progress,
      message: 'Deadline approaching',
      timestamp: new Date()
    });
  }
  
  /**
   * Broadcast user online/offline
   */
  broadcastPresence(presenceData) {
    if (!this.io) return;
    
    const { userId, userName, online, projectIds } = presenceData;
    
    // Broadcast to all project rooms user is member of
    if (projectIds && projectIds.length > 0) {
      projectIds.forEach(projectId => {
        this.io.to(`project:${projectId}`).emit('teammate:presence', {
          userId,
          userName,
          online,
          timestamp: new Date()
        });
      });
    }
  }
  
  /**
   * Broadcast burnout alert
   */
  broadcastBurnoutAlert(burnoutData) {
    if (!this.io) return;
    
    const { userId, level, recommendation } = burnoutData;
    
    this.io.to(`user:${userId}`).emit('user:burnout-alert', {
      level,
      recommendation,
      timestamp: new Date()
    });
    
    console.log(`⚠️  Burnout alert (${level}) sent to user ${userId}`);
  }
  
  /**
   * Broadcast ecosystem update (for status bar)
   */
  broadcastEcosystemUpdate(userId, stats) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('ecosystem:update', {
      stats,
      timestamp: new Date()
    });
  }
}

module.exports = new RealtimeService();
