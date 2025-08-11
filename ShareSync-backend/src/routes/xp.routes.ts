// src/routes/xp.routes.ts
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { logActivity } from '../utils/logActivity';
import { shouldBePublic } from '../utils/privacy';

const router = Router();

/**
 * POST /api/xp/award
 * body: { userId: string, delta: number }
 * NOTE: This assumes your User model has xp and level fields.
 */
router.post('/award', async (req: Request, res: Response) => {
  try {
    const { userId, delta } = req.body;
    if (!userId || typeof delta !== 'number') {
      return res.status(400).json({ error: 'userId and numeric delta are required' });
    }

    const User: any = (mongoose.models as any).User;
    if (!User) return res.status(500).json({ error: 'User model not registered' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const beforeXp = user.xp || 0;
    const beforeLevel = user.level || 1;

    user.xp = beforeXp + delta;

    // Example level formula; keep your own if you already have one.
    const calcLevel = (xp: number) => Math.max(1, Math.floor(xp / 100) + 1);
    const newLevel = calcLevel(user.xp);

    if (newLevel > beforeLevel) {
      user.level = newLevel;
    }

    await user.save();

    // If they leveled up, log public level-up only if privacy allows
    if (newLevel > beforeLevel) {
      const pub = await shouldBePublic({ userId, projectId: null });

      const payload = {
        type: 'streak:levelup',
        public: pub,
        userId,
        username: user.username || user.email,
        name: user.username || user.email,
        meta: { from: beforeLevel, to: newLevel },
      };
      await logActivity(payload);
      req.app.get('io')?.emit('activity', payload);
    }

    res.json({ ok: true, xp: user.xp, level: user.level });
  } catch (err) {
    console.error('[xp] award error', err);
    res.status(500).json({ error: 'Failed to award XP' });
  }
});

export default router;