// src/components/focus/index.js
// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS FORTRESS: Barrel Export
// ═══════════════════════════════════════════════════════════════════════════════

// Main hook
export {
  useFocusFortress,
  FOCUS_LEVELS,
  FOCUS_LEVEL_CONFIG,
  INTERRUPTION_TYPES,
  INTERRUPTION_ACTIONS,
} from '../../hooks/useFocusFortress';

// Focus Fortress UI
export {
  FocusFortressPanel,
  MiniFocusIndicator,
  FocusStartButton,
} from './FocusFortress';

// Interruption Shield
export {
  InterruptionPrompt,
  QueuedInterruptions,
  ShieldStatusBadge,
  QueueReviewModal,
} from './InterruptionShield';

// Calendar Integration
export {
  FocusCalendar,
  CurrentWindowBanner,
  FOCUS_WINDOW_QUALITY,
} from './FocusCalendar';

// Analytics
export {
  FocusAnalytics,
  MiniFocusStats,
} from './FocusAnalytics';
