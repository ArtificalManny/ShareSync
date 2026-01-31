// src/hooks/useEmotionalTemperature.js
// ═══════════════════════════════════════════════════════════════════════════════
// Emotional Temperature Hook - Determines UI color temperature based on state
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Determines the emotional temperature based on various factors
 * 
 * Temperature levels:
 * - cold: Calm, relaxed, low activity
 * - warm: Normal activity, productive, engaged
 * - hot: Fire mode, urgent, deadlines approaching
 */
export function useEmotionalTemperature({
  isFireMode = false,
  momentum = 0,
  urgentTasks = 0,
  streakAtRisk = false,
  focusSessionActive = false,
  recentShips = 0,
}) {
  const [temperature, setTemperature] = useState('warm');
  const [intensity, setIntensity] = useState(0.5); // 0-1 scale

  // Calculate temperature based on inputs
  useEffect(() => {
    let temp = 'warm';
    let intens = 0.5;

    // Fire mode always sets hot
    if (isFireMode) {
      temp = 'hot';
      intens = 0.9;
    }
    // Urgent tasks or streak at risk
    else if (urgentTasks > 2 || streakAtRisk) {
      temp = 'hot';
      intens = 0.7 + (urgentTasks * 0.05);
    }
    // High momentum or recent ships
    else if (momentum >= 4 || recentShips > 2) {
      temp = 'warm';
      intens = 0.7 + (momentum * 0.05);
    }
    // Focus session - slightly warmer
    else if (focusSessionActive) {
      temp = 'warm';
      intens = 0.6;
    }
    // Low activity
    else if (momentum < 2 && recentShips === 0) {
      temp = 'cold';
      intens = 0.3;
    }

    // Cap intensity
    intens = Math.min(intens, 1);

    setTemperature(temp);
    setIntensity(intens);
  }, [isFireMode, momentum, urgentTasks, streakAtRisk, focusSessionActive, recentShips]);

  // Apply temperature to document
  useEffect(() => {
    document.documentElement.setAttribute('data-temperature', temperature);
    return () => {
      document.documentElement.removeAttribute('data-temperature');
    };
  }, [temperature]);

  // Get CSS variables for current temperature
  const cssVariables = useMemo(() => {
    const baseColors = {
      cold: {
        accent: 'var(--temp-cold-accent)',
        glow: 'var(--temp-cold-accent-muted)',
        overlay: 'transparent',
      },
      warm: {
        accent: 'var(--temp-warm-accent)',
        glow: 'var(--temp-warm-accent-muted)',
        overlay: 'var(--warm-overlay)',
      },
      hot: {
        accent: 'var(--temp-hot-accent)',
        glow: 'var(--temp-hot-accent-muted)',
        overlay: 'var(--hot-overlay)',
      },
    };
    return baseColors[temperature] || baseColors.warm;
  }, [temperature]);

  // Get appropriate icon color
  const getIconColor = useCallback(() => {
    switch (temperature) {
      case 'cold': return 'text-cyan-400';
      case 'warm': return 'text-warning';
      case 'hot': return 'text-error-500';
      default: return 'text-brand';
    }
  }, [temperature]);

  // Get appropriate background
  const getBackgroundClass = useCallback(() => {
    switch (temperature) {
      case 'cold': return 'bg-cyan-500/5';
      case 'warm': return 'bg-warning/5';
      case 'hot': return 'bg-error-500/5';
      default: return 'bg-brand/5';
    }
  }, [temperature]);

  return {
    temperature,
    intensity,
    cssVariables,
    getIconColor,
    getBackgroundClass,
    isCold: temperature === 'cold',
    isWarm: temperature === 'warm',
    isHot: temperature === 'hot',
  };
}

export default useEmotionalTemperature;
