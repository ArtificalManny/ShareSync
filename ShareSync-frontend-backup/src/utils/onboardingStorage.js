// src/utils/onboardingStorage.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10: Onboarding Storage Utilities
// ═══════════════════════════════════════════════════════════════════════════════
//
// Centralized localStorage helpers for onboarding state.
// Handles serialization, validation, and migration.
//
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  ONBOARDING: 'ss.onboarding',
  ONBOARDING_VERSION: 'ss.onboarding.version',
  FIRST_INSIGHT: 'ss.first-insight',
  TASK_COMPLETIONS: 'ss.task-completions',
  USER_PREFERENCES: 'ss.user-preferences',
  STREAK: 'ss.streak',
};

const CURRENT_VERSION = 1;

/**
 * Safe localStorage getter with JSON parsing
 */
export function getStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    console.error(`[Storage] Failed to get ${key}:`, e);
    return defaultValue;
  }
}

/**
 * Safe localStorage setter with JSON serialization
 */
export function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[Storage] Failed to set ${key}:`, e);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`[Storage] Failed to remove ${key}:`, e);
    return false;
  }
}

/**
 * Clear all onboarding-related storage
 */
export function clearOnboardingStorage() {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorage(key);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING STATE
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_ONBOARDING_STATE = {
  completed: false,
  currentStep: 0,
  data: {
    archetype: null,
    firstTask: null,
    commitmentTime: null,
  },
  startedAt: null,
  completedAt: null,
  skipped: false,
};

/**
 * Get onboarding state
 */
export function getOnboardingState() {
  const state = getStorage(STORAGE_KEYS.ONBOARDING, DEFAULT_ONBOARDING_STATE);
  return { ...DEFAULT_ONBOARDING_STATE, ...state };
}

/**
 * Set onboarding state
 */
export function setOnboardingState(state) {
  return setStorage(STORAGE_KEYS.ONBOARDING, state);
}

/**
 * Update onboarding state (partial update)
 */
export function updateOnboardingState(updates) {
  const current = getOnboardingState();
  const updated = { ...current, ...updates };
  return setOnboardingState(updated);
}

/**
 * Check if onboarding is completed
 */
export function isOnboardingCompleted() {
  const state = getOnboardingState();
  return state.completed === true;
}

/**
 * Mark onboarding as completed
 */
export function completeOnboarding(data = {}) {
  return updateOnboardingState({
    completed: true,
    completedAt: new Date().toISOString(),
    data: { ...getOnboardingState().data, ...data },
  });
}

/**
 * Mark onboarding as skipped
 */
export function skipOnboarding() {
  return updateOnboardingState({
    completed: true,
    skipped: true,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Reset onboarding state
 */
export function resetOnboarding() {
  return setOnboardingState(DEFAULT_ONBOARDING_STATE);
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_PREFERENCES = {
  archetype: null,
  theme: 'dark',
  reducedMotion: false,
  notifications: true,
  soundEffects: false,
  peakHoursStart: 9,
  peakHoursEnd: 17,
};

/**
 * Get user preferences
 */
export function getUserPreferences() {
  const prefs = getStorage(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES);
  return { ...DEFAULT_PREFERENCES, ...prefs };
}

/**
 * Set user preferences
 */
export function setUserPreferences(prefs) {
  return setStorage(STORAGE_KEYS.USER_PREFERENCES, prefs);
}

/**
 * Update user preferences (partial update)
 */
export function updateUserPreferences(updates) {
  const current = getUserPreferences();
  return setUserPreferences({ ...current, ...updates });
}

/**
 * Get user's archetype from preferences
 */
export function getUserArchetype() {
  const prefs = getUserPreferences();
  return prefs.archetype;
}

/**
 * Set user's archetype
 */
export function setUserArchetype(archetypeId) {
  return updateUserPreferences({ archetype: archetypeId });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_STREAK = {
  current: 0,
  longest: 0,
  lastActiveDate: null,
  history: [], // Array of dates
};

/**
 * Get streak data
 */
export function getStreakData() {
  const streak = getStorage(STORAGE_KEYS.STREAK, DEFAULT_STREAK);
  return { ...DEFAULT_STREAK, ...streak };
}

/**
 * Set streak data
 */
export function setStreakData(streak) {
  return setStorage(STORAGE_KEYS.STREAK, streak);
}

/**
 * Record activity for today (updates streak)
 */
export function recordDailyActivity() {
  const streak = getStreakData();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  // Already recorded today
  if (streak.lastActiveDate === today) {
    return streak;
  }
  
  let newCurrent = streak.current;
  
  if (streak.lastActiveDate === yesterday) {
    // Continuing streak
    newCurrent = streak.current + 1;
  } else if (streak.lastActiveDate !== today) {
    // Streak broken (or first day)
    newCurrent = 1;
  }
  
  const updated = {
    current: newCurrent,
    longest: Math.max(streak.longest, newCurrent),
    lastActiveDate: today,
    history: [...streak.history.slice(-30), today], // Keep last 30 days
  };
  
  setStreakData(updated);
  return updated;
}

/**
 * Check if streak is still active (user was active yesterday or today)
 */
export function isStreakActive() {
  const streak = getStreakData();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  return streak.lastActiveDate === today || streak.lastActiveDate === yesterday;
}

/**
 * Get current streak count
 */
export function getCurrentStreak() {
  const streak = getStreakData();
  if (!isStreakActive()) return 0;
  return streak.current;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK COMPLETION TRACKING (for insights)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get task completions
 */
export function getTaskCompletions() {
  return getStorage(STORAGE_KEYS.TASK_COMPLETIONS, []);
}

/**
 * Add task completion
 */
export function addTaskCompletion(completion) {
  const completions = getTaskCompletions();
  const newCompletion = {
    id: completion.id || `task-${Date.now()}`,
    completedAt: completion.completedAt || new Date().toISOString(),
    createdAt: completion.createdAt || null,
    category: completion.category || null,
    timeOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
  };
  
  const updated = [...completions, newCompletion].slice(-100); // Keep last 100
  setStorage(STORAGE_KEYS.TASK_COMPLETIONS, updated);
  
  // Also record daily activity for streak
  recordDailyActivity();
  
  return updated;
}

/**
 * Get completion stats
 */
export function getCompletionStats() {
  const completions = getTaskCompletions();
  
  if (completions.length === 0) {
    return {
      total: 0,
      thisWeek: 0,
      today: 0,
      avgPerDay: 0,
      peakHour: null,
      peakDay: null,
    };
  }
  
  const now = new Date();
  const todayStr = now.toDateString();
  const weekAgo = new Date(now - 7 * 86400000);
  
  const today = completions.filter(c => 
    new Date(c.completedAt).toDateString() === todayStr
  ).length;
  
  const thisWeek = completions.filter(c => 
    new Date(c.completedAt) > weekAgo
  ).length;
  
  // Find peak hour
  const hourCounts = {};
  completions.forEach(c => {
    const hour = c.timeOfDay || new Date(c.completedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  // Find peak day
  const dayCounts = {};
  completions.forEach(c => {
    const day = c.dayOfWeek ?? new Date(c.completedAt).getDay();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  const peakDay = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return {
    total: completions.length,
    thisWeek,
    today,
    avgPerDay: thisWeek / 7,
    peakHour: peakHour ? parseInt(peakHour) : null,
    peakDay: peakDay ? days[parseInt(peakDay)] : null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIRST INSIGHT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get first insight data
 */
export function getFirstInsightData() {
  return getStorage(STORAGE_KEYS.FIRST_INSIGHT, {
    insight: null,
    shown: false,
    generatedAt: null,
  });
}

/**
 * Set first insight
 */
export function setFirstInsight(insight) {
  return setStorage(STORAGE_KEYS.FIRST_INSIGHT, {
    insight,
    shown: false,
    generatedAt: new Date().toISOString(),
  });
}

/**
 * Mark first insight as shown
 */
export function markFirstInsightShown() {
  const data = getFirstInsightData();
  return setStorage(STORAGE_KEYS.FIRST_INSIGHT, {
    ...data,
    shown: true,
  });
}

/**
 * Check if first insight has been shown
 */
export function hasFirstInsightBeenShown() {
  const data = getFirstInsightData();
  return data.shown === true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check and run migrations if needed
 */
export function runMigrations() {
  const version = getStorage(STORAGE_KEYS.ONBOARDING_VERSION, 0);
  
  if (version < CURRENT_VERSION) {
    // Add migrations here as needed
    // Example:
    // if (version < 1) { migrateToV1(); }
    // if (version < 2) { migrateToV2(); }
    
    setStorage(STORAGE_KEYS.ONBOARDING_VERSION, CURRENT_VERSION);
  }
}

// Run migrations on load
if (typeof window !== 'undefined') {
  runMigrations();
}

export { STORAGE_KEYS };
