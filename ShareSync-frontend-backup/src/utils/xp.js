/**
 * Simple XP curve utilities.
 * We use a triangular growth curve:
 *   Total XP to reach level L  = 50 * (L - 1) * L
 *   XP to go from L -> L+1     = 100 * L
 *
 * Examples:
 *  L1: 0 total
 *  L2: 100 total
 *  L3: 300 total
 *  L4: 600 total
 */

export function xpForLevel(level = 1) {
    const L = Math.max(1, Math.floor(level));
    return 50 * (L - 1) * L;
  }
  
  export function levelForXp(xp = 0) {
    const X = Math.max(0, Number(xp) || 0);
    // Solve 50 * n * (n + 1) <= X for n = L - 1
    const n = Math.floor((Math.sqrt(1 + (4 * X) / 50) - 1) / 2);
    return Math.max(1, n + 1);
  }
  
  /**
   * Returns progress info for the current level.
   * { level, current, start, end, needed, progress } where
   *  - current = xp
   *  - start = xpForLevel(level)
   *  - end   = xpForLevel(level+1)
   *  - needed = end - current
   *  - progress in [0,1]
   */
  export function progressToNext(xp = 0) {
    const current = Math.max(0, Number(xp) || 0);
    const level = levelForXp(current);
    const start = xpForLevel(level);
    const end = xpForLevel(level + 1);
    const span = Math.max(1, end - start);
    const progress = Math.min(1, Math.max(0, (current - start) / span));
    return {
      level,
      current,
      start,
      end,
      needed: Math.max(0, end - current),
      progress,
    };
  }
  
  export default { xpForLevel, levelForXp, progressToNext };
  