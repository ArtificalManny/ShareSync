// src/hooks/useProjectStory.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: Project Story Time Machine - Hooks
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getProjectTimeline,
  getWeeklySummary,
  getDecisionLog,
  getProjectSnapshot,
  getProjectWeeks,
} from '../api/projectStory';
import { filterEvents, groupEventsByDate, calculateTimelineStats } from '../utils/timelineFilters';

/**
 * Main hook for project timeline
 */
export function useProjectTimeline(projectId, initialFilters = {}) {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const fetchTimeline = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getProjectTimeline(projectId, filters);
      setEvents(data.events || []);
      setDateRange(data.dateRange);
    } catch (err) {
      setError(err.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [projectId, filters]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const filteredEvents = useMemo(() => filterEvents(events, filters), [events, filters]);
  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);
  const stats = useMemo(() => calculateTimelineStats(events), [events]);

  return {
    events,
    filteredEvents,
    groupedEvents,
    stats,
    filters,
    dateRange,
    loading,
    error,
    updateFilters,
    clearFilters,
    refresh: fetchTimeline,
  };
}

/**
 * Hook for weekly summary
 */
export function useWeeklySummary(projectId, weekStart) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getWeeklySummary(projectId, weekStart);
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [projectId, weekStart]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refresh: fetchSummary };
}

/**
 * Hook for decision log
 */
export function useDecisionLog(projectId) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDecisions = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getDecisionLog(projectId);
      setDecisions(data);
    } catch (err) {
      setError(err.message || 'Failed to load decisions');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  return { decisions, loading, error, refresh: fetchDecisions };
}

/**
 * Hook for replay mode
 */
export function useReplayMode(projectId, dateRange) {
  const [currentTime, setCurrentTime] = useState(dateRange?.start || null);
  const [snapshot, setSnapshot] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchSnapshot = useCallback(async (timestamp) => {
    if (!projectId || !timestamp) return;

    try {
      setLoading(true);
      const data = await getProjectSnapshot(projectId, timestamp);
      setSnapshot(data);
    } catch (err) {
      console.error('Snapshot error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch snapshot when time changes
  useEffect(() => {
    if (currentTime) {
      fetchSnapshot(currentTime);
    }
  }, [currentTime, fetchSnapshot]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || !dateRange) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const current = new Date(prev);
        const end = new Date(dateRange.end);
        const next = new Date(current.getTime() + (60 * 60 * 1000 * playbackSpeed)); // 1 hour per tick

        if (next >= end) {
          setIsPlaying(false);
          return dateRange.end;
        }
        return next.toISOString();
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, dateRange, playbackSpeed]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(dateRange?.start || null);
  }, [dateRange]);

  const seekTo = useCallback((timestamp) => {
    setCurrentTime(timestamp);
  }, []);

  const progress = useMemo(() => {
    if (!dateRange || !currentTime) return 0;
    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime();
    const current = new Date(currentTime).getTime();
    return ((current - start) / (end - start)) * 100;
  }, [dateRange, currentTime]);

  return {
    currentTime,
    snapshot,
    isPlaying,
    playbackSpeed,
    progress,
    loading,
    play,
    pause,
    stop,
    seekTo,
    setPlaybackSpeed,
  };
}

/**
 * Hook for available weeks
 */
export function useProjectWeeks(projectId) {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeeks() {
      if (!projectId) return;
      try {
        const data = await getProjectWeeks(projectId);
        setWeeks(data);
      } catch (err) {
        console.error('Weeks error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeeks();
  }, [projectId]);

  return { weeks, loading };
}

export default {
  useProjectTimeline,
  useWeeklySummary,
  useDecisionLog,
  useReplayMode,
  useProjectWeeks,
};
