// src/config/personaLanguage.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.1: Persona Language Map
// Pure data file — no imports, no side effects
// Maps each persona to its full label dictionary
// ═══════════════════════════════════════════════════════════════════════════════

const personaLanguage = {
  // ── Student ────────────────────────────────────────────────────────────
  student: {
    id: 'student',
    label: 'Student',
    emoji: '🎓',
    tone: 'Casual & encouraging',
    description: 'Perfect for school, study groups, and personal goals',

    // XP & Progression
    xp: 'XP',
    xpVerb: 'earned',
    xpUnit: 'XP',
    level: 'Level',
    levelUp: 'Level Up!',
    rank: 'Rank',
    streak: 'Study Streak',
    streakUnit: 'days',
    momentum: 'Energy',
    momentumLevel: 'Level',

    // Tasks & Work
    task: 'Assignment',
    taskPlural: 'Assignments',
    taskCreate: 'Add Assignment',
    taskComplete: 'Turn In',
    taskVerb: 'turned in',

    // Projects
    project: 'Class',
    projectPlural: 'Classes',
    projectCreate: 'New Class',

    // Shipping
    ship: 'Turn In',
    shipped: 'Turned In',
    shippedVerb: 'turned in',
    shipCeremony: 'Nice work! 🎉',

    // Daily Standup / Pulse
    pulseGreeting: 'How\'s your energy today?',
    pulseFocus: 'What\'s your #1 focus?',
    pulseBlocker: 'Anything blocking you?',

    // Moves / Priorities
    moves: 'Today\'s Goals',
    movesSubtitle: 'Knock these out',
    movesSingular: 'Goal',

    // Focus Blocks
    focusBlock: 'Study Block',
    focusBlockStart: 'Start Studying',
    focusBlockActive: 'Studying...',

    // Team
    teammate: 'Classmate',
    teammatePlural: 'Classmates',
    teamActivity: 'Class Activity',

    // Celebrations
    celebrationSmall: 'Nice! 🎮',
    celebrationMedium: 'You\'re on fire! 🔥',
    celebrationLarge: 'LEGENDARY! 🏆',
    celebrationStreak: 'Study streak going strong!',

    // Empty States
    emptyTasks: 'No assignments yet — add your first one!',
    emptyProjects: 'No classes yet — create one to get started!',
    emptyStreak: 'Start your study streak today!',

    // Metrics
    metricVelocity: 'Pace',
    metricEfficiency: 'Focus Score',
    metricDeployments: 'Completions',
    metricMomentum: 'Energy',
  },

  // ── Creator ────────────────────────────────────────────────────────────
  creator: {
    id: 'creator',
    label: 'Creator',
    emoji: '🎨',
    tone: 'Inspiring & creative',
    description: 'For artists, writers, makers, and builders',

    xp: 'Creative Energy',
    xpVerb: 'gained',
    xpUnit: 'CE',
    level: 'Stage',
    levelUp: 'New Stage Unlocked!',
    rank: 'Standing',
    streak: 'Creative Streak',
    streakUnit: 'days',
    momentum: 'Flow',
    momentumLevel: 'Stage',

    task: 'Piece',
    taskPlural: 'Pieces',
    taskCreate: 'New Piece',
    taskComplete: 'Ship It',
    taskVerb: 'shipped',

    project: 'Collection',
    projectPlural: 'Collections',
    projectCreate: 'New Collection',

    ship: 'Ship It',
    shipped: 'Shipped',
    shippedVerb: 'shipped',
    shipCeremony: 'Another piece in the world ✨',

    pulseGreeting: 'How\'s the creative energy today?',
    pulseFocus: 'What\'s calling you most?',
    pulseBlocker: 'Any creative blocks?',

    moves: 'Today\'s Pieces',
    movesSubtitle: 'What you\'re crafting',
    movesSingular: 'Piece',

    focusBlock: 'Deep Create',
    focusBlockStart: 'Enter the Zone',
    focusBlockActive: 'In the zone...',

    teammate: 'Collaborator',
    teammatePlural: 'Collaborators',
    teamActivity: 'Studio Activity',

    celebrationSmall: 'Beautiful work ✨',
    celebrationMedium: 'You\'re in the flow! 🌊',
    celebrationLarge: 'MASTERPIECE! 🎨',
    celebrationStreak: 'Creative streak is alive!',

    emptyTasks: 'No pieces yet — start creating!',
    emptyProjects: 'No collections yet — start your first one!',
    emptyStreak: 'Start your creative streak today!',

    metricVelocity: 'Output',
    metricEfficiency: 'Flow Score',
    metricDeployments: 'Pieces Shipped',
    metricMomentum: 'Flow',
  },

  // ── Professional ───────────────────────────────────────────────────────
  professional: {
    id: 'professional',
    label: 'Professional',
    emoji: '💼',
    tone: 'Clean & efficient',
    description: 'For focused individual contributors and professionals',

    xp: 'Impact Score',
    xpVerb: 'accrued',
    xpUnit: 'pts',
    level: 'Tier',
    levelUp: 'Tier Promotion',
    rank: 'Position',
    streak: 'Velocity Streak',
    streakUnit: 'days',
    momentum: 'Velocity',
    momentumLevel: 'Tier',

    task: 'Deliverable',
    taskPlural: 'Deliverables',
    taskCreate: 'New Deliverable',
    taskComplete: 'Complete',
    taskVerb: 'completed',

    project: 'Initiative',
    projectPlural: 'Initiatives',
    projectCreate: 'New Initiative',

    ship: 'Ship',
    shipped: 'Shipped',
    shippedVerb: 'shipped',
    shipCeremony: 'Delivered.',

    pulseGreeting: 'How\'s your bandwidth today?',
    pulseFocus: 'Top priority?',
    pulseBlocker: 'Any blockers?',

    moves: 'Priority Queue',
    movesSubtitle: 'Action required',
    movesSingular: 'Priority',

    focusBlock: 'Deep Work',
    focusBlockStart: 'Start Deep Work',
    focusBlockActive: 'In deep work...',

    teammate: 'Colleague',
    teammatePlural: 'Colleagues',
    teamActivity: 'Team Activity',

    celebrationSmall: 'Done ✓',
    celebrationMedium: 'Strong execution.',
    celebrationLarge: 'Outstanding delivery.',
    celebrationStreak: 'Velocity streak maintained.',

    emptyTasks: 'No deliverables queued.',
    emptyProjects: 'No initiatives created yet.',
    emptyStreak: 'Begin your velocity streak.',

    metricVelocity: 'Velocity',
    metricEfficiency: 'Efficiency',
    metricDeployments: 'Deployments',
    metricMomentum: 'Velocity',
  },

  // ── Team Lead ──────────────────────────────────────────────────────────
  teamlead: {
    id: 'teamlead',
    label: 'Team Lead',
    emoji: '🚀',
    tone: 'Strategic & overview',
    description: 'For managers, leads, and team coordinators',

    xp: 'Team Momentum',
    xpVerb: 'generated',
    xpUnit: 'TM',
    level: 'Tier',
    levelUp: 'Leadership Milestone',
    rank: 'Standing',
    streak: 'Team Streak',
    streakUnit: 'days',
    momentum: 'Capacity',
    momentumLevel: 'Tier',

    task: 'Sprint Goal',
    taskPlural: 'Sprint Goals',
    taskCreate: 'New Sprint Goal',
    taskComplete: 'Close',
    taskVerb: 'closed',

    project: 'Program',
    projectPlural: 'Programs',
    projectCreate: 'New Program',

    ship: 'Deploy',
    shipped: 'Deployed',
    shippedVerb: 'deployed',
    shipCeremony: 'Deployed to production.',

    pulseGreeting: 'Team pulse check',
    pulseFocus: 'Team\'s top priority?',
    pulseBlocker: 'Any team blockers?',

    moves: 'Sprint Priorities',
    movesSubtitle: 'What the team is focused on',
    movesSingular: 'Initiative',

    focusBlock: 'Focus Sprint',
    focusBlockStart: 'Start Sprint',
    focusBlockActive: 'Sprint active...',

    teammate: 'Team Member',
    teammatePlural: 'Team Members',
    teamActivity: 'Team Feed',

    celebrationSmall: 'Goal closed.',
    celebrationMedium: 'Team executing well.',
    celebrationLarge: 'Sprint objectives exceeded!',
    celebrationStreak: 'Team streak holding strong.',

    emptyTasks: 'No sprint goals defined yet.',
    emptyProjects: 'No programs created yet.',
    emptyStreak: 'Start your team streak.',

    metricVelocity: 'Throughput',
    metricEfficiency: 'Capacity',
    metricDeployments: 'Deployments',
    metricMomentum: 'Capacity',
  },
};

// ── Valid persona IDs ────────────────────────────────────────────────────
export const PERSONA_IDS = Object.keys(personaLanguage);

// ── Default persona ──────────────────────────────────────────────────────
export const DEFAULT_PERSONA = 'creator';

// ── Lookup helper ────────────────────────────────────────────────────────
// Returns the label for a given key under the active persona
// Falls back to 'creator' persona, then to the raw key
export function getPersonaLabel(persona, key) {
  const dict = personaLanguage[persona] || personaLanguage[DEFAULT_PERSONA];
  if (dict && key in dict) return dict[key];
  // Fallback: try default persona
  const fallback = personaLanguage[DEFAULT_PERSONA];
  if (fallback && key in fallback) return fallback[key];
  // Last resort: return key as-is
  return key;
}

// ── Get full persona config ──────────────────────────────────────────────
export function getPersonaConfig(persona) {
  return personaLanguage[persona] || personaLanguage[DEFAULT_PERSONA];
}

export default personaLanguage;
