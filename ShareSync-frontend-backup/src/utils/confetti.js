// Tiny confetti helper with reduced-motion guard and safe lazy import.
// Usage:
//   import { fireConfetti } from '@/utils/confetti'
//   fireConfetti('sprint_win', { particleCount: 120 })
//
// Notes:
// - No-ops if prefers-reduced-motion is on.
// - Debounces per key for a short window so you don't flood the screen.

let hasFired = Object.create(null);

function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Fire confetti (no-op on reduced motion).
 * @param {string} key Unique key to throttle repeated triggers.
 * @param {Object} opts canvas-confetti options override.
 */
export async function fireConfetti(key = 'default', opts = {}) {
  // Respect user motion preferences
  if (prefersReducedMotion()) return;
  if (typeof window === 'undefined') return;

  // Throttle per key
  if (hasFired[key]) return;
  hasFired[key] = true;

  // Lazy-load to keep main bundle slimmer
  let confetti;
  try {
    const mod = await import('canvas-confetti');
    confetti = mod?.default || mod;
  } catch {
    hasFired[key] = false; // allow future attempts
    return;
  }

  const base = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  };

  try {
    confetti({ ...base, ...opts });
  } finally {
    // Reset trigger after 5 seconds so it can be used again
    setTimeout(() => { hasFired[key] = false; }, 5000);
  }
}

export default { fireConfetti };
