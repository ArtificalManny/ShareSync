/**
 * notificationTriggers.js
 * Integration points for triggering notifications
 */

const {
  createNotification,
  NotificationType,
  notifyTaskAssignee,
  notifyShipCreated,
  notifyBadgeEarned,
  notifyLevelUp,
  notifyStreakMilestone,
} = require('./notifications');

const { sendNotificationToUser } = require('./notificationSocket');

// ============================================
// TASK NOTIFICATIONS
// ============================================

/**
 * Trigger when task is assigned
 */
async function onTaskAssigned(io, { taskId, assigneeId, assignedBy, taskTitle, projectTitle }) {
  const notification = await notifyTaskAssignee(
    taskId,
    assigneeId,
    assignedBy,
    taskTitle,
    projectTitle
  );
  
  if (notification && io) {
    sendNotificationToUser(io, assigneeId, notification);
  }
  
  return notification;
}

/**
 * Trigger when task is completed
 */
async function onTaskCompleted(io, { taskId, completedBy, completedByName, taskTitle, createdBy }) {
  if (createdBy.toString() === completedBy.toString()) {
    return null; // Don't notify if user completed their own task
  }
  
  const notification = await createNotification(
    createdBy,
    NotificationType.TASK_COMPLETED,
    {
      taskId,
      taskTitle,
      completedBy: completedByName,
    }
  );
  
  if (notification && io) {
    sendNotificationToUser(io, createdBy, notification);
  }
  
  return notification;
}

// ============================================
// PROJECT NOTIFICATIONS
// ============================================

/**
 * Trigger when user is invited to project
 */
async function onProjectInvite(io, { userId, invitedBy, invitedByName, projectId, projectTitle }) {
  const notification = await createNotification(
    userId,
    NotificationType.PROJECT_INVITE,
    {
      projectId,
      projectTitle,
      invitedBy: invitedByName,
    }
  );
  
  if (notification && io) {
    sendNotificationToUser(io, userId, notification);
  }
  
  return notification;
}

/**
 * Trigger when member joins project
 */
async function onMemberJoined(io, { projectId, projectTitle, userId, username, memberIds }) {
  const notifications = [];
  
  for (const memberId of memberIds) {
    if (memberId.toString() === userId.toString()) continue;
    
    const notification = await createNotification(
      memberId,
      NotificationType.MEMBER_JOINED,
      {
        projectId,
        projectTitle,
        username,
      }
    );
    
    if (notification && io) {
      sendNotificationToUser(io, memberId, notification);
    }
    
    notifications.push(notification);
  }
  
  return notifications;
}

// ============================================
// SHIP NOTIFICATIONS
// ============================================

/**
 * Trigger when ship is created
 */
async function onShipCreated(io, { projectId, authorId, authorName, description, memberIds }) {
  const notifications = await notifyShipCreated(projectId, authorId, authorName, description);
  
  if (notifications && io) {
    memberIds.forEach((memberId, index) => {
      if (notifications[index]) {
        sendNotificationToUser(io, memberId, notifications[index]);
      }
    });
  }
  
  return notifications;
}

// ============================================
// GAMIFICATION NOTIFICATIONS
// ============================================

/**
 * Trigger when badge is earned
 */
async function onBadgeEarned(io, { userId, badgeName, badgeIcon }) {
  const notification = await notifyBadgeEarned(userId, badgeName, badgeIcon);
  
  if (notification && io) {
    sendNotificationToUser(io, userId, notification);
  }
  
  return notification;
}

/**
 * Trigger when user levels up
 */
async function onLevelUp(io, { userId, level }) {
  const notification = await notifyLevelUp(userId, level);
  
  if (notification && io) {
    sendNotificationToUser(io, userId, notification);
  }
  
  return notification;
}

/**
 * Trigger on streak milestone
 */
async function onStreakMilestone(io, { userId, streak }) {
  const notification = await notifyStreakMilestone(userId, streak);
  
  if (notification && io) {
    sendNotificationToUser(io, userId, notification);
  }
  
  return notification;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  onTaskAssigned,
  onTaskCompleted,
  onProjectInvite,
  onMemberJoined,
  onShipCreated,
  onBadgeEarned,
  onLevelUp,
  onStreakMilestone,
};
