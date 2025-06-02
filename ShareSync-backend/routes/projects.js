const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Create a new project
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, category, status } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const project = new Project({
      title,
      description,
      category,
      status: status || 'Not Started',
      members: [{ email: user.email, role: 'Owner', profilePicture: user.profilePicture }],
      activityLog: [{ action: 'create', message: `created project: ${title}`, user: user.email, timestamp: new Date() }],
      posts: [],
      tasks: [],
      files: [],
      teams: [],
      suggestions: [],
      settings: { notifications: { email: true, sms: true, inApp: true, taskUpdates: true, fileUpdates: true, teamUpdates: true } },
    });

    await project.save();

    user.projects = user.projects || [];
    user.projects.push(project._id);
    user.points = (user.points || 0) + 10; // Award 10 points for creating a project
    await user.save();

    req.io.emit('projectCreated', {
      userId: user._id,
      project: project,
      message: `${user.email} created a new project: ${title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Projects Route - Create project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a project by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'email profilePicture');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Projects Route - Get project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    const member = project.members.find(m => m.email === user.email);
    if (!member || member.role !== 'Owner') {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    Object.assign(project, req.body);
    project.activityLog.push({
      action: 'update',
      message: `updated project: ${project.title}`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    req.io.emit('projectUpdated', {
      projectId: project._id,
      project: project,
      message: `${user.email} updated project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.json(project);
  } catch (error) {
    console.error('Projects Route - Update project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Invite a user to a project
router.post('/:id/invite', authMiddleware, async (req, res) => {
  const { email } = req.body;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    const member = project.members.find(m => m.email === user.email);
    if (!member || member.role !== 'Owner') {
      return res.status(403).json({ message: 'Not authorized to invite to this project' });
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (project.members.some(m => m.email === email)) {
      return res.status(400).json({ message: 'User already a member of this project' });
    }

    project.members.push({ email, role: 'Member', profilePicture: invitedUser.profilePicture });
    project.activityLog.push({
      action: 'invite',
      message: `invited ${email} to the project`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    invitedUser.projects = invitedUser.projects || [];
    invitedUser.projects.push(project._id);
    invitedUser.points = (invitedUser.points || 0) + 5; // Award 5 points for joining a project
    await invitedUser.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} invited ${email} to project: ${project.title}`,
      timestamp: new Date().toISOString(),
      userId: invitedUser._id,
    });

    res.status(200).json({ message: 'User invited successfully' });
  } catch (error) {
    console.error('Projects Route - Invite user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Auto-assign tasks
router.post('/:id/auto-assign-tasks', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    const member = project.members.find(m => m.email === user.email);
    if (!member || member.role !== 'Owner') {
      return res.status(403).json({ message: 'Not authorized to auto-assign tasks' });
    }

    project.tasks = project.tasks || [];
    project.tasks.forEach(task => {
      if (!task.assignedTo) {
        task.assignedTo = project.members[Math.floor(Math.random() * project.members.length)].email;
      }
    });
    project.activityLog.push({
      action: 'task-auto-assign',
      message: `auto-assigned tasks`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} auto-assigned tasks in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ message: 'Tasks auto-assigned successfully' });
  } catch (error) {
    console.error('Projects Route - Auto-assign tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a post to a project
router.post('/:id/posts', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!project.members.some(m => m.email === user.email)) {
      return res.status(403).json({ message: 'Not authorized to post to this project' });
    }

    const post = {
      type: req.body.type,
      content: req.body.content,
      author: user.email,
      timestamp: new Date(),
      votes: req.body.type === 'poll' ? [] : undefined,
      options: req.body.type === 'poll' ? req.body.options : undefined,
    };

    project.posts = project.posts || [];
    project.posts.push(post);
    project.activityLog.push({
      action: 'post',
      message: `created a ${post.type} post`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    user.points = (user.points || 0) + 3; // Award 3 points for posting
    await user.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} posted a ${post.type} in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Projects Route - Add post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a task to a project
router.post('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    const member = project.members.find(m => m.email === user.email);
    if (!member || member.role !== 'Owner') {
      return res.status(403).json({ message: 'Not authorized to add tasks to this project' });
    }

    const task = {
      id: (project.tasks.length + 1).toString(),
      title: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo || '',
      status: 'Not Started',
      subtasks: [],
      comments: [],
      likes: [],
      shares: [],
    };

    project.tasks = project.tasks || [];
    project.tasks.push(task);
    project.activityLog.push({
      action: 'task-create',
      message: `created task: ${task.title}`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    user.points = (user.points || 0) + 5; // Award 5 points for creating a task
    await user.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} created task: ${task.title} in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Projects Route - Add task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a subtask to a task
router.post('/:id/tasks/:taskId/subtasks', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    const member = project.members.find(m => m.email === user.email);
    if (!member || member.role !== 'Owner') {
      return res.status(403).json({ message: 'Not authorized to add subtasks to this project' });
    }

    const task = project.tasks.find(t => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const subtask = {
      id: (task.subtasks.length + 1).toString(),
      title: req.body.title,
      status: 'Not Started',
    };

    task.subtasks.push(subtask);
    project.activityLog.push({
      action: 'task-update',
      message: `added subtask: ${subtask.title} to task: ${task.title}`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    user.points = (user.points || 0) + 2; // Award 2 points for adding a subtask
    await user.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} added subtask: ${subtask.title} to task: ${task.title} in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(subtask);
  } catch (error) {
    console.error('Projects Route - Add subtask error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task status
router.put('/:id/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!project.members.some(m => m.email === user.email)) {
      return res.status(403).json({ message: 'Not authorized to update tasks in this project' });
    }

    const task = project.tasks.find(t => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = req.body.status || task.status;
    project.activityLog.push({
      action: 'task-status-update',
      message: `updated task: ${task.title} to status: ${task.status}`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    if (task.status === 'Completed') {
      user.points = (user.points || 0) + 10; // Award 10 points for completing a task
      await user.save();
    }

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} updated task: ${task.title} to status: ${task.status} in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(task);
  } catch (error) {
    console.error('Projects Route - Update task status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a comment to a task
router.post('/:id/tasks/:taskId/comments', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!project.members.some(m => m.email === user.email)) {
      return res.status(403).json({ message: 'Not authorized to comment in this project' });
    }

    const task = project.tasks.find(t => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = {
      text: req.body.text,
      user: user.email,
      timestamp: new Date(),
    };

    task.comments = task.comments || [];
    task.comments.push(comment);
    project.activityLog.push({
      action: 'task-comment',
      message: `commented on task: ${task.title}`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    user.points = (user.points || 0) + 1; // Award 1 point for commenting
    await user.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} commented on task: ${task.title} in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Projects Route - Add task comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like a task
router.post('/:id/tasks/:taskId/like', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!project.members.some(m => m.email === user.email)) {
      return res.status(403).json({ message: 'Not authorized to like in this project' });
    }

    const task = project.tasks.find(t => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.likes = task.likes || [];
    if (!task.likes.includes(user.email)) {
      task.likes.push(user.email);
      project.activityLog.push({
        action: 'task-like',
        message: `liked task: ${task.title}`,
        user: user.email,
        timestamp: new Date(),
      });
      await project.save();

      user.points = (user.points || 0) + 1; // Award 1 point for liking
      await user.save();

      req.io.emit('notification', {
        projectId: project._id,
        message: `${user.email} liked task: ${task.title} in project: ${project.title}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Projects Route - Like task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Share a task
router.post('/:id/tasks/:taskId/share', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!project.members.some(m => m.email === user.email)) {
      return res.status(403).json({ message: 'Not authorized to share in this project' });
    }

    const task = project.tasks.find(t => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.shares = task.shares || [];
    task.shares.push(user.email);
    project.activityLog.push({
      action: 'task-share',
      message: `shared task: ${task.title}`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    user.points = (user.points || 0) + 1; // Award 1 point for sharing
    await user.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} shared task: ${task.title} in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(task);
  } catch (error) {
    console.error('Projects Route - Share task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload a file to a project
router.post('/:id/files', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    const member = project.members.find(m => m.email === user.email);
    if (!member) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    const file = {
      name: req.body.name,
      url: req.body.url,
      uploadedBy: user.email,
      uploadedAt: new Date(),
      status: member.role === 'Owner' ? 'Uploaded' : 'Pending Approval',
    };

    project.files = project.files || [];
    project.files.push(file);
    project.activityLog.push({
      action: 'file-upload',
      message: `${user.email} ${member.role === 'Owner' ? 'uploaded' : 'requested to upload'} file: ${file.name}`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    user.points = (user.points || 0) + 3; // Award 3 points for uploading a file
    await user.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} ${member.role === 'Owner' ? 'uploaded' : 'requested to upload'} file: ${file.name} in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('Projects Route - Upload file error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve or reject a file upload
router.put('/:id/files/:fileId/approve', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    const member = project.members.find(m => m.email === user.email);
    if (!member || member.role !== 'Owner') {
      return res.status(403).json({ message: 'Not authorized to approve files in this project' });
    }

    const file = project.files.find(f => f._id.toString() === req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.status = req.body.status;
    project.activityLog.push({
      action: 'file-approval',
      message: `${user.email} ${file.status.toLowerCase()} file: ${file.name}`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} ${file.status.toLowerCase()} file: ${file.name} in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(file);
  } catch (error) {
    console.error('Projects Route - Approve file error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a team in a project
router.post('/:id/teams', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    const member = project.members.find(m => m.email === user.email);
    if (!member || member.role !== 'Owner') {
      return res.status(403).json({ message: 'Not authorized to create teams in this project' });
    }

    const team = {
      name: req.body.name,
      description: req.body.description,
      members: req.body.members.map(email => ({ email })),
    };

    project.teams = project.teams || [];
    project.teams.push(team);
    project.activityLog.push({
      action: 'team-create',
      message: `created team: ${team.name}`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    user.points = (user.points || 0) + 5; // Award 5 points for creating a team
    await user.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} created team: ${team.name} in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Projects Route - Create team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a suggestion to a project
router.post('/:id/suggestions', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!project.members.some(m => m.email === user.email)) {
      return res.status(403).json({ message: 'Not authorized to add suggestions to this project' });
    }

    const suggestion = {
      content: req.body.content,
      author: user.email,
      timestamp: new Date(),
    };

    project.suggestions = project.suggestions || [];
    project.suggestions.push(suggestion);
    project.activityLog.push({
      action: 'suggestion',
      message: `added a suggestion`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    user.points = (user.points || 0) + 2; // Award 2 points for adding a suggestion
    await user.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} added a suggestion in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Projects Route - Add suggestion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update notification settings
router.put('/:id/settings/notifications', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!project.members.some(m => m.email === user.email)) {
      return res.status(403).json({ message: 'Not authorized to update settings for this project' });
    }

    project.settings.notifications = req.body;
    project.activityLog.push({
      action: 'settings-update',
      message: `updated notification settings`,
      user: user.email,
      timestamp: new Date(),
    });
    await project.save();

    req.io.emit('notification', {
      projectId: project._id,
      message: `${user.email} updated notification settings in project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(project.settings);
  } catch (error) {
    console.error('Projects Route - Update notification settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get project contributions
router.get('/:id/contributions', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!project.members.some(m => m.email === user.email)) {
      return res.status(403).json({ message: 'Not authorized to view contributions for this project' });
    }

    const contributions = {};
    project.members.forEach(member => {
      contributions[member.email] = {
        tasksCompleted: project.tasks.filter(t => t.assignedTo === member.email && t.status === 'Completed').length,
        postsCreated: project.posts.filter(p => p.author === member.email).length,
        commentsMade: project.tasks.reduce((sum, t) => sum + t.comments.filter(c => c.user === member.email).length, 0),
        filesUploaded: project.files.filter(f => f.uploadedBy === member.email && f.status === 'Uploaded').length,
        suggestionsMade: project.suggestions.filter(s => s.author === member.email).length,
      };
    });

    res.json(contributions);
  } catch (error) {
    console.error('Projects Route - Get contributions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get leaderboard for a project
router.get('/:id/leaderboard', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!project.members.some(m => m.email === user.email)) {
      return res.status(403).json({ message: 'Not authorized to view leaderboard for this project' });
    }

    const leaderboard = await Promise.all(
      project.members.map(async (member) => {
        const memberUser = await User.findOne({ email: member.email });
        return {
          username: memberUser.username,
          email: member.email,
          points: memberUser.points || 0,
        };
      })
    );

    leaderboard.sort((a, b) => b.points - a.points);
    res.json(leaderboard);
  } catch (error) {
    console.error('Projects Route - Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;