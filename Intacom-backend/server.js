require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { S3 } = require('aws-sdk');
const socketIO = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../Intacom-frontend')));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Model
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, required: false },
});
const User = mongoose.model('User', UserSchema);

// Project Model
const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    admin: { type: String, required: true },
    sharedWith: [{ type: String }],
    announcements: [{
        content: String,
        media: String,
        user: String,
        likes: { type: Number, default: 0 },
        comments: [{ user: String, text: String }],
    }],
    tasks: [{
        title: String,
        assignee: String,
        dueDate: Date,
        status: { type: String, default: 'In Progress' },
        user: String,
        comments: [{ user: String, text: String }],
    }],
});
const Project = mongoose.model('Project', ProjectSchema);

// Auth Routes
app.post('/auth/register', async (req, res) => {
    const { username, password, profilePic } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, profilePic });
        await user.save();

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.cookie('userToken', JSON.stringify(user), { httpOnly: true });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/auth/logout', (req, res) => {
    res.clearCookie('userToken');
    res.json({ message: 'Logged out successfully' });
});

// Project Routes
app.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/projects', async (req, res) => {
    const { name, description, admin, sharedWith = [], announcements = [], tasks = [] } = req.body;
    try {
        const project = new Project({ name, description, admin, sharedWith, announcements, tasks });
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.post('/projects/:projectId/share', async (req, res) => {
    const { projectId } = req.params;
    const { users, admin } = req.body;
    try {
        const project = await Project.findById(projectId);
        if (!project || project.admin !== admin) {
            return res.status(403).json({ error: 'Unauthorized or project not found' });
        }
        project.sharedWith = [...new Set([...project.sharedWith, ...users])];
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to share project' });
    }
});

app.post('/projects/:projectId/announcements', async (req, res) => {
    const { projectId } = req.params;
    const { content, media, user } = req.body;
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        project.announcements.push({ content, media, user, likes: 0, comments: [] });
        await project.save();
        io.emit('newAnnouncement', { projectId, announcement: project.announcements[project.announcements.length - 1] });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add announcement' });
    }
});

app.post('/projects/:projectId/tasks', async (req, res) => {
    const { projectId } = req.params;
    const { title, assignee, dueDate, status, user } = req.body;
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        project.tasks.push({ title, assignee, dueDate, status, user, comments: [] });
        await project.save();
        io.emit('newTask', { projectId, task: project.tasks[project.tasks.length - 1] });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add task' });
    }
});

app.post('/projects/:projectId/announcements/:annId/like', async (req, res) => {
    const { projectId, annId } = req.params;
    const { user } = req.body;
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const announcement = project.announcements.id(annId);
        if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
        announcement.likes = (announcement.likes || 0) + 1;
        await project.save();
        io.emit('notification', { user, message: `You liked an announcement in Project ${project.name}` });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to like announcement' });
    }
});

app.post('/projects/:projectId/announcements/:annId/comments', async (req, res) => {
    const { projectId, annId } = req.params;
    const { text, user } = req.body;
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const announcement = project.announcements.id(annId);
        if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
        announcement.comments.push({ user, text });
        await project.save();
        io.emit('notification', { user, message: `You commented on an announcement in Project ${project.name}` });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

app.post('/projects/:projectId/tasks/:taskId/comments', async (req, res) => {
    const { projectId, taskId } = req.params;
    const { text, user } = req.body;
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const task = project.tasks.id(taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        task.comments.push({ user, text });
        await project.save();
        io.emit('notification', { user, message: `You commented on a task in Project ${project.name}` });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add task comment' });
    }
});

app.post('/projects/:projectId/tasks/:taskId/status', async (req, res) => {
    const { projectId, taskId } = req.params;
    const { status, user } = req.body;
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const task = project.tasks.id(taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        task.status = status;
        await project.save();
        io.emit('notification', { user, message: `Task status updated to ${status} in Project ${project.name}` });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task status' });
    }
});

// Upload Route
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });

    const fileName = `${Date.now()}-${file.originalname}`;
    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const data = await s3.upload(params).promise();
        res.json(data.Location);
    } catch (error) {
        res.status(500).json({ error: 'Upload to S3 failed' });
    }
});

// Socket.io for Real-Time Communication
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});