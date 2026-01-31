// src/hooks/useIdentityEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY ENGINE: Work Shapes Who You Become
// Tracks growth, skills, reputation, and career narrative
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHETYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const ARCHETYPES = {
  BUILDER: 'builder',
  STRATEGIST: 'strategist',
  CONNECTOR: 'connector',
  EXPLORER: 'explorer',
};

export const ARCHETYPE_LEVELS = {
  NOVICE: { level: 1, name: 'Novice', xpRequired: 0 },
  APPRENTICE: { level: 2, name: 'Apprentice', xpRequired: 500 },
  JOURNEYMAN: { level: 3, name: 'Journeyman', xpRequired: 1500 },
  EXPERT: { level: 4, name: 'Expert', xpRequired: 3500 },
  MASTER: { level: 5, name: 'Master', xpRequired: 7000 },
  GRANDMASTER: { level: 6, name: 'Grandmaster', xpRequired: 15000 },
};

export const ARCHETYPE_CONFIG = {
  [ARCHETYPES.BUILDER]: {
    name: 'Builder',
    icon: '🏗️',
    color: 'brand',
    description: 'You ship. Fast and relentlessly.',
    evolution: ['Builder', 'Architect', 'Visionary'],
    traits: ['Fast shipping', 'Quality code', 'Problem solving'],
    abilities: {
      1: { name: 'Quick Start', description: 'Tasks auto-start when you open them' },
      2: { name: 'Momentum Boost', description: '+10% XP during streaks' },
      3: { name: 'Builder\'s Focus', description: 'Focus sessions last 10% longer' },
      4: { name: 'Architect Vision', description: 'See task dependencies automatically' },
      5: { name: 'Master Builder', description: 'Unlock custom project templates' },
      6: { name: 'Visionary', description: 'AI suggests optimal task order' },
    },
  },
  [ARCHETYPES.STRATEGIST]: {
    name: 'Strategist',
    icon: '🎯',
    color: 'purple',
    description: 'You plan. Every move is calculated.',
    evolution: ['Strategist', 'Tactician', 'Mastermind'],
    traits: ['Long-term planning', 'Risk assessment', 'Priority management'],
    abilities: {
      1: { name: 'Priority Sense', description: 'Priority suggestions are more accurate' },
      2: { name: 'Forecast Vision', description: 'See 2-week completion forecasts' },
      3: { name: 'Risk Detection', description: 'Early warnings for at-risk items' },
      4: { name: 'Tactical Mind', description: 'What-if simulations unlock' },
      5: { name: 'Master Planner', description: 'Auto-generate sprint plans' },
      6: { name: 'Mastermind', description: 'AI-powered strategic recommendations' },
    },
  },
  [ARCHETYPES.CONNECTOR]: {
    name: 'Connector',
    icon: '🤝',
    color: 'cyan',
    description: 'You unite. Teams thrive around you.',
    evolution: ['Connector', 'Catalyst', 'Orchestrator'],
    traits: ['Team collaboration', 'Communication', 'Mentoring'],
    abilities: {
      1: { name: 'Team Sense', description: 'See team availability at a glance' },
      2: { name: 'Unblock Power', description: '+20% XP for unblocking teammates' },
      3: { name: 'Catalyst Aura', description: 'Co-working sessions give +25% XP' },
      4: { name: 'Network Effect', description: 'Your celebrations spread to team' },
      5: { name: 'Master Mentor', description: 'Mentorship tracking unlocked' },
      6: { name: 'Orchestrator', description: 'AI-powered team optimization' },
    },
  },
  [ARCHETYPES.EXPLORER]: {
    name: 'Explorer',
    icon: '🔮',
    color: 'warning',
    description: 'You discover. Innovation is your path.',
    evolution: ['Explorer', 'Innovator', 'Pioneer'],
    traits: ['Learning', 'Experimentation', 'Creative solutions'],
    abilities: {
      1: { name: 'Curious Mind', description: '+XP for trying new task types' },
      2: { name: 'Learning Boost', description: 'Skill progress increases 15%' },
      3: { name: 'Innovation Spark', description: 'Unique task suggestions unlock' },
      4: { name: 'Pioneer Path', description: 'Create custom skill branches' },
      5: { name: 'Master Explorer', description: 'Hidden achievements visible' },
      6: { name: 'Trailblazer', description: 'Define new team workflows' },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKILLS
// ═══════════════════════════════════════════════════════════════════════════════

export const SKILL_CATEGORIES = {
  EXECUTION: 'execution',
  STRATEGY: 'strategy',
  COMMUNICATION: 'communication',
  LEADERSHIP: 'leadership',
  TECHNICAL: 'technical',
};

export const SKILLS = {
  // Execution
  speed: { name: 'Speed', category: SKILL_CATEGORIES.EXECUTION, icon: '⚡', maxLevel: 10 },
  quality: { name: 'Quality', category: SKILL_CATEGORIES.EXECUTION, icon: '✨', maxLevel: 10 },
  consistency: { name: 'Consistency', category: SKILL_CATEGORIES.EXECUTION, icon: '📊', maxLevel: 10 },
  
  // Strategy
  planning: { name: 'Planning', category: SKILL_CATEGORIES.STRATEGY, icon: '📋', maxLevel: 10 },
  prioritization: { name: 'Prioritization', category: SKILL_CATEGORIES.STRATEGY, icon: '🎯', maxLevel: 10 },
  estimation: { name: 'Estimation', category: SKILL_CATEGORIES.STRATEGY, icon: '⏱️', maxLevel: 10 },
  
  // Communication
  writing: { name: 'Writing', category: SKILL_CATEGORIES.COMMUNICATION, icon: '✍️', maxLevel: 10 },
  presenting: { name: 'Presenting', category: SKILL_CATEGORIES.COMMUNICATION, icon: '🎤', maxLevel: 10 },
  feedback: { name: 'Feedback', category: SKILL_CATEGORIES.COMMUNICATION, icon: '💬', maxLevel: 10 },
  
  // Leadership
  delegation: { name: 'Delegation', category: SKILL_CATEGORIES.LEADERSHIP, icon: '👥', maxLevel: 10 },
  mentoring: { name: 'Mentoring', category: SKILL_CATEGORIES.LEADERSHIP, icon: '🌱', maxLevel: 10 },
  decision_making: { name: 'Decision Making', category: SKILL_CATEGORIES.LEADERSHIP, icon: '⚖️', maxLevel: 10 },
  
  // Technical
  problem_solving: { name: 'Problem Solving', category: SKILL_CATEGORIES.TECHNICAL, icon: '🧩', maxLevel: 10 },
  debugging: { name: 'Debugging', category: SKILL_CATEGORIES.TECHNICAL, icon: '🔍', maxLevel: 10 },
  architecture: { name: 'Architecture', category: SKILL_CATEGORIES.TECHNICAL, icon: '🏛️', maxLevel: 10 },
};

// Skill tree structure (parent -> children)
export const SKILL_TREE = {
  leadership: {
    name: 'Leadership',
    children: ['execution', 'strategy', 'communication'],
  },
  execution: {
    name: 'Execution',
    children: ['speed', 'quality', 'consistency'],
  },
  strategy: {
    name: 'Strategy',
    children: ['planning', 'prioritization', 'estimation'],
  },
  communication: {
    name: 'Communication',
    children: ['writing', 'presenting', 'feedback'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPUTATION TRAITS
// ═══════════════════════════════════════════════════════════════════════════════

export const REPUTATION_TRAITS = {
  FAST_SHIPPER: {
    id: 'fast_shipper',
    name: 'Fast Shipper',
    icon: '🚀',
    description: 'Consistently delivers ahead of schedule',
    criteria: { metric: 'early_completions', threshold: 10 },
  },
  QUALITY_CHAMPION: {
    id: 'quality_champion',
    name: 'Quality Champion',
    icon: '✨',
    description: 'Work rarely needs revisions',
    criteria: { metric: 'no_revision_rate', threshold: 0.9 },
  },
  TEAM_UNLOCKER: {
    id: 'team_unlocker',
    name: 'Team Unlocker',
    icon: '🔓',
    description: 'Frequently unblocks teammates',
    criteria: { metric: 'unblocks', threshold: 15 },
  },
  RELIABLE_PARTNER: {
    id: 'reliable_partner',
    name: 'Reliable Partner',
    icon: '��',
    description: 'Always delivers on commitments',
    criteria: { metric: 'commitment_rate', threshold: 0.95 },
  },
  KNOWLEDGE_SHARER: {
    id: 'knowledge_sharer',
    name: 'Knowledge Sharer',
    icon: '📚',
    description: 'Helps others learn and grow',
    criteria: { metric: 'help_given', threshold: 20 },
  },
  DEEP_THINKER: {
    id: 'deep_thinker',
    name: 'Deep Thinker',
    icon: '🧠',
    description: 'Tackles complex problems with care',
    criteria: { metric: 'complex_tasks', threshold: 10 },
  },
  MOMENTUM_KEEPER: {
    id: 'momentum_keeper',
    name: 'Momentum Keeper',
    icon: '🔥',
    description: 'Maintains long streaks of productivity',
    criteria: { metric: 'longest_streak', threshold: 14 },
  },
  CALM_UNDER_PRESSURE: {
    id: 'calm_under_pressure',
    name: 'Calm Under Pressure',
    icon: '😌',
    description: 'Performs well near deadlines',
    criteria: { metric: 'deadline_performance', threshold: 0.9 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GROWTH QUESTS
// ═══════════════════════════════════════════════════════════════════════════════

export const QUEST_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  SPECIAL: 'special',
};

export const GROWTH_QUESTS = {
  // Delegation quests
  delegation_starter: {
    id: 'delegation_starter',
    name: 'Delegation Practice',
    description: 'Assign 3 tasks to teammates this week',
    skill: 'delegation',
    type: QUEST_TYPES.WEEKLY,
    target: 3,
    xpReward: 150,
    skillProgress: 10,
  },
  delegation_master: {
    id: 'delegation_master',
    name: 'Delegation Master',
    description: 'Assign 10 tasks with clear descriptions',
    skill: 'delegation',
    type: QUEST_TYPES.MONTHLY,
    target: 10,
    xpReward: 500,
    skillProgress: 25,
  },
  
  // Communication quests
  clear_communicator: {
    id: 'clear_communicator',
    name: 'Clear Communicator',
    description: 'Write 5 detailed task descriptions',
    skill: 'writing',
    type: QUEST_TYPES.WEEKLY,
    target: 5,
    xpReward: 100,
    skillProgress: 10,
  },
  feedback_giver: {
    id: 'feedback_giver',
    name: 'Constructive Voice',
    description: 'Leave helpful feedback on 5 tasks',
    skill: 'feedback',
    type: QUEST_TYPES.WEEKLY,
    target: 5,
    xpReward: 100,
    skillProgress: 10,
  },
  
  // Leadership quests
  mentor_moment: {
    id: 'mentor_moment',
    name: 'Mentor Moment',
    description: 'Help a teammate through a blocker',
    skill: 'mentoring',
    type: QUEST_TYPES.WEEKLY,
    target: 1,
    xpReward: 200,
    skillProgress: 15,
  },
  team_supporter: {
    id: 'team_supporter',
    name: 'Team Supporter',
    description: 'Unblock 3 teammates this week',
    skill: 'mentoring',
    type: QUEST_TYPES.WEEKLY,
    target: 3,
    xpReward: 250,
    skillProgress: 20,
  },
  
  // Execution quests
  speed_run: {
    id: 'speed_run',
    name: 'Speed Run',
    description: 'Complete 5 tasks in one day',
    skill: 'speed',
    type: QUEST_TYPES.DAILY,
    target: 5,
    xpReward: 150,
    skillProgress: 10,
  },
  quality_streak: {
    id: 'quality_streak',
    name: 'Quality Streak',
    description: 'Complete 10 tasks with no revisions',
    skill: 'quality',
    type: QUEST_TYPES.WEEKLY,
    target: 10,
    xpReward: 200,
    skillProgress: 15,
  },
  
  // Strategy quests
  estimation_accuracy: {
    id: 'estimation_accuracy',
    name: 'Estimation Accuracy',
    description: 'Complete 5 tasks within estimated time',
    skill: 'estimation',
    type: QUEST_TYPES.WEEKLY,
    target: 5,
    xpReward: 150,
    skillProgress: 15,
  },
  priority_master: {
    id: 'priority_master',
    name: 'Priority Master',
    description: 'Complete all critical tasks before any low-priority',
    skill: 'prioritization',
    type: QUEST_TYPES.WEEKLY,
    target: 1,
    xpReward: 200,
    skillProgress: 20,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════

const LS_KEYS = {
  IDENTITY: 'ss.identity',
  SKILLS: 'ss.skills',
  QUESTS: 'ss.quests',
  REPUTATION: 'ss.reputation',
  CAREER: 'ss.career',
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getArchetypeLevel(xp) {
  const levels = Object.values(ARCHETYPE_LEVELS).sort((a, b) => b.xpRequired - a.xpRequired);
  for (const level of levels) {
    if (xp >= level.xpRequired) {
      return level;
    }
  }
  return ARCHETYPE_LEVELS.NOVICE;
}

function getSkillLevel(progress) {
  return Math.min(10, Math.floor(progress / 100) + 1);
}

function calculateSkillProgress(activities, skillId) {
  const skill = SKILLS[skillId];
  if (!skill) return 0;
  
  // Calculate based on relevant activities
  const relevantActivities = activities.filter(a => a.skills?.includes(skillId));
  return relevantActivities.reduce((sum, a) => sum + (a.skillProgress || 10), 0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAREER NARRATIVE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function generateCareerNarrative(data) {
  const { activities, skills, reputation, period } = data;
  
  const narrative = {
    period,
    summary: '',
    highlights: [],
    growth: [],
    strengths: [],
    areas_for_growth: [],
  };
  
  // Calculate metrics
  const tasksCompleted = activities.filter(a => a.type === 'task_complete').length;
  const unblocks = activities.filter(a => a.type === 'unblock').length;
  const mentoringSessions = activities.filter(a => a.type === 'mentor').length;
  
  // Generate summary
  narrative.summary = `In ${period}, you completed ${tasksCompleted} tasks`;
  if (unblocks > 0) narrative.summary += ` and unblocked ${unblocks} teammates`;
  if (mentoringSessions > 0) narrative.summary += `, while mentoring ${mentoringSessions} times`;
  narrative.summary += '.';
  
  // Highlights
  if (tasksCompleted >= 50) {
    narrative.highlights.push(`Shipped ${tasksCompleted} features - exceptional output!`);
  }
  if (unblocks >= 10) {
    narrative.highlights.push(`Unblocked ${unblocks} teammates - true team player`);
  }
  
  // Growth areas (skills that improved most)
  const skillGrowth = Object.entries(skills)
    .map(([id, data]) => ({
      id,
      name: SKILLS[id]?.name || id,
      growth: data.currentProgress - (data.previousProgress || 0),
    }))
    .filter(s => s.growth > 0)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 3);
  
  narrative.growth = skillGrowth.map(s => ({
    skill: s.name,
    percentage: Math.round(s.growth),
  }));
  
  // Strengths (reputation traits)
  narrative.strengths = reputation.filter(r => r.earned).map(r => ({
    name: REPUTATION_TRAITS[r.id]?.name || r.id,
    icon: REPUTATION_TRAITS[r.id]?.icon,
  }));
  
  return narrative;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * useIdentityEngine - Track identity, skills, and growth
 */
export function useIdentityEngine({
  userId,
  activities = [],
} = {}) {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [identity, setIdentity] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.IDENTITY}.${userId}`);
      return saved ? JSON.parse(saved) : {
        archetype: ARCHETYPES.BUILDER,
        xp: 0,
        level: 1,
        selectedAbilities: [],
      };
    } catch {
      return { archetype: ARCHETYPES.BUILDER, xp: 0, level: 1, selectedAbilities: [] };
    }
  });
  
  const [skills, setSkills] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.SKILLS}.${userId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [activeQuests, setActiveQuests] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.QUESTS}.${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [reputationMetrics, setReputationMetrics] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.REPUTATION}.${userId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PERSIST STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`${LS_KEYS.IDENTITY}.${userId}`, JSON.stringify(identity));
    } catch {}
  }, [identity, userId]);
  
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`${LS_KEYS.SKILLS}.${userId}`, JSON.stringify(skills));
    } catch {}
  }, [skills, userId]);
  
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`${LS_KEYS.QUESTS}.${userId}`, JSON.stringify(activeQuests));
    } catch {}
  }, [activeQuests, userId]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════
  
  const archetypeConfig = useMemo(() => 
    ARCHETYPE_CONFIG[identity.archetype],
    [identity.archetype]
  );
  
  const archetypeLevel = useMemo(() => 
    getArchetypeLevel(identity.xp),
    [identity.xp]
  );
  
  const nextLevel = useMemo(() => {
    const levels = Object.values(ARCHETYPE_LEVELS).sort((a, b) => a.xpRequired - b.xpRequired);
    const currentIdx = levels.findIndex(l => l.level === archetypeLevel.level);
    return levels[currentIdx + 1] || null;
  }, [archetypeLevel]);
  
  const evolutionTitle = useMemo(() => {
    const idx = Math.min(archetypeLevel.level - 1, 2);
    return archetypeConfig?.evolution[Math.floor(idx / 2)] || archetypeConfig?.name;
  }, [archetypeConfig, archetypeLevel]);
  
  const unlockedAbilities = useMemo(() => {
    const abilities = [];
    for (let i = 1; i <= archetypeLevel.level; i++) {
      const ability = archetypeConfig?.abilities[i];
      if (ability) abilities.push({ ...ability, level: i });
    }
    return abilities;
  }, [archetypeConfig, archetypeLevel]);
  
  const skillLevels = useMemo(() => {
    const levels = {};
    Object.keys(SKILLS).forEach(skillId => {
      const progress = skills[skillId]?.progress || 0;
      levels[skillId] = {
        level: getSkillLevel(progress),
        progress: progress % 100,
        totalProgress: progress,
      };
    });
    return levels;
  }, [skills]);
  
  const earnedReputation = useMemo(() => {
    return Object.values(REPUTATION_TRAITS)
      .filter(trait => {
        const metric = reputationMetrics[trait.criteria.metric] || 0;
        return metric >= trait.criteria.threshold;
      })
      .map(trait => ({
        ...trait,
        earned: true,
        progress: Math.min(100, (reputationMetrics[trait.criteria.metric] || 0) / trait.criteria.threshold * 100),
      }));
  }, [reputationMetrics]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const addXP = useCallback((amount, reason) => {
    setIdentity(prev => ({
      ...prev,
      xp: prev.xp + amount,
    }));
    return amount;
  }, []);
  
  const setArchetype = useCallback((archetype) => {
    if (ARCHETYPE_CONFIG[archetype]) {
      setIdentity(prev => ({
        ...prev,
        archetype,
      }));
    }
  }, []);
  
  const addSkillProgress = useCallback((skillId, amount) => {
    if (!SKILLS[skillId]) return;
    
    setSkills(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        progress: (prev[skillId]?.progress || 0) + amount,
        lastUpdated: Date.now(),
      },
    }));
  }, []);
  
  const startQuest = useCallback((questId) => {
    const quest = GROWTH_QUESTS[questId];
    if (!quest) return;
    
    setActiveQuests(prev => {
      if (prev.find(q => q.id === questId)) return prev;
      return [...prev, {
        ...quest,
        startedAt: Date.now(),
        progress: 0,
      }];
    });
  }, []);
  
  const updateQuestProgress = useCallback((questId, progress) => {
    setActiveQuests(prev => prev.map(q => {
      if (q.id !== questId) return q;
      const newProgress = Math.min(q.target, progress);
      return { ...q, progress: newProgress };
    }));
  }, []);
  
  const completeQuest = useCallback((questId) => {
    const quest = activeQuests.find(q => q.id === questId);
    if (!quest || quest.progress < quest.target) return null;
    
    // Award XP
    addXP(quest.xpReward, `Quest: ${quest.name}`);
    
    // Award skill progress
    if (quest.skill) {
      addSkillProgress(quest.skill, quest.skillProgress);
    }
    
    // Remove from active
    setActiveQuests(prev => prev.filter(q => q.id !== questId));
    
    return quest;
  }, [activeQuests, addXP, addSkillProgress]);
  
  const updateReputationMetric = useCallback((metric, value) => {
    setReputationMetrics(prev => ({
      ...prev,
      [metric]: value,
    }));
  }, []);
  
  const incrementReputationMetric = useCallback((metric, amount = 1) => {
    setReputationMetrics(prev => ({
      ...prev,
      [metric]: (prev[metric] || 0) + amount,
    }));
  }, []);
  
  const getCareerNarrative = useCallback((period = 'Q1 2024') => {
    return generateCareerNarrative({
      activities,
      skills,
      reputation: Object.values(REPUTATION_TRAITS).map(t => ({
        id: t.id,
        earned: earnedReputation.some(e => e.id === t.id),
      })),
      period,
    });
  }, [activities, skills, earnedReputation]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════
  
  return {
    // Identity
    identity,
    archetype: identity.archetype,
    archetypeConfig,
    archetypeLevel,
    nextLevel,
    evolutionTitle,
    unlockedAbilities,
    xp: identity.xp,
    
    // Skills
    skills,
    skillLevels,
    
    // Quests
    activeQuests,
    availableQuests: GROWTH_QUESTS,
    
    // Reputation
    reputationMetrics,
    earnedReputation,
    allReputationTraits: REPUTATION_TRAITS,
    
    // Actions
    addXP,
    setArchetype,
    addSkillProgress,
    startQuest,
    updateQuestProgress,
    completeQuest,
    updateReputationMetric,
    incrementReputationMetric,
    getCareerNarrative,
    
    // Constants
    ARCHETYPES,
    ARCHETYPE_CONFIG,
    ARCHETYPE_LEVELS,
    SKILLS,
    SKILL_CATEGORIES,
    SKILL_TREE,
    GROWTH_QUESTS,
    REPUTATION_TRAITS,
  };
}

export default useIdentityEngine;
