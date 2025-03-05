// server.js

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Server } = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB (Atlas or local)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intacom', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Configure AWS S3
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const s3 = new AWS.S3();

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    profilePic: String
});
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
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

// Notification Schema
const notificationSchema = new mongoose.Schema({
    user: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

// Connection Schema
const connectionSchema = new mongoose.Schema({
    user: String,
    connections: [String]
});
const Connection = mongoose.model('Connection', connectionSchema);

// Activity Schema
const activitySchema = new mongoose.Schema({
    user: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});
const Activity = mongoose.model('Activity', activitySchema);

// Auth Routes
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await user.comparePassword(password)) {
        res.cookie('userToken', JSON.stringify({ username: user.username, profilePic: user.profilePic }), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ user, token: 'mock-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/auth/register', async (req, res) => {
    const { username, password, profilePic } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ error: 'Username taken' });
    }
    const newUser = new User({ username, password, profilePic: profilePic || 'assets/default-profile.jpg' });
    await newUser.save();
    res.cookie('userToken', JSON.stringify({ username: newUser.username, profilePic: newUser.profilePic }), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json(newUser);
});

app.get('/auth/user', (req, res) => {
    const token = req.cookies.userToken;
    if (token) {
        const user = JSON.parse(token);
        res.json(user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.post('/auth/logout', (req, res) => {
    res.clearCookie('userToken');
    res.json({ message: 'Logged out successfully' });
});

// Users
app.get('/users/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        res.json(user || { profilePic: 'assets/default-profile.jpg', username: req.params.username });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user' });
    }
});

// Projects
app.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/projects', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const newProject = new Project({
            ...req.body,
            id: Date.now(),
            admin: user.username,
            sharedWith: []
        });
        await newProject.save();
        res.json(newProject);
    } catch (error) {
        res.status(500).json({ error: 'Error creating project' });
    }
});

app.post('/projects/:projectId/share', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || (user.username !== project.admin && !project.sharedWith.includes(user.username))) {
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
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || (user.username !== project.admin && !project.sharedWith.includes(user.username))) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        project.announcements.push({ ...req.body, id: Date.now(), likes: 0, comments: [], user: user.username });
        await project.save();
        io.emit('newAnnouncement', { projectId: req.params.projectId, announcement: project.announcements[project.announcements.length - 1] });
        const newActivity = new Activity({ user: user.username, message: `Created a new announcement in Project ${project.name}` });
        await newActivity.save();
        io.emit('notification', { user: user.username, message: `You created a new announcement in Project ${project.name}` });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding announcement' });
    }
});

app.post('/projects/:projectId/tasks', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || (user.username !== project.admin && !project.sharedWith.includes(user.username))) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        project.tasks.push({ ...req.body, id: Date.now(), comments: [], user: user.username });
        await project.save();
        io.emit('newTask', { projectId: req.params.projectId, task: project.tasks[project.tasks.length - 1] });
        const newActivity = new Activity({ user: user.username, message: `Created a new task '${req.body.title}' in Project ${project.name}` });
        await newActivity.save();
        if (req.body.assignee) {
            io.emit('notification', { user: req.body.assignee, message: `New task '${req.body.title}' assigned to you in Project ${project.name}` });
            const notification = new Notification({ user: req.body.assignee, message: `New task '${req.body.title}' assigned to you in Project ${project.name}` });
            await notification.save();
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding task' });
    }
});

app.post('/projects/:projectId/announcements/:annId/like', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        const announcement = project.announcements.find(a => a.id === parseInt(req.params.annId));
        if (announcement) announcement.likes += 1;
        await project.save();
        const newActivity = new Activity({ user: user.username, message: `Liked an announcement in Project ${project.name}` });
        await newActivity.save();
        io.emit('notification', { user: user.username, message: `You liked an announcement in Project ${project.name}` });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error liking announcement' });
    }
});

