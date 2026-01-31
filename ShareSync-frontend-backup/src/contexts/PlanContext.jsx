// src/contexts/PlanContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE L: Plan State Provider
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPlanAndUsage, PLAN_TIERS } from '../api/billing';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [role, setRole] = useState('member');
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlanData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getPlanAndUsage();
      
      setPlan(data.plan || PLAN_TIERS.free);
      setUsage(data.usage || {});
      setRole(data.role || 'member');
      setCanManageBilling(data.canManageBilling || false);
    } catch (err) {
      setError(err.message || 'Failed to load plan');
      // Fallback to free plan
      setPlan(PLAN_TIERS.free);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  // Check if a limit is reached
  const isLimitReached = useCallback((limitKey) => {
    if (!usage?.[limitKey]) return false;
    const { used, limit } = usage[limitKey];
    if (limit === -1) return false; // Unlimited
    return used >= limit;
  }, [usage]);

  // Check if approaching limit (>80%)
  const isApproachingLimit = useCallback((limitKey) => {
    if (!usage?.[limitKey]) return false;
    const { percentage } = usage[limitKey];
    return percentage >= 80 && percentage < 100;
  }, [usage]);

  // Get usage percentage for a limit
  const getUsagePercentage = useCallback((limitKey) => {
    return usage?.[limitKey]?.percentage || 0;
  }, [usage]);

  // Check if user can see upgrade prompts (leaders only)
  const canSeeUpgradePrompts = useCallback(() => {
    return role === 'owner' || role === 'admin';
  }, [role]);

  // Check if a feature is available on current plan
  const hasFeature = useCallback((featureKey) => {
    if (!plan?.limits) return false;
    const limit = plan.limits[featureKey];
    return limit === -1 || limit > 0;
  }, [plan]);

  // Check if can create more of something
  const canCreate = useCallback((limitKey) => {
    if (!usage?.[limitKey] || !plan?.limits) return true;
    const limit = plan.limits[limitKey];
    if (limit === -1) return true; // Unlimited
    return usage[limitKey].used < limit;
  }, [usage, plan]);

  const value = {
    plan,
    planId: plan?.id || 'free',
    usage,
    role,
    canManageBilling,
    loading,
    error,
    refresh: fetchPlanData,
    // Helpers
    isLimitReached,
    isApproachingLimit,
    getUsagePercentage,
    canSeeUpgradePrompts,
    hasFeature,
    canCreate,
    // Plan tier info
    isPro: plan?.id === 'plus' || plan?.id === 'team' || plan?.id === 'enterprise',
    isTeam: plan?.id === 'team' || plan?.id === 'enterprise',
    isFree: plan?.id === 'free',
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}

export default PlanContext;
