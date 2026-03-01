// backend/routes/projects.js
const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  getShips,
  createShip,
  deleteShip
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Project CRUD
router.route('/')
  .get(getProjects)
  .post(createProject);

// ── Priority 3.1: Smart Start AI endpoint ────────────────────────────────
// POST /api/projects/smart-start
// Takes { description, persona? }, returns AI-generated project plan
router.post('/smart-start', async (req, res) => {
  try {
    const { generateProjectPlan } = require('../services/aiService');
    const userId = req.user._id || req.user.id;
    const { description, persona } = req.body;

    const result = await generateProjectPlan(userId, description, persona);

    res.json({ success: true, ...result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.message || 'Failed to generate project plan'
    });
  }
});

router.route('/:id')

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

// Tasks
router.route('/:id/tasks')
  .get(getTasks)
  .post(createTask);

router.route('/:id/tasks/:taskId')
  .put(updateTask)
  .delete(deleteTask);

router.post('/:id/tasks/:taskId/complete', completeTask);

// Ships
router.route('/:id/ships')
  .get(getShips)
  .post(createShip);

router.delete('/:id/ships/:shipId', deleteShip);

module.exports = router;
