// src/contexts/MomentumContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM VISUALIZATION - Global Context Provider
// ═══════════════════════════════════════════════════════════════════════════════
// Provides momentum state to the entire app so components can react:
// - Background color temperature shifts
// - Animation intensity changes  
// - Micro-interactions adjust
// - GLOW INTENSITY (0-5) for the Momentum Glow System
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useMomentum from '../hooks/useMomentum';

const MomentumContext = createContext(null);

// CSS custom properties we'll update based on momentum
const CSS_VARS = {
  // Color temperature overlay
  '--momentum-temp-hue': '0',        // 0 = neutral, negative = cool, positive = warm
  '--momentum-temp-opacity': '0',     // How strong the overlay is
  
  // Animation scaling
  '--momentum-animation-scale': '1',  // Multiplier for animation durations
  '--momentum-pulse-enabled': '1',    // 1 = enabled, 0 = disabled
  
  // Glow intensity (NEW - Phase 1)
  '--momentum-glow-level': '0',       // 0-5 glow intensity
};

/**
 * Calculate glow intensity level (0-5) from momentum score (0-100)
 * 
 * Score ranges:
 * 0-19:   Level 0 (Idle - no glow)
 * 20-39:  Level 1 (Warming up - subtle warmth)
 * 40-59:  Level 2 (Building - noticeable glow)
 * 60-74:  Level 3 (Flowing - strong presence)
 * 75-89:  Level 4 (Peak - commanding glow)
 * 90-100: Level 5 (On Fire - maximum intensity)
 */
function calculateGlowLevel(score) {
  if (score < 20) return 0;
  if (score < 40) return 1;
  if (score < 60) return 2;
  if (score < 75) return 3;
  if (score < 90) return 4;
  return 5;
}

/**
 * Get semantic glow state name from level
 */
function getGlowStateName(level) {
  const states = ['idle', 'warming', 'building', 'flowing', 'peak', 'fire'];
  return states[level] || 'idle';
}

/**
 * Calculate glow CSS class from level
 */
function getGlowClassName(level) {
  const classes = [
    'momentum-idle',
    'momentum-warming', 
    'momentum-building',
    'momentum-flowing',
    'momentum-peak',
    'momentum-fire'
  ];
  return classes[level] || 'momentum-idle';
}

export function MomentumProvider({ children, enabled = true }) {
  // Mock data - in real app, this would come from your API/state
  const [momentumData, setMomentumData] = useState({
    tasksCompletedToday: 3,
    tasksCompletedThisWeek: 15,
    dailyTarget: 5,
    weeklyTarget: 25,
    streakDays: 7,
    projectHealthScores: [75, 80, 60],
    recentActivityDays: 5,
  });

  const momentum = useMomentum(momentumData);

  // Calculate glow intensity from momentum score
  const glowLevel = useMemo(() => calculateGlowLevel(momentum.score), [momentum.score]);
  const glowState = useMemo(() => getGlowStateName(glowLevel), [glowLevel]);
  const glowClassName = useMemo(() => getGlowClassName(glowLevel), [glowLevel]);

  // Update CSS custom properties when momentum changes
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;

    // Temperature shift: cool (blue) for low, warm (orange/gold) for high
    // NOW using Deep Violet (#7C3AED) as the brand neutral
    if (momentum.isLowMomentum) {
      root.style.setProperty('--momentum-temp-hue', '210'); // Blue
      root.style.setProperty('--momentum-temp-opacity', '0.03');
    } else if (momentum.isHighMomentum) {
      root.style.setProperty('--momentum-temp-hue', '35'); // Warm gold
      root.style.setProperty('--momentum-temp-opacity', '0.04');
    } else {
      root.style.setProperty('--momentum-temp-hue', '263'); // Deep Violet (brand)
      root.style.setProperty('--momentum-temp-opacity', '0.02');
    }

    // Animation scaling (slower for low momentum)
    const animScale = momentum.isLowMomentum ? 1.5 : momentum.isHighMomentum ? 0.8 : 1;
    root.style.setProperty('--momentum-animation-scale', String(animScale));

    // Pulse enabled
    root.style.setProperty('--momentum-pulse-enabled', momentum.isLowMomentum ? '0' : '1');

    // NEW: Set glow level CSS variable
    root.style.setProperty('--momentum-glow-level', String(glowLevel));

    // NEW: Set data-momentum attribute on body for global styling
    document.body.setAttribute('data-momentum', String(glowLevel));

  }, [enabled, momentum.isLowMomentum, momentum.isHighMomentum, momentum.score, glowLevel]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.removeAttribute('data-momentum');
    };
  }, []);

  // Method to update momentum data (call from your task/project hooks)
  const updateMomentumData = useCallback((updates) => {
    setMomentumData(prev => ({ ...prev, ...updates }));
  }, []);

  // Simulate completing a task (for demo)
  const recordTaskCompletion = useCallback(() => {
    setMomentumData(prev => ({
      ...prev,
      tasksCompletedToday: prev.tasksCompletedToday + 1,
      tasksCompletedThisWeek: prev.tasksCompletedThisWeek + 1,
    }));
  }, []);

  // Helper to apply momentum glow to any element
  const getMomentumProps = useCallback((additionalClassName = '') => ({
    'data-momentum': glowLevel,
    className: `${glowClassName} ${additionalClassName}`.trim(),
  }), [glowLevel, glowClassName]);

  const value = {
    // Momentum data
    ...momentum,
    
    // Raw data
    data: momentumData,
    
    // NEW: Glow system values
    glowLevel,           // 0-5 numeric level
    glowState,           // 'idle' | 'warming' | 'building' | 'flowing' | 'peak' | 'fire'
    glowClassName,       // CSS class: 'momentum-idle', 'momentum-warming', etc.
    getMomentumProps,    // Helper function for applying momentum to elements
    
    // Actions
    updateMomentumData,
    recordTaskCompletion,
    
    // Feature flag
    enabled,
  };

  return (
    <MomentumContext.Provider value={value}>
      {children}
    </MomentumContext.Provider>
  );
}

export function useMomentumContext() {
  const context = useContext(MomentumContext);
  
  if (!context) {
    // Return safe defaults if used outside provider
    return {
      score: 50,
      vibe: 'neutral',
      isHighMomentum: false,
      isLowMomentum: false,
      isNeutral: true,
      temperatureShift: 0,
      animationIntensity: 0.7,
      components: { completions: 50, streak: 50, health: 50, activity: 50 },
      data: {},
      // NEW: Glow system defaults
      glowLevel: 2,
      glowState: 'building',
      glowClassName: 'momentum-building',
      getMomentumProps: (className = '') => ({ 'data-momentum': 2, className: `momentum-building ${className}`.trim() }),
      // Actions
      updateMomentumData: () => {},
      recordTaskCompletion: () => {},
      enabled: false,
    };
  }
  
  return context;
}

// Export helper hooks for convenience
export function useMomentumGlow() {
  const { glowLevel, glowState, glowClassName, getMomentumProps } = useMomentumContext();
  return { glowLevel, glowState, glowClassName, getMomentumProps };
}

export function useMomentumScore() {
  const { score, vibe, isHighMomentum, isLowMomentum, isNeutral } = useMomentumContext();
  return { score, vibe, isHighMomentum, isLowMomentum, isNeutral };
}

export default MomentumContext;
