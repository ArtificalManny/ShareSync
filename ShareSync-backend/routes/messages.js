// backend/routes/messages.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: mergeParams for nested routes
const {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  resolveMessage,
  unresolveMessage,
  getUnreadCount,
  markAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Message CRUD
router.route('/')
  .get(getMessages)        // GET /api/projects/:projectId/messages
  .post(createMessage);    // POST /api/projects/:projectId/messages

router.route('/:messageId')
  .put(updateMessage)      // PUT /api/projects/:projectId/messages/:messageId
  .delete(deleteMessage);  // DELETE /api/projects/:projectId/messages/:messageId

// Reactions
router.post('/:messageId/reactions', addReaction);                    // POST
router.delete('/:messageId/reactions/:emoji', removeReaction);        // DELETE

// Resolve (Questions)
router.post('/:messageId/resolve', resolveMessage);                   // POST
router.delete('/:messageId/resolve', unresolveMessage);               // DELETE

// Read receipts
router.get('/unread', getUnreadCount);                                // GET
router.post('/:messageId/read', markAsRead);                          // POST

module.exports = router;
