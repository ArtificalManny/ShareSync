from pathlib import Path
import sys

ROOT = Path.cwd()
HOOK = ROOT / "src/hooks/useGrowthTrack.js"

HOOK_CODE = """// src/hooks/useGrowthTrack.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Identity & Growth Track - Hooks
// Realtime-ready profile analytics fetch layer
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSkillProfile,
  getEvolutionMoments,
  getGrowthSuggestions,
  getGrowthTrends,
} from '../api/growthTrack';

const DEFAULT_TRENDS = {
  summary: {
    velocityGrowth: 0,
    qualityGrowth: 0,
    collaborationGrowth: 0,
    overallGrowth: 0,
  },
  data: [],
};

function normalizeTrendPoint(point = {}, index = 0) {
  const velocity = Number(point.velocity || 0);
  const quality = Number(point.quality || 0);
  const collaboration = Number(point.collaboration || 0);

  const suppliedOverall = point.overall;
  const computedOverall = Math.round((velocity * 0.4) + (quality * 0.3) + (collaboration * 0.3));

  return {
    label: point.label || point.week || point.date || `Week ${index + 1}`,
    date: point.date || null,
    velocity,
    quality,
    collaboration,
    overall: Number.isFinite(Number(suppliedOverall)) ? Number(suppliedOverall) : computedOverall,
  };
}

function normalizeTrends(rawTrends) {
  if (!rawTrends) return DEFAULT_TRENDS;

  const data = Array.isArray(rawTrends.data)
    ? rawTrends.data.map(normalizeTrendPoint)
    : [];

  return {
    ...DEFAULT_TRENDS,
    ...rawTrends,
    summary: {
      ...DEFAULT_TRENDS.summary,
      ...(rawTrends.summary || {}),
    },
    data,
  };
}

function normalizeSkillProfile(rawProfile) {
  if (!rawProfile) return null;

  return {
    ...rawProfile,
    skills: {
      velocity: 0,
      quality: 0,
      collaboration: 0,
      reliability: 0,
      ...(rawProfile.skills || {}),
    },
    strengths: Array.isArray(rawProfile.strengths) ? rawProfile.strengths : [],
    growthAreas: Array.isArray(rawProfile.growthAreas) ? rawProfile.growthAreas : [],
    archetype: rawProfile.archetype || { current: null },
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function useGrowthTrack(userId) {
  const [skillProfile, setSkillProfile] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [trends, setTrends] = useState(DEFAULT_TRENDS);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const lastFetchRef = useRef(0);

  const fetchAll = useCallback(async (silent = false) => {
    if (!userId) {
      setSkillProfile(null);
      setEvolution([]);
      setSuggestions([]);
      setTrends(DEFAULT_TRENDS);
      setLoading(false);
      return;
    }

    if (inFlightRef.current) return;

    try {
      inFlightRef.current = true;

      if (!silent) setLoading(true);
      setError(null);

      const [skills, evo, sugg, trend] = await Promise.all([
        getSkillProfile(userId).catch((err) => {
          console.warn('[useGrowthTrack] Skill profile unavailable:', err?.message || err);
          return null;
        }),
        getEvolutionMoments(userId).catch((err) => {
          console.warn('[useGrowthTrack] Evolution moments unavailable:', err?.message || err);
          return [];
        }),
        getGrowthSuggestions(userId).catch((err) => {
          console.warn('[useGrowthTrack] Growth suggestions unavailable:', err?.message || err);
          return [];
        }),
        getGrowthTrends(userId, 'all', 12).catch((err) => {
          console.warn('[useGrowthTrack] Growth trends unavailable:', err?.message || err);
          return null;
        }),
      ]);

      if (!mountedRef.current) return;

      setSkillProfile(normalizeSkillProfile(skills));
      setEvolution(normalizeArray(evo));
      setSuggestions(normalizeArray(sugg));
      setTrends(normalizeTrends(trend));
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.warn('[useGrowthTrack] Growth data unavailable:', err?.message || err);

      if (mountedRef.current) {
        setError(err);
      }
    } finally {
      inFlightRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll(false);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchAll]);

  useEffect(() => {
    if (!userId) return undefined;

    const refreshSilently = () => {
      fetchAll(true);
    };

    const refreshWithThrottle = () => {
      const now = Date.now();
      const elapsed = now - lastFetchRef.current;

      if (elapsed < 1500) return;

      fetchAll(true);
    };

    const handleWindowFocus = () => {
      refreshWithThrottle();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshWithThrottle();
      }
    };

    const handleGrowthRefresh = (event) => {
      const eventUserId =
        event?.detail?.userId ||
        event?.detail?.user?._id ||
        event?.detail?.user?.id ||
        null;

      if (!eventUserId || String(eventUserId) === String(userId)) {
        refreshSilently();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // App-wide hooks that sockets or action handlers can dispatch later:
    // window.dispatchEvent(new CustomEvent('growth-track:refresh', { detail: { userId } }))
    // window.dispatchEvent(new CustomEvent('profile.metrics.updated', { detail: { userId } }))
    window.addEventListener('growth-track:refresh', handleGrowthRefresh);
    window.addEventListener('profile.metrics.updated', handleGrowthRefresh);
    window.addEventListener('activity:created', handleGrowthRefresh);
    window.addEventListener('task:completed', handleGrowthRefresh);
    window.addEventListener('vault:file-uploaded', handleGrowthRefresh);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('growth-track:refresh', handleGrowthRefresh);
      window.removeEventListener('profile.metrics.updated', handleGrowthRefresh);
      window.removeEventListener('activity:created', handleGrowthRefresh);
      window.removeEventListener('task:completed', handleGrowthRefresh);
      window.removeEventListener('vault:file-uploaded', handleGrowthRefresh);
    };
  }, [userId, fetchAll]);

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
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetch() {
      if (!userId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getSkillProfile(userId);

        if (active) {
          setProfile(normalizeSkillProfile(data));
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      active = false;
    };
  }, [userId]);

  return { profile, loading, error };
}

export function useEvolutionMoments(userId) {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetch() {
      if (!userId) {
        setMoments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getEvolutionMoments(userId);

        if (active) {
          setMoments(normalizeArray(data));
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      active = false;
    };
  }, [userId]);

  return { moments, loading, error };
}

export function useGrowthSuggestions(userId) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetch() {
      if (!userId) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getGrowthSuggestions(userId);

        if (active) {
          setSuggestions(normalizeArray(data));
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      active = false;
    };
  }, [userId]);

  return { suggestions, loading, error };
}

export function useGrowthTrends(userId, metric = 'all', weeks = 12) {
  const [trends, setTrends] = useState(DEFAULT_TRENDS);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetch() {
      if (!userId) {
        setTrends(DEFAULT_TRENDS);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getGrowthTrends(userId, metric, weeks);

        if (active) {
          setTrends(normalizeTrends(data));
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      active = false;
    };
  }, [userId, metric, weeks]);

  return { trends, loading, error };
}

export default {
  useGrowthTrack,
  useSkillProfile,
  useEvolutionMoments,
  useGrowthSuggestions,
  useGrowthTrends,
};
"""

def fail(message):
    print(f"\\n[patch_use_growth_track_realtime] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_use_growth_track_realtime] starting")

    if not HOOK.exists():
        fail(f"Could not find {HOOK}")

    original = HOOK.read_text(encoding="utf-8")

    required_markers = [
        "export function useGrowthTrack",
        "getSkillProfile",
        "getEvolutionMoments",
        "getGrowthSuggestions",
        "getGrowthTrends",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "profile.metrics.updated" in original and "normalizeTrends" in original:
        print("[patch_use_growth_track_realtime] useGrowthTrack already appears realtime-ready")
        return

    backup = HOOK.with_suffix(HOOK.suffix + ".bak-realtime-growth-track")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_use_growth_track_realtime] backup created: {backup}")

    HOOK.write_text(HOOK_CODE, encoding="utf-8")
    print(f"[patch_use_growth_track_realtime] patched: {HOOK}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"normalizeTrends|profile.metrics.updated|growth-track:refresh|useGrowthTrack|getGrowthTrends\" src/hooks/useGrowthTrack.js")
    print("  git diff -- src/hooks/useGrowthTrack.js")

if __name__ == "__main__":
    main()
