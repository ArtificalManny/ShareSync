// /ShareSync-backend/server.js
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();

// ***** CONFIG *****
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const FRONTENDS = [
  'http://localhost:54693', // your Vite port (from screenshots)
  'http://localhost:5173',  // Vite default
  'http://localhost:3000',  // fallback
];

// ***** MIDDLEWARE *****
app.use(cors({
  origin: (origin, cb) => cb(null, true), // simple + permissive for dev
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files (local dev)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ***** SOCKET.IO *****
// Attach Socket.IO to the HTTP server and expose on app for routes to use.
const httpServer = http.createServer(app);
const { initSockets } = require('./src/sockets');
const io = initSockets(httpServer, {
  cors: { origin: FRONTENDS, credentials: true },
});
app.set('io', io);

// ***** ROUTES *****
// Users API (profile/xp/streak/badges/highlights)
app.use('/api/users', require('./src/routes/users'));

// Legacy upload alias (keeps existing FE call working)
// POST /api/uploads/avatar → same handler as /api/users/me/avatar
app.use('/api/uploads', require('./src/routes/uploads'));

// ⭐ NEW: Projects API (with tasks & ships)
const projectRoutes = require('./routes/projects');
app.use('/api/projects', projectRoutes);

// ⭐ Messages API (nested under projects)
// This handles: /api/projects/:projectId/messages
const messageRoutes = require('./routes/messages');
app.use('/api/projects/:projectId/messages', messageRoutes);

// ---------------------------------------------------------------------------
// Below: Mock data routes for backwards compatibility (can be removed later)
// ---------------------------------------------------------------------------

// ***** MOCK DATA (LEGACY) *****
let mockUser = {
  _id: 'u_1',
  username: 'manny',
  firstName: 'Manny',
  lastName: '',
  bio: 'Trying to ship daily.',
  publicProfile: true,
  profilePicture: '',
  appearance: { theme: 'system' },
  notifications: { emailActivity: true, emailDigest: true },
  lastLogin: new Date().toISOString(),
};

const mockStats = () => ({
  cadence: { value: 7 },
  onTimeCompletion: { value: 0.82 },
  activeDays: { value: 14 },
  throughputPerWeek: { value: 9 },
  activitySeries: Array.from({ length: 30 }).map((_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 3600 * 1000).toISOString().slice(0, 10),
    count: Math.floor(Math.random() * 5),
  })),
});

const mockActivity = ({ scope }) => ({
  items: [
    {
      _id: 'a1',
      type: 'task',
      icon: 'check',
      summary: scope === 'project' ? 'Completed task "Wire sidebar"' : 'You completed "Wire sidebar"',
      meta: 'Project Alpha',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'a2',
      type: 'update',
      icon: 'message',
      summary: 'Posted an update',
      meta: 'Docs Refresh',
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
  ],
  nextCursor: null,
});

// Legacy mock project endpoints (kept for backwards compatibility)
// NOTE: These will be overridden by the real /api/projects routes above
app.get('/api/projects/quick', (req, res) => {
  // This is now a mock - real projects come from database
  res.json([
    { _id: 'p_1', title: 'Project Alpha' },
    { _id: 'p_2', title: 'Docs Refresh' }
  ]);
});

// User stats (supports ?range=&projectId=)
app.get('/api/users/me/stats', (req, res) => {
  res.json(mockStats());
});

// Legacy alias (if code hits /api/user/me/stats)
app.get('/api/user/me/stats', (req, res) => {
  res.json(mockStats());
});

// Activity feed (user or project scope)
app.get('/api/activity', (req, res) => {
  const scope = req.query.scope || 'user';
  res.json(mockActivity({ scope }));
});

// ***** START *****
httpServer.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Socket.io on path /socket.io`);
  console.log('✅ Project routes registered: /api/projects');
  console.log('✅ Message routes registered: /api/projects/:projectId/messages');
  console.log('✅ Task routes registered: /api/projects/:id/tasks');
  console.log('✅ Ship routes registered: /api/projects/:id/ships');
});
