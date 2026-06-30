// src/data/archetypes.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: Work Personality Archetypes
// ═══════════════════════════════════════════════════════════════════════════════
//
// These archetypes help users identify WHO they want to become through their work.
// Not just "what tool do you need" but "what kind of person are you building?"
//
// ═══════════════════════════════════════════════════════════════════════════════

export const ARCHETYPES = [
  {
    id: 'builder',
    name: 'The Builder',
    emoji: '🔨',
    tagline: 'You ship things into existence',
    description: "You thrive when creating something from nothing. You measure success by what you've built, not what you've planned.",
    traits: ['Action-oriented', 'Iterative', 'Hands-on'],
    color: 'brand',
    gradient: 'from-brand-500 to-brand-600',
    bgGradient: 'from-brand/10 to-brand/5',
    peakBehavior: 'Ships early and often',
    weakness: 'May skip planning',
    idealFor: ['Developers', 'Creators', 'Entrepreneurs'],
    motivators: ['Tangible output', 'Rapid iteration', 'Building from scratch'],
    kryptonite: ['Excessive meetings', 'Analysis paralysis', 'Waiting for approval'],
  },
  {
    id: 'strategist',
    name: 'The Strategist',
    emoji: '♟️',
    tagline: 'You see the whole board',
    description: "You think three moves ahead. You're not just completing tasks—you're orchestrating outcomes.",
    traits: ['Big-picture', 'Analytical', 'Patient'],
    color: 'info',
    gradient: 'from-info-500 to-info-600',
    bgGradient: 'from-info/10 to-info/5',
    peakBehavior: 'Plans before executing',
    weakness: 'May over-plan',
    idealFor: ['Project Managers', 'Leaders', 'Consultants'],
    motivators: ['Clear objectives', 'Long-term impact', 'Systems thinking'],
    kryptonite: ['Chaos without structure', 'Constant pivots', 'Micromanagement'],
  },
  {
    id: 'finisher',
    name: 'The Finisher',
    emoji: '🎯',
    tagline: 'You close the loop',
    description: 'You hate loose ends. Your superpower is taking things from 90% to Available when others have moved on.',
    traits: ['Detail-oriented', 'Persistent', 'Reliable'],
    color: 'success',
    gradient: 'from-success-500 to-success-600',
    bgGradient: 'from-success/10 to-success/5',
    peakBehavior: 'Completes what others abandon',
    weakness: 'May get stuck in details',
    idealFor: ['QA Engineers', 'Editors', 'Operations'],
    motivators: ['Completion satisfaction', 'Quality standards', 'Tying up loose ends'],
    kryptonite: ['Endless scope creep', 'Moving goalposts', 'Perfectionism traps'],
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    emoji: '🧭',
    tagline: 'You find new paths',
    description: "You're energized by the unknown. Routine kills you—discovery fuels you.",
    traits: ['Curious', 'Adaptable', 'Creative'],
    color: 'warning',
    gradient: 'from-warning-500 to-warning-600',
    bgGradient: 'from-warning/10 to-warning/5',
    peakBehavior: 'Discovers novel solutions',
    weakness: 'May struggle with routine',
    idealFor: ['Researchers', 'Designers', 'Innovators'],
    motivators: ['New challenges', 'Creative freedom', 'Learning opportunities'],
    kryptonite: ['Repetitive tasks', 'Rigid processes', 'Bureaucracy'],
  },
];

/**
 * Get archetype by ID
 */
export const getArchetypeById = (id) => {
  return ARCHETYPES.find(a => a.id === id) || null;
};

/**
 * Get archetype color token
 */
export const getArchetypeColor = (id) => {
  const archetype = getArchetypeById(id);
  return archetype?.color || 'brand';
};

/**
 * Get archetype gradient classes
 */
export const getArchetypeGradient = (id) => {
  const archetype = getArchetypeById(id);
  return archetype?.gradient || 'from-brand-500 to-brand-600';
};

/**
 * Get archetype background gradient
 */
export const getArchetypeBgGradient = (id) => {
  const archetype = getArchetypeById(id);
  return archetype?.bgGradient || 'from-brand/10 to-brand/5';
};

/**
 * Get all archetype IDs
 */
export const getArchetypeIds = () => {
  return ARCHETYPES.map(a => a.id);
};

/**
 * Validate archetype ID
 */
export const isValidArchetype = (id) => {
  return ARCHETYPES.some(a => a.id === id);
};

/**
 * Get archetype suggestions based on user behavior
 * (Can be expanded with actual ML/heuristics later)
 */
export const suggestArchetype = (completionPatterns) => {
  if (!completionPatterns) return null;
  
  const { 
    avgTasksPerDay = 0,
    completionRate = 0,
    avgTimeToComplete = 0,
    prefersMorning = false,
  } = completionPatterns;

  // Simple heuristics (can be refined)
  if (avgTasksPerDay > 5 && avgTimeToComplete < 2) {
    return 'builder'; // Ships fast and often
  }
  if (completionRate > 0.95) {
    return 'finisher'; // High completion rate
  }
  if (avgTimeToComplete > 24) {
    return 'strategist'; // Takes time to plan
  }
  return 'explorer'; // Default to explorer
};

export default ARCHETYPES;
