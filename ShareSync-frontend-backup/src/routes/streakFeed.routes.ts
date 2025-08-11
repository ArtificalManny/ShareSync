import express from 'express';
import { StreakFeedItem } from '../../../ShareSync-backend/src/models/streakFeedItem.model'


const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await StreakFeedItem.find().sort({ timestamp: -1 }).limit(30);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch streak feed' });
  }
});

export default router;
