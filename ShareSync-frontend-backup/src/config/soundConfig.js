// src/config/soundConfig.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Sound Configuration
// ═══════════════════════════════════════════════════════════════════════════════
//
// Central configuration for all sounds in ShareSync.
// Uses Web Audio API synthesis parameters - no external audio files needed.
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
export const SOUND_CATEGORIES = {
  UI: 'ui',
  ACHIEVEMENT: 'achievement',
  MOMENTUM: 'momentum',
  NOTIFICATION: 'notification',
  AMBIENT: 'ambient',
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT VOLUME LEVELS (0-1)
// ═══════════════════════════════════════════════════════════════════════════════
export const DEFAULT_VOLUMES = {
  master: 0.7,
  [SOUND_CATEGORIES.UI]: 0.5,
  [SOUND_CATEGORIES.ACHIEVEMENT]: 0.8,
  [SOUND_CATEGORIES.MOMENTUM]: 0.7,
  [SOUND_CATEGORIES.NOTIFICATION]: 0.6,
  [SOUND_CATEGORIES.AMBIENT]: 0.3,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND DEFINITIONS
// Each sound has synthesis parameters for Web Audio API
// ═══════════════════════════════════════════════════════════════════════════════
export const SOUNDS = {
  // ─────────────────────────────────────────────────────────────────────────────
  // UI SOUNDS - Subtle clicks and feedback
  // ─────────────────────────────────────────────────────────────────────────────
  click: {
    id: 'click',
    category: SOUND_CATEGORIES.UI,
    type: 'tone',
    params: {
      frequency: 800,
      type: 'sine',
      duration: 0.05,
      volume: 0.3,
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    },
  },
  
  hover: {
    id: 'hover',
    category: SOUND_CATEGORIES.UI,
    type: 'tone',
    params: {
      frequency: 600,
      type: 'sine',
      duration: 0.03,
      volume: 0.15,
      envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
    },
  },
  
  toggle_on: {
    id: 'toggle_on',
    category: SOUND_CATEGORIES.UI,
    type: 'tone',
    params: {
      frequency: 880,
      type: 'sine',
      duration: 0.1,
      volume: 0.3,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.02 },
      pitchSlide: { end: 1100, duration: 0.08 },
    },
  },
  
  toggle_off: {
    id: 'toggle_off',
    category: SOUND_CATEGORIES.UI,
    type: 'tone',
    params: {
      frequency: 880,
      type: 'sine',
      duration: 0.1,
      volume: 0.3,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.02 },
      pitchSlide: { end: 660, duration: 0.08 },
    },
  },
  
  expand: {
    id: 'expand',
    category: SOUND_CATEGORIES.UI,
    type: 'tone',
    params: {
      frequency: 400,
      type: 'sine',
      duration: 0.15,
      volume: 0.25,
      envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.02 },
      pitchSlide: { end: 600, duration: 0.12 },
    },
  },
  
  collapse: {
    id: 'collapse',
    category: SOUND_CATEGORIES.UI,
    type: 'tone',
    params: {
      frequency: 600,
      type: 'sine',
      duration: 0.15,
      volume: 0.25,
      envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.02 },
      pitchSlide: { end: 400, duration: 0.12 },
    },
  },
  
  error: {
    id: 'error',
    category: SOUND_CATEGORIES.UI,
    type: 'tone',
    params: {
      frequency: 200,
      type: 'sawtooth',
      duration: 0.2,
      volume: 0.3,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 },
      vibrato: { frequency: 20, depth: 10 },
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ACHIEVEMENT SOUNDS - Rewarding and satisfying
  // ─────────────────────────────────────────────────────────────────────────────
  task_complete: {
    id: 'task_complete',
    category: SOUND_CATEGORIES.ACHIEVEMENT,
    type: 'chord',
    params: {
      frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 - Major chord
      type: 'sine',
      duration: 0.3,
      volume: 0.4,
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.1 },
      stagger: 0.03,
    },
  },
  
  ship: {
    id: 'ship',
    category: SOUND_CATEGORIES.ACHIEVEMENT,
    type: 'sequence',
    params: {
      notes: [
        { frequency: 523.25, duration: 0.1 }, // C5
        { frequency: 659.25, duration: 0.1 }, // E5
        { frequency: 783.99, duration: 0.15 }, // G5
        { frequency: 1046.50, duration: 0.25 }, // C6
      ],
      type: 'sine',
      volume: 0.5,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.15 },
      gap: 0.02,
    },
  },
  
  ship_epic: {
    id: 'ship_epic',
    category: SOUND_CATEGORIES.ACHIEVEMENT,
    type: 'sequence',
    params: {
      notes: [
        { frequency: 392.00, duration: 0.12 }, // G4
        { frequency: 523.25, duration: 0.12 }, // C5
        { frequency: 659.25, duration: 0.12 }, // E5
        { frequency: 783.99, duration: 0.15 }, // G5
        { frequency: 1046.50, duration: 0.3 }, // C6
      ],
      type: 'sine',
      volume: 0.6,
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.2 },
      gap: 0.02,
      harmonics: true,
    },
  },
  
  level_up: {
    id: 'level_up',
    category: SOUND_CATEGORIES.ACHIEVEMENT,
    type: 'fanfare',
    params: {
      notes: [
        { frequency: 523.25, duration: 0.15 }, // C5
        { frequency: 587.33, duration: 0.15 }, // D5
        { frequency: 659.25, duration: 0.15 }, // E5
        { frequency: 783.99, duration: 0.2 },  // G5
        { frequency: 1046.50, duration: 0.4 }, // C6
      ],
      type: 'triangle',
      volume: 0.6,
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.3 },
      gap: 0.05,
      reverb: 0.3,
    },
  },
  
  streak_milestone: {
    id: 'streak_milestone',
    category: SOUND_CATEGORIES.ACHIEVEMENT,
    type: 'chord',
    params: {
      frequencies: [392.00, 493.88, 587.33, 783.99], // G4, B4, D5, G5 - G major
      type: 'sine',
      duration: 0.5,
      volume: 0.5,
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.3 },
      stagger: 0.05,
      shimmer: true,
    },
  },
  
  xp_gain: {
    id: 'xp_gain',
    category: SOUND_CATEGORIES.ACHIEVEMENT,
    type: 'tone',
    params: {
      frequency: 1200,
      type: 'sine',
      duration: 0.15,
      volume: 0.3,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
      pitchSlide: { end: 1600, duration: 0.1 },
    },
  },
  
  achievement_unlock: {
    id: 'achievement_unlock',
    category: SOUND_CATEGORIES.ACHIEVEMENT,
    type: 'sequence',
    params: {
      notes: [
        { frequency: 783.99, duration: 0.1 },  // G5
        { frequency: 987.77, duration: 0.1 },  // B5
        { frequency: 1174.66, duration: 0.15 }, // D6
        { frequency: 1567.98, duration: 0.3 },  // G6
      ],
      type: 'sine',
      volume: 0.5,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.2 },
      gap: 0.03,
      sparkle: true,
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // MOMENTUM SOUNDS - Escalate with momentum level
  // ─────────────────────────────────────────────────────────────────────────────
  momentum_tick: {
    id: 'momentum_tick',
    category: SOUND_CATEGORIES.MOMENTUM,
    type: 'tone',
    params: {
      frequency: 440,
      type: 'sine',
      duration: 0.08,
      volume: 0.2,
      envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.01 },
    },
    // Frequency multiplier based on momentum level (1-5)
    momentumScale: {
      frequency: [1, 1.1, 1.25, 1.4, 1.6],
      volume: [0.15, 0.2, 0.25, 0.3, 0.35],
    },
  },
  
  momentum_level_up: {
    id: 'momentum_level_up',
    category: SOUND_CATEGORIES.MOMENTUM,
    type: 'sequence',
    params: {
      notes: [
        { frequency: 440, duration: 0.1 },
        { frequency: 554.37, duration: 0.1 },
        { frequency: 659.25, duration: 0.2 },
      ],
      type: 'triangle',
      volume: 0.4,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 },
      gap: 0.02,
    },
    // Notes shift up with momentum level
    momentumScale: {
      pitchMultiplier: [1, 1.1, 1.25, 1.4, 1.6],
    },
  },
  
  fire_mode_activate: {
    id: 'fire_mode_activate',
    category: SOUND_CATEGORIES.MOMENTUM,
    type: 'sequence',
    params: {
      notes: [
        { frequency: 523.25, duration: 0.08 },
        { frequency: 659.25, duration: 0.08 },
        { frequency: 783.99, duration: 0.08 },
        { frequency: 1046.50, duration: 0.08 },
        { frequency: 1318.51, duration: 0.15 },
      ],
      type: 'sawtooth',
      volume: 0.5,
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.1 },
      gap: 0.01,
      distortion: 0.2,
    },
  },
  
  fire_mode_deactivate: {
    id: 'fire_mode_deactivate',
    category: SOUND_CATEGORIES.MOMENTUM,
    type: 'tone',
    params: {
      frequency: 880,
      type: 'sawtooth',
      duration: 0.3,
      volume: 0.3,
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 },
      pitchSlide: { end: 220, duration: 0.25 },
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // NOTIFICATION SOUNDS - Team activity and alerts
  // ─────────────────────────────────────────────────────────────────────────────
  team_ship: {
    id: 'team_ship',
    category: SOUND_CATEGORIES.NOTIFICATION,
    type: 'tone',
    params: {
      frequency: 880,
      type: 'sine',
      duration: 0.2,
      volume: 0.3,
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.05 },
      pitchSlide: { end: 1100, duration: 0.1 },
    },
  },
  
  team_achievement: {
    id: 'team_achievement',
    category: SOUND_CATEGORIES.NOTIFICATION,
    type: 'chord',
    params: {
      frequencies: [659.25, 783.99, 987.77],
      type: 'sine',
      duration: 0.25,
      volume: 0.35,
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.1 },
      stagger: 0.02,
    },
  },
  
  mention: {
    id: 'mention',
    category: SOUND_CATEGORIES.NOTIFICATION,
    type: 'sequence',
    params: {
      notes: [
        { frequency: 880, duration: 0.08 },
        { frequency: 1100, duration: 0.12 },
      ],
      type: 'sine',
      volume: 0.4,
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.05 },
      gap: 0.05,
    },
  },
  
  reminder: {
    id: 'reminder',
    category: SOUND_CATEGORIES.NOTIFICATION,
    type: 'sequence',
    params: {
      notes: [
        { frequency: 660, duration: 0.1 },
        { frequency: 660, duration: 0.1 },
        { frequency: 880, duration: 0.15 },
      ],
      type: 'sine',
      volume: 0.35,
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.05 },
      gap: 0.08,
    },
  },
  
  message: {
    id: 'message',
    category: SOUND_CATEGORIES.NOTIFICATION,
    type: 'tone',
    params: {
      frequency: 1000,
      type: 'sine',
      duration: 0.12,
      volume: 0.3,
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.02 },
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // AMBIENT SOUNDS - Focus mode background audio
  // ─────────────────────────────────────────────────────────────────────────────
  focus_start: {
    id: 'focus_start',
    category: SOUND_CATEGORIES.AMBIENT,
    type: 'tone',
    params: {
      frequency: 220,
      type: 'sine',
      duration: 1.5,
      volume: 0.2,
      envelope: { attack: 0.5, decay: 0.5, sustain: 0.3, release: 0.5 },
      pitchSlide: { end: 440, duration: 1 },
    },
  },
  
  focus_end: {
    id: 'focus_end',
    category: SOUND_CATEGORIES.AMBIENT,
    type: 'chord',
    params: {
      frequencies: [261.63, 329.63, 392.00], // C4, E4, G4
      type: 'sine',
      duration: 1,
      volume: 0.25,
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.3, release: 0.4 },
      stagger: 0.1,
    },
  },
  
  timer_tick: {
    id: 'timer_tick',
    category: SOUND_CATEGORIES.AMBIENT,
    type: 'tone',
    params: {
      frequency: 1000,
      type: 'sine',
      duration: 0.02,
      volume: 0.1,
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.005 },
    },
  },
  
  timer_warning: {
    id: 'timer_warning',
    category: SOUND_CATEGORIES.AMBIENT,
    type: 'sequence',
    params: {
      notes: [
        { frequency: 880, duration: 0.15 },
        { frequency: 880, duration: 0.15 },
      ],
      type: 'triangle',
      volume: 0.4,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.05 },
      gap: 0.1,
    },
  },
  
  timer_complete: {
    id: 'timer_complete',
    category: SOUND_CATEGORIES.AMBIENT,
    type: 'sequence',
    params: {
      notes: [
        { frequency: 523.25, duration: 0.2 },
        { frequency: 659.25, duration: 0.2 },
        { frequency: 783.99, duration: 0.3 },
      ],
      type: 'sine',
      volume: 0.5,
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.3, release: 0.2 },
      gap: 0.05,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT LOOP DEFINITIONS
// These are generated noise/drone patterns for focus mode
// ═══════════════════════════════════════════════════════════════════════════════
export const AMBIENT_LOOPS = {
  white_noise: {
    id: 'white_noise',
    name: 'White Noise',
    type: 'noise',
    params: {
      noiseType: 'white',
      volume: 0.15,
      filter: { type: 'lowpass', frequency: 8000, Q: 1 },
    },
  },
  
  pink_noise: {
    id: 'pink_noise',
    name: 'Pink Noise',
    type: 'noise',
    params: {
      noiseType: 'pink',
      volume: 0.2,
      filter: { type: 'lowpass', frequency: 4000, Q: 0.5 },
    },
  },
  
  brown_noise: {
    id: 'brown_noise',
    name: 'Brown Noise',
    type: 'noise',
    params: {
      noiseType: 'brown',
      volume: 0.25,
      filter: { type: 'lowpass', frequency: 1000, Q: 0.5 },
    },
  },
  
  binaural_focus: {
    id: 'binaural_focus',
    name: 'Focus Binaural',
    type: 'binaural',
    params: {
      baseFrequency: 200,
      beatFrequency: 10, // Alpha waves (8-12 Hz) for relaxed focus
      volume: 0.15,
    },
  },
  
  binaural_deep: {
    id: 'binaural_deep',
    name: 'Deep Work Binaural',
    type: 'binaural',
    params: {
      baseFrequency: 150,
      beatFrequency: 4, // Theta waves (4-7 Hz) for deep concentration
      volume: 0.15,
    },
  },
  
  drone_ambient: {
    id: 'drone_ambient',
    name: 'Ambient Drone',
    type: 'drone',
    params: {
      frequencies: [110, 165, 220], // A2, E3, A3
      type: 'sine',
      volume: 0.1,
      modulation: { frequency: 0.1, depth: 5 },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND PRESETS (quick access to common sounds)
// ═══════════════════════════════════════════════════════════════════════════════
export const SOUND_PRESETS = {
  // UI interactions
  buttonClick: 'click',
  buttonHover: 'hover',
  toggleOn: 'toggle_on',
  toggleOff: 'toggle_off',
  menuExpand: 'expand',
  menuCollapse: 'collapse',
  errorFeedback: 'error',
  
  // Task/Achievement
  taskDone: 'task_complete',
  shipTask: 'ship',
  shipEpic: 'ship_epic',
  levelUp: 'level_up',
  streakMilestone: 'streak_milestone',
  xpGained: 'xp_gain',
  achievementUnlocked: 'achievement_unlock',
  
  // Momentum
  momentumTick: 'momentum_tick',
  momentumUp: 'momentum_level_up',
  fireOn: 'fire_mode_activate',
  fireOff: 'fire_mode_deactivate',
  
  // Notifications
  teamShipped: 'team_ship',
  teamAchievement: 'team_achievement',
  mentioned: 'mention',
  reminded: 'reminder',
  newMessage: 'message',
  
  // Focus/Timer
  focusBegin: 'focus_start',
  focusFinish: 'focus_end',
  timerTick: 'timer_tick',
  timerWarn: 'timer_warning',
  timerDone: 'timer_complete',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get sound definition by ID
 */
export function getSoundById(id) {
  return SOUNDS[id] || null;
}

/**
 * Get all sounds in a category
 */
export function getSoundsByCategory(category) {
  return Object.values(SOUNDS).filter(sound => sound.category === category);
}

/**
 * Get ambient loop by ID
 */
export function getAmbientLoopById(id) {
  return AMBIENT_LOOPS[id] || null;
}

/**
 * Apply momentum scaling to sound params
 */
export function applyMomentumScale(sound, momentumLevel) {
  if (!sound.momentumScale) return sound.params;
  
  const level = Math.min(Math.max(momentumLevel, 1), 5) - 1; // 0-4 index
  const scaledParams = { ...sound.params };
  
  if (sound.momentumScale.frequency) {
    const multiplier = sound.momentumScale.frequency[level] || 1;
    scaledParams.frequency = sound.params.frequency * multiplier;
    
    if (scaledParams.notes) {
      scaledParams.notes = scaledParams.notes.map(note => ({
        ...note,
        frequency: note.frequency * multiplier,
      }));
    }
  }
  
  if (sound.momentumScale.volume) {
    scaledParams.volume = sound.momentumScale.volume[level];
  }
  
  if (sound.momentumScale.pitchMultiplier) {
    const multiplier = sound.momentumScale.pitchMultiplier[level] || 1;
    if (scaledParams.notes) {
      scaledParams.notes = scaledParams.notes.map(note => ({
        ...note,
        frequency: note.frequency * multiplier,
      }));
    }
  }
  
  return scaledParams;
}

export default SOUNDS;
