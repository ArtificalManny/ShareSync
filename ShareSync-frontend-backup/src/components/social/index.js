// src/components/social/index.js
// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL FABRIC: Barrel Export
// ═══════════════════════════════════════════════════════════════════════════════

// Live Presence
export {
  LivePresenceBar,
  MiniPresenceIndicator,
  TypingIndicator,
  ShipNotification,
  PRESENCE_STATES,
  ACTIVITY_TYPES,
} from './LivePresenceBar';

// Blocking Visualizer
export {
  BlockingBadge,
  BlockingChain,
  WaitingOnYouBanner,
  DependencyGraph,
  BlockingSummary,
  BLOCKING_STATUS,
} from './BlockingVisualizer';

// Co-Working Sessions
export {
  useCoWorkingSession,
  CoWorkingSessionPanel,
  InviteToCoWorkButton,
  MiniCoWorkingIndicator,
  SESSION_STATES,
} from './CoWorkingSession';

// Smart Mentions
export {
  SmartMentionDropdown,
  MentionChip,
  QueuedMentionIndicator,
  useSmartMention,
} from './SmartMention';

// Async Standups
export {
  DailyPrompt,
  DailyPromptBanner,
  TeamDigest,
  MiniDigestPreview,
} from './AsyncStandup';
