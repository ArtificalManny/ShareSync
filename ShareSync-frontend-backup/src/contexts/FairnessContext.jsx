// src/contexts/FairnessContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: Fairness & Contribution Engine - State Management
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getProjectContributions, 
  getFairnessReport,
  getContributionTrends,
} from '../api/fairnessEngine';
import { detectSkew, calculateEntropyScore } from '../utils/contributionScore';

const FairnessContext = createContext(null);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function FairnessProvider({ children, projectId, autoRefreshInterval = 60000 }) {
  const [contributions, setContributions] = useState([]);
  const [report, setReport] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch contributions
  const fetchContributions = useCallback(async (silent = false) => {
    if (!projectId) return;
    
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const data = await getProjectContributions(projectId);
      setContributions(data.contributions || []);
      setLastRefresh(Date.now());
    } catch (err) {
      setError(err.message || 'Failed to load contributions');
      console.error('[Fairness] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch full report
  const fetchReport = useCallback(async (timeframe = 'sprint') => {
    if (!projectId) return null;
    
    try {
      const data = await getFairnessReport(projectId, timeframe);
      setReport(data);
      return data;
    } catch (err) {
      console.error('[Fairness] Report fetch error:', err);
      return null;
    }
  }, [projectId]);

  // Fetch trends
  const fetchTrends = useCallback(async (weeks = 8) => {
    if (!projectId) return [];
    
    try {
      const data = await getContributionTrends(projectId, weeks);
      setTrends(data);
      return data;
    } catch (err) {
      console.error('[Fairness] Trends fetch error:', err);
      return [];
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      fetchContributions(true);
    }, autoRefreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchContributions, autoRefreshInterval]);

  // Listen for ship events to trigger refresh
  useEffect(() => {
    const handleShip = () => {
      setTimeout(() => fetchContributions(true), 1000);
    };
    
    window.addEventListener('local-ship', handleShip);
    window.addEventListener('task-complete', handleShip);
    
    return () => {
      window.removeEventListener('local-ship', handleShip);
      window.removeEventListener('task-complete', handleShip);
    };
  }, [fetchContributions]);

  // Computed values
  const skewAnalysis = useMemo(() => detectSkew(contributions), [contributions]);
  const entropyScore = useMemo(() => calculateEntropyScore(contributions), [contributions]);
  const isBalanced = useMemo(() => !skewAnalysis.isSkewed, [skewAnalysis]);
  const heavyLifter = useMemo(() => skewAnalysis.heavyLifter, [skewAnalysis]);
  const warnings = useMemo(() => skewAnalysis.warnings || [], [skewAnalysis]);

  // Get member by ID
  const getMemberContribution = useCallback((userId) => {
    return contributions.find(c => c.userId === userId) || null;
  }, [contributions]);

  // Get top contributors
  const getTopContributors = useCallback((count = 3) => {
    return [...contributions].sort((a, b) => b.score - a.score).slice(0, count);
  }, [contributions]);

  const value = useMemo(() => ({
    // Data
    projectId,
    contributions,
    report,
    trends,
    
    // State
    loading,
    error,
    lastRefresh,
    
    // Computed
    skewAnalysis,
    entropyScore,
    isBalanced,
    heavyLifter,
    warnings,
    hasWarnings: warnings.length > 0,
    
    // Actions
    refresh: () => fetchContributions(false),
    silentRefresh: () => fetchContributions(true),
    fetchReport,
    fetchTrends,
    getMemberContribution,
    getTopContributors,
  }), [
    projectId, contributions, report, trends,
    loading, error, lastRefresh,
    skewAnalysis, entropyScore, isBalanced, heavyLifter, warnings,
    fetchContributions, fetchReport, fetchTrends, getMemberContribution, getTopContributors,
  ]);

  return (
    <FairnessContext.Provider value={value}>
      {children}
    </FairnessContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main hook for accessing fairness state
 */
export function useFairness() {
  const context = useContext(FairnessContext);
  
  if (!context) {
    // Return default state if not in provider
    return {
      projectId: null,
      contributions: [],
      report: null,
      trends: [],
      loading: false,
      error: null,
      lastRefresh: null,
      skewAnalysis: { isSkewed: false, level: 'balanced', warnings: [] },
      entropyScore: 1,
      isBalanced: true,
      heavyLifter: null,
      warnings: [],
      hasWarnings: false,
      refresh: () => {},
      silentRefresh: () => {},
      fetchReport: async () => null,
      fetchTrends: async () => [],
      getMemberContribution: () => null,
      getTopContributors: () => [],
    };
  }
  
  return context;
}

/**
 * Hook for just the skew warnings
 */
export function useFairnessWarnings() {
  const { warnings, hasWarnings, isBalanced, skewAnalysis } = useFairness();
  
  return {
    warnings,
    hasWarnings,
    isBalanced,
    level: skewAnalysis.level,
    maxPercentage: skewAnalysis.maxPercentage,
  };
}

/**
 * Hook for a specific member's contribution
 */
export function useMemberContribution(userId) {
  const { getMemberContribution, loading } = useFairness();
  
  const contribution = useMemo(() => getMemberContribution(userId), [getMemberContribution, userId]);
  
  return { contribution, loading };
}

export default FairnessContext;
