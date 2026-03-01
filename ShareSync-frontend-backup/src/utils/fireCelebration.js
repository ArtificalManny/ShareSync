// src/utils/fireCelebration.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Global celebration trigger utility
//
// Fire celebrations from ANY component without needing shared context.
// CelebrationRouter (mounted at app level) listens for these events.
//
// Usage:
//   import { fireCelebration } from '../utils/fireCelebration';
//   fireCelebration('taskComplete', { xp: 50, taskTitle: 'Fix bug' });
//   fireCelebration('levelUp', { level: 5 });
//   fireCelebration('shipCeremony', { xp: 100, projectName: 'ShareSync' });
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Dispatch a celebration event that CelebrationRouter picks up.
 *
 * @param {'taskComplete'|'xpAward'|'levelUp'|'streakMilestone'|'focusComplete'|'shipCeremony'} eventType
 * @param {Object} data — arbitrary payload (xp, taskTitle, level, etc.)
 */
export function fireCelebration(eventType, data = {}) {
  if (typeof window === 'undefined') return;

  try {
    window.dispatchEvent(
      new CustomEvent('celebration-trigger', {
        detail: { eventType, data },
      })
    );
  } catch (err) {
    // Non-fatal — celebrations are nice-to-have, never critical
    console.warn('[fireCelebration] Failed to dispatch:', err?.message);
  }
}

/**
 * Convenience shortcuts
 */
export const celebrateTaskComplete = (data) => fireCelebration('taskComplete', data);
export const celebrateXP = (data) => fireCelebration('xpAward', data);
export const celebrateLevelUp = (data) => fireCelebration('levelUp', data);
export const celebrateStreak = (data) => fireCelebration('streakMilestone', data);
export const celebrateFocus = (data) => fireCelebration('focusComplete', data);
export const celebrateShip = (data) => fireCelebration('shipCeremony', data);

export default fireCelebration;
