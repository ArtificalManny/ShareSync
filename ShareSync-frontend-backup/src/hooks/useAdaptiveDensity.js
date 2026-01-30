// src/hooks/useAdaptiveDensity.js
// ═══════════════════════════════════════════════════════════════════════════════
// ALIVE AWARE: Adaptive Density System
// The UI adapts its density based on time of day, user energy, and work patterns
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// DENSITY MODES
// ═══════════════════════════════════════════════════════════════════════════════

export const DENSITY_MODES = {
  SPACIOUS: 'spacious',   // Morning - ease into work
  BALANCED: 'balanced',   // Default - normal density
  COMPACT: 'compact',     // Peak hours - maximum information
  MINIMAL: 'minimal',     // Evening - wind down
  FOCUS: 'focus',         // During focus sessions - distraction-free
};

export const ENERGY_LEVELS = {
  WAKING: 'waking',       // Just started working
  WARMING: 'warming',     // Building momentum
  PEAK: 'peak',           // Maximum energy/focus
  SUSTAINING: 'sustaining', // Maintaining work
  WINDING: 'winding',     // Energy declining
  RESTING: 'resting',     // Low energy, wind down
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIME PERIODS - Configurable work schedule
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_SCHEDULE = {
  earlyMorning: { start: 5, end: 8 },
  morning: { start: 8, end: 10 },
  lateMorning: { start: 10, end: 12 },
  earlyAfternoon: { start: 12, end: 14 },
  afternoon: { start: 14, end: 17 },
  lateAfternoon: { start: 17, end: 19 },
  evening: { start: 19, end: 22 },
  night: { start: 22, end: 5 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DENSITY CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const DENSITY_CONFIG = {
  [DENSITY_MODES.SPACIOUS]: {
    name: 'Spacious',
    description: 'Relaxed layout for easing into work',
    cardPadding: 'p-6',
    cardGap: 'gap-6',
    fontSize: 'text-base',
    headerSize: 'text-xl',
    gridCols: 'lg:grid-cols-2',
    sidebarWidth: 'w-[280px]',
    showSecondaryInfo: false,
    animationSpeed: 'duration-500',
    breathingIntensity: 0.3,
    showMotivationalMessages: true,
    reducedNotifications: true,
    contentDensity: 0.6,
  },
  [DENSITY_MODES.BALANCED]: {
    name: 'Balanced',
    description: 'Standard layout for normal work',
    cardPadding: 'p-4',
    cardGap: 'gap-4',
    fontSize: 'text-sm',
    headerSize: 'text-lg',
    gridCols: 'lg:grid-cols-3',
    sidebarWidth: 'w-[260px]',
    showSecondaryInfo: true,
    animationSpeed: 'duration-300',
    breathingIntensity: 0.5,
    showMotivationalMessages: true,
    reducedNotifications: false,
    contentDensity: 0.8,
  },
  [DENSITY_MODES.COMPACT]: {
    name: 'Compact',
    description: 'Dense layout for peak productivity',
    cardPadding: 'p-3',
    cardGap: 'gap-3',
    fontSize: 'text-sm',
    headerSize: 'text-base',
    gridCols: 'lg:grid-cols-4',
    sidebarWidth: 'w-[220px]',
    showSecondaryInfo: true,
    animationSpeed: 'duration-200',
    breathingIntensity: 0.7,
    showMotivationalMessages: false,
    reducedNotifications: false,
    contentDensity: 1.0,
  },
  [DENSITY_MODES.MINIMAL]: {
    name: 'Minimal',
    description: 'Clean layout for winding down',
    cardPadding: 'p-5',
    cardGap: 'gap-5',
    fontSize: 'text-base',
    headerSize: 'text-xl',
    gridCols: 'lg:grid-cols-2',
    sidebarWidth: 'w-[240px]',
    showSecondaryInfo: false,
    animationSpeed: 'duration-700',
    breathingIntensity: 0.2,
    showMotivationalMessages: true,
    reducedNotifications: true,
    contentDensity: 0.5,
  },
  [DENSITY_MODES.FOCUS]: {
    name: 'Focus',
    description: 'Distraction-free layout',
    cardPadding: 'p-6',
    cardGap: 'gap-4',
    fontSize: 'text-base',
    headerSize: 'text-lg',
    gridCols: 'lg:grid-cols-1',
    sidebarWidth: 'w-[72px]',
    showSecondaryInfo: false,
    animationSpeed: 'duration-300',
    breathingIntensity: 0.4,
    showMotivationalMessages: false,
    reducedNotifications: true,
    contentDensity: 0.4,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getTimePeriod(hour, schedule = DEFAULT_SCHEDULE) {
  if (hour >= schedule.earlyMorning.start && hour < schedule.earlyMorning.end) return 'earlyMorning';
  if (hour >= schedule.morning.start && hour < schedule.morning.end) return 'morning';
  if (hour >= schedule.lateMorning.start && hour < schedule.lateMorning.end) return 'lateMorning';
  if (hour >= schedule.earlyAfternoon.start && hour < schedule.earlyAfternoon.end) return 'earlyAfternoon';
  if (hour >= schedule.afternoon.start && hour < schedule.afternoon.end) return 'afternoon';
  if (hour >= schedule.lateAfternoon.start && hour < schedule.lateAfternoon.end) return 'lateAfternoon';
  if (hour >= schedule.evening.start && hour < schedule.evening.end) return 'evening';
  return 'night';
}

function getRecommendedDensity(timePeriod, isInFocus = false, momentumLevel = 0) {
  if (isInFocus) return DENSITY_MODES.FOCUS;
  if (momentumLevel >= 4) return DENSITY_MODES.COMPACT;
  
  const periodToDensity = {
    earlyMorning: DENSITY_MODES.SPACIOUS,
    morning: DENSITY_MODES.SPACIOUS,
    lateMorning: DENSITY_MODES.BALANCED,
    earlyAfternoon: DENSITY_MODES.COMPACT,
    afternoon: DENSITY_MODES.COMPACT,
    lateAfternoon: DENSITY_MODES.BALANCED,
    evening: DENSITY_MODES.MINIMAL,
    night: DENSITY_MODES.MINIMAL,
  };
  
  return periodToDensity[timePeriod] || DENSITY_MODES.BALANCED;
}

function getEnergyLevel(timePeriod, sessionDuration = 0) {
  if (sessionDuration > 180) return ENERGY_LEVELS.WINDING;
  
  const periodToEnergy = {
    earlyMorning: ENERGY_LEVELS.WAKING,
    morning: ENERGY_LEVELS.WARMING,
    lateMorning: ENERGY_LEVELS.PEAK,
    earlyAfternoon: ENERGY_LEVELS.PEAK,
    afternoon: ENERGY_LEVELS.SUSTAINING,
    lateAfternoon: ENERGY_LEVELS.WINDING,
    evening: ENERGY_LEVELS.RESTING,
    night: ENERGY_LEVELS.RESTING,
  };
  
  return periodToEnergy[timePeriod] || ENERGY_LEVELS.SUSTAINING;
}

function getGreeting(timePeriod, energyLevel, userName = 'there') {
  const greetings = {
    earlyMorning: { default: `Good early morning, ${userName}.` },
    morning: { default: `Good morning, ${userName}. Ready to build momentum?` },
    lateMorning: { [ENERGY_LEVELS.PEAK]: `You're in your peak window, ${userName}. Make it count!` },
    earlyAfternoon: { default: `Good afternoon, ${userName}.` },
    afternoon: { [ENERGY_LEVELS.WINDING]: `Nice work today, ${userName}. Consider wrapping up soon.` },
    lateAfternoon: { default: `Evening's approaching, ${userName}. Let's finish strong.` },
    evening: { default: `Evening, ${userName}. Remember to rest.` },
    night: { default: `Late night, ${userName}. Please get some rest.` },
  };
  
  const periodGreetings = greetings[timePeriod] || {};
  return periodGreetings[energyLevel] || periodGreetings.default || `Hello, ${userName}.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════

const LS_KEYS = {
  DENSITY_OVERRIDE: 'ss.density.override',
  AUTO_ADAPT_ENABLED: 'ss.density.autoAdapt',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useAdaptiveDensity({
  isInFocus = false,
  momentumLevel = 0,
  sessionDuration = 0,
  tasksCompleted = 0,
  userName = 'there',
} = {}) {
  const [autoAdaptEnabled, setAutoAdaptEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.AUTO_ADAPT_ENABLED);
      return saved !== 'false';
    } catch {
      return true;
    }
  });
  
  const [densityOverride, setDensityOverride] = useState(() => {
    try {
      return localStorage.getItem(LS_KEYS.DENSITY_OVERRIDE) || null;
    } catch {
      return null;
    }
  });
  
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.AUTO_ADAPT_ENABLED, autoAdaptEnabled.toString());
    } catch {}
  }, [autoAdaptEnabled]);
  
  useEffect(() => {
    try {
      if (densityOverride) {
        localStorage.setItem(LS_KEYS.DENSITY_OVERRIDE, densityOverride);
      } else {
        localStorage.removeItem(LS_KEYS.DENSITY_OVERRIDE);
      }
    } catch {}
  }, [densityOverride]);
  
  const timePeriod = useMemo(() => getTimePeriod(currentHour), [currentHour]);
  const energyLevel = useMemo(() => getEnergyLevel(timePeriod, sessionDuration), [timePeriod, sessionDuration]);
  const recommendedDensity = useMemo(() => getRecommendedDensity(timePeriod, isInFocus, momentumLevel), [timePeriod, isInFocus, momentumLevel]);
  
  const activeDensity = useMemo(() => {
    if (!autoAdaptEnabled && densityOverride) return densityOverride;
    if (densityOverride) return densityOverride;
    return recommendedDensity;
  }, [autoAdaptEnabled, densityOverride, recommendedDensity]);
  
  const config = useMemo(() => DENSITY_CONFIG[activeDensity], [activeDensity]);
  const greeting = useMemo(() => getGreeting(timePeriod, energyLevel, userName), [timePeriod, energyLevel, userName]);
  
  const setDensity = useCallback((mode) => {
    if (DENSITY_CONFIG[mode]) {
      setDensityOverride(mode);
    }
  }, []);
  
  const resetToAuto = useCallback(() => {
    setDensityOverride(null);
  }, []);
  
  const toggleAutoAdapt = useCallback(() => {
    setAutoAdaptEnabled(prev => !prev);
  }, []);
  
  const isManualOverride = densityOverride !== null;
  
  return {
    density: activeDensity,
    config,
    timePeriod,
    energyLevel,
    greeting,
    recommendedDensity,
    isManualOverride,
    autoAdaptEnabled,
    setDensity,
    resetToAuto,
    toggleAutoAdapt,
    availableModes: DENSITY_MODES,
    allConfigs: DENSITY_CONFIG,
  };
}

export function useAdaptiveClasses(densityConfig) {
  return useMemo(() => {
    if (!densityConfig) return {};
    
    return {
      card: `${densityConfig.cardPadding} rounded-xl bg-surface-1 border border-white/[0.06]`,
      cardGap: densityConfig.cardGap,
      text: densityConfig.fontSize,
      header: densityConfig.headerSize,
      grid: `grid ${densityConfig.gridCols} ${densityConfig.cardGap}`,
      animation: densityConfig.animationSpeed,
      sidebar: densityConfig.sidebarWidth,
    };
  }, [densityConfig]);
}

export default useAdaptiveDensity;
