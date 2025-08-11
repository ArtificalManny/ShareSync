import { Router } from 'express';
import { logActivity } from '../utils/logActivity';
import { ActivityEvent } from '../models/activityEvent.model';

const router = Router();

/**
 * POST /api/activity
 * Body: { type: string, public?: boolean, ...other optional fields... }
 */
router.post('/', async (req, res) => {
  try {
    const { type } = req.body || {};
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: '`type` is required (string).' });
    }

    const saved = await logActivity(req.body);
    return res.status(201).json(saved);
  } catch (err) {
    console.error('[activity] log error:', err);
    return res.status(500).json({ error: 'Failed to log activity' });
  }
});

/**
 * GET /api/activity
 * Query: ?limit=50&cursor=<last_id>&publicOnly=true|false
 * Simple cursor pagination by _id descending.
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 200);
    const cursor = req.query.cursor as string | undefined;
    const publicOnly = String(req.query.publicOnly || 'false') === 'true';

    const query: any = {};
    if (cursor) query._id = { $lt: cursor };
    if (publicOnly) query.public = true;

    const items = await ActivityEvent.find(query).sort({ _id: -1 }).limit(limit);
    const nextCursor = items.length === limit ? String(items[items.length - 1]._id) : null;

    return res.json({ items, nextCursor });
  } catch (err) {
    console.error('[activity] list error:', err);
    return res.status(500).json({ error: 'Failed to list activity' });
  }
});

export default router;
