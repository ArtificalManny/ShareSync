// /ShareSync-backend/server.js - OPTIMIZED & PRODUCTION-READY
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// ***** PERFORMANCE MONITORING *****
const { requestTimer } = require('./middleware/performanceMonitor');

// ***** RATE LIMITING *****
const { 
  apiLimiter, 
  authLimiter, 
  uploadLimiter, 
  searchLimiter,
  notificationLimiter 
} = require('./middleware/rateLimiter');

// ***** CONFIG *****
const PORT = process.env.PORT || 5000;

// ***** SECURITY - HELMET *****
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable for development
}));

// ***** COMPRESSION *****
app.use(compression());

// ***** PERFORMANCE MONITORING *****
app.use(requestTimer);

// ***** CORS - MUST BE FIRST *****
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight
app.options('*', cors());

// ***** MIDDLEWARE *****
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ***** HEALTH CHECK *****
app.get('/health', (req, res) => {
  const { getPerformanceMetrics } = require('./middleware/performanceMonitor');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// ***** TEST ENDPOINT *****
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ***** SOCKET.IO *****
const httpServer = http.createServer(app);
const { initSockets } = require('./src/sockets');
const io = initSockets(httpServer, {
  cors: { origin: true, credentials: true },
});
app.set('io', io);

// ***** ROUTES WITH RATE LIMITING *****

// Auth routes (strict rate limiting)
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authLimiter, authRoutes);
  console.log('✅ Auth routes loaded (rate limited: 5 req/15min)');
} catch (e) {
  console.log('⚠️ Auth routes not loaded:', e.message);
}

// User routes
try {
  app.use('/api/users', apiLimiter, require('./src/routes/users'));
  console.log('✅ Users routes loaded (rate limited: 100 req/15min)');
} catch (e) {
  console.log('⚠️ Users routes not loaded:', e.message);
}

// ⭐ SETTINGS ROUTES (The Missing Link!)
try {
  const settingsRoutes = require('./routes/settings');
  app.use('/api/settings', apiLimiter, settingsRoutes);
  console.log('✅ Settings routes loaded');
} catch (e) {
  console.log('⚠️ Settings routes not loaded:', e.message);
}

// Upload routes (strict rate limiting)
try {
  app.use('/api/uploads', uploadLimiter, require('./src/routes/uploads'));
  console.log('✅ Uploads routes loaded (rate limited: 10 uploads/hour)');
} catch (e) {
  console.log('⚠️ Uploads routes not loaded:', e.message);
}

// Search routes (moderate rate limiting)
try {
  app.use('/api/search', searchLimiter, require('./routes/search'));
  console.log('✅ Search routes loaded (rate limited: 50 req/min)');
} catch (e) {
  console.log('⚠️ Search routes not loaded:', e.message);
}

// Notification routes
try {
  app.use('/api/notifications', notificationLimiter, require('./routes/notifications'));
  console.log('✅ Notifications routes loaded (rate limited: 20 req/min)');
} catch (e) {
  console.log('⚠️ Notifications routes not loaded:', e.message);
}

// Analytics routes (EXISTING - kept as is)
try {
  app.use('/api/analytics', apiLimiter, require('./routes/analytics'));
  console.log('✅ Analytics routes loaded');
} catch (e) {
  console.log('⚠️ Analytics routes not loaded:', e.message);
}

// ⭐ WEEK 6: AI Routes (NEW)
try {
  const aiRoutes = require('./routes/ai');
  app.use('/api/ai', apiLimiter, aiRoutes);
  console.log('✅ AI routes loaded (Week 6 Ecosystem)');
} catch (e) {
  console.log('⚠️ AI routes not loaded:', e.message);
}

// ⭐ WEEK 6: Ecosystem Routes (NEW)
try {
  const ecosystemRoutes = require('./routes/ecosystem');
  app.use('/api/ecosystem', apiLimiter, ecosystemRoutes);
  console.log('✅ Ecosystem routes loaded (Week 6)');
} catch (e) {
  console.log('⚠️ Ecosystem routes not loaded:', e.message);
}

