// server/utils/email/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Express middleware: require a valid Bearer token.
 * Ensures req.user.id is available for downstream controllers.
 */
module.exports = function authRequired(req, res, next) {
  const raw = req.header('Authorization') || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // normalize to req.user.id
    const id = decoded?.user?.id || decoded?.id;
    if (!id) return res.status(401).json({ msg: 'Token missing user id' });
    req.user = { ...(decoded.user || {}), id: String(id) };
    req.userId = String(id);
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

/**
 * OPTIONAL: bind auth to Socket.IO. Call once after creating io:
 *   io.use(attachSocketAuth());
 *
 * It reads Bearer token from `auth.token` or `headers.authorization`,
 * validates it, and sets socket.data.userId.
 */
module.exports.attachSocketAuth = function attachSocketAuth() {
  return (socket, next) => {
    try {
      const hdr = socket.handshake.headers?.authorization || '';
      const authToken = socket.handshake.auth?.token || (hdr.startsWith('Bearer ') ? hdr.slice(7) : null);
      if (!authToken) return next(new Error('unauthorized'));
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      const id = decoded?.user?.id || decoded?.id;
      if (!id) return next(new Error('unauthorized'));
      socket.data.userId = String(id);
      next();
    } catch (e) {
      next(new Error('unauthorized'));
    }
  };
};
