// src/hooks/useOnboarding.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9: Onboarding State Management
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ss.onboarding';

const INITIAL_STATE = {
  completed: false,
  currentStep: 0,
  data: {
    archetype: null,
    firstTask: null,
    commitmentTime: null, // '24h' | '48h' | 'week'
  },
  startedAt: null,
  completedAt: null,
};

export const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'archetype', title: 'Your Identity' },
  { id: 'first-task', title: 'First Mission' },
  { id: 'momentum', title: 'Commitment' },
];

export default function useOnboarding() {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('[Onboarding] Failed to load state:', e);
    }
    return INITIAL_STATE;
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[Onboarding] Failed to save state:', e);
    }
  }, [state]);

  const startOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 0,
      startedAt: new Date().toISOString(),
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, ONBOARDING_STEPS.length - 1),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  }, []);

  const goToStep = useCallback((stepIndex) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, Math.min(stepIndex, ONBOARDING_STEPS.length - 1)),
    }));
  }, []);

  const setArchetype = useCallback((archetypeId) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, archetype: archetypeId },
    }));
  }, []);

  const setFirstTask = useCallback((task) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, firstTask: task },
    }));
  }, []);

  const setCommitment = useCallback((time) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, commitmentTime: time },
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      completed: true,
      completedAt: new Date().toISOString(),
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(INITIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isCompleted = state.completed;
  const currentStep = state.currentStep;
  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return {
    // State
    state,
    isCompleted,
    currentStep,
    currentStepData,
    progress,
    isLastStep,
    isFirstStep,
    data: state.data,
    
    // Actions
    startOnboarding,
    nextStep,
    prevStep,
    goToStep,
    setArchetype,
    setFirstTask,
    setCommitment,
    completeOnboarding,
    resetOnboarding,
  };
}
