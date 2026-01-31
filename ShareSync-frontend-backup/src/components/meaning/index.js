// src/components/meaning/index.js
// ═══════════════════════════════════════════════════════════════════════════════
// MEANING LAYER: Barrel Export
// ═══════════════════════════════════════════════════════════════════════════════

// Why Chain - Purpose hierarchy visualization
export { 
  WhyChain, 
  MiniWhyBadge, 
  WhyChainTooltip, 
  ContributionSummary 
} from './WhyChain';

// Impact Preview - "Completing this will..."
export { 
  ImpactPreview, 
  BlockingImpact, 
  ProgressImpact, 
  RewardPreview 
} from './ImpactPreview';

// Weekly Meaning Report
export { 
  WeeklyMeaningReport, 
  MiniWeeklyReport 
} from './WeeklyMeaningReport';

// Celebration Moments
export {
  TaskCompleteCelebration,
  useTaskCelebration,
  SprintCompleteCelebration,
  GoalAchievedCelebration,
  ShipCeremony,
} from './CelebrationMoments';