// ⭐ Priority 3.4: Pulse Check Routes
try {
  const pulseRoutes = require('./src/routes/pulse');
  app.use('/api/pulse', apiLimiter, pulseRoutes);
  console.log('✅ Pulse Check routes loaded (Priority 3.4)');
} catch (e) {
  console.log('⚠️ Pulse Check routes not loaded:', e.message);
}

const focusRoutes = require('./src/routes/focus');
app.use('/api/focus', apiLimiter, focusRoutes);

// ⭐ Priority 4.1: Persona Mode Routes
try {
  const personaRoutes = require('./src/routes/persona');
  app.use('/api/users', apiLimiter, personaRoutes);
  console.log('✅ Persona routes loaded (Priority 4.1)');
} catch (e) {
  console.log('⚠️ Persona routes not loaded:', e.message);
}

// Project routes
try {
  const projectRoutes = require('./routes/projects');
  app.use('/api/projects', apiLimiter, projectRoutes);
  console.log('✅ Projects routes loaded');
} catch (e) {
  console.log('❌ Projects routes FAILED:', e.message);
}

// Message routes
try {
  const messageRoutes = require('./routes/messages');
  app.use('/api/projects/:projectId/messages', apiLimiter, messageRoutes);
  console.log('✅ Messages routes loaded');
} catch (e) {
  console.log('❌ Messages routes FAILED:', e.message);
}

// Member routes
try {
  app.use('/api/projects/:projectId/members', apiLimiter, require('./routes/members'));
  console.log('✅ Members routes loaded');
} catch (e) {
  console.log('⚠️ Members routes not loaded:', e.message);
}

// ***** LEGACY MOCK ROUTES (for development) *****
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/projects/quick', (req, res) => {
    res.json([
      { _id: 'p_1', title: 'Mock Project 1' },
      { _id: 'p_2', title: 'Mock Project 2' }
    ]);
  });

  app.get('/api/users/me/stats', (req, res) => {
    res.json({
      cadence: { value: 7 },
      onTimeCompletion: { value: 0.82 },
      activeDays: { value: 14 },
      throughputPerWeek: { value: 9 },
      activitySeries: []
    });
  });

  app.get('/api/activity', (req, res) => {
    res.json({
      items: [
        {
          _id: 'a1',
          type: 'task',
          icon: 'check',
          summary: 'Test activity',
          createdAt: new Date().toISOString()
        }
      ]
    });
  });
}

// ***** 404 HANDLER *****
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// ***** ERROR HANDLER *****
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  // Don't leak error details in production
  const errorResponse = {
    message: process.env.NODE_ENV === 'production' 
      ? 'Server error' 
      : err.message,
  };
  
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// ⭐ WEEK 6: Start Burnout Detection Cron Job (NEW)
try {
  const startBurnoutDetection = require('./jobs/burnoutDetection');
  startBurnoutDetection();
  console.log('✅ Burnout detection cron job initialized');
} catch (e) {
  console.log('⚠️ Burnout detection cron job not loaded:', e.message);
}

// ***** START SERVER *****
httpServer.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(70));
  console.log('🚀 ShareSync Backend Server - OPTIMIZED + WEEK 6 ECOSYSTEM');
  console.log('='.repeat(70));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔌 Socket: ws://localhost:${PORT}/socket.io`);
  console.log(`🌐 CORS: ${process.env.NODE_ENV === 'production' ? 'RESTRICTED' : 'ENABLED (all origins)'}`);
  console.log(`🔒 Security: Helmet enabled`);
  console.log(`⚡ Compression: Enabled`);
  console.log(`🛡️  Rate Limiting: Active`);
  console.log(`📊 Performance Monitoring: Active`);
  console.log(`🧠 AI Recommendations: Active`);
  console.log(`🏥 Burnout Detection: Active (daily 6 AM)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(70));
  console.log('');
  
  // Run database indexes on startup (optional)
  if (process.env.CREATE_INDEXES === 'true') {
    console.log('🔧 Creating database indexes...');
    require('./scripts/create-indexes')();
  }
});

// ***** GRACEFUL SHUTDOWN *****
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
