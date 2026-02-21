// src/api/onboarding.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10: Onboarding API Calls
// ═══════════════════════════════════════════════════════════════════════════════
//
// API endpoints for persisting onboarding data to the backend.
// Falls back gracefully to localStorage if API fails.
//
// ═══════════════════════════════════════════════════════════════════════════════

import api from './client';
import {
  setUserArchetype,
  completeOnboarding as completeOnboardingLocal,
  addTaskCompletion,
  setStreakData,
  getStreakData,
} from '../utils/onboardingStorage';

/**
 * Save user's selected archetype to backend
 */
export async function saveArchetype(archetypeId) {
  try {
    const response = await api.patch('/users/me', {
      archetype: archetypeId,
    });
    
    // Also save locally
    setUserArchetype(archetypeId);
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Onboarding API] Failed to save archetype:', error);
    
    // Save locally as fallback
    setUserArchetype(archetypeId);
    
    return { success: false, error: error.message, savedLocally: true };
  }
}

/**
 * Mark onboarding as complete on backend
 */
export async function completeOnboarding(onboardingData) {
  const { archetype, firstTask, commitmentTime } = onboardingData;
  
  try {
    // Update user profile
    await api.patch('/users/me', {
      archetype,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
    });
    
    // Create first task if provided
    if (firstTask) {
      await createFirstTask(firstTask, commitmentTime);
    }
    
    // Mark complete locally
    completeOnboardingLocal(onboardingData);
    
    return { success: true };
  } catch (error) {
    console.error('[Onboarding API] Failed to complete onboarding:', error);
    
    // Still mark complete locally so user can proceed
    completeOnboardingLocal(onboardingData);
    
    return { success: false, error: error.message, savedLocally: true };
  }
}

/**
 * Create the user's first task
 */
export async function createFirstTask(taskTitle, commitmentTime = '24h') {
  const deadlineMap = {
    '24h': new Date(Date.now() + 24 * 60 * 60 * 1000),
    '48h': new Date(Date.now() + 48 * 60 * 60 * 1000),
    'week': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
  
  const deadline = deadlineMap[commitmentTime] || deadlineMap['24h'];
  
  try {
    const response = await api.post('/tasks', {
      title: taskTitle,
      deadline: deadline.toISOString(),
      priority: 'high',
      isFirstTask: true,
      tags: ['onboarding'],
    });
    
    return { success: true, task: response.data };
  } catch (error) {
    console.error('[Onboarding API] Failed to create first task:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Record task completion (for insights)
 */
export async function recordTaskCompletion(taskData) {
  // Always save locally first (for offline support)
  addTaskCompletion(taskData);
  
  try {
    // Also send to backend for analytics
    await api.post('/analytics/task-completion', {
      taskId: taskData.id,
      completedAt: taskData.completedAt || new Date().toISOString(),
      createdAt: taskData.createdAt,
    });
    
    return { success: true };
  } catch (error) {
    // Non-critical, just log
    console.warn('[Onboarding API] Failed to record completion:', error);
    return { success: false, savedLocally: true };
  }
}

/**
 * Sync streak data with backend
 */
export async function syncStreak() {
  const localStreak = getStreakData();
  
  try {
    const response = await api.get('/users/me/streak');
    const serverStreak = response.data;
    
    // Use the higher values (in case of sync issues)
    const mergedStreak = {
      current: Math.max(localStreak.current, serverStreak.current || 0),
      longest: Math.max(localStreak.longest, serverStreak.longest || 0),
      lastActiveDate: localStreak.lastActiveDate || serverStreak.lastActiveDate,
      history: localStreak.history,
    };
    
    // Update local
    setStreakData(mergedStreak);
    
    // Update server if local is higher
    if (localStreak.current > (serverStreak.current || 0)) {
      await api.patch('/users/me/streak', {
        current: localStreak.current,
        longest: localStreak.longest,
      });
    }
    
    return { success: true, streak: mergedStreak };
  } catch (error) {
    console.warn('[Onboarding API] Failed to sync streak:', error);
    return { success: false, streak: localStreak };
  }
}

/**
 * Get onboarding status from backend
 */
export async function getOnboardingStatus() {
  try {
    const response = await api.get('/users/me');
    const user = response.data;
    
    return {
      success: true,
      isComplete: user.onboardingCompleted === true,
      archetype: user.archetype,
      completedAt: user.onboardingCompletedAt,
    };
  } catch (error) {
    console.error('[Onboarding API] Failed to get status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save user preferences to backend
 */
export async function savePreferences(preferences) {
  try {
    await api.patch('/users/me/preferences', preferences);
    return { success: true };
  } catch (error) {
    console.error('[Onboarding API] Failed to save preferences:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get personalized suggestions based on archetype
 */
export async function getArchetypeSuggestions(archetypeId) {
  try {
    const response = await api.get(`/suggestions/archetype/${archetypeId}`);
    return { success: true, suggestions: response.data };
  } catch (error) {
    // Return default suggestions
    const defaults = {
      builder: [
        'Start with a quick prototype',
        'Ship something small today',
        'Break big tasks into shippable chunks',
      ],
      strategist: [
        'Map out your week on Sunday',
        'Define success metrics first',
        'Review and adjust weekly',
      ],
      finisher: [
        'Identify your 90%-done tasks',
        'Block time for final polish',
        'Celebrate completed work',
      ],
      explorer: [
        'Try a new approach today',
        'Document discoveries as you go',
        'Share learnings with the team',
      ],
    };
    
    return { 
      success: false, 
      suggestions: defaults[archetypeId] || defaults.builder,
    };
  }
}

/**
 * Skip onboarding (user chose to skip)
 */
export async function skipOnboarding() {
  try {
    await api.patch('/users/me', {
      onboardingSkipped: true,
      onboardingSkippedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.warn('[Onboarding API] Failed to record skip:', error);
    return { success: false };
  }
}

export default {
  saveArchetype,
  completeOnboarding,
  createFirstTask,
  recordTaskCompletion,
  syncStreak,
  getOnboardingStatus,
  savePreferences,
  getArchetypeSuggestions,
  skipOnboarding,
};