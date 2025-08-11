// src/routes/post.routes.ts
import { Router, Request, Response } from 'express'
import { Post } from '../models/post.model'
import { logActivity, type ActivityEventInput } from '../utils/logActivity'

const router = Router()

/**
 * POST /api/posts
 * body: { projectId, type: 'announcement' | 'update', content, author? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, type, content, author } = req.body
    const post = await Post.create({ projectId, type, content, author })

    const payload: ActivityEventInput = {
      type: 'post:create',
      public: true,
      projectId: projectId || undefined,
      postId: post._id.toString(),
      name: author || 'Unknown',
      meta: { kind: type, preview: String(content ?? '').slice(0, 160) },
    }
    await logActivity(payload)
    req.app.get('io')?.emit('activity', payload)

    res.status(201).json(post)
  } catch (err: any) {
    console.error('[posts] create error', err)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

export default router
