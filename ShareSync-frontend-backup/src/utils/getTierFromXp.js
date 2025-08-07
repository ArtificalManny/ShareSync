// /src/utils/getTierFromXP.js
export function getTierFromXP(xp) {
    if (xp >= 2000) return 'Legend';
    if (xp >= 1000) return 'Elite';
    if (xp >= 500) return 'Rising Star';
    return 'Novice';
  }
  