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
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));

app.get('/api/leaderboard', (req, res) => {
  // Mock leaderboard data
  res.json([
    { email: 'john@example.com', points: 150 },
    { email: 'jane@example.com', points: 120 },
    { email: 'bob@example.com', points: 90 },
  ]);
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinProject', ({ projectId, user }) => {
    socket.join(projectId);
    io.to(projectId).emit('memberStatus', { email: user.email, profilePicture: user.profilePicture, status: 'online' });
  });

  socket.on('leaveProject', ({ projectId, user }) => {
    io.to(projectId).emit('memberStatus', { email: user.email, status: 'offline' });
  });

  socket.on('post', (post) => {
    io.to(post.projectId).emit('post', post);
  });

  socket.on('message', (message) => {
    io.to(message.projectId).emit('message', message);
  });

  socket.on('project-create', (project) => {
    io.emit('project-create', project);
  });

  socket.on('notification', (notification) => {
    io.emit('notification', notification);
  });

  socket.on('metric-update', (update) => {
    io.emit('metric-update', update);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});