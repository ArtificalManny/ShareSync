// src/sockets/index.js
const socketIO = require('socket.io');
const messageHandlers = require('../../socket/messageHandlers');

/**
 * Initialize Socket.IO with message handlers
 * @param {Server} httpServer - HTTP server instance
 * @param {object} options - Socket.io options
 * @returns {Server} Socket.io server instance
 */
function initSockets(httpServer, options = {}) {
  const io = socketIO(httpServer, options);

  // Authentication middleware (optional)
  io.use((socket, next) => {
    // You can add JWT verification here if needed
    // For now, allow all connections
    console.log(`[Socket.io] New connection attempt: ${socket.id}`);
    next();
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Register message handlers
    messageHandlers(socket, io);

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket.io] Socket error:`, error);
    });
  });

  return io;
}

module.exports = { initSockets };
