// server/middleware/flags.js

/**
 * Create a middleware that gates routes behind a boolean env flag.
 * Usage:
 *   const { requireFlag } = require('../middleware/flags');
 *   router.post('/projects/:id/mentor/predict', requireFlag('AI_MENTOR'), predict);
 *
 * Env:
 *   AI_MENTOR=true|false
 *
 * Dev override (only if NODE_ENV!=='production'):
 *   Header: x-flags: {"AI_MENTOR":true}
 */
function parseBool(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
    return false;
  }
  
  function getFlagFromEnv(name) {
    return parseBool(process.env[name]);
  }
  
  function getOverrideFromHeader(req, name) {
    if (process.env.NODE_ENV === 'production') return null;
    try {
      const raw = req.headers['x-flags'];
      if (!raw) return null;
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (obj && Object.prototype.hasOwnProperty.call(obj, name)) {
        return parseBool(obj[name]);
      }
    } catch (_) {
      // ignore bad header
    }
    return null;
  }
  
  function isEnabled(req, name) {
    const override = getOverrideFromHeader(req, name);
    if (override !== null) return override;
    return getFlagFromEnv(name);
  }
  
  /** Middleware factory */
  function requireFlag(name) {
    return (req, res, next) => {
      if (isEnabled(req, name)) return next();
      return res.status(404).json({ error: 'Not found' }); // hide behind 404
    };
  }
  
  module.exports = {
    requireFlag,
    isEnabled,
  };
  