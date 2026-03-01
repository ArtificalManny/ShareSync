// services/burnoutDetector.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.4: Burnout Detection Service
// ═══════════════════════════════════════════════════════════════════════════════
//
// Called after each pulse submission.
// Checks if the last 3+ pulses are energy ≤ 2.
// Returns a burnout flag + severity.
//
// For now: returns data. Does NOT send notifications (avoids scope creep).
// When you're ready for team lead notifications, add a notify() call here.
//
// ═══════════════════════════════════════════════════════════════════════════════

const PulseCheck = require('../models/PulseCheck');

/**
 * Check burnout status for a user.
 *
 * @param {string} userId - The user's _id
 * @param {number} lookbackCount - How many recent pulses to check (default: 5)
 * @returns {Object} { isBurnout, streak, severity, recentPulses }
 */
async function checkBurnout(userId, lookbackCount = 5) {
  try {
    const recentPulses = await PulseCheck.find({ userId })
      .sort({ date: -1 })
      .limit(lookbackCount)
      .select('energy date')
      .lean();

    if (!recentPulses || recentPulses.length < 3) {
      return {
        isBurnout: false,
        streak: 0,
        severity: 'none',
        recentPulses: recentPulses || [],
      };
    }

    // Count consecutive low-energy pulses (most recent first)
    let lowStreak = 0;
    for (const pulse of recentPulses) {
      if (pulse.energy <= 2) {
        lowStreak++;
      } else {
        break;
      }
    }

    const severity =
      lowStreak >= 5 ? 'critical' :
      lowStreak >= 3 ? 'warning' :
      'none';

    return {
      isBurnout: lowStreak >= 3,
      streak: lowStreak,
      severity,
      recentPulses,
    };
  } catch (error) {
    console.error('[burnoutDetector] checkBurnout error:', error);
    return {
      isBurnout: false,
      streak: 0,
      severity: 'none',
      recentPulses: [],
      error: error.message,
    };
  }
}

module.exports = { checkBurnout };
