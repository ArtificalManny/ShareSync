// backend/socket/messageHandlers.js
const Message = require('../models/Message');

/**
 * Register message-related socket event handlers
 * @param {Socket} socket - Individual socket connection
 * @param {Server} io - Socket.io server instance
 */
module.exports = (socket, io) => {
  
  /**
   * User joins a project room
   * This allows them to receive real-time updates for that project
   */
  socket.on('join:project', async ({ projectId, userId }) => {
    try {
      console.log(`[Socket] User ${userId} joining project ${projectId}`);
      
      // Join the project room
      socket.join(`project:${projectId}`);
      
      // Store project context on socket
      socket.projectId = projectId;
      socket.userId = userId;
      
      // Notify others in the project that someone joined
      socket.to(`project:${projectId}`).emit('user:joined', {
        userId,
        timestamp: new Date().toISOString()
      });
      
      // Send confirmation to the user
      socket.emit('join:success', { projectId });
      
    } catch (error) {
      console.error('[Socket] join:project error:', error);
      socket.emit('error', { message: 'Failed to join project' });
    }
  });

  /**
   * User leaves a project room
   */
  socket.on('leave:project', async ({ projectId, userId }) => {
    try {
      console.log(`[Socket] User ${userId} leaving project ${projectId}`);
      
      socket.leave(`project:${projectId}`);
      
      // Notify others
      socket.to(`project:${projectId}`).emit('user:left', {
        userId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('[Socket] leave:project error:', error);
    }
  });

  /**
   * New message sent - broadcast to all in project
   * This is triggered by the HTTP POST endpoint after saving to DB
   */
  socket.on('message:new', async (messageData) => {
    try {
      const { projectId, message } = messageData;
      
      console.log(`[Socket] Broadcasting new message in project ${projectId}`);
      
      // Broadcast to everyone in the project EXCEPT the sender
      socket.to(`project:${projectId}`).emit('message:new', message);
      
    } catch (error) {
      console.error('[Socket] message:new error:', error);
    }
  });

  /**
   * Message updated - broadcast to all in project
   */
  socket.on('message:updated', async (messageData) => {
    try {
      const { projectId, message } = messageData;
      
      console.log(`[Socket] Broadcasting message update in project ${projectId}`);
      
      socket.to(`project:${projectId}`).emit('message:updated', message);
      
    } catch (error) {
      console.error('[Socket] message:updated error:', error);
    }
  });

  /**
   * Message deleted - broadcast to all in project
   */
  socket.on('message:deleted', async (messageData) => {
    try {
      const { projectId, messageId } = messageData;
      
      console.log(`[Socket] Broadcasting message deletion in project ${projectId}`);
      
      socket.to(`project:${projectId}`).emit('message:deleted', { messageId });
      
    } catch (error) {
      console.error('[Socket] message:deleted error:', error);
    }
  });

  /**
   * Reaction added - broadcast to all in project
   */
  socket.on('reaction:added', async (reactionData) => {
    try {
      const { projectId, messageId, reaction } = reactionData;
      
      console.log(`[Socket] Broadcasting reaction added to message ${messageId}`);
      
      socket.to(`project:${projectId}`).emit('reaction:added', {
        messageId,
        reaction
      });
      
    } catch (error) {
      console.error('[Socket] reaction:added error:', error);
    }
  });

  /**
   * Reaction removed - broadcast to all in project
   */
  socket.on('reaction:removed', async (reactionData) => {
    try {
      const { projectId, messageId, emoji, userId } = reactionData;
      
      console.log(`[Socket] Broadcasting reaction removed from message ${messageId}`);
      
      socket.to(`project:${projectId}`).emit('reaction:removed', {
        messageId,
        emoji,
        userId
      });
      
    } catch (error) {
      console.error('[Socket] reaction:removed error:', error);
    }
  });

  /**
   * Message resolved - broadcast to all in project
   */
  socket.on('message:resolved', async (resolveData) => {
    try {
      const { projectId, messageId, resolvedBy } = resolveData;
      
      console.log(`[Socket] Broadcasting message ${messageId} resolved`);
      
      socket.to(`project:${projectId}`).emit('message:resolved', {
        messageId,
        resolvedBy,
        resolvedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('[Socket] message:resolved error:', error);
    }
  });

  /**
   * Typing indicator - user is typing
   */
  socket.on('typing:start', async ({ projectId, userId, userName }) => {
    try {
      console.log(`[Socket] User ${userName} started typing in project ${projectId}`);
      
      // Broadcast to everyone EXCEPT the typer
      socket.to(`project:${projectId}`).emit('typing:start', {
        userId,
        userName
      });
      
    } catch (error) {
      console.error('[Socket] typing:start error:', error);
    }
  });

  /**
   * Typing indicator - user stopped typing
   */
  socket.on('typing:stop', async ({ projectId, userId }) => {
    try {
      console.log(`[Socket] User ${userId} stopped typing in project ${projectId}`);
      
      socket.to(`project:${projectId}`).emit('typing:stop', { userId });
      
    } catch (error) {
      console.error('[Socket] typing:stop error:', error);
    }
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    
    // Notify project members if user was in a project
    if (socket.projectId && socket.userId) {
      socket.to(`project:${socket.projectId}`).emit('user:left', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    }
  });
};
