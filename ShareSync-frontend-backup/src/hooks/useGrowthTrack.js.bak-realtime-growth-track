// src/hooks/useGrowthTrack.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Identity & Growth Track - Hooks (STABLE)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
  getSkillProfile,
  getEvolutionMoments,
  getGrowthSuggestions,
  getGrowthTrends,
} from '../api/growthTrack';

export function useGrowthTrack(userId) {
  const [skillProfile, setSkillProfile] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!userId) return;

    try {
      if (!silent) setLoading(true);
      setError(null);

      // We use .catch on individual promises so a single 404/429 doesn't break everything
      const [skills, evo, sugg, trend] = await Promise.all([
        getSkillProfile(userId).catch(() => null),
        getEvolutionMoments(userId).catch(() => []),
        getGrowthSuggestions(userId).catch(() => []),
        getGrowthTrends(userId, 'all', 12).catch(() => null),
      ]);

      setSkillProfile(skills);
      setEvolution(evo);
      setSuggestions(sugg);
      setTrends(trend);
    } catch (err) {
      console.warn('[useGrowthTrack] Growth data unavailable:', err?.message);
      setError(err); 
    } finally {
      setLoading(false);
    }
  }, [userId]); // ⭐ Fixed: removed skillProfile to prevent infinite recreation

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

export function useSkillProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!userId) return;
      try { const data = await getSkillProfile(userId); setProfile(data); } 
      catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    fetch();
  }, [userId]);

  return { profile, loading };
}

export function useEvolutionMoments(userId) {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!userId) return;
      try { const data = await getEvolutionMoments(userId); setMoments(data); } 
      catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    fetch();
  }, [userId]);

  return { moments, loading };
}

export function useGrowthSuggestions(userId) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!userId) return;
      try { const data = await getGrowthSuggestions(userId); setSuggestions(data); } 
      catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    fetch();
  }, [userId]);

  return { suggestions, loading };
}

export function useGrowthTrends(userId, metric = 'all', weeks = 12) {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!userId) return;
      try { const data = await getGrowthTrends(userId, metric, weeks); setTrends(data); } 
      catch (err) { console.error(err); } 
      finally { setLoading(false); }
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
