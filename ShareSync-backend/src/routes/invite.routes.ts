// src/routes/invite.routes.ts
import express, { Request, Response } from 'express'
import crypto from 'crypto'
import { Invite } from '../models/invite.model'
import { logActivity, type ActivityEventInput } from '../utils/logActivity'

const router = express.Router()

/**
 * POST /api/invites/send
 * body: { email: string; message?: string; inviterId?: string; projectId?: string }
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { email, message, inviterId, projectId } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const token = crypto.randomBytes(24).toString('hex')

    const invite = await Invite.create({
      email,
      message,
      inviterId,
      projectId,
      token,
      accepted: false,
    })

    const payload: ActivityEventInput = {
      type: 'invite:sent',
      public: false,                            // internal
      projectId: projectId || undefined,
      name: email,
      userId: inviterId || undefined,
      meta: { inviteId: invite._id.toString() },
    }
    await logActivity(payload)
    const io = req.app.get('io')
    io?.emit('activity', payload)

    res.json({ ok: true, inviteId: invite._id, token })
  } catch (err) {
    console.error('[invites/send] error', err)
    res.status(500).json({ error: 'Failed to send invite' })
  }
})

/**
 * GET /api/invites/accept/:token
 * Marks the invite as accepted (and can attach user to project if needed).
 */
router.get('/accept/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    const invite = await Invite.findOne({ token })
    if (!invite) return res.status(404).json({ error: 'Invite not found' })

    if (invite.accepted) {
      return res.json({ ok: true, message: 'Already accepted' })
    }

    invite.accepted = true
    await invite.save()

    // OPTIONAL: add to project members here if desired (you had this earlier)

    const payload: ActivityEventInput = {
      type: 'invite:accepted',
      public: true,                             // ✅ public celebration
      projectId: invite.projectId ? String(invite.projectId) : undefined,
      name: invite.email,
      meta: { inviteId: invite._id.toString() },
    }
    await logActivity(payload)
    const io = req.app.get('io')
    io?.emit('activity', payload)

    res.json({ ok: true })
  } catch (err) {
    console.error('[invites/accept] error', err)
    res.status(500).json({ error: 'Failed to accept invite' })
  }
})

export default router