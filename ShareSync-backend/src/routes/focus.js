// backend/src/routes/focus.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.3: Focus Block REST endpoints
// POST /api/focus/start  — Start a focus block
// POST /api/focus/stop   — Stop active focus block
// GET  /api/focus/active — Get current active block (if any)
// GET  /api/focus/history — Get recent focus block history
//
// SAFETY: All endpoints wrapped in try/catch. Socket broadcast is optional
// (won't crash if io not available). XP award wrapped in try/catch.
// ═══════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const FocusBlock = require('../../models/FocusBlock');

// All routes require authentication
router.use(protect);

// ── POST /api/focus/start ────────────────────────────────────────────────
// Start a new focus block. Auto-stops any existing active block first.
router.post('/start', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { taskId, taskName, projectId, label, duration } = req.body;

    // Validate duration
    const mins = Number(duration);
    if (!mins || mins < 1 || mins > 480) {
      return res.status(400).json({ error: 'Duration must be 1-480 minutes' });
    }

    // Auto-stop any existing active block for this user
    const existing = await FocusBlock.findOne({ userId, status: 'active' });
    if (existing) {
      existing.status = 'cancelled';
      existing.endedAt = new Date();
      existing.actualDuration = Math.round((existing.endedAt - existing.startedAt) / 60000);
      await existing.save();
    }

    // Create new focus block
    const block = await FocusBlock.create({
      userId,
      taskId: taskId || null,
      taskName: String(taskName || '').slice(0, 200),
      projectId: projectId || null,
      label: String(label || '').slice(0, 100),
      duration: mins,
      startedAt: new Date(),
      status: 'active',
      xpMultiplier: 2
    });

    // ── Socket broadcast (optional, non-fatal) ──────────────────────
    try {
      const io = req.app.get('io');
      if (io && projectId) {
        io.to(`project:${projectId}`).emit('user:focus-start', {
          userId,
          userName: req.user.firstName || req.user.username || 'Someone',
          blockId: block._id,
          taskName: block.taskName,
          duration: block.duration,
          startedAt: block.startedAt
        });
      }
    } catch (socketErr) {
      console.warn('[Focus] Socket broadcast failed (non-fatal):', socketErr.message);
    }

    res.status(201).json({
      success: true,
      block: {
        id: block._id,
        duration: block.duration,
        taskName: block.taskName,
        startedAt: block.startedAt,
        status: block.status,
        xpMultiplier: block.xpMultiplier
      }
    });
  } catch (err) {
    console.error('[Focus] Start error:', err.message);
    res.status(500).json({ error: 'Failed to start focus block' });
  }
});

// ── POST /api/focus/stop ─────────────────────────────────────────────────
// Stop the current active focus block. Awards XP based on actual duration.
router.post('/stop', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const block = await FocusBlock.findOne({ userId, status: 'active' });
    if (!block) {
      return res.status(404).json({ error: 'No active focus block found' });
    }

    // Calculate actual duration
    const now = new Date();
    const actualMinutes = Math.round((now - block.startedAt) / 60000);

    // Award XP: 2 XP per minute of actual focus time
    const xpEarned = Math.min(actualMinutes * 2, block.duration * 2);

    block.endedAt = now;
    block.actualDuration = actualMinutes;
    block.status = 'completed';
    block.xpAwarded = xpEarned;
    await block.save();

    // ── Safe XP award to user ───────────────────────────────────────
    try {
      const User = require('../../models/User');
      const user = await User.findById(userId);
      if (user) {
        if (typeof user.addXP === 'function') {
          await user.addXP(xpEarned, 'focus_block');
        } else {
          // Fallback: direct field update
          await User.findByIdAndUpdate(userId, { $inc: { xp: xpEarned } });
        }
      }
    } catch (xpErr) {
      console.warn('[Focus] XP award failed (non-fatal):', xpErr.message);
    }

    // ── Socket broadcast (optional, non-fatal) ──────────────────────
    try {
      const io = req.app.get('io');
      if (io && block.projectId) {
        io.to(`project:${block.projectId}`).emit('user:focus-end', {
          userId,
          userName: req.user.firstName || req.user.username || 'Someone',
          blockId: block._id,
          actualDuration: actualMinutes,
          xpEarned
        });
      }
    } catch (socketErr) {
      console.warn('[Focus] Socket broadcast failed (non-fatal):', socketErr.message);
    }

    res.json({
      success: true,
      block: {
        id: block._id,
        duration: block.duration,
        actualDuration: actualMinutes,
        xpAwarded: xpEarned,
        startedAt: block.startedAt,
        endedAt: block.endedAt,
        status: block.status
      }
    });
  } catch (err) {
    console.error('[Focus] Stop error:', err.message);
    res.status(500).json({ error: 'Failed to stop focus block' });
  }
});

// ── GET /api/focus/active ────────────────────────────────────────────────
// Get the current user's active focus block (if any)
router.get('/active', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const block = await FocusBlock.findOne({ userId, status: 'active' }).lean();

    if (!block) {
      return res.json({ active: false, block: null });
    }

    res.json({
      active: true,
      block: {
        id: block._id,
        duration: block.duration,
        taskName: block.taskName,
        label: block.label,
        startedAt: block.startedAt,
        xpMultiplier: block.xpMultiplier,
        elapsed: Math.round((Date.now() - new Date(block.startedAt).getTime()) / 60000)
      }
    });
  } catch (err) {
    console.error('[Focus] Active check error:', err.message);
    res.status(500).json({ error: 'Failed to check active focus block' });
  }
});

// ── GET /api/focus/history ───────────────────────────────────────────────
// Get recent focus block history for the current user
router.get('/history', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    const blocks = await FocusBlock.find({
      userId,
      status: { $in: ['completed', 'cancelled'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Calculate totals
    const completed = blocks.filter(b => b.status === 'completed');
    const totalMinutes = completed.reduce((sum, b) => sum + (b.actualDuration || 0), 0);
    const totalXP = completed.reduce((sum, b) => sum + (b.xpAwarded || 0), 0);

    res.json({
      blocks: blocks.map(b => ({
        id: b._id,
        duration: b.duration,
        actualDuration: b.actualDuration,
        taskName: b.taskName,
        label: b.label,
        status: b.status,
        xpAwarded: b.xpAwarded,
        startedAt: b.startedAt,
        endedAt: b.endedAt
      })),
      stats: {
        totalSessions: completed.length,
        totalMinutes,
        totalXP,
        avgDuration: completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0
      }
    });
  } catch (err) {
    console.error('[Focus] History error:', err.message);
    res.status(500).json({ error: 'Failed to fetch focus history' });
  }
});

module.exports = router;
