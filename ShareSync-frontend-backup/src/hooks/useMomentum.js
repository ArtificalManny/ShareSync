// src/hooks/useMomentum.js
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM VISUALIZATION - Momentum Calculator
// ═══════════════════════════════════════════════════════════════════════════════
// Calculates a "momentum score" from various signals:
// - Recent task completions
// - Streak data
// - Project health
// - Activity patterns
//
// Returns a score from 0-100 and a "vibe" (low/neutral/high)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';

// Momentum thresholds
const THRESHOLDS = {
  LOW: 35,      // Below this = low momentum
  HIGH: 70,     // Above this = high momentum
};

// Weights for different signals (must sum to 1)
const WEIGHTS = {
  recentCompletions: 0.30,  // Tasks completed today/this week
  streak: 0.25,             // Current streak days
  projectHealth: 0.25,      // Average project health
  activityPattern: 0.20,    // Consistency of activity
};

/**
 * Calculate momentum from various data sources
 */
export function calculateMomentum({
  tasksCompletedToday = 0,
  tasksCompletedThisWeek = 0,
  dailyTarget = 5,
  weeklyTarget = 25,
  streakDays = 0,
  projectHealthScores = [], // Array of 0-100 scores
  recentActivityDays = 0,   // Days active in last 7
}) {
  // 1. Recent completions score (0-100)
  const dailyProgress = Math.min(1, tasksCompletedToday / dailyTarget);
  const weeklyProgress = Math.min(1, tasksCompletedThisWeek / weeklyTarget);
  const completionsScore = ((dailyProgress * 0.6) + (weeklyProgress * 0.4)) * 100;

  // 2. Streak score (0-100)
  // Logarithmic scale: 1 day = 20, 7 days = 70, 14+ days = 90+
  const streakScore = Math.min(100, Math.log2(streakDays + 1) * 25);

  // 3. Project health score (0-100)
  const avgHealth = projectHealthScores.length > 0
    ? projectHealthScores.reduce((a, b) => a + b, 0) / projectHealthScores.length
    : 50; // Default to neutral if no projects

  // 4. Activity pattern score (0-100)
  // How many of the last 7 days were active
  const activityScore = (recentActivityDays / 7) * 100;

  // Weighted sum
  const momentum = Math.round(
    (completionsScore * WEIGHTS.recentCompletions) +
    (streakScore * WEIGHTS.streak) +
    (avgHealth * WEIGHTS.projectHealth) +
    (activityScore * WEIGHTS.activityPattern)
  );

  // Determine vibe
  let vibe = 'neutral';
  if (momentum < THRESHOLDS.LOW) vibe = 'low';
  else if (momentum >= THRESHOLDS.HIGH) vibe = 'high';

  return {
    score: momentum,
    vibe,
    components: {
      completions: Math.round(completionsScore),
      streak: Math.round(streakScore),
      health: Math.round(avgHealth),
      activity: Math.round(activityScore),
    },
  };
}

/**
 * Hook to track and calculate momentum
 */
export default function useMomentum(data = {}) {
  const [momentum, setMomentum] = useState(() => calculateMomentum(data));

  // Recalculate when data changes
  useEffect(() => {
    const result = calculateMomentum(data);
    setMomentum(result);
  }, [
    data.tasksCompletedToday,
    data.tasksCompletedThisWeek,
    data.dailyTarget,
    data.weeklyTarget,
    data.streakDays,
    data.projectHealthScores?.join(','),
    data.recentActivityDays,
  ]);

  // Derived states
  const isHighMomentum = momentum.vibe === 'high';
  const isLowMomentum = momentum.vibe === 'low';
  const isNeutral = momentum.vibe === 'neutral';

  // Get color temperature shift (-1 to 1)
  // -1 = cool (low momentum), 0 = neutral, 1 = warm (high momentum)
  const temperatureShift = useMemo(() => {
    if (momentum.score < THRESHOLDS.LOW) {
      // Map 0-35 to -1 to -0.2
      return -1 + ((momentum.score / THRESHOLDS.LOW) * 0.8);
    } else if (momentum.score >= THRESHOLDS.HIGH) {
      // Map 70-100 to 0.2 to 1
      return 0.2 + (((momentum.score - THRESHOLDS.HIGH) / (100 - THRESHOLDS.HIGH)) * 0.8);
    }
    // Neutral zone: -0.2 to 0.2
    const neutralRange = THRESHOLDS.HIGH - THRESHOLDS.LOW;
    const neutralPosition = (momentum.score - THRESHOLDS.LOW) / neutralRange;
    return -0.2 + (neutralPosition * 0.4);
  }, [momentum.score]);

  // Animation intensity (0 to 1)
  // Low momentum = reduced animations, high = enabled
  const animationIntensity = useMemo(() => {
    if (momentum.score < THRESHOLDS.LOW) return 0.3;
    if (momentum.score >= THRESHOLDS.HIGH) return 1;
    // Neutral: 0.5 to 0.8
    const neutralRange = THRESHOLDS.HIGH - THRESHOLDS.LOW;
    const neutralPosition = (momentum.score - THRESHOLDS.LOW) / neutralRange;
    return 0.5 + (neutralPosition * 0.3);
  }, [momentum.score]);

  return {
    // Core data
    score: momentum.score,
    vibe: momentum.vibe,
    components: momentum.components,

    // Derived states
    isHighMomentum,
    isLowMomentum,
    isNeutral,

    // UI modifiers
    temperatureShift,    // -1 (cool) to 1 (warm)
    animationIntensity,  // 0 to 1

    // Thresholds for reference
    thresholds: THRESHOLDS,
  };
}

export { THRESHOLDS, WEIGHTS };
