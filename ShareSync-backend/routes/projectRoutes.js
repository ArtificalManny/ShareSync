// backend/routes/projectRoutes.js

// This is the "Listener" for joining a project
router.post('/:projectId/join', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body; // Sent from your frontend

    // 1. Find the project in the database
    const project = await Project.findById(projectId);
    
    // 2. Add the user to the members array if they aren't already there
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
      
      // 3. (Optional) Tell everyone else via WebSockets
      io.emit('project_updated', { projectId, memberCount: project.members.length });
      
      return res.status(200).json({ message: "Welcome to the mission!" });
    }
    
    res.status(400).json({ message: "You are already on this deck." });
  } catch (err) {
    res.status(500).json({ error: "System failure during join sequence." });
  }
});