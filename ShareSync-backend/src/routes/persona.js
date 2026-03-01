// backend/src/routes/persona.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.1: Persona REST endpoints
// GET  /api/users/persona  — returns current persona string
// PUT  /api/users/persona  — validates + saves persona to User model
//
// SAFETY:
// - Validates against whitelist of allowed values
// - Falls back to 'creator' if field doesn't exist yet
// - All endpoints wrapped in try/catch
// - Zero impact on existing User fields
// ═══════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');

// Allowed persona values — must match frontend config/personaLanguage.js
const VALID_PERSONAS = ['student', 'creator', 'professional', 'teamlead'];
const DEFAULT_PERSONA = 'creator';

// All routes require authentication
router.use(protect);

// ── GET /api/users/persona ───────────────────────────────────────────────
// Returns the current user's persona setting
router.get('/persona', async (req, res) => {
  try {
    const User = require('../../models/User');
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId).select('persona').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const persona = VALID_PERSONAS.includes(user.persona) ? user.persona : DEFAULT_PERSONA;

    res.json({
      success: true,
      persona,
    });
  } catch (err) {
    console.error('[Persona] GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch persona' });
  }
});

// ── PUT /api/users/persona ───────────────────────────────────────────────
// Updates the current user's persona setting
router.put('/persona', async (req, res) => {
  try {
    const User = require('../../models/User');
    const userId = req.user._id || req.user.id;
    const { persona } = req.body;

    // Validate
    if (!persona || !VALID_PERSONAS.includes(persona)) {
      return res.status(400).json({
        error: `Invalid persona. Must be one of: ${VALID_PERSONAS.join(', ')}`,
      });
    }

    // Update user — use $set to add field even if it didn't exist before
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { persona } },
      { new: true, select: 'persona' }
    );

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      persona: updated.persona,
    });
  } catch (err) {
    console.error('[Persona] PUT error:', err.message);
    res.status(500).json({ error: 'Failed to update persona' });
  }
});

module.exports = router;
