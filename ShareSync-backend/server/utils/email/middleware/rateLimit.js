// server/utils/email/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const sendMessageLimiter = rateLimit({
  windowMs: 60_000, // 1 min
  max: 60,          // 60 messages/min/user
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

const summarizeLimiter = rateLimit({
  windowMs: 60_000,
  max: 6, // 6 summaries/min
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { sendMessageLimiter, summarizeLimiter };
