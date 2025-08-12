// This middleware will never block the request.
// You can extend it later to decode a token if needed.
function optionalAuth(req, _res, next) {
    // Example if you want to try decoding later:
    // const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    // if (token) { try { req.user = verify(token) } catch (_) {} }
    next();
  }
  
  module.exports = { optionalAuth };
  