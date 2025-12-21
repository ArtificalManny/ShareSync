/**
 * routes/notifications.js
 * Routes for notification management
 */

const express = require('express');
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  createNotification,
  getPreferences,
  updatePreferences,
} = require('../controllers/notificationController');

// Require auth middleware
let requireAuth;
try { requireAuth = require('../middleware/auth'); } catch { requireAuth = require('../auth'); }

// All routes require authentication
router.use(requireAuth);

// ============================================
// NOTIFICATION ROUTES
// ============================================

// GET /api/notifications - Get user's notifications
router.get('/', getNotifications);

// GET /api/notifications/unread - Get unread count
router.get('/unread', getUnreadCount);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', markAllAsRead);

// DELETE /api/notifications/clear - Clear all notifications
router.delete('/clear', clearAll);

// PUT /api/notifications/:notificationId/read - Mark as read
router.put('/:notificationId/read', markAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', deleteNotification);

// POST /api/notifications - Create notification (admin/system)
router.post('/', createNotification);

// ============================================
// PREFERENCES ROUTES
// ============================================

// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences/settings', getPreferences);

// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences/settings', updatePreferences);

module.exports = router;
