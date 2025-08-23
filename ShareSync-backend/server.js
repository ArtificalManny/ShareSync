// /ShareSync-backend/server.js
const express = require('express');
const cors = require('cors');

const app = express();

// ***** CONFIG *****
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const FRONTENDS = [
  'http://localhost:54693', // your Vite port shown in screenshots
  'http://localhost:5173',  // common default Vite port
  'http://localhost:3000',  // just in case
];

// ***** MIDDLEWARE *****
app.use(cors({
  origin: (origin, cb) => cb(null, true), // keep simple in dev
  credentials: true,
}));
app.use(express.json());

// ***** IN-MEMORY MOCK DATA *****
let mockUser = {
  _id: 'u_1',
  username: 'manny',
  firstName: 'Manny',
  lastName: '',
  bio: 'Trying to ship daily.',
  publicProfile: true,
  profilePicture: '',
  appearance: { theme: 'system' },             // 'system' | 'light' | 'dark'
  notifications: { emailActivity: true, emailDigest: true },
  lastLogin: new Date().toISOString(),
};

let mockProjects = [
  {
    _id: 'p_1',
    title: 'Project Alpha',
    description: 'Kickoff milestones',
    status: 'Active',
    privacy: 'private',
    members: [{ _id: 'u_1', username: 'manny', firstName: 'Manny' }],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'p_2',
    title: 'Docs Refresh',
    description: 'Polish and publish',
    status: 'Active',
    privacy: 'public',
    members: [{ _id: 'u_1', username: 'manny', firstName: 'Manny' }],
    createdAt: new Date().toISOString(),
  },
];

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
      summary: scope === 'project' ? 'Completed task “Wire sidebar”' : 'You completed “Wire sidebar”',
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

// ***** ROUTES *****
// Users (/api prefix is important for your frontend)
const usersRouter = require('./src/api/user');  // file below
app.use('/api', usersRouter);

// Projects (list + create)
app.get('/api/projects', (req, res) => {
  res.json(mockProjects);
});

app.post('/api/projects/create', (req, res) => {
  const { title, description, status = 'Active', privacy = 'private', members = [] } = req.body || {};
  const proj = {
    _id: `p_${Date.now()}`,
    title,
    description,
    status,
    privacy,
    members,
    createdAt: new Date().toISOString(),
  };
  mockProjects.unshift(proj);
  res.status(201).json(proj);
});

// Quick-rail helper (optional)
app.get('/api/projects/quick', (req, res) => {
  res.json(mockProjects.slice(0, 6).map(p => ({ _id: p._id, title: p.title })));
});

// User stats (supports ?range=&projectId=)
app.get('/api/users/me/stats', (req, res) => {
  res.json(mockStats());
});

// Legacy alias (if your code hits /api/user/me/stats)
app.get('/api/user/me/stats', (req, res) => {
  res.json(mockStats());
});

// Activity feed (user or project scope)
app.get('/api/activity', (req, res) => {
  const scope = req.query.scope || 'user'; // 'user' | 'project'
  res.json(mockActivity({ scope }));
});

// ***** START *****
app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
