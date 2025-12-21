/**
 * notifications.js
 * Notification creation and delivery utilities
 */

const User = require('../models/User');

// ============================================
// NOTIFICATION TYPES
// ============================================

const NotificationType = {
  // Tasks
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  TASK_COMMENT: 'task_comment',
  TASK_DUE_SOON: 'task_due_soon',
  
  // Projects
  PROJECT_INVITE: 'project_invite',
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
  
  // Activity
  SHIP_CREATED: 'ship_created',
  MENTION: 'mention',
  
  // Gamification
  BADGE_EARNED: 'badge_earned',
  LEVEL_UP: 'level_up',
  STREAK_MILESTONE: 'streak_milestone',
  ACHIEVEMENT_COMPLETE: 'achievement_complete',
  
  // System
  SYSTEM_UPDATE: 'system_update',
  WELCOME: 'welcome',
};

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

/**
 * Generate notification message based on type
 */
function generateNotificationMessage(type, data) {
  const templates = {
    [NotificationType.TASK_ASSIGNED]: (d) => 
      `${d.assignedBy} assigned you a task: "${d.taskTitle}"`,
    
    [NotificationType.TASK_COMPLETED]: (d) => 
      `${d.completedBy} completed the task: "${d.taskTitle}"`,
    
    [NotificationType.TASK_COMMENT]: (d) => 
      `${d.commenter} commented on "${d.taskTitle}"`,
    
    [NotificationType.TASK_DUE_SOON]: (d) => 
      `Task "${d.taskTitle}" is due ${d.dueIn}`,
    
    [NotificationType.PROJECT_INVITE]: (d) => 
      `${d.invitedBy} invited you to join "${d.projectTitle}"`,
    
    [NotificationType.MEMBER_JOINED]: (d) => 
      `${d.username} joined "${d.projectTitle}"`,
    
    [NotificationType.MEMBER_LEFT]: (d) => 
      `${d.username} left "${d.projectTitle}"`,
    
    [NotificationType.SHIP_CREATED]: (d) => 
      `${d.author} shipped: "${d.description}"`,
    
    [NotificationType.MENTION]: (d) => 
      `${d.mentionedBy} mentioned you in "${d.context}"`,
    
    [NotificationType.BADGE_EARNED]: (d) => 
      `🎖️ You earned the "${d.badgeName}" badge!`,
    
    [NotificationType.LEVEL_UP]: (d) => 
      `🎉 Congratulations! You reached level ${d.level}!`,
    
    [NotificationType.STREAK_MILESTONE]: (d) => 
      `🔥 Amazing! ${d.streak}-day streak achieved!`,
    
    [NotificationType.ACHIEVEMENT_COMPLETE]: (d) => 
      `🏆 Achievement unlocked: "${d.achievementName}"`,
    
    [NotificationType.SYSTEM_UPDATE]: (d) => 
      d.message,
    
    [NotificationType.WELCOME]: (d) => 
      `Welcome to ShareSync, ${d.username}! 🚀`,
  };
  
  const template = templates[type];
  return template ? template(data) : 'You have a new notification';
}

// ============================================
// CREATE NOTIFICATION
// ============================================

/**
 * Create notification for user
 */
async function createNotification(userId, type, data, metadata = {}) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`User ${userId} not found for notification`);
      return null;
    }
    
    // Generate message
    const message = generateNotificationMessage(type, data);
    
    // Create notification object
    const notification = {
      message,
      type,
      data,
      metadata,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    // Add to user's notifications
    user.notifications.unshift(notification); // Add to beginning
    
    // Keep only last 100 notifications
    if (user.notifications.length > 100) {
      user.notifications = user.notifications.slice(0, 100);
    }
    
    await user.save();
    
    console.log(`📬 Notification created for ${user.username}: ${type}`);
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

/**
 * Create notifications for multiple users
 */
async function createNotifications(userIds, type, data, metadata = {}) {
  const notifications = await Promise.all(
    userIds.map(userId => createNotification(userId, type, data, metadata))
  );
  
  return notifications.filter(n => n !== null);
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Notify project members
 */
async function notifyProjectMembers(projectId, excludeUserId, type, data) {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);
    
    if (!project) return [];
    
    // Get all member IDs except excluded user
    const memberIds = [
      project.owner.toString(),
      ...project.members.map(m => m.user.toString()),
    ].filter(id => id !== excludeUserId?.toString());
    
    return await createNotifications(memberIds, type, data);
  } catch (error) {
    console.error('Notify project members error:', error);
    return [];
  }
}

/**
 * Notify task assignee
 */
async function notifyTaskAssignee(taskId, assigneeId, assignedBy, taskTitle, projectTitle) {
  return await createNotification(assigneeId, NotificationType.TASK_ASSIGNED, {
    taskId,
    taskTitle,
    projectTitle,
    assignedBy,
  });
}

/**
 * Notify on ship creation
 */
async function notifyShipCreated(projectId, authorId, authorName, description) {
  return await notifyProjectMembers(
    projectId,
    authorId,
    NotificationType.SHIP_CREATED,
    { author: authorName, description }
  );
}

/**
 * Notify on badge earned
 */
async function notifyBadgeEarned(userId, badgeName, badgeIcon) {
  return await createNotification(userId, NotificationType.BADGE_EARNED, {
    badgeName,
    badgeIcon,
  });
}

/**
 * Notify on level up
 */
async function notifyLevelUp(userId, level) {
  return await createNotification(userId, NotificationType.LEVEL_UP, {
    level,
  });
}

/**
 * Notify on streak milestone
 */
async function notifyStreakMilestone(userId, streak) {
  if (streak === 7 || streak === 30 || streak === 100 || streak % 100 === 0) {
    return await createNotification(userId, NotificationType.STREAK_MILESTONE, {
      streak,
    });
  }
  return null;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  NotificationType,
  createNotification,
  createNotifications,
  notifyProjectMembers,
  notifyTaskAssignee,
  notifyShipCreated,
  notifyBadgeEarned,
  notifyLevelUp,
  notifyStreakMilestone,
  generateNotificationMessage,
};