app.post('/projects/:projectId/announcements/:annId/comments', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        const announcement = project.announcements.find(a => a.id === parseInt(req.params.annId));
        if (announcement) announcement.comments.push({ ...req.body, user: user.username });
        await project.save();
        const newActivity = new Activity({ user: user.username, message: `Commented on an announcement in Project ${project.name}` });
        await newActivity.save();
        io.emit('notification', { user: user.username, message: `You commented on an announcement in Project ${project.name}` });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding comment' });
    }
});

app.post('/projects/:projectId/tasks/:taskId/comments', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.find(t => t.id === parseInt(req.params.taskId));
        if (task) task.comments.push({ ...req.body, user: user.username });
        await project.save();
        const newActivity = new Activity({ user: user.username, message: `Commented on a task in Project ${project.name}` });
        await newActivity.save();
        io.emit('notification', { user: user.username, message: `You commented on a task in Project ${project.name}` });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding task comment' });
    }
});

app.post('/projects/:projectId/tasks/:taskId/status', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.find(t => t.id === parseInt(req.params.taskId));
        if (task && (user.username === task.assignee || user.username === project.admin)) {
            task.status = req.body.status;
            await project.save();
            const newActivity = new Activity({ user: user.username, message: `Updated task '${task.title}' status to ${req.body.status} in Project ${project.name}` });
            await newActivity.save();
            io.emit('notification', { user: user.username, message: `You updated task '${task.title}' status to ${req.body.status} in Project ${project.name}` });
            res.json(project);
        } else {
            res.status(403).json({ error: 'Unauthorized to update task status' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error updating task status' });
    }
});

app.post('/upload', async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            res.status(500).json({ error: 'File upload failed' });
            return;
        }
        const fileStream = fs.createReadStream(req.file.path);
        const uploadParams = {
            Bucket: process.env.S3_BUCKET,
            Key: req.file.filename,
            Body: fileStream,
            ContentType: req.file.mimetype
        };
        try {
            await s3.upload(uploadParams).promise();
            fs.unlinkSync(req.file.path); // Remove local file after upload
            res.json(`https://${process.env.S3_BUCKET}.s3.amazonaws.com/${req.file.filename}`);
        } catch (error) {
            res.status(500).json({ error: 'S3 upload failed' });
        }
    });
});

app.use('/uploads', express.static('uploads')); // Optional: for local testing

// Notifications
app.get('/notifications/:username', async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.params.username }).sort({ timestamp: -1 }).limit(10);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching notifications' });
    }
});

// Connections
app.get('/connections/:username', async (req, res) => {
    try {
        let connection = await Connection.findOne({ user: req.params.username });
        if (!connection) {
            connection = new Connection({ user: req.params.username, connections: [] });
            await connection.save();
        }
        const connectedUsers = await User.find({ username: { $in: connection.connections } });
        res.json(connectedUsers);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching connections' });
    }
});

app.post('/connections/:username', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        let connection = await Connection.findOne({ user: user.username });
        if (!connection) {
            connection = new Connection({ user: user.username, connections: [] });
        }
        connection.connections.push(req.params.username);
        await connection.save();
        res.json(connection);
    } catch (error) {
        res.status(500).json({ error: 'Error adding connection' });
    }
});

// Activities
app.get('/activities', async (req, res) => {
    try {
        const activities = await Activity.find().sort({ timestamp: -1 }).limit(20);
        const users = await User.find({ username: { $in: activities.map(a => a.user) } });
        const userMap = users.reduce((map, user) => (map[user.username] = { username: user.username, profilePic: user.profilePic }, map), {});
        res.json(activities.map(a => ({ user: userMap[a.user], message: a.message, timestamp: a.timestamp })));
    } catch (error) {
        res.status(500).json({ error: 'Error fetching activities' });
    }
});

app.post('/activities', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const newActivity = new Activity({ user: user.username, message: req.body.message });
        await newActivity.save();
        res.json(newActivity);
    } catch (error) {
        res.status(500).json({ error: 'Error adding activity' });
    }
});

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));
});