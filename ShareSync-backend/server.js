const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors({
  origin: 'http://localhost:54693', // Allow frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow necessary methods
  credentials: true, // Allow cookies/auth headers if needed
}));
app.use(express.json());

// Mock project creation endpoint
app.post('/api/projects/create', (req, res) => {
  const { title, description, category, status, privacy, members, addToProfile, projectColor, projectImage } = req.body;
  // Remove token check for testing (re-enable later with real auth)
  const newProject = {
    _id: `proj_${Date.now()}`,
    title,
    description,
    category,
    status,
    privacy,
    members: members || [],
    addToProfile: addToProfile || false,
    projectColor: projectColor || '#6b48ff',
    projectImage: projectImage || '',
    createdAt: new Date().toISOString(),
  };

  console.log('New project created:', newProject);
  res.status(201).json(newProject);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});