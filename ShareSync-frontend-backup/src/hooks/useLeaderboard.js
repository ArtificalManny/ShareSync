// src/hooks/useLeaderboard.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.2: Momentum Streaks - Leaderboard Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Fetches and manages leaderboard data with multiple categories.
// Supports filtering, pagination, and real-time updates.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// Leaderboard categories
export const LEADERBOARD_CATEGORIES = {
  STREAKS: 'streaks',
  SHIPS: 'ships',
  XP: 'xp',
  COLLABORATORS: 'collaborators',
  COMEBACK: 'comeback',
};

// Time periods
export const TIME_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'all_time',
};

// Mock data generator
function generateMockLeaderboard(category, period, currentUserId) {
  const names = [
    { name: 'Sarah Chen', avatar: '👩‍💻', username: 'sarah_ships' },
    { name: 'Mike Rodriguez', avatar: '👨‍🎨', username: 'mike_codes' },
    { name: 'Alex Kim', avatar: '🧑‍🔬', username: 'alex_builds' },
    { name: 'Emma Wilson', avatar: '👩‍🚀', username: 'emma_creates' },
    { name: 'Jordan Lee', avatar: '👨‍💼', username: 'jordan_dev' },
    { name: 'Taylor Brooks', avatar: '👩‍��', username: 'taylor_pm' },
    { name: 'Casey Morgan', avatar: '🧑‍🎨', username: 'casey_designs' },
    { name: 'Riley Johnson', avatar: '👨‍🔧', username: 'riley_tech' },
    { name: 'Quinn Davis', avatar: '👩‍🏫', username: 'quinn_ai' },
    { name: 'Manny Rivas', avatar: '🚀', username: 'manny' },
  ];

  const baseMultiplier = {
    [TIME_PERIODS.DAILY]: 1,
    [TIME_PERIODS.WEEKLY]: 7,
    [TIME_PERIODS.MONTHLY]: 30,
    [TIME_PERIODS.ALL_TIME]: 365,
  }[period] || 7;

  return names.map((user, index) => {
    const isMe = user.username === 'manny';
    const rank = index + 1;
    
    // Different stats based on category
    let stats = {};
    switch (category) {
      case LEADERBOARD_CATEGORIES.STREAKS:
        stats = {
          streak: Math.floor((100 - index * 8) * (baseMultiplier / 7)),
          longestStreak: Math.floor((150 - index * 12) * (baseMultiplier / 7)),
          streakStartDate: new Date(Date.now() - (100 - index * 8) * 86400000).toISOString(),
        };
        break;
      case LEADERBOARD_CATEGORIES.SHIPS:
        stats = {
          ships: Math.floor((50 - index * 4) * baseMultiplier),
          avgShipsPerDay: parseFloat((3 - index * 0.2).toFixed(1)),
          fastestShip: `${Math.floor(15 + index * 5)}m`,
        };
        break;
      case LEADERBOARD_CATEGORIES.XP:
        stats = {
          xp: Math.floor((5000 - index * 400) * baseMultiplier),
          level: Math.floor(15 - index * 1.2),
          xpGainedThisPeriod: Math.floor((500 - index * 40) * baseMultiplier),
        };
        break;
      case LEADERBOARD_CATEGORIES.COLLABORATORS:
        stats = {
          projectsContributed: Math.floor(20 - index * 1.5),
          coworkSessions: Math.floor((15 - index) * baseMultiplier / 7),
          helpGiven: Math.floor((30 - index * 2) * baseMultiplier / 7),
        };
        break;
      case LEADERBOARD_CATEGORIES.COMEBACK:
        stats = {
          previousStreak: Math.floor(50 - index * 5),
          daysOff: Math.floor(5 + index * 2),
          newStreak: Math.floor(20 - index * 2),
          comebackScore: Math.floor(100 - index * 8),
        };
        break;
      default:
        stats = { score: Math.floor((100 - index * 8) * baseMultiplier) };
    }

    return {
      id: `user-${index + 1}`,
      rank,
      ...user,
      ...stats,
      isMe,
      achievements: Array(Math.max(0, 5 - index)).fill({}),
      trend: index < 3 ? 'up' : index > 6 ? 'down' : 'stable',
      previousRank: rank + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3),
    };
  }).sort((a, b) => {
    // Sort by primary stat based on category
    switch (category) {
      case LEADERBOARD_CATEGORIES.STREAKS:
        return b.streak - a.streak;
      case LEADERBOARD_CATEGORIES.SHIPS:
        return b.ships - a.ships;
      case LEADERBOARD_CATEGORIES.XP:
        return b.xp - a.xp;
      case LEADERBOARD_CATEGORIES.COLLABORATORS:
        return b.projectsContributed - a.projectsContributed;
      case LEADERBOARD_CATEGORIES.COMEBACK:
        return b.comebackScore - a.comebackScore;
      default:
        return b.score - a.score;
    }
  }).map((user, index) => ({ ...user, rank: index + 1 }));
}

/**
 * useLeaderboard - Main leaderboard hook
 */
export function useLeaderboard(options = {}) {
  const {
    category = LEADERBOARD_CATEGORIES.STREAKS,
    period = TIME_PERIODS.WEEKLY,
    limit = 10,
    teamOnly = false,
  } = options;

  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = generateMockLeaderboard(category, period, user?.id);
      setLeaderboard(data.slice(0, limit));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category, period, limit, user?.id]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Find current user in leaderboard
  const myEntry = useMemo(() => {
    return leaderboard.find(entry => entry.isMe) || null;
  }, [leaderboard]);

  const myRank = myEntry?.rank || null;

  // Top 3 users
  const podium = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  // Rest of leaderboard
  const rest = useMemo(() => {
    return leaderboard.slice(3);
  }, [leaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard,
    myEntry,
    myRank,
    podium,
    rest,
    category,
    period,
  };
}

/**
 * useComebackLeaderboard - Specific hook for comeback stories
 */
export function useComebackLeaderboard(period = TIME_PERIODS.WEEKLY) {
  return useLeaderboard({
    category: LEADERBOARD_CATEGORIES.COMEBACK,
    period,
    limit: 5,
  });
}

/**
 * useMyRank - Get just the current user's rank
 */
export function useMyRank(category = LEADERBOARD_CATEGORIES.STREAKS) {
  const { myEntry, myRank, loading } = useLeaderboard({ category, limit: 100 });
  
  return {
    rank: myRank,
    entry: myEntry,
    loading,
    percentile: myRank ? Math.round((1 - myRank / 100) * 100) : null,
  };
}

export default useLeaderboard;
