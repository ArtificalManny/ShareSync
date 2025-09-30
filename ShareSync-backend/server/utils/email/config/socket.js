// server/utils/email/config/socket.js
const { Server } = require('socket.io');
const { attachSocketAuth } = require('../middleware/auth');
const { wireChatSockets } = require('../sockets/chat');
// If you have other socket modules, import and wire them here:
// const { wirePostSockets } = require('../sockets/posts');

function configureSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  });

  // Populate socket.data.userId from Bearer token once
  io.use(attachSocketAuth());

  // Wire individual channel handlers
  wireChatSockets(io);
  // wirePostSockets?.(io);

  return io;
}

module.exports = { configureSockets };
