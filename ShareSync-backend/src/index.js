// src/index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// Expose io so routes/services can emit
app.set('io', io);

// Small helper to keep a single room naming scheme
const projectRoom = (id) => `project:${String(id)}`;

// ✅ Route Imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const activityRoutes = require('./routes/activity');
const fileRoutes = require('./routes/files');     // ← already added earlier
const taskRoutes = require('./routes/tasks');     // ← NEW

// ✅ Route Registration
app.use('/api/auth', authRoutes);

// Attach the room helper before project-scoped routers
app.use(
  '/api/projects',
  (req, res, next) => {
    req.projectRoom = projectRoom;
    next();
  },
  projectRoutes
);

// Files (project-scoped)
app.use(
  '/api/projects',
  (req, res, next) => {
    req.projectRoom = projectRoom;
    next();
  },
  fileRoutes
);

// Tasks (project-scoped)  ← NEW
app.use(
  '/api/projects',
  (req, res, next) => {
    req.projectRoom = projectRoom;
    next();
  },
  taskRoutes
);

app.use('/api/activity', activityRoutes);

// Convenience emitter attached to app (use in controllers/services)
// Usage: req.app.emitProjectMembersUpdated(projectId, members, invites)
app.emitProjectMembersUpdated = (projectId, members, invites) => {
  io.to(projectRoom(projectId)).emit('project:membersUpdated', {
    projectId,
    members,
    invites,
  });
};

// ✅ Socket.IO Events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a project room (normalized)
  socket.on('join_project', (projectId) => {
    if (!projectId) return;
    const room = projectRoom(projectId);
    socket.join(room);
    console.log(`User ${socket.id} joined ${room}`);
  });

  socket.on('leave_project', (projectId) => {
    if (!projectId) return;
    const room = projectRoom(projectId);
    socket.leave(room);
    console.log(`User ${socket.id} left ${room}`);
  });

  socket.on('message', (data) => {
    if (!data?.projectId) return;
    io.to(projectRoom(data.projectId)).emit('message', { ...data, timestamp: new Date() });
  });

  socket.on('notification', (data) => {
    if (!data?.projectId) return;
    io.to(projectRoom(data.projectId)).emit('notification', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ✅ MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
