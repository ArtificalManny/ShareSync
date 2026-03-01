// src/context/OnboardingContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 1: Onboarding Context — Bridges localStorage hook + backend sync
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useOnboarding, { ONBOARDING_STEPS } from '../hooks/useOnboarding';
import client from '../api/client';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const onboarding = useOnboarding();
  const [backendStatus, setBackendStatus] = useState(null);
  const [profileStrength, setProfileStrength] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // ── Fetch onboarding status from backend on mount ──────────────────────
  const fetchBackendStatus = useCallback(async () => {
    try {
      const { data } = await client.get('/users/me/onboarding');
      const status = data?.data || data;
      setBackendStatus(status);

      // If backend says completed but local doesn't know, sync local
      if (status?.onboardingCompleted && !onboarding.isCompleted) {
        onboarding.completeOnboarding();
      }
    } catch (err) {
      // 401 = not logged in, skip silently
      if (err?.response?.status !== 401) {
        console.warn('[OnboardingContext] Failed to fetch status:', err?.message);
      }
    } finally {
      setHasFetched(true);
    }
  }, [onboarding.isCompleted, onboarding.completeOnboarding]);

  // ── Fetch profile strength ─────────────────────────────────────────────
  const fetchProfileStrength = useCallback(async () => {
    try {
      const { data } = await client.get('/users/me/profile-strength');
      setProfileStrength(data?.data || data);
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.warn('[OnboardingContext] Failed to fetch profile strength:', err?.message);
      }
    }
  }, []);

  // ── Complete onboarding (local + backend) ──────────────────────────────
  const completeOnboardingFull = useCallback(async () => {
    setSyncing(true);
    try {
      // Mark locally first (instant UI update)
      onboarding.completeOnboarding();

      // Then sync to backend
      await client.patch('/users/me/onboarding/complete');
    } catch (err) {
      console.warn('[OnboardingContext] Backend complete failed (local still marked):', err?.message);
    } finally {
      setSyncing(false);
    }
  }, [onboarding.completeOnboarding]);

  // ── Initial fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    // Only fetch if we have a token (user is logged in)
    const token = localStorage.getItem('ss.token') || localStorage.getItem('token');
    if (token) {
      fetchBackendStatus();
      fetchProfileStrength();
    } else {
      setHasFetched(true);
    }
  }, [fetchBackendStatus, fetchProfileStrength]);

  // ── Determine if onboarding should show ────────────────────────────────
  const shouldShowOnboarding = hasFetched && !onboarding.isCompleted;

  const value = {
    // Everything from the base hook
    ...onboarding,

    // Backend-synced overrides
    completeOnboarding: completeOnboardingFull,

    // Additional state
    backendStatus,
    profileStrength,
    shouldShowOnboarding,
    syncing,
    hasFetched,

    // Refresh helpers
    refreshStatus: fetchBackendStatus,
    refreshProfileStrength: fetchProfileStrength,

    // Re-export steps for convenience
    steps: ONBOARDING_STEPS,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    // Graceful fallback — don't crash if provider is missing
    console.warn('[useOnboardingContext] Used outside OnboardingProvider, returning defaults');
    return {
      isCompleted: true,
      shouldShowOnboarding: false,
      hasFetched: true,
      currentStep: 0,
      progress: 100,
      data: {},
      steps: ONBOARDING_STEPS,
      completeOnboarding: () => {},
      nextStep: () => {},
      prevStep: () => {},
      goToStep: () => {},
      setArchetype: () => {},
      setFirstTask: () => {},
      setCommitment: () => {},
      refreshStatus: () => {},
      refreshProfileStrength: () => {},
    };
  }
  return ctx;
}

export default OnboardingContext;
