// src/hooks/useGrowthTrack.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Identity & Growth Track - Hooks
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
  getSkillProfile,
  getEvolutionMoments,
  getGrowthSuggestions,
  getGrowthTrends,
} from '../api/growthTrack';

/**
 * Main hook for growth track data
 */
export function useGrowthTrack(userId) {
  const [skillProfile, setSkillProfile] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const [skills, evo, sugg, trend] = await Promise.all([
        getSkillProfile(userId),
        getEvolutionMoments(userId),
        getGrowthSuggestions(userId),
        getGrowthTrends(userId, 'all', 12),
      ]);

      setSkillProfile(skills);
      setEvolution(evo);
      setSuggestions(sugg);
      setTrends(trend);
    } catch (err) {
      setError(err.message || 'Failed to load growth data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    skillProfile,
    evolution,
    suggestions,
    trends,
    loading,
    error,
    refresh: fetchAll,
  };
}

/**
 * Hook for just skill profile
 */
export function useSkillProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!userId) return;
      try {
        const data = await getSkillProfile(userId);
        setProfile(data);
      } catch (err) {
        console.error('Skill profile error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [userId]);

  return { profile, loading };
}

/**
 * Hook for evolution moments
 */
export function useEvolutionMoments(userId) {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!userId) return;
      try {
        const data = await getEvolutionMoments(userId);
        setMoments(data);
      } catch (err) {
        console.error('Evolution error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [userId]);

  return { moments, loading };
}

/**
 * Hook for growth suggestions
 */
export function useGrowthSuggestions(userId) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!userId) return;
      try {
        const data = await getGrowthSuggestions(userId);
        setSuggestions(data);
      } catch (err) {
        console.error('Suggestions error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [userId]);

  return { suggestions, loading };
}

/**
 * Hook for trend data
 */
export function useGrowthTrends(userId, metric = 'all', weeks = 12) {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!userId) return;
      try {
        const data = await getGrowthTrends(userId, metric, weeks);
        setTrends(data);
      } catch (err) {
        console.error('Trends error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [userId, metric, weeks]);

  return { trends, loading };
}

export default {
  useGrowthTrack,
  useSkillProfile,
  useEvolutionMoments,
  useGrowthSuggestions,
  useGrowthTrends,
};
