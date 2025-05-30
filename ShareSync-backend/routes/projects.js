const express = require('express');
   const router = express.Router();
   const User = require('../models/User');
   const auth = require('../middleware/auth');

   // Create a new project
   router.post('/', auth, async (req, res) => {
     try {
       console.log('Projects Route - Creating new project for user:', req.user.id);
       const { title, description } = req.body;

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
         status: 'Not Started',
         posts: [],
         comments: [],
         activityLog: [{ message: `${user.email} created the project`, timestamp: new Date().toISOString() }],
         members: [{ email: user.email, role: 'Owner', profilePicture: user.profilePicture }],
         tasks: [],
         tasksCompleted: 0,
         totalTasks: 0,
       };

       user.projects.push(newProject);
       const savedUser = await user.save();
       console.log('Projects Route - Project saved to MongoDB:', newProject.id);
       console.log('Projects Route - Updated user projects:', savedUser.projects);
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

       user.projects[projectIndex] = { ...user.projects[projectIndex], ...updates };
       await user.save();

       const project = user.projects[projectIndex];
       for (const member of project.members) {
         if (member.email !== user.email) {
           const memberUser = await User.findOne({ email: member.email });
           if (memberUser) {
             const memberProjectIndex = memberUser.projects.findIndex((p) => p.id === projectId);
             if (memberProjectIndex !== -1) {
               memberUser.projects[memberProjectIndex] = { ...memberUser.projects[memberProjectIndex], ...updates };
               await memberUser.save();
             }
           }
         }
       }

       console.log('Projects Route - Project updated:', projectId);
       res.json(user.projects[projectIndex]);
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

       const projectCopy = { ...project, members: project.members };
       invitedUser.projects.push(projectCopy);

       invitedUser.notifications.push({
         message: `You have been invited to join project: ${project.title}`,
         timestamp: new Date().toISOString(),
       });

       await user.save();
       await invitedUser.save();
       console.log('Projects Route - Invite sent to:', email);
       res.json({ message: 'Invite sent successfully' });
     } catch (err) {
       console.error('Projects Route - Error sending invite:', err.message);
       res.status(500).json({ message: 'Server error' });
     }
   });

   module.exports = router;