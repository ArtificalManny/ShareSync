// src/utils/variableRewards.js
// ═══════════════════════════════════════════════════════════════════════════════
// Behavioral: Variable Reward Logic (Dopamine Hits)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Variable reward types - each has different rarity and impact
 */
export const REWARD_TYPES = {
  // Common (60% chance when triggered)
  xpBonus: {
    id: 'xpBonus',
    rarity: 'common',
    weight: 60,
    range: [5, 25],
    message: (amount) => `Bonus XP! +${amount}`,
    emoji: '⚡',
  },
  
  // Uncommon (25% chance)
  streakSave: {
    id: 'streakSave',
    rarity: 'uncommon',
    weight: 25,
    message: () => 'Streak Shield activated!',
    emoji: '🛡️',
  },
  momentumBoost: {
    id: 'momentumBoost',
    rarity: 'uncommon',
    weight: 25,
    range: [1, 3],
    message: (amount) => `Momentum +${amount}!`,
    emoji: '🚀',
  },
  
  // Rare (12% chance)
  doubleXp: {
    id: 'doubleXp',
    rarity: 'rare',
    weight: 12,
    duration: 30, // minutes
    message: () => '2X XP for 30 minutes!',
    emoji: '✨',
  },
  mysteryBadge: {
    id: 'mysteryBadge',
    rarity: 'rare',
    weight: 12,
    badges: ['Early Bird', 'Night Owl', 'Speed Demon', 'Team Player'],
    message: (badge) => `Unlocked: ${badge}`,
    emoji: '🏆',
  },
  
  // Epic (3% chance)
  teamMomentum: {
    id: 'teamMomentum',
    rarity: 'epic',
    weight: 3,
    message: () => 'Team Momentum Surge!',
    emoji: '🌟',
  },
};

/**
 * Trigger conditions for variable rewards
 */
export const TRIGGER_CONDITIONS = {
  taskComplete: { baseChance: 0.15 }, // 15% base chance on task complete
  shipComplete: { baseChance: 0.40 }, // 40% base chance on ship
  streakMilestone: { baseChance: 0.60 }, // 60% at streak milestones
  returnAfterAbsence: { baseChance: 0.80 }, // 80% when returning
  randomInterval: { baseChance: 0.05 }, // 5% random during session
};

/**
 * Check if a reward should trigger
 */
export function shouldTriggerReward(condition, multipliers = {}) {
  const config = TRIGGER_CONDITIONS[condition];
  if (!config) return false;

  let chance = config.baseChance;

  // Apply multipliers
  if (multipliers.streak) {
    chance *= 1 + (multipliers.streak * 0.02); // +2% per streak day
  }
  if (multipliers.momentum) {
    chance *= 1 + (multipliers.momentum * 0.05); // +5% per momentum level
  }
  if (multipliers.isPro) {
    chance *= 1.2; // +20% for pro users
  }

  // Cap at 90%
  chance = Math.min(chance, 0.9);

  return Math.random() < chance;
}

/**
 * Select a random reward based on weights
 */
export function selectReward(excludeTypes = []) {
  const available = Object.values(REWARD_TYPES)
    .filter(r => !excludeTypes.includes(r.id));

  const totalWeight = available.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;

  for (const reward of available) {
    random -= reward.weight;
    if (random <= 0) {
      return generateRewardInstance(reward);
    }
  }

  // Fallback to first available
  return generateRewardInstance(available[0]);
}

/**
 * Generate a specific reward instance with randomized values
 */
function generateRewardInstance(rewardType) {
  const instance = {
    type: rewardType.id,
    rarity: rewardType.rarity,
    emoji: rewardType.emoji,
    timestamp: Date.now(),
  };

  // Generate value if range exists
  if (rewardType.range) {
    const [min, max] = rewardType.range;
    instance.value = Math.floor(Math.random() * (max - min + 1)) + min;
    instance.message = rewardType.message(instance.value);
  } else if (rewardType.badges) {
    instance.badge = rewardType.badges[Math.floor(Math.random() * rewardType.badges.length)];
    instance.message = rewardType.message(instance.badge);
  } else if (rewardType.duration) {
    instance.duration = rewardType.duration;
    instance.message = rewardType.message();
  } else {
    instance.message = rewardType.message();
  }

  return instance;
}

/**
 * Calculate reward XP value
 */
export function calculateRewardXp(reward) {
  const baseXp = {
    common: 10,
    uncommon: 25,
    rare: 50,
    epic: 100,
  };

  let xp = baseXp[reward.rarity] || 10;

  if (reward.value) {
    xp += reward.value;
  }

  return xp;
}

/**
 * Get rarity color
 */
export function getRewardColor(rarity) {
  const colors = {
    common: 'text-text-secondary',
    uncommon: 'text-brand',
    rare: 'text-cyan-400',
    epic: 'text-warning',
  };
  return colors[rarity] || colors.common;
}

/**
 * Get rarity background
 */
export function getRewardBg(rarity) {
  const bgs = {
    common: 'bg-surface-2',
    uncommon: 'bg-brand/10',
    rare: 'bg-cyan-400/10',
    epic: 'bg-warning/10',
  };
  return bgs[rarity] || bgs.common;
}

export default {
  REWARD_TYPES,
  TRIGGER_CONDITIONS,
  shouldTriggerReward,
  selectReward,
  calculateRewardXp,
  getRewardColor,
  getRewardBg,
};
