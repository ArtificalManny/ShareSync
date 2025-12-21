/**
 * notificationController.js
 * Handles notification operations
 */

const User = require('../models/User');
const { 
  createNotification, 
  NotificationType 
} = require('../utils/notifications');

// ============================================
// GET NOTIFICATIONS
// ============================================

/**
 * Get user's notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 50, skip = 0, unreadOnly = false } = req.query;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let notifications = user.notifications;
    
    // Filter unread only if requested
    if (unreadOnly === 'true') {
      notifications = notifications.filter(n => !n.read);
    }
    
    // Pagination
    const paginatedNotifications = notifications.slice(
      parseInt(skip), 
      parseInt(skip) + parseInt(limit)
    );
    
    res.json({
      notifications: paginatedNotifications,
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get unread count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const unreadCount = user.notifications.filter(n => !n.read).length;
    
    res.json({
      unread: unreadCount,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// MARK AS READ
// ============================================

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const notification = user.notifications.id(req.params.notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.read = true;
    await user.save();
    
    res.json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.notifications.forEach(notification => {
      notification.read = true;
    });
    
    await user.save();
    
    res.json({
      message: 'All notifications marked as read',
      total: user.notifications.length,
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// DELETE NOTIFICATION
// ============================================

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const notificationIndex = user.notifications.findIndex(
      n => n._id.toString() === req.params.notificationId
    );
    
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    user.notifications.splice(notificationIndex, 1);
    await user.save();
    
    res.json({
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Clear all notifications
 */
exports.clearAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const count = user.notifications.length;
    user.notifications = [];
    await user.save();
    
    res.json({
      message: 'All notifications cleared',
      deleted: count,
    });
  } catch (error) {
    console.error('Clear all error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// CREATE NOTIFICATION (Admin/System)
// ============================================

/**
 * Create notification (for system/admin use)
 */
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, data, metadata } = req.body;
    
    if (!userId || !type) {
      return res.status(400).json({ message: 'userId and type are required' });
    }
    
    const notification = await createNotification(userId, type, data, metadata);
    
    if (!notification) {
      return res.status(500).json({ message: 'Failed to create notification' });
    }
    
    // Emit real-time notification via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('notification', notification);
    }
    
    res.json({
      message: 'Notification created',
      notification,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

/**
 * Get notification preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get preferences from gamification or create default
    const preferences = user.gamification?.preferences || {
      notifyOnLevelUp: true,
      notifyOnBadge: true,
    };
    
    res.json({
      preferences,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update notification preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { 
      notifyOnLevelUp, 
      notifyOnBadge, 
      notifyOnTaskAssigned,
      notifyOnMention,
      emailNotifications,
    } = req.body;
    
    // Update gamification preferences
    if (!user.gamification.preferences) {
      user.gamification.preferences = {};
    }
    
    if (notifyOnLevelUp !== undefined) {
      user.gamification.preferences.notifyOnLevelUp = notifyOnLevelUp;
    }
    
    if (notifyOnBadge !== undefined) {
      user.gamification.preferences.notifyOnBadge = notifyOnBadge;
    }
    
    // Add custom notification preferences
    if (notifyOnTaskAssigned !== undefined) {
      user.gamification.preferences.notifyOnTaskAssigned = notifyOnTaskAssigned;
    }
    
    if (notifyOnMention !== undefined) {
      user.gamification.preferences.notifyOnMention = notifyOnMention;
    }
    
    if (emailNotifications !== undefined) {
      user.gamification.preferences.emailNotifications = emailNotifications;
    }
    
    await user.save();
    
    res.json({
      message: 'Preferences updated',
      preferences: user.gamification.preferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;
