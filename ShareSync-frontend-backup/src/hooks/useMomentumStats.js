// src/hooks/useMomentumStats.js
import { useState, useEffect } from 'react';

/**
 * useMomentumStats - Fetches real-time momentum metrics
 * 
 * Returns:
 * - shipsToday: Number of projects/tasks shipped today
 * - activeTeammates: Number of teammates online/active now
 * - weekProgress: Percentage of week's goals completed (0-100)
 */
export default function useMomentumStats() {
  const [stats, setStats] = useState({
    shipsToday: 0,
    activeTeammates: 0,
    weekProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMomentumStats() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('ss.jwt');
        if (!token) {
          setStats({ shipsToday: 0, activeTeammates: 0, weekProgress: 0 });
          setLoading(false);
          return;
        }

        // ⭐ FETCH ALL STATS IN PARALLEL
        const [shipsData, activeData, progressData] = await Promise.all([
          fetchShipsToday(token),
          fetchActiveTeammates(token),
          fetchWeekProgress(token),
        ]);

        setStats({
          shipsToday: shipsData || 0,
          activeTeammates: activeData || 0,
          weekProgress: progressData || 0,
        });

      } catch (err) {
        console.error('[useMomentumStats] Error:', err);
        setError(err.message);
        // Set default values on error
        setStats({ shipsToday: 0, activeTeammates: 0, weekProgress: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchMomentumStats();

    // ⭐ REFRESH EVERY 60 SECONDS
    const interval = setInterval(fetchMomentumStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}

// ====================================================================
// HELPER FUNCTIONS - API CALLS
// ====================================================================

/**
 * fetchShipsToday - Get number of ships (completed projects/tasks) today
 */
async function fetchShipsToday(token) {
  try {
    const response = await fetch('http://localhost:3000/api/momentum/ships-today', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[fetchShipsToday] API returned non-OK status');
      return 0;
    }

    const data = await response.json();
    return data.count || data.shipsToday || 0;
  } catch (error) {
    console.error('[fetchShipsToday] Error:', error);
    return 0;
  }
}

/**
 * fetchActiveTeammates - Get number of teammates active right now
 */
async function fetchActiveTeammates(token) {
  try {
    const response = await fetch('http://localhost:3000/api/presence/active-count', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[fetchActiveTeammates] API returned non-OK status');
      return 0;
    }

    const data = await response.json();
    return data.count || data.activeCount || 0;
  } catch (error) {
    console.error('[fetchActiveTeammates] Error:', error);
    return 0;
  }
}

/**
 * fetchWeekProgress - Get percentage of this week's goals completed
 */
async function fetchWeekProgress(token) {
  try {
    const response = await fetch('http://localhost:3000/api/momentum/week-progress', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[fetchWeekProgress] API returned non-OK status');
      return 0;
    }

    const data = await response.json();
    const progress = data.progress || data.percentage || 0;
    
    // Ensure it's between 0-100
    return Math.min(Math.max(progress, 0), 100);
  } catch (error) {
    console.error('[fetchWeekProgress] Error:', error);
    return 0;
  }
}
