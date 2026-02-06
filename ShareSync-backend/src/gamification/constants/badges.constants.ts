// src/gamification/constants/badges.constants.ts
// ═══════════════════════════════════════════════════════════════════════════════
// BADGE DEFINITIONS: All unlockable achievements
// ═══════════════════════════════════════════════════════════════════════════════

export enum BadgeCategory {
  MILESTONE = 'milestone',       // Progress milestones
  STREAK = 'streak',             // Streak achievements
  SKILL = 'skill',               // Skill-based
  SOCIAL = 'social',             // Team/collaboration
  LEGENDARY = 'legendary',       // Rare achievements
  SPECIAL = 'special',           // Event/seasonal
  MYSTERY = 'mystery',           // Hidden until unlocked
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  xpReward: number;
  criteria: {
    type: string;
    value: number;
    condition?: string;
  };
  isHidden?: boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // MILESTONE BADGES - Task Completion
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'first_task',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '🚀',
    category: BadgeCategory.MILESTONE,
    rarity: BadgeRarity.COMMON,
    xpReward: 25,
    criteria: { type: 'tasks_completed', value: 1 },
  },
  {
    id: 'task_10',
    name: 'Getting Started',
    description: 'Complete 10 tasks',
    icon: '📋',
    category: BadgeCategory.MILESTONE,
    rarity: BadgeRarity.COMMON,
    xpReward: 50,
    criteria: { type: 'tasks_completed', value: 10 },
  },
  {
    id: 'task_50',
    name: 'Productive',
    description: 'Complete 50 tasks',
    icon: '⚡',
    category: BadgeCategory.MILESTONE,
    rarity: BadgeRarity.UNCOMMON,
    xpReward: 100,
    criteria: { type: 'tasks_completed', value: 50 },
  },
  {
    id: 'task_100',
    name: 'Centurion',
    description: 'Complete 100 tasks',
    icon: '💯',
    category: BadgeCategory.MILESTONE,
    rarity: BadgeRarity.RARE,
    xpReward: 250,
    criteria: { type: 'tasks_completed', value: 100 },
  },
  {
    id: 'task_500',
    name: 'Task Titan',
    description: 'Complete 500 tasks',
    icon: '🏆',
    category: BadgeCategory.MILESTONE,
    rarity: BadgeRarity.EPIC,
    xpReward: 500,
    criteria: { type: 'tasks_completed', value: 500 },
  },
  {
    id: 'task_1000',
    name: 'Legendary Shipper',
    description: 'Complete 1000 tasks',
    icon: '👑',
    category: BadgeCategory.MILESTONE,
    rarity: BadgeRarity.LEGENDARY,
    xpReward: 1000,
    criteria: { type: 'tasks_completed', value: 1000 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // STREAK BADGES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'streak_3',
    name: 'Warm Up',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    category: BadgeCategory.STREAK,
    rarity: BadgeRarity.COMMON,
    xpReward: 30,
    criteria: { type: 'streak_days', value: 3 },
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: BadgeCategory.STREAK,
    rarity: BadgeRarity.UNCOMMON,
    xpReward: 75,
    criteria: { type: 'streak_days', value: 7 },
  },
  {
    id: 'streak_14',
    name: 'Fortnight Force',
    description: 'Maintain a 14-day streak',
    icon: '🔥',
    category: BadgeCategory.STREAK,
    rarity: BadgeRarity.RARE,
    xpReward: 150,
    criteria: { type: 'streak_days', value: 14 },
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    category: BadgeCategory.STREAK,
    rarity: BadgeRarity.EPIC,
    xpReward: 300,
    criteria: { type: 'streak_days', value: 30 },
  },
  {
    id: 'streak_100',
    name: 'Century Streak',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    category: BadgeCategory.STREAK,
    rarity: BadgeRarity.LEGENDARY,
    xpReward: 1000,
    criteria: { type: 'streak_days', value: 100 },
  },
  {
    id: 'streak_365',
    name: 'Year of Excellence',
    description: 'Maintain a 365-day streak',
    icon: '🌟',
    category: BadgeCategory.STREAK,
    rarity: BadgeRarity.LEGENDARY,
    xpReward: 5000,
    criteria: { type: 'streak_days', value: 365 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SKILL BADGES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 10 tasks before 9 AM',
    icon: '🌅',
    category: BadgeCategory.SKILL,
    rarity: BadgeRarity.UNCOMMON,
    xpReward: 100,
    criteria: { type: 'early_tasks', value: 10 },
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 10 tasks after 10 PM',
    icon: '🦉',
    category: BadgeCategory.SKILL,
    rarity: BadgeRarity.UNCOMMON,
    xpReward: 100,
    criteria: { type: 'late_tasks', value: 10 },
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 5 tasks in one hour',
    icon: '⚡',
    category: BadgeCategory.SKILL,
    rarity: BadgeRarity.RARE,
    xpReward: 200,
    criteria: { type: 'tasks_per_hour', value: 5 },
  },
  {
    id: 'unblocker',
    name: 'Unblocker',
    description: 'Complete 10 blocking tasks',
    icon: '🔓',
    category: BadgeCategory.SKILL,
    rarity: BadgeRarity.RARE,
    xpReward: 200,
    criteria: { type: 'blocking_tasks', value: 10 },
  },
  {
    id: 'on_time_king',
    name: 'Punctuality King',
    description: 'Complete 50 tasks before their due date',
    icon: '⏰',
    category: BadgeCategory.SKILL,
    rarity: BadgeRarity.EPIC,
    xpReward: 300,
    criteria: { type: 'on_time_tasks', value: 50 },
  },
  {
    id: 'focus_master',
    name: 'Focus Master',
    description: 'Complete 25 tasks during focus mode',
    icon: '🎯',
    category: BadgeCategory.SKILL,
    rarity: BadgeRarity.EPIC,
    xpReward: 300,
    criteria: { type: 'focus_tasks', value: 25 },
  },
  {
    id: 'deep_work',
    name: 'Deep Work Champion',
    description: 'Accumulate 100 hours of focus time',
    icon: '🧘',
    category: BadgeCategory.SKILL,
    rarity: BadgeRarity.LEGENDARY,
    xpReward: 500,
    criteria: { type: 'focus_hours', value: 100 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SOCIAL BADGES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Work on 5 different projects with teammates',
    icon: '🤝',
    category: BadgeCategory.SOCIAL,
    rarity: BadgeRarity.UNCOMMON,
    xpReward: 100,
    criteria: { type: 'team_projects', value: 5 },
  },
  {
    id: 'helper',
    name: 'Helpful Hand',
    description: 'Complete 25 tasks assigned by others',
    icon: '🙌',
    category: BadgeCategory.SOCIAL,
    rarity: BadgeRarity.RARE,
    xpReward: 150,
    criteria: { type: 'assigned_tasks', value: 25 },
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Work with 10 different team members',
    icon: '🎓',
    category: BadgeCategory.SOCIAL,
    rarity: BadgeRarity.RARE,
    xpReward: 200,
    criteria: { type: 'unique_collaborators', value: 10 },
  },
  {
    id: 'communicator',
    name: 'Great Communicator',
    description: 'Send 100 messages across projects',
    icon: '💬',
    category: BadgeCategory.SOCIAL,
    rarity: BadgeRarity.UNCOMMON,
    xpReward: 100,
    criteria: { type: 'messages_sent', value: 100 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEGENDARY BADGES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'legendary_hit',
    name: 'Lucky Legend',
    description: 'Hit a legendary reward (1% chance)',
    icon: '🌟',
    category: BadgeCategory.LEGENDARY,
    rarity: BadgeRarity.LEGENDARY,
    xpReward: 500,
    criteria: { type: 'legendary_rewards', value: 1 },
  },
  {
    id: 'legendary_3',
    name: 'Triple Legend',
    description: 'Hit 3 legendary rewards',
    icon: '⭐',
    category: BadgeCategory.LEGENDARY,
    rarity: BadgeRarity.LEGENDARY,
    xpReward: 1000,
    criteria: { type: 'legendary_rewards', value: 3 },
  },
  {
    id: 'project_shipper',
    name: 'Project Shipper',
    description: 'Complete an entire project',
    icon: '🚢',
    category: BadgeCategory.LEGENDARY,
    rarity: BadgeRarity.EPIC,
    xpReward: 500,
    criteria: { type: 'projects_completed', value: 1 },
  },
  {
    id: 'multi_shipper',
    name: 'Serial Shipper',
    description: 'Complete 5 projects',
    icon: '🚀',
    category: BadgeCategory.LEGENDARY,
    rarity: BadgeRarity.LEGENDARY,
    xpReward: 1500,
    criteria: { type: 'projects_completed', value: 5 },
  },
  {
    id: 'xp_10k',
    name: 'XP Collector',
    description: 'Earn 10,000 total XP',
    icon: '💰',
    category: BadgeCategory.MILESTONE,
    rarity: BadgeRarity.RARE,
    xpReward: 250,
    criteria: { type: 'total_xp', value: 10000 },
  },
  {
    id: 'xp_50k',
    name: 'XP Hoarder',
    description: 'Earn 50,000 total XP',
    icon: '💎',
    category: BadgeCategory.MILESTONE,
    rarity: BadgeRarity.EPIC,
    xpReward: 500,
    criteria: { type: 'total_xp', value: 50000 },
  },
  {
    id: 'xp_100k',
    name: 'XP Magnate',
    description: 'Earn 100,000 total XP',
    icon: '👑',
    category: BadgeCategory.MILESTONE,
    rarity: BadgeRarity.LEGENDARY,
    xpReward: 1000,
    criteria: { type: 'total_xp', value: 100000 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MYSTERY BADGES (Hidden until unlocked)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete every task scheduled for a week',
    icon: '💫',
    category: BadgeCategory.MYSTERY,
    rarity: BadgeRarity.EPIC,
    xpReward: 500,
    criteria: { type: 'perfect_week', value: 1 },
    isHidden: true,
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Resume after a 30+ day break and complete 10 tasks',
    icon: '🔄',
    category: BadgeCategory.MYSTERY,
    rarity: BadgeRarity.RARE,
    xpReward: 200,
    criteria: { type: 'comeback', value: 30 },
    isHidden: true,
  },
  {
    id: 'zero_to_hero',
    name: 'Zero to Hero',
    description: 'Go from level 1 to level 10 in 30 days',
    icon: '🦸',
    category: BadgeCategory.MYSTERY,
    rarity: BadgeRarity.LEGENDARY,
    xpReward: 1000,
    criteria: { type: 'level_up_speed', value: 10 },
    isHidden: true,
  },
  {
    id: 'marathon',
    name: 'Marathon Session',
    description: 'Complete 20 tasks in a single day',
    icon: '🏃',
    category: BadgeCategory.MYSTERY,
    rarity: BadgeRarity.EPIC,
    xpReward: 400,
    criteria: { type: 'tasks_in_day', value: 20 },
    isHidden: true,
  },
];

export const BADGE_MAP = BADGE_DEFINITIONS.reduce((map, badge) => {
  map[badge.id] = badge;
  return map;
}, {} as Record<string, BadgeDefinition>);

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_MAP[id];
}

export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.category === category);
}

export function getBadgesByRarity(rarity: BadgeRarity): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.rarity === rarity);
}
