// src/hooks/usePlanLimits.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE L: Plan Limits Hook
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { getPlanAndUsage, checkFeatureAccess, PLAN_TIERS } from '../api/billing';

/**
 * Standalone hook for checking plan limits
 * Can be used without PlanProvider for isolated components
 */
export function usePlanLimits() {
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getPlanAndUsage();
        setPlan(data.plan);
        setUsage(data.usage);
      } catch (err) {
        console.error('Plan limits error:', err);
        setPlan(PLAN_TIERS.free);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const checkLimit = useCallback((key) => {
    if (!usage?.[key] || !plan?.limits) {
      return { allowed: true, percentage: 0, remaining: Infinity };
    }

    const { used, limit } = usage[key];
    if (limit === -1) {
      return { allowed: true, percentage: 0, remaining: Infinity };
    }

    return {
      allowed: used < limit,
      percentage: (used / limit) * 100,
      remaining: limit - used,
      used,
      limit,
    };
  }, [usage, plan]);

  return { plan, usage, loading, checkLimit };
}

/**
 * Hook to check a specific feature
 */
export function useFeatureCheck(featureName) {
  const [allowed, setAllowed] = useState(true);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const result = await checkFeatureAccess(featureName);
        setAllowed(result.allowed);
        setReason(result.reason || '');
      } catch (err) {
        setAllowed(false);
        setReason('Unable to verify access');
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [featureName]);

  return { allowed, reason, loading };
}

/**
 * Hook to track usage and show warnings
 */
export function useUsageWarning(limitKey, warningThreshold = 80) {
  const { usage, loading } = usePlanLimits();
  const [showWarning, setShowWarning] = useState(false);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    if (!usage?.[limitKey]) return;
    
    const pct = usage[limitKey].percentage || 0;
    setPercentage(pct);
    setShowWarning(pct >= warningThreshold);
  }, [usage, limitKey, warningThreshold]);

  return { showWarning, percentage, loading };
}

export default {
  usePlanLimits,
  useFeatureCheck,
  useUsageWarning,
};
