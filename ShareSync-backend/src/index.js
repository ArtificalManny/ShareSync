const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// ✅ Route Imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const activityRoutes = require('./routes/activity');

// ✅ Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activity', activityRoutes); // <-- NEW LINE ✅

// ✅ Socket.IO Events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  socket.on('message', (data) => {
    io.to(data.projectId).emit('message', { ...data, timestamp: new Date() });
  });

  socket.on('notification', (data) => {
    io.to(data.projectId).emit('notification', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
