// src/routes/streakFeed.routes.ts
import express from 'express';
import { Types } from 'mongoose';
import { StreakFeedItem } from '../models/streakFeedItem.model';

const router = express.Router();

/**
 * GET /api/streak-feed
 * Query params:
 *  - type: 'streak' | 'levelUp' | 'taskComplete' (optional)
 *  - since: '24h' | '7d' | '30d' | 'all'         (optional, default '7d')
 *  - sort: 'top' | 'new'                         (optional, default 'new')
 *  - limit: number                               (optional, default 20, max 50)
 *  - cursor: string (base64)                     (optional, server-provided)
 *  - userId: string                              (optional)
 *  - projectId: string                           (optional)
 *
 * Response:
 *  { items: [...], nextCursor?: string }
 */
router.get('/', async (req, res) => {
  try {
    const {
      type,
      since = '7d',
      sort = 'new',
      cursor,
      userId,
      projectId,
    } = req.query as {
      type?: 'streak' | 'levelUp' | 'taskComplete';
      since?: '24h' | '7d' | '30d' | 'all';
      sort?: 'top' | 'new';
      cursor?: string;
      userId?: string;
      projectId?: string;
    };

    // clamp page size
    const rawLimit = Number(req.query.limit) || 20;
    const limit = Math.max(1, Math.min(rawLimit, 50));

    // base filters
    const match: Record<string, any> = {};
    if (type && ['streak', 'levelUp', 'taskComplete'].includes(type)) {
      match.type = type;
    }
    if (userId) match.userId = userId;
    if (projectId) match.projectId = projectId;

    // time window
    if (since !== 'all') {
      const now = new Date();
      let cutoff: Date | null = null;
      if (since === '24h') cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (since === '7d') cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (since === '30d') cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (cutoff) {
        // Support legacy docs that only had `timestamp` by projecting a virtual `ts`
        match.$expr = {
          $gte: [
            { $ifNull: ['$createdAt', '$timestamp'] },
            cutoff,
          ],
        };
      }
    }

    // decode cursor
    let cursorObj: any = null;
    if (cursor) {
      try {
        cursorObj = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
      } catch {
        // ignore bad cursor
      }
    }

    // pipeline
    const pipeline: any[] = [
      { $match: match },
      // Create a uniform sort key `ts` that works for both createdAt and legacy timestamp
      {
        $addFields: {
          ts: { $ifNull: ['$createdAt', '$timestamp'] },
        },
      },
    ];

    if (sort === 'top') {
      // compute counts before cursor + sort
      pipeline.push({
        $addFields: {
          reactionCount: {
            $sum: {
              $map: {
                input: { $objectToArray: '$reactions' },
                as: 'kv',
                in: { $size: { $ifNull: ['$$kv.v', []] } },
              },
            },
          },
          replyCount: { $size: { $ifNull: ['$replies', []] } },
        },
      });

      // cursor for top: rc DESC, then ts DESC, then _id DESC
      if (cursorObj && typeof cursorObj.rc === 'number' && cursorObj.ts && cursorObj.id) {
        const ts = new Date(cursorObj.ts);
        const oid = new Types.ObjectId(cursorObj.id);
        pipeline.push({
          $match: {
            $or: [
              { reactionCount: { $lt: cursorObj.rc } },
              { $and: [{ reactionCount: cursorObj.rc }, { ts: { $lt: ts } }] },
              { $and: [{ reactionCount: cursorObj.rc }, { ts: ts }, { _id: { $lt: oid } }] },
            ],
          },
        });
      }

      pipeline.push({ $sort: { reactionCount: -1, ts: -1, _id: -1 } });
      pipeline.push({ $limit: limit });
    } else {
      // sort === 'new' : ts DESC, _id DESC
      if (cursorObj && cursorObj.ts && cursorObj.id) {
        const ts = new Date(cursorObj.ts);
        const oid = new Types.ObjectId(cursorObj.id);
        pipeline.push({
          $match: {
            $or: [{ ts: { $lt: ts } }, { $and: [{ ts: ts }, { _id: { $lt: oid } }] }],
          },
        });
      }

      pipeline.push({
        $addFields: {
          reactionCount: {
            $sum: {
              $map: {
                input: { $objectToArray: '$reactions' },
                as: 'kv',
                in: { $size: { $ifNull: ['$$kv.v', []] } },
              },
            },
          },
          replyCount: { $size: { $ifNull: ['$replies', []] } },
        },
      });

      pipeline.push({ $sort: { ts: -1, _id: -1 } });
      pipeline.push({ $limit: limit });
    }

    // trim payload
    pipeline.push({
      $project: {
        reactions: 1,
        replies: 1,
        reactionCount: 1,
        replyCount: 1,
        type: 1,
        userId: 1,
        username: 1,
        projectId: 1,
        name: 1,
        title: 1,
        // expose both createdAt and ts for safety (ts = createdAt || timestamp)
        createdAt: 1,
        ts: 1,
      },
    });

    const items = await StreakFeedItem.aggregate(pipeline);

    // next cursor
    let nextCursor: string | undefined;
    if (items.length === limit) {
      const last = items[items.length - 1];
      if (sort === 'top') {
        nextCursor = Buffer.from(
          JSON.stringify({ rc: last.reactionCount || 0, ts: last.ts || last.createdAt, id: String(last._id) }),
          'utf8'
        ).toString('base64');
      } else {
        nextCursor = Buffer.from(
          JSON.stringify({ ts: last.ts || last.createdAt, id: String(last._id) }),
          'utf8'
        ).toString('base64');
      }
    }

    return res.json({ items, nextCursor });
  } catch (err) {
    console.error('[streak-feed] fetch error', err);
    return res.status(500).json({ error: 'Failed to fetch streak feed' });
  }
});

// POST /api/streak-feed/:id/react
router.post('/:id/react', async (req, res) => {
  try {
    const { emoji, username } = req.body as { emoji: string; username: string };
    const feedItem = await StreakFeedItem.findById(req.params.id);
    if (!feedItem) return res.status(404).send('Not found');

    const current = (feedItem as any).reactions.get(emoji) || [];
    const updated = current.includes(username)
      ? current.filter((u: string) => u !== username)
      : [...current, username];

    (feedItem as any).reactions.set(emoji, updated);
    await (feedItem as any).save();

    return res.json(feedItem);
  } catch (err) {
    console.error('[streak-feed] react error', err);
    return res.status(500).json({ error: 'Failed to react' });
  }
});

// POST /api/streak-feed/:id/reply
router.post('/:id/reply', async (req, res) => {
  try {
    const { userId, username, avatar, message } = req.body as {
      userId?: string;
      username?: string;
      avatar?: string;
      message: string;
    };

    const feedItem = await StreakFeedItem.findById(req.params.id);
    if (!feedItem) return res.status(404).send('Not found');

    (feedItem as any).replies.push({
      userId,
      username,
      avatar,
      message,
      timestamp: new Date(),
    });

    await (feedItem as any).save();
    return res.json(feedItem);
  } catch (err) {
    console.error('[streak-feed] reply error', err);
    return res.status(500).json({ error: 'Failed to reply' });
  }
});

export default router;