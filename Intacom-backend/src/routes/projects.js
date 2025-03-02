// backend/src/routes/projects.js
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

router.get('/', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
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

router.post('/:projectId/share', async (req, res) => {
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

router.post('/:projectId/announcements', async (req, res) => {
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
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding announcement' });
    }
});

router.post('/:projectId/tasks', async (req, res) => {
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
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding task' });
    }
});

router.post('/:projectId/announcements/:annId/like', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
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

router.post('/:projectId/announcements/:annId/comments', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        const announcement = project.announcements.find(a => a.id === parseInt(req.params.annId));
        if (announcement) announcement.comments.push({ ...req.body, user: user.username });
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding comment' });
    }
});

router.post('/:projectId/tasks/:taskId/comments', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.find(t => t.id === parseInt(req.params.taskId));
        if (task) task.comments.push({ ...req.body, user: user.username });
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error adding task comment' });
    }
});

router.post('/:projectId/tasks/:taskId/status', async (req, res) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = JSON.parse(token);
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.find(t => t.id === parseInt(req.params.taskId));
        if (task && (user.username === task.assignee || user.username === project.admin)) {
            task.status = req.body.status;
            await project.save();
            res.json(project);
        } else {
            res.status(403).json({ error: 'Unauthorized to update task status' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error updating task status' });
    }
});

module.exports = router;