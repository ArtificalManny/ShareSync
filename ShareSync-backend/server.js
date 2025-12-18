// /ShareSync-backend/server.js - SIMPLIFIED
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();

// ***** CONFIG *****
const PORT = 5000;

// ***** CORS - MUST BE FIRST *****
app.use(cors({
  origin: true, // Allow all origins for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight
app.options('*', cors());

// ***** MIDDLEWARE *****
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ***** TEST ENDPOINT *****
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', cors: 'enabled' });
});

// ***** SOCKET.IO *****
const httpServer = http.createServer(app);
const { initSockets } = require('./src/sockets');
const io = initSockets(httpServer, {
  cors: { origin: true, credentials: true },
});
app.set('io', io);

// ***** ROUTES *****
try {
  app.use('/api/users', require('./src/routes/users'));
  console.log('✅ Users routes loaded');
} catch (e) {
  console.log('⚠️ Users routes not loaded:', e.message);
}

try {
  app.use('/api/uploads', require('./src/routes/uploads'));
  console.log('✅ Uploads routes loaded');
} catch (e) {
  console.log('⚠️ Uploads routes not loaded:', e.message);
}

try {
  const projectRoutes = require('./routes/projects');
  app.use('/api/projects', projectRoutes);
  console.log('✅ Projects routes loaded');
} catch (e) {
  console.log('❌ Projects routes FAILED:', e.message);
  console.log('Stack:', e.stack);
}

try {
  const messageRoutes = require('./routes/messages');
  app.use('/api/projects/:projectId/messages', messageRoutes);
  console.log('✅ Messages routes loaded');
} catch (e) {
  console.log('❌ Messages routes FAILED:', e.message);
}

// ***** LEGACY MOCK ROUTES *****
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

// ***** ERROR HANDLER *****
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// ***** START *****
httpServer.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🚀 ShareSync Backend Server');
  console.log('='.repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔌 Socket: ws://localhost:${PORT}/socket.io`);
  console.log(`🌐 CORS: ENABLED (all origins for debugging)`);
  console.log('='.repeat(60));
  console.log('');
});
