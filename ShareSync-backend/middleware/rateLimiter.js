/**
 * rateLimiter.js
 * Rate limiting middleware to prevent abuse
 */

const rateLimit = require('express-rate-limit');

// ============================================
// GENERAL API RATE LIMITER
// ============================================

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// ============================================
// AUTH RATE LIMITER (STRICT)
// ============================================

/**
 * Auth rate limiter (login, register)
 * 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// ============================================
// FILE UPLOAD RATE LIMITER
// ============================================

/**
 * File upload rate limiter
 * 10 uploads per hour
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: 'Too many file uploads, please try again later.',
});

// ============================================
// SEARCH RATE LIMITER
// ============================================

/**
 * Search rate limiter
 * 50 requests per minute
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 search requests per minute
  message: 'Too many search requests, please slow down.',
});

// ============================================
// NOTIFICATION RATE LIMITER
// ============================================

/**
 * Notification creation rate limiter
 * 20 requests per minute
 */
const notificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit to 20 notification creations per minute
  message: 'Too many notification requests, please slow down.',
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  searchLimiter,
  notificationLimiter,
};
