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
