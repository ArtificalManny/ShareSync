// /src/routes/ai.routes.ts
import express from 'express'
import { generateAISuggestion } from '../utils/generateAISuggestion'

const router = express.Router()

// POST /api/ai/suggestion
// Body: { streakDays, totalXP, tasksCompletedToday, tasksThisWeek, longestStreak?, taskCompletionRate? }
router.post('/suggestion', (req, res) => {
  try {
    const suggestion = generateAISuggestion(req.body || {})
    return res.json({ suggestion })
  } catch (err) {
    console.error('[AI] suggestion error', err)
    return res.status(500).json({ error: 'Failed to generate suggestion' })
  }
})

export default router
