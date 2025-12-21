/**
 * errorMonitoring.js
 * Error monitoring and tracking (Sentry integration)
 */

/**
 * To enable Sentry:
 * 1. npm install @sentry/node
 * 2. Sign up at sentry.io
 * 3. Add SENTRY_DSN to .env
 * 4. Uncomment code below
 */

/*
const Sentry = require('@sentry/node');

// Initialize Sentry
function initSentry(app) {
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured');
    return;
  }
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
  });
  
  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
  
  console.log('✅ Sentry initialized');
}

// Error handler must be before any other error middleware
function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

// Manually capture errors
function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Capture message
function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level);
}

module.exports = {
  initSentry,
  sentryErrorHandler,
  captureError,
  captureMessage,
};
*/

// Placeholder functions when Sentry is not configured
module.exports = {
  initSentry: () => console.log('⚠️  Sentry not configured'),
  sentryErrorHandler: () => (err, req, res, next) => next(err),
  captureError: (error) => console.error('Error:', error),
  captureMessage: (message) => console.log('Message:', message),
};
