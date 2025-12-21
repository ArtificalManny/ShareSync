/**
 * notificationSocket.js
 * WebSocket handler for real-time notifications
 */

/**
 * Initialize notification WebSocket handlers
 */
function initializeNotificationSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected for notifications: ${socket.id}`);
    
    // Join user's personal room
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined notification room`);
    });
    
    // Leave user's room
    socket.on('leave', (userId) => {
      socket.leave(userId);
      console.log(`👋 User ${userId} left notification room`);
    });
    
    // Mark notification as read (real-time)
    socket.on('notification:read', async (data) => {
      const { userId, notificationId } = data;
      
      // Broadcast to user's other devices
      io.to(userId).emit('notification:marked-read', { notificationId });
    });
    
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Send notification to user via WebSocket
 */
function sendNotificationToUser(io, userId, notification) {
  if (io) {
    io.to(userId.toString()).emit('notification', notification);
    console.log(`📨 Sent real-time notification to user ${userId}`);
  }
}

/**
 * Send notification to multiple users
 */
function sendNotificationToUsers(io, userIds, notification) {
  if (io) {
    userIds.forEach(userId => {
      io.to(userId.toString()).emit('notification', notification);
    });
    console.log(`📨 Sent notification to ${userIds.length} users`);
  }
}

module.exports = {
  initializeNotificationSocket,
  sendNotificationToUser,
  sendNotificationToUsers,
};
