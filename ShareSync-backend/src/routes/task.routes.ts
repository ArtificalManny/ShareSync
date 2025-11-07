// backend/src/routes/task.routes.ts
import { Router } from 'express';
import { Task } from '../models/task.model';   // ← now exports Task
import { TasksService } from '../models/task.model';

const router = Router();

router.get('/:projectId/tasks', async (req, res) => {
  const { projectId } = req.params;
  const tasks = await (req.app.get('tasksService') as TasksService).list(projectId);
  res.json(tasks);
});

export default router;