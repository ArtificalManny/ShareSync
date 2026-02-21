const socketIO = require('socket.io');
const messageHandlers = require('../../socket/messageHandlers');
const realtimeService = require('../../services/realtimeService');

/**
 * Initialize Socket.IO with message handlers + ecosystem real-time
 * @param {Server} httpServer - HTTP server instance
 * @param {object} options - Socket.io options
 * @returns {Server} Socket.io server instance
 */
function initSockets(httpServer, options = {}) {
  const io = socketIO(httpServer, options);
  
  // ⭐ Pass io instance to realtime service for ecosystem broadcasting
  realtimeService.setIO(io);

  // Authentication middleware
  io.use((socket, next) => {
    // Extract token from handshake (if provided)
    const token = socket.handshake.auth?.token;
    const userId = socket.handshake.auth?.userId;
    
    if (token && userId) {
      // Token provided - attach userId to socket
      socket.userId = userId;
      console.log(`[Socket.io] Authenticated connection: ${socket.id} (User: ${userId})`);
    } else {
      // No token - allow connection but log it
      console.log(`[Socket.io] Unauthenticated connection: ${socket.id}`);
    }
    
    next();
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    const userId = socket.userId;

    // ⭐ ECOSYSTEM: Auto-join user's personal room if authenticated
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[Socket.io] User ${userId} joined personal room`);
      
      // Broadcast presence
      socket.broadcast.emit('user:presence', {
        userId,
        online: true,
        timestamp: new Date()
      });
    }

    // ⭐ ECOSYSTEM: Handle project room joining
    socket.on('join:projects', (projectIds) => {
      if (Array.isArray(projectIds)) {
        projectIds.forEach(projectId => {
          socket.join(`project:${projectId}`);
          console.log(`[Socket.io] User ${userId || socket.id} joined project room: ${projectId}`);
        });
      }
    });

    // ⭐ ECOSYSTEM: Handle manual room joining (for flexibility)
    socket.on('join', (data) => {
      const { room } = data;
      if (room) {
        socket.join(room);
        console.log(`[Socket.io] ${socket.id} joined room: ${room}`);
      }
    });

    // ⭐ ECOSYSTEM: Handle manual room leaving
    socket.on('leave', (data) => {
      const { room } = data;
      if (room) {
        socket.leave(room);
        console.log(`[Socket.io] ${socket.id} left room: ${room}`);
      }
    });

    // ⭐ ECOSYSTEM: Handle user activity updates
    socket.on('user:active', () => {
      if (userId) {
        socket.broadcast.emit('user:presence', {
          userId,
          online: true,
          timestamp: new Date()
        });
      }
    });

    // ⭐ ECOSYSTEM: Handle typing indicators
    socket.on('typing:start', (data) => {
      if (data.projectId) {
        socket.to(`project:${data.projectId}`).emit('typing:indicator', {
          userId,
          userName: data.userName,
          typing: true
        });
      }
    });

    socket.on('typing:stop', (data) => {
      if (data.projectId) {
        socket.to(`project:${data.projectId}`).emit('typing:indicator', {
          userId,
          userName: data.userName,
          typing: false
        });
      }
    });

    // ⭐ EXISTING: Register message handlers (PRESERVED)
    messageHandlers(socket, io);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      
      // ⭐ ECOSYSTEM: Broadcast offline presence
      if (userId) {
        socket.broadcast.emit('user:presence', {
          userId,
          online: false,
          timestamp: new Date()
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket.io] Socket error:`, error);
    });
  });

  console.log('✅ Socket.IO initialized with ecosystem features');
  return io;
}

module.exports = { initSockets };