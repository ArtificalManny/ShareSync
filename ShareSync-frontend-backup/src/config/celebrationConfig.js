// src/config/celebrationConfig.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Celebration Scaling Configuration
// Pure data file — maps each persona to its celebration behavior defaults
//
// Users can override these defaults via CelebrationStylePicker in Settings.
// The useCelebration hook merges persona defaults with user overrides.
// ═══════════════════════════════════════════════════════════════════════════════

const celebrationConfig = {
  // ── Student: Full party mode ───────────────────────────────────────────
  student: {
    confetti: true,
    sound: true,
    emojiRain: true,
    animationIntensity: 'high',    // 'high' | 'medium' | 'low' | 'minimal' | 'none'
    quotes: false,
    teamNotify: false,
    screenFlash: true,
    haptics: true,                  // vibration on mobile if supported

    // Per-event overrides
    events: {
      taskComplete: { confetti: true, emojiRain: false, sound: true },
      xpAward: { confetti: false, emojiRain: false, sound: true, screenFlash: true },
      levelUp: { confetti: true, emojiRain: true, sound: true, screenFlash: true },
      streakMilestone: { confetti: true, emojiRain: true, sound: true },
      focusComplete: { confetti: false, emojiRain: false, sound: true },
      shipCeremony: { confetti: true, emojiRain: true, sound: true, screenFlash: true },
    },
  },

  // ── Creator: Subtle glow + inspirational quotes ────────────────────────
  creator: {
    confetti: false,
    sound: false,
    emojiRain: false,
    animationIntensity: 'medium',
    quotes: true,
    teamNotify: false,
    screenFlash: false,
    haptics: false,

    events: {
      taskComplete: { quotes: true, animationIntensity: 'medium' },
      xpAward: { quotes: false, animationIntensity: 'low' },
      levelUp: { quotes: true, animationIntensity: 'medium', sound: true },
      streakMilestone: { quotes: true, animationIntensity: 'medium' },
      focusComplete: { quotes: true, animationIntensity: 'low' },
      shipCeremony: { quotes: true, animationIntensity: 'medium', sound: true },
    },
  },

  // ── Professional: Clean and minimal ────────────────────────────────────
  professional: {
    confetti: false,
    sound: false,
    emojiRain: false,
    animationIntensity: 'minimal',
    quotes: false,
    teamNotify: false,
    screenFlash: false,
    haptics: false,

    events: {
      taskComplete: { animationIntensity: 'minimal' },
      xpAward: { animationIntensity: 'none' },
      levelUp: { animationIntensity: 'low' },
      streakMilestone: { animationIntensity: 'low' },
      focusComplete: { animationIntensity: 'minimal' },
      shipCeremony: { animationIntensity: 'low' },
    },
  },

  // ── Team Lead: Team-oriented notifications ─────────────────────────────
  teamlead: {
    confetti: false,
    sound: false,
    emojiRain: false,
    animationIntensity: 'low',
    quotes: false,
    teamNotify: true,
    screenFlash: false,
    haptics: false,

    events: {
      taskComplete: { teamNotify: true, animationIntensity: 'low' },
      xpAward: { teamNotify: false, animationIntensity: 'minimal' },
      levelUp: { teamNotify: true, animationIntensity: 'low' },
      streakMilestone: { teamNotify: true, animationIntensity: 'low' },
      focusComplete: { teamNotify: false, animationIntensity: 'minimal' },
      shipCeremony: { teamNotify: true, animationIntensity: 'low', sound: true },
    },
  },
};

// ── Animation intensity durations (ms) ───────────────────────────────────
export const INTENSITY_DURATION = {
  high: 3000,
  medium: 2000,
  low: 1200,
  minimal: 600,
  none: 0,
};

// ── Celebration event types ──────────────────────────────────────────────
export const CELEBRATION_EVENTS = [
  'taskComplete',
  'xpAward',
  'levelUp',
  'streakMilestone',
  'focusComplete',
  'shipCeremony',
];

// ── Get merged config for a persona + event type ─────────────────────────
// Returns the base persona config merged with event-specific overrides
export function getCelebrationConfig(persona, eventType) {
  const base = celebrationConfig[persona] || celebrationConfig.creator;
  const eventOverrides = base.events?.[eventType] || {};

  // Strip the events key from the spread
  const { events, ...baseWithoutEvents } = base;

  return {
    ...baseWithoutEvents,
    ...eventOverrides,
  };
}

// ── Default override shape (used by CelebrationStylePicker) ──────────────
export const DEFAULT_OVERRIDES = {
  confetti: null,       // null = use persona default
  sound: null,
  emojiRain: null,
  animationIntensity: null,
  quotes: null,
};

export default celebrationConfig;
