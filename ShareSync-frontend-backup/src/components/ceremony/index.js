// src/components/ceremony/index.js
// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY MOMENTS: Barrel Export
// ═══════════════════════════════════════════════════════════════════════════════

// Main hook
export {
  useCeremony,
  CELEBRATION_TIERS,
  TIER_CONFIG,
  BADGE_TYPES,
  QUICK_WIN_TYPES,
} from '../../hooks/useCeremony';

// Celebration Overlay
export {
  CelebrationOverlay,
} from './CelebrationOverlay';

// Ship Ceremony
export {
  ShipButton,
  ShipConfirmationModal,
  ClapButton,
  CountdownOverlay,
} from './ShipCeremony';

// Streak Protection
export {
  StreakDisplay,
  StreakProtectionModal,
  StreakRiskBanner,
  StreakMilestone,
} from './StreakProtection';

// Hall of Fame
export {
  HallOfFame,
  MiniFameWidget,
} from './HallOfFame';

// Team Celebration
export {
  ProjectShipTeamCelebration,
  SprintCompleteCelebration,
  TeamShipNotification,
} from './TeamCelebration';
