// src/routes/pulse.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.4: Pulse Check Routes
// ═══════════════════════════════════════════════════════════════════════════════
//
// POST /api/pulse/submit         — Submit today's pulse (+15 XP)
// GET  /api/pulse/history        — Personal pulse history
// GET  /api/pulse/team/:projectId — Team energy data (for heatmap)
//
// ═══════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();

let requireAuth;
try { requireAuth = require('../middleware/auth'); } catch { requireAuth = require('../auth'); }

const PulseCheck = require('../../models/PulseCheck');
const User = require('../../models/User');
const { checkBurnout } = require('../../services/burnoutDetector');

// ─────────────────────────────────────────────────────────────────────────
// HELPER: Normalize date to start of day (UTC)
// ─────────────────────────────────────────────────────────────────────────
function startOfDayUTC(date) {
  const d = new Date(date || Date.now());
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/pulse/submit
// ═══════════════════════════════════════════════════════════════════════════
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { energy, focusTaskId, focusTaskText, blocker, projectId } = req.body;

    // ── Validate energy ──
    const energyNum = Number(energy);
    if (!energyNum || energyNum < 1 || energyNum > 5) {
      return res.status(400).json({ message: 'energy must be 1-5' });
    }

    const today = startOfDayUTC();

    // ── Check for duplicate (one pulse per day) ──
    const existing = await PulseCheck.findOne({ userId, date: today });
    if (existing) {
      return res.status(409).json({
        message: 'Pulse already submitted today',
        pulse: existing,
      });
    }

    // ── Create pulse ──
    const XP_REWARD = 15;

    const pulse = new PulseCheck({
      userId,
      date: today,
      energy: energyNum,
      focusTaskId: focusTaskId || null,
      focusTaskText: focusTaskText || '',
      blocker: {
        hasBlocker: Boolean(blocker?.hasBlocker),
        description: blocker?.description || '',
      },
      xpAwarded: XP_REWARD,
      projectId: projectId || null,
    });

    await pulse.save();

    // ── Award XP to user (safe — won't crash if method missing) ──
    try {
      const user = await User.findById(userId);
      if (user && typeof user.addXP === 'function') {
        await user.addXP(XP_REWARD, 'Daily pulse check');
      } else if (user) {
        // Fallback: manual XP update
        user.gamification = user.gamification || {};
        user.gamification.totalXP = (user.gamification.totalXP || 0) + XP_REWARD;
        await user.save();
      }
    } catch (xpErr) {
      console.warn('[pulse/submit] XP award failed (non-fatal):', xpErr.message);
    }

    // ── Burnout detection (async, non-blocking) ──
    let burnoutStatus = { isBurnout: false, streak: 0, severity: 'none' };
    try {
      burnoutStatus = await checkBurnout(userId);
    } catch (burnoutErr) {
      console.warn('[pulse/submit] Burnout check failed (non-fatal):', burnoutErr.message);
    }

    res.status(201).json({
      message: 'Pulse submitted',
      pulse,
      xpAwarded: XP_REWARD,
      burnout: burnoutStatus,
    });
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Pulse already submitted today' });
    }
    console.error('[pulse/submit] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/pulse/history?days=30
// ═══════════════════════════════════════════════════════════════════════════
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = Math.min(Number(req.query.days) || 30, 90); // Cap at 90

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const pulses = await PulseCheck.find({
      userId,
      date: { $gte: cutoff },
    })
      .sort({ date: -1 })
      .lean();

    // Compute quick stats
    const energies = pulses.map((p) => p.energy);
    const avgEnergy = energies.length > 0
      ? Math.round((energies.reduce((s, e) => s + e, 0) / energies.length) * 10) / 10
      : 0;
    const blockerCount = pulses.filter((p) => p.blocker?.hasBlocker).length;

    res.json({
      pulses,
      totalDays: pulses.length,
      avgEnergy,
      blockerCount,
    });
  } catch (error) {
    console.error('[pulse/history] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/pulse/team/:projectId?days=14
// ═══════════════════════════════════════════════════════════════════════════
router.get('/team/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const days = Math.min(Number(req.query.days) || 14, 30); // Cap at 30

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Get all pulses for this project in the date range
    const pulses = await PulseCheck.find({
      projectId,
      date: { $gte: cutoff },
    })
      .sort({ date: -1 })
      .populate('userId', 'firstName lastName username')
      .lean();

    // Group by user
    const memberMap = {};
    const daySet = new Set();

    for (const pulse of pulses) {
      const userName = pulse.userId
        ? `${pulse.userId.firstName || ''} ${pulse.userId.lastName || ''}`.trim() || pulse.userId.username
        : 'Unknown';
      const userId = pulse.userId?._id?.toString() || 'unknown';

      if (!memberMap[userId]) {
        memberMap[userId] = { name: userName, pulses: [] };
      }

      const dayKey = new Date(pulse.date).toISOString().split('T')[0];
      memberMap[userId].pulses.push({
        date: dayKey,
        energy: pulse.energy,
        hasBlocker: pulse.blocker?.hasBlocker || false,
      });
      daySet.add(dayKey);
    }

    // Generate all days in range
    const allDays = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      allDays.push(d.toISOString().split('T')[0]);
    }

    res.json({
      members: Object.values(memberMap),
      days: allDays,
      totalPulses: pulses.length,
    });
  } catch (error) {
    console.error('[pulse/team] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
