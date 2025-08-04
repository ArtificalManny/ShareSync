import express from 'express'
import { PrismaClient } from '@prisma/client'
import { logUserActivity } from '../src/utils/logUserActivity'

const router = express.Router()
const prisma = new PrismaClient()

router.post('/:id/complete', async (req, res) => {
  try {
    const userId = (req.user as any)?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const taskId = req.params.id

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        completed: true,
        completedById: userId,
        completedAt: new Date()
      }
    })

    await logUserActivity(userId, 'COMPLETE_TASK', taskId)

    return res.json(updatedTask)
  } catch (err) {
    console.error('[POST /tasks/:id/complete]', err)
    return res.status(500).json({ message: 'Error completing task' })
  }
})

router.post('/:id/assign', async (req, res) => {
  try {
    const userId = (req.user as any)?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const taskId = req.params.id
    const { assigneeId } = req.body

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: assigneeId
      }
    })

    await logUserActivity(userId, 'ASSIGN_TASK', taskId)

    return res.json(updatedTask)
  } catch (err) {
    console.error('[POST /tasks/:id/assign]', err)
    return res.status(500).json({ message: 'Error assigning task' })
  }
})

router.post('/', async (req, res) => {
  try {
    const userId = (req.user as any)?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { title, description, projectId } = req.body

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        createdById: userId
      }
    })

    await logUserActivity(userId, 'CREATE_TASK', newTask.id)

    return res.status(201).json(newTask)
  } catch (err) {
    console.error('[POST /tasks]', err)
    return res.status(500).json({ message: 'Error creating task' })
  }
})

export default router
