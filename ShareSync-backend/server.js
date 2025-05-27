const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:54693',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Mock leaderboard endpoint
app.get('/api/leaderboard', (req, res) => {
  console.log('Server - Fetching leaderboard');
  res.json([
    { email: 'test@example.com', points: 100 },
    { email: 'user2@example.com', points: 80 },
  ]);
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));