// src/routes/task.routes.ts
import { Router, Request, Response } from 'express';
import { Task } from '../models/task.model';
import { logActivity, type ActivityEventInput } from '../utils/logActivity';
import { shouldBePublic } from '../utils/privacy';

const router = Router();

/**
 * POST /api/tasks
 * body: { projectId, title, description?, assignedTo?, dueDate? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, title, description, assignedTo, dueDate } = req.body;
    const task = await Task.create({
      projectId,
      title,
      description,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    const payload: ActivityEventInput = {
      type: 'task:create',
      public: false,
      projectId: projectId || undefined,
      taskId: task._id.toString(),
      name: task.title,
      meta: { assignedTo: task.assignedTo ?? null },
    };
    await logActivity(payload);
    req.app.get('io')?.emit('activity', payload);

    res.status(201).json(task);
  } catch (err: any) {
    console.error('[tasks] create error', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * PATCH /api/tasks/:taskId/status
 * body: { status }
 *
 * If status transitions to 'Completed', emit a public task:complete (respecting privacy).
 */
router.patch('/:taskId/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const wasCompleted = task.status === 'Completed';
    task.status = status;
    await task.save();

    // Always log the internal update
    {
      const payload: ActivityEventInput = {
        type: 'task:update',
        public: false,
        projectId: String(task.projectId),
        taskId: task._id.toString(),
        name: task.title,
        meta: { status: task.status },
      };
      await logActivity(payload);
      req.app.get('io')?.emit('activity', payload);
    }

    // If it just became Completed, log a *public* task:complete if privacy allows
    if (status === 'Completed' && !wasCompleted) {
      const isPublic = await shouldBePublic({
        userId: (task as any).assignedTo ? String((task as any).assignedTo) : undefined,
        projectId: String(task.projectId),
      });

      const payload: ActivityEventInput = {
        type: 'task:complete',
        public: isPublic,
        projectId: String(task.projectId),
        taskId: task._id.toString(),
        name: task.title,
        meta: { status: task.status },
      };
      await logActivity(payload);
      req.app.get('io')?.emit('activity', payload);
    }

    res.json(task);
  } catch (err: any) {
    console.error('[tasks] update status error', err);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

/**
 * POST /api/tasks/:taskId/like
 */
router.post('/:taskId/like', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.likes = (task.likes || 0) + 1;
    await task.save();

    const payload: ActivityEventInput = {
      type: 'task:like',
      public: false,
      projectId: String(task.projectId),
      taskId: task._id.toString(),
      name: task.title,
    };
    await logActivity(payload);
    req.app.get('io')?.emit('activity', payload);

    res.json(task);
  } catch (err: any) {
    console.error('[tasks] like error', err);
    res.status(500).json({ error: 'Failed to like task' });
  }
});

/**
 * POST /api/tasks/:taskId/share
 */
router.post('/:taskId/share', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.shares = (task.shares || 0) + 1;
    await task.save();

    const payload: ActivityEventInput = {
      type: 'task:share',
      public: false,
      projectId: String(task.projectId),
      taskId: task._id.toString(),
      name: task.title,
    };
    await logActivity(payload);
    req.app.get('io')?.emit('activity', payload);

    res.json(task);
  } catch (err: any) {
    console.error('[tasks] share error', err);
    res.status(500).json({ error: 'Failed to share task' });
  }
});

/**
 * POST /api/tasks/:taskId/comments
 * body: { text, user }
 */
router.post('/:taskId/comments', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { text, user } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.comments.push({ text, user, timestamp: new Date() });
    await task.save();

    const payload: ActivityEventInput = {
      type: 'task:comment',
      public: false,
      projectId: String(task.projectId),
      taskId: task._id.toString(),
      name: task.title,
      meta: { text, user },
    };
    await logActivity(payload);
    req.app.get('io')?.emit('activity', payload);

    res.json(task);
  } catch (err: any) {
    console.error('[tasks] comment error', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;