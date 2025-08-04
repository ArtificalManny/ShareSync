// ✅ /routes/comments.ts
import { Router } from 'express'
import { logUserActivity } from '../src/utils/logUserActivity'

const router = Router()

router.post('/comment', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const { id: userId } = req.user as { id: string }
  await logUserActivity(userId, 'comment')
  res.status(200).json({ message: 'Comment activity logged' })
})

export default router
