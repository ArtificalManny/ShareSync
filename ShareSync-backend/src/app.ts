// /Users/artificalmanny/Portfolio/ShareSync/ShareSync-backend/src/app.ts
import express from 'express';
import cors from 'cors';

// routes
import inviteRoutes from './routes/invite.routes';
import streakFeedRoutes from './routes/streakFeed.routes';
import aiRoutes from './routes/ai.routes';
import taskRouter from './routes/task.routes';
import postRouter from './routes/post.routes';
import activityRoutes from './routes/activity.routes';
import xpRoutes from './routes/xp.routes'

// NOTE: projects route is a JS file. Import it like this:
const projectsRouter = require('./routes/projects.js');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// mount routes
app.use('/api/invites', inviteRoutes);
app.use('/api/streak-feed', streakFeedRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRouter);
app.use('/api/posts', postRouter);
app.use('/api/activity', activityRoutes);

// 🔗 mount projects (fixes 404 on /api/projects)
app.use('/api/projects', projectsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[app] error', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('/api/xp', xpRoutes)


export default app;