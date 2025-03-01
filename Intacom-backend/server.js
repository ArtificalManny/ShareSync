const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/intacom')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

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
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));