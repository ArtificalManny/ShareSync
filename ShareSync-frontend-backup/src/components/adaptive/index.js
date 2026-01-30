// src/components/adaptive/index.js
// ═══════════════════════════════════════════════════════════════════════════════
// ALIVE AWARE: Adaptive Components Barrel Export
// ═══════════════════════════════════════════════════════════════════════════════

// Provider and core components
export { 
  AdaptiveDensityProvider, 
  useAdaptive,
  DensityIndicator,
  AdaptiveCard,
  AdaptiveGrid,
  AdaptiveText,
} from './AdaptiveDensityProvider';

// Break reminder
export { 
  BreakReminder,
  MiniBreakIndicator,
} from './BreakReminder';

// Context restoration
export { 
  WelcomeBackPrompt,
  RecentItemsBar,
  useContextBreadcrumb,
} from './ContextRestorer';

// Re-export hooks
export { 
  useAdaptiveDensity, 
  useAdaptiveClasses,
  DENSITY_MODES,
  ENERGY_LEVELS,
} from '../../hooks/useAdaptiveDensity';

export { 
  useFatigueDetection,
  FATIGUE_LEVELS,
  BREAK_TYPES,
} from '../../hooks/useFatigueDetection';

export { 
  useContextMemory,
  CONTEXT_TYPES,
} from '../../hooks/useContextMemory';
