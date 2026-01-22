// src/hooks/useWeeklyRetro.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - Data Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Fetches and processes weekly retro data.
// Combines local data with API data for comprehensive insights.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateInsights, generateWeeklySummary } from '../utils/insightGenerator';

const STORAGE_KEY = 'ss.weekly-retro';

/**
 * useWeeklyRetro - Main hook for weekly retrospective data
 */
export default function useWeeklyRetro() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState(null);

  // Get current week boundaries
  const getWeekBoundaries = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  }, []);

  // Fetch data from local storage and API
  const fetchWeeklyData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getWeekBoundaries();
      
      // Get local data
      const localData = getLocalWeeklyData(start, end);
      
      // Try to fetch from API
      let apiData = null;
      try {
        const response = await fetch('/api/retro/weekly', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          apiData = await response.json();
        }
      } catch {
        // API not available, use local data only
      }

      // Merge data
      const mergedData = mergeWeeklyData(localData, apiData);
      setWeeklyData(mergedData);

      // Generate insights
      const generatedInsights = generateInsights(mergedData);
      setInsights(generatedInsights);

      // Generate summary
      const generatedSummary = generateWeeklySummary(mergedData);
      setSummary(generatedSummary);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getWeekBoundaries]);

  // Initial fetch
  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  // Get stats for display
  const stats = useMemo(() => {
    if (!weeklyData) return null;

    const {
      tasksCompleted = [],
      focusSessions = [],
      streak = { current: 0, longest: 0 },
      collaborations = [],
    } = weeklyData;

    const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration || 25), 0);

    // Calculate category breakdown
    const categories = {};
    tasksCompleted.forEach(task => {
      const cat = task.category || 'general';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Calculate hourly distribution
    const hourlyDistribution = new Array(24).fill(0);
    tasksCompleted.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        hourlyDistribution[hour]++;
      }
    });

    // Calculate daily distribution
    const dailyDistribution = new Array(7).fill(0);
    tasksCompleted.forEach(task => {
      if (task.completedAt) {
        const day = new Date(task.completedAt).getDay();
        dailyDistribution[day]++;
      }
    });

    return {
      totalTasks: tasksCompleted.length,
      totalFocusMinutes,
      totalFocusHours: Math.round(totalFocusMinutes / 60 * 10) / 10,
      focusSessions: focusSessions.length,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      collaborationCount: collaborations.length,
      categories,
      hourlyDistribution,
      dailyDistribution,
      avgTasksPerDay: Math.round(tasksCompleted.length / 7 * 10) / 10,
    };
  }, [weeklyData]);

  // Check if retro was already viewed this week
  const hasViewedThisWeek = useMemo(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}.lastViewed`);
      if (!stored) return false;
      
      const lastViewed = new Date(stored);
      const { start } = getWeekBoundaries();
      
      return lastViewed >= start;
    } catch {
      return false;
    }
  }, [getWeekBoundaries]);

  // Mark as viewed
  const markAsViewed = useCallback(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}.lastViewed`, new Date().toISOString());
    } catch {
      // Ignore
    }
  }, []);

  // Get previous week data for comparison
  const previousWeekComparison = useMemo(() => {
    if (!weeklyData?.previousWeek) return null;

    const prev = weeklyData.previousWeek;
    const current = weeklyData;

    const tasksDiff = (current.tasksCompleted?.length || 0) - (prev.tasksCompleted?.length || 0);
    const focusDiff = (current.focusSessions?.length || 0) - (prev.focusSessions?.length || 0);

    return {
      tasksDiff,
      focusDiff,
      tasksPercent: prev.tasksCompleted?.length > 0 
        ? Math.round((tasksDiff / prev.tasksCompleted.length) * 100) 
        : 100,
      improved: tasksDiff > 0,
    };
  }, [weeklyData]);

  return {
    loading,
    error,
    weeklyData,
    insights,
    summary,
    stats,
    hasViewedThisWeek,
    markAsViewed,
    previousWeekComparison,
    refetch: fetchWeeklyData,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get weekly data from local storage
 */
function getLocalWeeklyData(start, end) {
  const data = {
    tasksCompleted: [],
    focusSessions: [],
    streak: { current: 0, longest: 0 },
    collaborations: [],
  };

  try {
    // Get task completions
    const taskCompletions = localStorage.getItem('ss.task-completions');
    if (taskCompletions) {
      const tasks = JSON.parse(taskCompletions);
      data.tasksCompleted = tasks.filter(t => {
        const completedAt = new Date(t.completedAt);
        return completedAt >= start && completedAt <= end;
      });
    }

    // Get focus sessions
    const focusSessions = localStorage.getItem('ss.focus-sessions');
    if (focusSessions) {
      const sessions = JSON.parse(focusSessions).sessions || [];
      data.focusSessions = sessions.filter(s => {
        const completedAt = new Date(s.completedAt);
        return completedAt >= start && completedAt <= end;
      });
    }

    // Get streak data
    const streakData = localStorage.getItem('ss.streak');
    if (streakData) {
      data.streak = JSON.parse(streakData);
    }

  } catch (e) {
    console.error('[WeeklyRetro] Error loading local data:', e);
  }

  return data;
}

/**
 * Merge local and API data
 */
function mergeWeeklyData(localData, apiData) {
  if (!apiData) return localData;

  return {
    tasksCompleted: [
      ...(localData.tasksCompleted || []),
      ...(apiData.tasksCompleted || []).filter(
        t => !localData.tasksCompleted?.some(lt => lt.id === t.id)
      ),
    ],
    focusSessions: [
      ...(localData.focusSessions || []),
      ...(apiData.focusSessions || []).filter(
        s => !localData.focusSessions?.some(ls => ls.id === s.id)
      ),
    ],
    streak: apiData.streak || localData.streak,
    collaborations: apiData.collaborations || localData.collaborations || [],
    previousWeek: apiData.previousWeek || null,
  };
}

/**
 * Check if it's time to show weekly retro (Monday morning)
 */
export function shouldShowWeeklyRetro() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  
  // Show on Monday between 8am-12pm
  if (dayOfWeek === 1 && hour >= 8 && hour < 12) {
    try {
      const lastViewed = localStorage.getItem(`${STORAGE_KEY}.lastViewed`);
      if (!lastViewed) return true;
      
      const lastViewedDate = new Date(lastViewed);
      const monday = new Date(now);
      monday.setHours(0, 0, 0, 0);
      
      return lastViewedDate < monday;
    } catch {
      return true;
    }
  }
  
  return false;
}
