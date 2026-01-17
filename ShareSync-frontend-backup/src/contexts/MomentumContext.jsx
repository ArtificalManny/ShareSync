// src/contexts/MomentumContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM VISUALIZATION - Global Context Provider
// ═══════════════════════════════════════════════════════════════════════════════
// Provides momentum state to the entire app so components can react:
// - Background color temperature shifts
// - Animation intensity changes
// - Micro-interactions adjust
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
};

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

  // Update CSS custom properties when momentum changes
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;

    // Temperature shift: cool (blue) for low, warm (orange/gold) for high
    if (momentum.isLowMomentum) {
      root.style.setProperty('--momentum-temp-hue', '210'); // Blue
      root.style.setProperty('--momentum-temp-opacity', '0.03');
    } else if (momentum.isHighMomentum) {
      root.style.setProperty('--momentum-temp-hue', '35'); // Warm gold
      root.style.setProperty('--momentum-temp-opacity', '0.04');
    } else {
      root.style.setProperty('--momentum-temp-hue', '270'); // Neutral purple (brand)
      root.style.setProperty('--momentum-temp-opacity', '0.02');
    }

    // Animation scaling (slower for low momentum)
    const animScale = momentum.isLowMomentum ? 1.5 : momentum.isHighMomentum ? 0.8 : 1;
    root.style.setProperty('--momentum-animation-scale', String(animScale));

    // Pulse enabled
    root.style.setProperty('--momentum-pulse-enabled', momentum.isLowMomentum ? '0' : '1');

  }, [enabled, momentum.isLowMomentum, momentum.isHighMomentum, momentum.score]);

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

  const value = {
    // Momentum data
    ...momentum,
    
    // Raw data
    data: momentumData,
    
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
      updateMomentumData: () => {},
      recordTaskCompletion: () => {},
      enabled: false,
    };
  }
  
  return context;
}

export default MomentumContext;
