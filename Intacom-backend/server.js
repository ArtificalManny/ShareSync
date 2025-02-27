const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

mongoose.connect('mongodb://localhost/intacom', { useNewUrlParser: true, useUnifiedTopology: true });

const projectSchema = new mongoose.Schema({
    name: String,
    description: String,
    announcements: [{ content: String, media: String, likes: Number, comments: [String] }],
    tasks: [{ title: String, assignee: String, dueDate: Date, status: String, comments: [String] }]
});

const Project = mongoose.model('Project', projectSchema);

app.use(express.json());

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
        const newProject = new Project(req.body);
        await newProject.save();
        res.json(newProject);
    } catch (error) {
        res.status(500).json({ error: 'Error creating project' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));