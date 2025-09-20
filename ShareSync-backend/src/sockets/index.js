// src/sockets/index.js
// Socket.IO bootstrap: auth via JWT, user room join, basic join/leave helpers.

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function extractToken(socket) {
  // Prefer auth.token (client sent via io(..., { auth: { token } }))
  let token = socket.handshake?.auth?.token;
  if (token) return token;

  // Fallback: Authorization header: "Bearer <token>"
  const authz = socket.handshake?.headers?.authorization;
  if (authz && authz.startsWith('Bearer ')) {
    return authz.slice('Bearer '.length).trim();
  }
  return null;
}

function decodeUserId(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Support a few token shapes
    return decoded?.user?.id || decoded?.id || decoded?.sub || null;
  } catch {
    return null;
  }
}

/**
 * initSockets(httpServer, { cors })
 * - Attaches io to the HTTP server
 * - Returns `io`
 * - Also expects your Express app to call `app.set('io', io)` so routes can emit.
 */
function initSockets(httpServer, { cors } = {}) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: cors || { origin: true, credentials: true },
    transports: ['websocket'],
  });

  io.use((socket, next) => {
    const token = extractToken(socket);
    if (!token) return next(); // allow anonymous (rooms can still be joined)
    const userId = decodeUserId(token);
    if (userId) socket.data.userId = String(userId);
    return next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;

    // Join user room for live profile updates, etc.
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // FE helper: join/leave arbitrary rooms (e.g., "project:<id>")
    socket.on('join', (payload = {}) => {
      const room = payload.room || payload;
      if (room) socket.join(String(room));
    });

    socket.on('leave', (payload = {}) => {
      const room = payload.room || payload;
      if (room) socket.leave(String(room));
    });

    socket.on('disconnect', () => {
      // no-op for now
    });
  });

  return io;
}

module.exports = { initSockets };
