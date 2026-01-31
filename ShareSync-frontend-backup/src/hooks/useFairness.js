// src/hooks/useFairness.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: Fairness & Contribution Engine - Standalone Hooks
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getProjectContributions, 
  getUserContributions,
  getFairnessReport,
  getContributionTrends,
} from '../api/fairnessEngine';
import { 
  calculateTeamContributions, 
  detectSkew, 
  calculateEntropyScore,
  getContributionTier,
} from '../utils/contributionScore';

/**
 * Hook for project contributions (standalone, doesn't need provider)
 */
export function useProjectContributions(projectId, options = {}) {
  const { autoRefresh = true, refreshInterval = 60000 } = options;
  
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContributions = useCallback(async (silent = false) => {
    if (!projectId) return;
    
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const data = await getProjectContributions(projectId);
      setContributions(data.contributions || []);
    } catch (err) {
      setError(err.message || 'Failed to load contributions');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;
    
    const interval = setInterval(() => fetchContributions(true), refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchContributions]);

  const skewAnalysis = useMemo(() => detectSkew(contributions), [contributions]);

  return {
    contributions,
    loading,
    error,
    refresh: fetchContributions,
    skewAnalysis,
    isBalanced: !skewAnalysis.isSkewed,
    entropyScore: calculateEntropyScore(contributions),
  };
}

/**
 * Hook for user's own contribution stats
 */
export function useUserContributions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getUserContributions();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load user contributions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fairness report
 */
export function useFairnessReport(projectId, timeframe = 'sprint') {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getFairnessReport(projectId, timeframe);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to load fairness report');
    } finally {
      setLoading(false);
    }
  }, [projectId, timeframe]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, loading, error, refresh: fetchReport };
}

/**
 * Hook for contribution trends
 */
export function useContributionTrends(projectId, weeks = 8) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrends = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getContributionTrends(projectId, weeks);
      setTrends(data);
    } catch (err) {
      setError(err.message || 'Failed to load contribution trends');
    } finally {
      setLoading(false);
    }
  }, [projectId, weeks]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { trends, loading, error, refresh: fetchTrends };
}

/**
 * Hook to check if balance alert should show
 */
export function useBalanceAlert(contributions, threshold = 40) {
  return useMemo(() => {
    const skew = detectSkew(contributions, { warning: threshold, critical: 60 });
    
    if (!skew.isSkewed) {
      return { show: false, type: null, member: null, message: null };
    }
    
    return {
      show: true,
      type: skew.level,
      member: skew.heavyLifter,
      message: skew.warnings[0]?.message || 'Workload imbalanced',
      percentage: skew.maxPercentage,
    };
  }, [contributions, threshold]);
}

export default {
  useProjectContributions,
  useUserContributions,
  useFairnessReport,
  useContributionTrends,
  useBalanceAlert,
};
