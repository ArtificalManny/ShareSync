const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const Project = require('../models/Project');

// Mock notification function (replace with SendGrid/Twilio in production)
const sendNotification = async (user, message, projectId) => {
  console.log(`Notification to ${user.email}: ${message}`);
  if (user.projects.find(p => p.id === projectId)?.settings?.notifications?.inApp) {
    user.notifications.push({ message, timestamp: new Date().toISOString(), read: false });
    await user.save();
  }
  // Add email/SMS logic here
};

// Create a new project
router.post('/', auth, async (req, res) => {
  try {
    console.log('Projects Route - Creating new project for user:', req.user.id);
    const { title, description, category } = req.body;

    if (!title) {
      console.log('Projects Route - Title is required');
      return res.status(400).json({ message: 'Project title is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const newProject = {
      id: `proj-${user.projects.length + 1}`,
      title: title,
      description: description || 'A new project',
      category: category || 'Personal',
      status: 'Not Started',
      posts: [],
      comments: [],
      activityLog: [{ message: `${user.email} created the project`, timestamp: new Date().toISOString(), user: user.email, action: 'create' }],
      members: [{ email: user.email, role: 'Owner', profilePicture: user.profilePicture }],
      tasks: [],
      tasksCompleted: 0,
      totalTasks: 0,
      teams: [],
      files: [],
      settings: {
        notifications: {
          email: true,
          sms: true,
          inApp: true,
        },
      },
      suggestions: [],
    };

    user.projects.push(newProject);
    const savedUser = await user.save();
    console.log('Projects Route - Project saved to MongoDB:', newProject);
    console.log('Projects Route - Updated user projects:', savedUser.projects.map(p => p.id));

    await sendNotification(user, `You created a new project: ${title}`, newProject.id);

    res.status(201).json(newProject);
  } catch (err) {
    console.error('Projects Route - Error creating project:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a project
router.put('/:projectId', auth, async (req, res) => {
  try {
    console.log('Projects Route - Updating project:', req.params.projectId);
    const { projectId } = req.params;
    const updates = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can update project details' });
    }

    const oldProject = { ...user.projects[projectIndex] };
    user.projects[projectIndex] = { ...user.projects[projectIndex], ...updates };
    user.projects[projectIndex].activityLog.push({
      message: `${user.email} updated the project: ${JSON.stringify(updates)}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'update',
    });
    await user.save();

    const updatedProject = user.projects[projectIndex];
    for (const member of updatedProject.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex] = { ...memberUser.projects[memberProjectIndex], ...updates };
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `Project ${updatedProject.title} has been updated by ${user.email}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Project updated:', projectId);
    res.json(updatedProject);
  } catch (err) {
    console.error('Projects Route - Error updating project:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send an invite to join a project
router.post('/:projectId/invite', auth, async (req, res) => {
  try {
    console.log('Projects Route - Sending invite for project:', req.params.projectId);
    const { projectId } = req.params;
    const { email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can send invites' });
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      console.log('Projects Route - Invited user not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    if (project.members.some((m) => m.email === email)) {
      console.log('Projects Route - User already a member:', email);
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push({
      email: invitedUser.email,
      role: 'Member',
      profilePicture: invitedUser.profilePicture,
    });
    project.activityLog.push({
      message: `${user.email} invited ${invitedUser.email} to the project`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'invite',
    });

    const projectCopy = { ...project, members: project.members };
    invitedUser.projects.push(projectCopy);

    invitedUser.notifications.push({
      message: `You have been invited to join project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    await user.save();
    await invitedUser.save();

    await sendNotification(invitedUser, `You have been invited to join project: ${project.title} by ${user.email}`, projectId);

    console.log('Projects Route - Invite sent to:', email);
    res.json({ message: 'Invite sent successfully' });
  } catch (err) {
    console.error('Projects Route - Error sending invite:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request to join a project (for non-members)
router.post('/:projectId/request-join', auth, async (req, res) => {
  try {
    console.log('Projects Route - Request to join project:', req.params.projectId);
    const { projectId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const owner = await User.findOne({ 'projects.id': projectId, 'projects.members': { $elemMatch: { email: { $ne: user.email }, role: 'Owner' } } });
    if (!owner) {
      console.log('Projects Route - Project or owner not found:', projectId);
      return res.status(404).json({ message: 'Project or owner not found' });
    }

    const projectIndex = owner.projects.findIndex((p) => p.id === projectId);
    const project = owner.projects[projectIndex];

    if (project.members.some((m) => m.email === user.email)) {
      console.log('Projects Route - User already a member:', user.email);
      return res.status(400).json({ message: 'You are already a member of this project' });
    }

    owner.notifications.push({
      message: `${user.email} has requested to join your project: ${project.title}`,
      timestamp: new Date().toISOString(),
    });

    await owner.save();
    await sendNotification(owner, `${user.email} has requested to join your project: ${project.title}`, projectId);

    console.log('Projects Route - Join request sent for project:', projectId);
    res.json({ message: 'Join request sent successfully' });
  } catch (err) {
    console.error('Projects Route - Error sending join request:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a post in a project
router.post('/:projectId/posts', auth, async (req, res) => {
  try {
    console.log('Projects Route - Creating post for project:', req.params.projectId);
    const { projectId } = req.params;
    const { type, content, options } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const newPost = {
      type,
      content,
      author: user.email,
      timestamp: new Date().toISOString(),
      comments: [],
      options: type === 'poll' ? options : [],
      votes: [],
    };

    project.posts.push(newPost);
    project.activityLog.push({
      message: `${user.email} created a ${type} post: ${content}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'post',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].posts = project.posts;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} created a new ${type} post in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Post created:', newPost);
    res.json(newPost);
  } catch (err) {
    console.error('Projects Route - Error creating post:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Comment on a post
router.post('/:projectId/posts/:postIndex/comments', auth, async (req, res) => {
  try {
    console.log('Projects Route - Commenting on post in project:', req.params.projectId);
    const { projectId, postIndex } = req.params;
    const { content } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    if (postIndex >= project.posts.length) {
      console.log('Projects Route - Post not found:', postIndex);
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      author: user.email,
      content,
      timestamp: new Date().toISOString(),
      likes: [],
      shares: [],
    };

    project.posts[postIndex].comments.push(newComment);
    project.activityLog.push({
      message: `${user.email} commented on a post: ${content}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'comment',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].posts = project.posts;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} commented on a post in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Comment added:', newComment);
    res.json(newComment);
  } catch (err) {
    console.error('Projects Route - Error adding comment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a post comment
router.post('/:projectId/posts/:postIndex/comments/:commentIndex/like', auth, async (req, res) => {
  try {
    console.log('Projects Route - Liking comment in project:', req.params.projectId);
    const { projectId, postIndex, commentIndex } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    if (postIndex >= project.posts.length || commentIndex >= project.posts[postIndex].comments.length) {
      console.log('Projects Route - Post or comment not found:', postIndex, commentIndex);
      return res.status(404).json({ message: 'Post or comment not found' });
    }

    const comment = project.posts[postIndex].comments[commentIndex];
    if (comment.likes.includes(user.email)) {
      comment.likes = comment.likes.filter(email => email !== user.email);
      project.activityLog.push({
        message: `${user.email} unliked a comment on a post`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'unlike',
      });
    } else {
      comment.likes.push(user.email);
      project.activityLog.push({
        message: `${user.email} liked a comment on a post`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'like',
      });
    }

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].posts = project.posts;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} ${comment.likes.includes(user.email) ? 'liked' : 'unliked'} a comment in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Comment like toggled:', comment);
    res.json(comment);
  } catch (err) {
    console.error('Projects Route - Error liking comment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share a post comment
router.post('/:projectId/posts/:postIndex/comments/:commentIndex/share', auth, async (req, res) => {
  try {
    console.log('Projects Route - Sharing comment in project:', req.params.projectId);
    const { projectId, postIndex, commentIndex } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    if (postIndex >= project.posts.length || commentIndex >= project.posts[postIndex].comments.length) {
      console.log('Projects Route - Post or comment not found:', postIndex, commentIndex);
      return res.status(404).json({ message: 'Post or comment not found' });
    }

    const comment = project.posts[postIndex].comments[commentIndex];
    if (comment.shares.includes(user.email)) {
      comment.shares = comment.shares.filter(email => email !== user.email);
      project.activityLog.push({
        message: `${user.email} unshared a comment on a post`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'unshare',
      });
    } else {
      comment.shares.push(user.email);
      project.activityLog.push({
        message: `${user.email} shared a comment on a post`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'share',
      });
    }

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].posts = project.posts;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} ${comment.shares.includes(user.email) ? 'shared' : 'unshared'} a comment in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Comment share toggled:', comment);
    res.json(comment);
  } catch (err) {
    console.error('Projects Route - Error sharing comment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on a poll
router.post('/:projectId/posts/:postIndex/vote', auth, async (req, res) => {
  try {
    console.log('Projects Route - Voting on poll in project:', req.params.projectId);
    const { projectId, postIndex } = req.params;
    const { option } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    if (postIndex >= project.posts.length) {
      console.log('Projects Route - Post not found:', postIndex);
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = project.posts[postIndex];
    if (post.type !== 'poll') {
      console.log('Projects Route - Post is not a poll:', postIndex);
      return res.status(400).json({ message: 'Post is not a poll' });
    }

    const existingVote = post.votes.find(v => v.user === user.email);
    if (existingVote) {
      existingVote.option = option;
    } else {
      post.votes.push({ user: user.email, option });
    }

    project.activityLog.push({
      message: `${user.email} voted on a poll: ${option}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'vote',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].posts = project.posts;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} voted on a poll in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Vote recorded:', post.votes);
    res.json(post);
  } catch (err) {
    console.error('Projects Route - Error voting on poll:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a task
router.post('/:projectId/tasks', auth, async (req, res) => {
  try {
    console.log('Projects Route - Creating task for project:', req.params.projectId);
    const { projectId } = req.params;
    const { title, description } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can create tasks' });
    }

    const newTask = {
      id: `task-${project.tasks.length + 1}`,
      title,
      description,
      assignedTo: 'Unassigned',
      status: 'Not Started',
      subtasks: [],
      comments: [],
    };

    project.tasks.push(newTask);
    project.totalTasks += 1;
    project.activityLog.push({
      message: `${user.email} created a new task: ${title}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'task-create',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].totalTasks = project.totalTasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} created a new task: ${title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Task created:', newTask);
    res.json(newTask);
  } catch (err) {
    console.error('Projects Route - Error creating task:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a subtask
router.post('/:projectId/tasks/:taskId/subtasks', auth, async (req, res) => {
  try {
    console.log('Projects Route - Creating subtask for task in project:', req.params.projectId);
    const { projectId, taskId } = req.params;
    const { title } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.log('Projects Route - Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can create subtasks' });
    }

    const newSubtask = {
      id: `subtask-${project.tasks[taskIndex].subtasks.length + 1}`,
      title,
      status: 'Not Started',
      comments: [],
    };

    project.tasks[taskIndex].subtasks.push(newSubtask);
    project.activityLog.push({
      message: `${user.email} created a new subtask: ${title} under task: ${project.tasks[taskIndex].title}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'subtask-create',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} created a new subtask: ${title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Subtask created:', newSubtask);
    res.json(newSubtask);
  } catch (err) {
    console.error('Projects Route - Error creating subtask:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status or assignment
router.put('/:projectId/tasks/:taskId', auth, async (req, res) => {
  try {
    console.log('Projects Route - Updating task in project:', req.params.projectId);
    const { projectId, taskId } = req.params;
    const { status, assignedTo } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.log('Projects Route - Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (status && !isOwner && project.tasks[taskIndex].assignedTo !== user.email) {
      console.log('Projects Route - User not authorized to update task status:', user.email);
      return res.status(403).json({ message: 'Not authorized to update this task status' });
    }

    if (assignedTo && !isOwner) {
      console.log('Projects Route - User not authorized to assign task:', user.email);
      return res.status(403).json({ message: 'Only project owners can assign tasks' });
    }

    const task = project.tasks[taskIndex];
    const wasCompleted = task.status === 'Completed';
    const willBeCompleted = status === 'Completed';

    if (status) task.status = status;
    if (assignedTo) task.assignedTo = assignedTo;
    project.activityLog.push({
      message: `${user.email} updated task: ${task.title}${assignedTo ? ` (Assigned to ${assignedTo})` : ''} (Status: ${status || task.status})`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'task-update',
    });

    if (!wasCompleted && willBeCompleted) {
      project.tasksCompleted += 1;
    } else if (wasCompleted && !willBeCompleted) {
      project.tasksCompleted -= 1;
    }

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].tasksCompleted = project.tasksCompleted;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} updated task: ${task.title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Task updated:', task);
    res.json(task);
  } catch (err) {
    console.error('Projects Route - Error updating task:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update subtask status
router.put('/:projectId/tasks/:taskId/subtasks/:subtaskId', auth, async (req, res) => {
  try {
    console.log('Projects Route - Updating subtask in project:', req.params.projectId);
    const { projectId, taskId, subtaskId } = req.params;
    const { status } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.log('Projects Route - Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    const subtaskIndex = project.tasks[taskIndex].subtasks.findIndex((s) => s.id === subtaskId);
    if (subtaskIndex === -1) {
      console.log('Projects Route - Subtask not found:', subtaskId);
      return res.status(404).json({ message: 'Subtask not found' });
    }

    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner && project.tasks[taskIndex].assignedTo !== user.email) {
      console.log('Projects Route - User not authorized to update subtask:', user.email);
      return res.status(403).json({ message: 'Not authorized to update this subtask' });
    }

    const subtask = project.tasks[taskIndex].subtasks[subtaskIndex];
    subtask.status = status;
    project.activityLog.push({
      message: `${user.email} updated subtask: ${subtask.title} under task: ${project.tasks[taskIndex].title} (Status: ${status})`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'subtask-update',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} updated subtask: ${subtask.title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Subtask updated:', subtask);
    res.json(subtask);
  } catch (err) {
    console.error('Projects Route - Error updating subtask:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Comment on a task
router.post('/:projectId/tasks/:taskId/comments', auth, async (req, res) => {
  try {
    console.log('Projects Route - Commenting on task in project:', req.params.projectId);
    const { projectId, taskId } = req.params;
    const { content } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.log('Projects Route - Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    const newComment = {
      author: user.email,
      content,
      timestamp: new Date().toISOString(),
      likes: [],
      shares: [],
    };

    project.tasks[taskIndex].comments.push(newComment);
    project.activityLog.push({
      message: `${user.email} commented on task: ${project.tasks[taskIndex].title} - ${content}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'task-comment',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} commented on task: ${project.tasks[taskIndex].title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Task comment added:', newComment);
    res.json(newComment);
  } catch (err) {
    console.error('Projects Route - Error adding task comment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Comment on a subtask
router.post('/:projectId/tasks/:taskId/subtasks/:subtaskId/comments', auth, async (req, res) => {
  try {
    console.log('Projects Route - Commenting on subtask in project:', req.params.projectId);
    const { projectId, taskId, subtaskId } = req.params;
    const { content } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.log('Projects Route - Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    const subtaskIndex = project.tasks[taskIndex].subtasks.findIndex((s) => s.id === subtaskId);
    if (subtaskIndex === -1) {
      console.log('Projects Route - Subtask not found:', subtaskId);
      return res.status(404).json({ message: 'Subtask not found' });
    }

    const newComment = {
      author: user.email,
      content,
      timestamp: new Date().toISOString(),
      likes: [],
      shares: [],
    };

    project.tasks[taskIndex].subtasks[subtaskIndex].comments.push(newComment);
    project.activityLog.push({
      message: `${user.email} commented on subtask: ${project.tasks[taskIndex].subtasks[subtaskIndex].title} - ${content}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'subtask-comment',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} commented on subtask: ${project.tasks[taskIndex].subtasks[subtaskIndex].title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Subtask comment added:', newComment);
    res.json(newComment);
  } catch (err) {
    console.error('Projects Route - Error adding subtask comment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a task comment
router.post('/:projectId/tasks/:taskId/comments/:commentIndex/like', auth, async (req, res) => {
  try {
    console.log('Projects Route - Liking task comment in project:', req.params.projectId);
    const { projectId, taskId, commentIndex } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1 || commentIndex >= project.tasks[taskIndex].comments.length) {
      console.log('Projects Route - Task or comment not found:', taskId, commentIndex);
      return res.status(404).json({ message: 'Task or comment not found' });
    }

    const comment = project.tasks[taskIndex].comments[commentIndex];
    if (comment.likes.includes(user.email)) {
      comment.likes = comment.likes.filter(email => email !== user.email);
      project.activityLog.push({
        message: `${user.email} unliked a comment on task: ${project.tasks[taskIndex].title}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'task-unlike',
      });
    } else {
      comment.likes.push(user.email);
      project.activityLog.push({
        message: `${user.email} liked a comment on task: ${project.tasks[taskIndex].title}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'task-like',
      });
    }

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} ${comment.likes.includes(user.email) ? 'liked' : 'unliked'} a comment on task: ${project.tasks[taskIndex].title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Task comment like toggled:', comment);
    res.json(comment);
  } catch (err) {
    console.error('Projects Route - Error liking task comment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share a task comment
router.post('/:projectId/tasks/:taskId/comments/:commentIndex/share', auth, async (req, res) => {
  try {
    console.log('Projects Route - Sharing task comment in project:', req.params.projectId);
    const { projectId, taskId, commentIndex } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1 || commentIndex >= project.tasks[taskIndex].comments.length) {
      console.log('Projects Route - Task or comment not found:', taskId, commentIndex);
      return res.status(404).json({ message: 'Task or comment not found' });
    }

    const comment = project.tasks[taskIndex].comments[commentIndex];
    if (comment.shares.includes(user.email)) {
      comment.shares = comment.shares.filter(email => email !== user.email);
      project.activityLog.push({
        message: `${user.email} unshared a comment on task: ${project.tasks[taskIndex].title}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'task-unshare',
      });
    } else {
      comment.shares.push(user.email);
      project.activityLog.push({
        message: `${user.email} shared a comment on task: ${project.tasks[taskIndex].title}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'task-share',
      });
    }

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} ${comment.shares.includes(user.email) ? 'shared' : 'unshared'} a comment on task: ${project.tasks[taskIndex].title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Task comment share toggled:', comment);
    res.json(comment);
  } catch (err) {
    console.error('Projects Route - Error sharing task comment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a subtask comment
router.post('/:projectId/tasks/:taskId/subtasks/:subtaskId/comments/:commentIndex/like', auth, async (req, res) => {
  try {
    console.log('Projects Route - Liking subtask comment in project:', req.params.projectId);
    const { projectId, taskId, subtaskId, commentIndex } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.log('Projects Route - Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    const subtaskIndex = project.tasks[taskIndex].subtasks.findIndex((s) => s.id === subtaskId);
    if (subtaskIndex === -1 || commentIndex >= project.tasks[taskIndex].subtasks[subtaskIndex].comments.length) {
      console.log('Projects Route - Subtask or comment not found:', subtaskId, commentIndex);
      return res.status(404).json({ message: 'Subtask or comment not found' });
    }

    const comment = project.tasks[taskIndex].subtasks[subtaskIndex].comments[commentIndex];
    if (comment.likes.includes(user.email)) {
      comment.likes = comment.likes.filter(email => email !== user.email);
      project.activityLog.push({
        message: `${user.email} unliked a comment on subtask: ${project.tasks[taskIndex].subtasks[subtaskIndex].title}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'subtask-unlike',
      });
    } else {
      comment.likes.push(user.email);
      project.activityLog.push({
        message: `${user.email} liked a comment on subtask: ${project.tasks[taskIndex].subtasks[subtaskIndex].title}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'subtask-like',
      });
    }

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} ${comment.likes.includes(user.email) ? 'liked' : 'unliked'} a comment on subtask: ${project.tasks[taskIndex].subtasks[subtaskIndex].title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Subtask comment like toggled:', comment);
    res.json(comment);
  } catch (err) {
    console.error('Projects Route - Error liking subtask comment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share a subtask comment
router.post('/:projectId/tasks/:taskId/subtasks/:subtaskId/comments/:commentIndex/share', auth, async (req, res) => {
  try {
    console.log('Projects Route - Sharing subtask comment in project:', req.params.projectId);
    const { projectId, taskId, subtaskId, commentIndex } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.log('Projects Route - Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    const subtaskIndex = project.tasks[taskIndex].subtasks.findIndex((s) => s.id === subtaskId);
    if (subtaskIndex === -1 || commentIndex >= project.tasks[taskIndex].subtasks[subtaskIndex].comments.length) {
      console.log('Projects Route - Subtask or comment not found:', subtaskId, commentIndex);
      return res.status(404).json({ message: 'Subtask or comment not found' });
    }

    const comment = project.tasks[taskIndex].subtasks[subtaskIndex].comments[commentIndex];
    if (comment.shares.includes(user.email)) {
      comment.shares = comment.shares.filter(email => email !== user.email);
      project.activityLog.push({
        message: `${user.email} unshared a comment on subtask: ${project.tasks[taskIndex].subtasks[subtaskIndex].title}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'subtask-unshare',
      });
    } else {
      comment.shares.push(user.email);
      project.activityLog.push({
        message: `${user.email} shared a comment on subtask: ${project.tasks[taskIndex].subtasks[subtaskIndex].title}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'subtask-share',
      });
    }

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} ${comment.shares.includes(user.email) ? 'shared' : 'unshared'} a comment on subtask: ${project.tasks[taskIndex].subtasks[subtaskIndex].title} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Subtask comment share toggled:', comment);
    res.json(comment);
  } catch (err) {
    console.error('Projects Route - Error sharing subtask comment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload a file (or request to upload if not an owner)
router.post('/:projectId/files', auth, async (req, res) => {
  try {
    console.log('Projects Route - Uploading file to project:', req.params.projectId);
    const { projectId } = req.params;
    const { name, url } = req.body; // In production, use a file upload service like AWS S3
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');

    const newFile = {
      name,
      url,
      uploadedBy: user.email,
      timestamp: new Date().toISOString(),
      status: isOwner ? 'Approved' : 'Pending',
    };

    project.files.push(newFile);
    project.activityLog.push({
      message: `${user.email} ${isOwner ? 'uploaded' : 'requested to upload'} a file: ${name}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: isOwner ? 'file-upload' : 'file-request',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].files = project.files;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} ${isOwner ? 'uploaded' : 'requested to upload'} a file: ${name} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    if (!isOwner) {
      const owner = project.members.find(m => m.role === 'Owner');
      const ownerUser = await User.findOne({ email: owner.email });
      if (ownerUser) {
        ownerUser.notifications.push({
          message: `${user.email} has requested to upload a file: ${name} to project: ${project.title}`,
          timestamp: new Date().toISOString(),
        });
        await ownerUser.save();
        await sendNotification(ownerUser, `${user.email} has requested to upload a file: ${name} to project: ${project.title}`, projectId);
      }
    }

    console.log('Projects Route - File upload/request processed:', newFile);
    res.json(newFile);
  } catch (err) {
    console.error('Projects Route - Error uploading file:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject a file upload request
router.put('/:projectId/files/:fileIndex', auth, async (req, res) => {
  try {
    console.log('Projects Route - Approving/rejecting file in project:', req.params.projectId);
    const { projectId, fileIndex } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can approve/reject files' });
    }

    if (fileIndex >= project.files.length) {
      console.log('Projects Route - File not found:', fileIndex);
      return res.status(404).json({ message: 'File not found' });
    }

    const file = project.files[fileIndex];
    if (file.status !== 'Pending') {
      console.log('Projects Route - File not in pending state:', fileIndex);
      return res.status(400).json({ message: 'File is not in a pending state' });
    }

    if (status === 'Rejected') {
      project.files.splice(fileIndex, 1);
      project.activityLog.push({
        message: `${user.email} rejected file: ${file.name}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'file-reject',
      });
    } else {
      file.status = status;
      project.activityLog.push({
        message: `${user.email} approved file: ${file.name}`,
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'file-approve',
      });
    }

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].files = project.files;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} ${status.toLowerCase()} file: ${file.name} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    const uploader = await User.findOne({ email: file.uploadedBy });
    if (uploader) {
      uploader.notifications.push({
        message: `Your file ${file.name} was ${status.toLowerCase()} by ${user.email} in project: ${project.title}`,
        timestamp: new Date().toISOString(),
      });
      await uploader.save();
      await sendNotification(uploader, `Your file ${file.name} was ${status.toLowerCase()} by ${user.email} in project: ${project.title}`, projectId);
    }

    console.log('Projects Route - File status updated:', file);
    res.json(status === 'Rejected' ? { message: 'File rejected and removed' } : file);
  } catch (err) {
    console.error('Projects Route - Error updating file status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a team within a project
router.post('/:projectId/teams', auth, async (req, res) => {
  try {
    console.log('Projects Route - Creating team in project:', req.params.projectId);
    const { projectId } = req.params;
    const { name, description, members } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can create teams' });
    }

    const teamMembers = members.map(email => {
      const member = project.members.find(m => m.email === email);
      return { email, role: member ? member.role : 'Member' };
    });

    const newTeam = {
      name,
      description,
      members: teamMembers,
    };

    project.teams.push(newTeam);
    project.activityLog.push({
      message: `${user.email} created a new team: ${name} with members: ${teamMembers.map(m => m.email).join(', ')}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'team-create',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].teams = project.teams;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} created a new team: ${name} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Team created:', newTeam);
    res.json(newTeam);
  } catch (err) {
    console.error('Projects Route - Error creating team:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a team
router.put('/:projectId/teams/:teamIndex', auth, async (req, res) => {
  try {
    console.log('Projects Route - Updating team in project:', req.params.projectId);
    const { projectId, teamIndex } = req.params;
    const { name, description, members } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can update teams' });
    }

    if (teamIndex >= project.teams.length) {
      console.log('Projects Route - Team not found:', teamIndex);
      return res.status(404).json({ message: 'Team not found' });
    }

    const teamMembers = members.map(email => {
      const member = project.members.find(m => m.email === email);
      return { email, role: member ? member.role : 'Member' };
    });

    const oldTeam = { ...project.teams[teamIndex] };
    project.teams[teamIndex] = {
      name: name || project.teams[teamIndex].name,
      description: description || project.teams[teamIndex].description,
      members: teamMembers || project.teams[teamIndex].members,
    };

    project.activityLog.push({
      message: `${user.email} updated team: ${project.teams[teamIndex].name} (Previous: ${JSON.stringify(oldTeam)})`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'team-update',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].teams = project.teams;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} updated team: ${project.teams[teamIndex].name} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Team updated:', project.teams[teamIndex]);
    res.json(project.teams[teamIndex]);
  } catch (err) {
    console.error('Projects Route - Error updating team:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a team
router.delete('/:projectId/teams/:teamIndex', auth, async (req, res) => {
  try {
    console.log('Projects Route - Deleting team in project:', req.params.projectId);
    const { projectId, teamIndex } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can delete teams' });
    }

    if (teamIndex >= project.teams.length) {
      console.log('Projects Route - Team not found:', teamIndex);
      return res.status(404).json({ message: 'Team not found' });
    }

    const teamName = project.teams[teamIndex].name;
    project.teams.splice(teamIndex, 1);
    project.activityLog.push({
      message: `${user.email} deleted team: ${teamName}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'team-delete',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].teams = project.teams;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} deleted team: ${teamName} in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Team deleted:', teamName);
    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    console.error('Projects Route - Error deleting team:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit a project suggestion
router.post('/:projectId/suggestions', auth, async (req, res) => {
  try {
    console.log('Projects Route - Submitting suggestion for project:', req.params.projectId);
    const { projectId } = req.params;
    const { content } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const newSuggestion = {
      content,
      author: user.email,
      timestamp: new Date().toISOString(),
    };

    project.suggestions.push(newSuggestion);
    project.activityLog.push({
      message: `${user.email} submitted a suggestion: ${content}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'suggestion-submit',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].suggestions = project.suggestions;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} submitted a suggestion in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Suggestion submitted:', newSuggestion);
    res.json(newSuggestion);
  } catch (err) {
    console.error('Projects Route - Error submitting suggestion:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project notification settings
router.put('/:projectId/settings/notifications', auth, async (req, res) => {
  try {
    console.log('Projects Route - Updating notification settings for project:', req.params.projectId);
    const { projectId } = req.params;
    const { email, sms, inApp } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const oldSettings = { ...project.settings.notifications };
    project.settings.notifications = {
      email: email !== undefined ? email : project.settings.notifications.email,
      sms: sms !== undefined ? sms : project.settings.notifications.sms,
      inApp: inApp !== undefined ? inApp : project.settings.notifications.inApp,
    };

    project.activityLog.push({
      message: `${user.email} updated notification settings: ${JSON.stringify(oldSettings)} to ${JSON.stringify(project.settings.notifications)}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'settings-update',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].settings = project.settings;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} updated notification settings in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Notification settings updated:', project.settings.notifications);
    res.json(project.settings.notifications);
  } catch (err) {
    console.error('Projects Route - Error updating notification settings:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-assign tasks to team members
router.post('/:projectId/tasks/auto-assign', auth, async (req, res) => {
  try {
    console.log('Projects Route - Auto-assigning tasks for project:', req.params.projectId);
    const { projectId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can auto-assign tasks' });
    }

    const members = project.members.filter(m => m.role !== 'Owner');
    const tasks = project.tasks;

    if (members.length === 0 || tasks.length === 0) {
      console.log('Projects Route - No members or tasks to auto-assign:', projectId);
      return res.status(400).json({ message: 'No members or tasks available for auto-assignment' });
    }

    const assignmentDetails = [];
    tasks.forEach((task, index) => {
      const assignedTo = members[index % members.length].email;
      task.assignedTo = assignedTo;
      assignmentDetails.push(`${task.title} assigned to ${assignedTo}`);
    });

    project.activityLog.push({
      message: `${user.email} auto-assigned tasks: ${assignmentDetails.join('; ')}`,
      timestamp: new Date().toISOString(),
      user: user.email,
      action: 'task-auto-assign',
    });

    await user.save();

    for (const member of project.members) {
      const memberUser = await User.findOne({ email: member.email });
      if (memberUser) {
        const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
        if (memberProjectIndex !== -1) {
          memberUser.projects[memberProjectIndex].tasks = project.tasks;
          memberUser.projects[memberProjectIndex].activityLog = project.activityLog;
          await memberUser.save();
          if (member.email !== user.email) {
            await sendNotification(memberUser, `${user.email} auto-assigned tasks in project: ${project.title}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Tasks auto-assigned:', project.tasks);
    res.json({ message: 'Tasks auto-assigned successfully', tasks: project.tasks });
  } catch (err) {
    console.error('Projects Route - Error auto-assigning tasks:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a project
router.delete('/:projectId', auth, async (req, res) => {
  try {
    console.log('Projects Route - Deleting project:', req.params.projectId);
    const { projectId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
    if (!isOwner) {
      console.log('Projects Route - User is not an owner:', user.email);
      return res.status(403).json({ message: 'Only project owners can delete projects' });
    }

    const projectTitle = project.title;
    user.projects.splice(projectIndex, 1);
    await user.save();

    for (const member of project.members) {
      if (member.email !== user.email) {
        const memberUser = await User.findOne({ email: member.email });
        if (memberUser) {
          const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
          if (memberProjectIndex !== -1) {
            memberUser.projects.splice(memberProjectIndex, 1);
            await memberUser.save();
            await sendNotification(memberUser, `Project ${projectTitle} has been deleted by ${user.email}`, projectId);
          }
        }
      }
    }

    console.log('Projects Route - Project deleted:', projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Projects Route - Error deleting project:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project contribution stats for transparency dashboard
router.get('/:projectId/contributions', auth, async (req, res) => {
  try {
    console.log('Projects Route - Fetching contribution stats for project:', req.params.projectId);
    const { projectId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Projects Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = user.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      console.log('Projects Route - Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = user.projects[projectIndex];
    const contributions = {};

    // Initialize contributions for each member
    project.members.forEach(member => {
      contributions[member.email] = {
        tasksCompleted: 0,
        postsCreated: 0,
        commentsMade: 0,
        filesUploaded: 0,
        suggestionsMade: 0,
      };
    });

    // Calculate contributions from activity log
    project.activityLog.forEach(log => {
      const email = log.user;
      if (!contributions[email]) return;

      if (log.action === 'task-update') {
        if (log.message.includes('Completed')) {
          contributions[email].tasksCompleted += 1;
        }
      } else if (log.action === 'post') {
        contributions[email].postsCreated += 1;
      } else if (log.action === 'comment' || log.action === 'task-comment' || log.action === 'subtask-comment') {
        contributions[email].commentsMade += 1;
      } else if (log.action === 'file-upload') {
        contributions[email].filesUploaded += 1;
      } else if (log.action === 'suggestion-submit') {
        contributions[email].suggestionsMade += 1;
      }
    });

    console.log('Projects Route - Contribution stats:', contributions);
    res.json(contributions);
  } catch (err) {
    console.error('Projects Route - Error fetching contribution stats:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/create', auth, async (req, res) => {
  try {
    const { title, color, image, members } = req.body;
    if (!title) return res.status(400).json({ msg: 'Title is required' });
    const project = new Project({
      title,
      color,
      image,
      members,
      owner: req.user.id,
    });
    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Project creation error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;