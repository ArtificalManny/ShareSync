// server.js

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intacom', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage }).single('file');

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String, // Hash this in production
    profilePic: String
});
const User = mongoose.model('User', userSchema);

// Project Schema
const projectSchema = new mongoose.Schema({
    name: String,
    description: String,
    admin: String,
    sharedWith: [String],
    announcements: [{
        id: Number,
        content: String,
        media: String,
        likes: { type: Number, default: 0 },
        comments: [{ user: String, text: String }],
        user: String
    }],
    tasks: [{
        id: Number,
        title: String,
        assignee: String,
        dueDate: Date,
        status: String,
        comments: [{ user: String, text: String }],
        user: String
    }]
});
const Project = mongoose.model('Project', projectSchema);

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        res.json({ user, token: 'mock-token' }); // Use JWT in production
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password, profilePic } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ error: 'Username taken' });
    }
    const newUser = new User({ username, password, profilePic: profilePic || 'default-profile.jpg' });
    await newUser.save();
    res.json(newUser);
});

// Get user by username
app.get('/users/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        res.json(user || { profilePic: 'default-profile.jpg', username: req.params.username });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user' });
    }
});

// Project routes
app.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/projects', async (req, res) => {
    try {
        const newProject = new Project({
            ...req.body,
            id: Date.now(),
            admin: req.body.admin || 'admin',
            sharedWith: []
        });
        await newProject.save();
        res.json(newProject);
    } catch (error) {
        res.status(500).json({ error: 'Error creating project' });
    }
});

app.post('/projects/:projectId/share', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || (req.body.admin !== project.admin && !project.sharedWith.includes(req.body.admin))) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        project.sharedWith = [...new Set([...project.sharedWith, ...req.body.users])];
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error sharing project' });
    }
});

app.post('/projects/:projectId/announcements', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        project.announcements.push({ ...req.body, id: Date.now(), likes: 0, comments: [] });
        await project.save();
        io.emit('newAnnouncement', { projectId: req.params.projectId, announcement: project.announcements[project.announcements.length - 1] });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding announcement' });
    }
});

app.post('/projects/:projectId/tasks', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        project.tasks.push({ ...req.body, id: Date.now(), comments: [] });
        await project.save();
        io.emit('newTask', { projectId: req.params.projectId, task: project.tasks[project.tasks.length - 1] });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding task' });
    }
});

app.post('/projects/:projectId/announcements/:annId/like', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const announcement = project.announcements.find(a => a.id === parseInt(req.params.annId));
        if (announcement) announcement.likes += 1;
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error liking announcement' });
    }
});

app.post('/projects/:projectId/announcements/:annId/comments', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const announcement = project.announcements.find(a => a.id === parseInt(req.params.annId));
        if (announcement) announcement.comments.push(req.body);
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding comment' });
    }
});

app.post('/projects/:projectId/tasks/:taskId/comments', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.find(t => t.id === parseInt(req.params.taskId));
        if (task) task.comments.push(req.body);
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding task comment' });
    }
});

app.post('/projects/:projectId/tasks/:taskId/status', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.find(t => t.id === parseInt(req.params.taskId));
        if (task) task.status = req.body.status;
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error updating task status' });
    });

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(500).json({ error: 'File upload failed' });
            return;
        }
        res.json(`http://localhost:3000/uploads/${req.file.filename}`);
    });
});

app.use('/uploads', express.static('uploads'));

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));
});