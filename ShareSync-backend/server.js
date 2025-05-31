const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:54693',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/sharesync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err.message);
});

// Routes
const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const notificationsRoutes = require('./routes/notifications');
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/notifications', notificationsRoutes);

// WebSocket for real-time notifications
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project: ${projectId}`);
  });

  socket.on('message', (data) => {
    const { projectId, text, user } = data;
    const message = { user, text, timestamp: new Date().toISOString() };
    io.to(projectId).emit('message', message);
    io.to(projectId).emit('notification', { message: `${user} sent a new message: ${text}`, timestamp: message.timestamp });
    console.log(`Message sent in project ${projectId}: ${text} by ${user}`);
  });

  socket.on('project_activity', (data) => {
    const { projectId, message, user } = data;
    io.to(projectId).emit('notification', { message: `${user} ${message}`, timestamp: new Date().toISOString() });
    console.log(`Activity in project ${projectId}: ${message} by ${user}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});