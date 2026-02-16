// ═══════════════════════════════════════════════════════════════════════════
// SHARESYNC MOTION SYSTEM
// All animations should feel like moving physical objects
// ═══════════════════════════════════════════════════════════════════════════

import { Variants, Transition } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// SPRING PRESETS — Use these instead of duration-based animations
// ─────────────────────────────────────────────────────────────────────────────

export const springs = {
  // Snappy - for buttons, small elements
  // Fast response, minimal overshoot
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  } as Transition,

  // Smooth - for cards, panels
  // Balanced feel, slight bounce
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  } as Transition,

  // Heavy - for modals, important actions
  // Feels weighty, deliberate
  heavy: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
  } as Transition,

  // Bouncy - for celebrations, XP, achievements
  // Playful, attention-grabbing
  bouncy: {
    type: 'spring',
    stiffness: 500,
    damping: 15,
    mass: 0.5,
  } as Transition,

  // Gentle - for tooltips, subtle reveals
  // Slow, graceful
  gentle: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
  } as Transition,
};

// ─────────────────────────────────────────────────────────────────────────────
// EASING FUNCTIONS — For non-spring animations
// ─────────────────────────────────────────────────────────────────────────────

export const easings = {
  // Standard ease-out for most transitions
  out: [0.16, 1, 0.3, 1],
  
  // Ease-in-out for looping animations
  inOut: [0.65, 0, 0.35, 1],
  
  // Anticipation (slight pull-back before action)
  anticipate: [0.68, -0.6, 0.32, 1.6],
  
  // Overshoot (bounces past target)
  overshoot: [0.34, 1.56, 0.64, 1],
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS — Reusable animation states
// ─────────────────────────────────────────────────────────────────────────────

// Fade + Rise (default for content appearing)
export const fadeRise: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.smooth,
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.15 },
  },
};

// Scale Pop (for buttons, icons, achievements)
export const scalePop: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springs.bouncy,
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { duration: 0.1 },
  },
};

// Slide In (for sidebars, drawers)
export const slideIn: Variants = {
  hidden: { 
    x: -300,
    opacity: 0,
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: springs.heavy,
  },
  exit: { 
    x: -300,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Slide In from Right (for panels, drawers)
export const slideInRight: Variants = {
  hidden: { 
    x: 300,
    opacity: 0,
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: springs.heavy,
  },
  exit: { 
    x: 300,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Modal (backdrop + card)
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export const modalContent: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: springs.heavy,
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    y: 10,
    transition: { duration: 0.15 },
  },
};

// Stagger Children (for lists)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: springs.smooth,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HOVER & TAP STATES — Interactive feedback
// ─────────────────────────────────────────────────────────────────────────────

// Standard button interaction
export const buttonInteraction = {
  whileHover: { 
    scale: 1.02,
    transition: springs.snappy,
  },
  whileTap: { 
    scale: 0.98,
    transition: springs.snappy,
  },
};

// Card hover (subtle lift)
export const cardInteraction = {
  whileHover: { 
    y: -4,
    scale: 1.01,
    transition: springs.smooth,
  },
};

// Icon button (more dramatic)
export const iconInteraction = {
  whileHover: { 
    scale: 1.1,
    transition: springs.bouncy,
  },
  whileTap: { 
    scale: 0.9,
    transition: springs.snappy,
  },
};

// Link hover (subtle)
export const linkInteraction = {
  whileHover: { 
    x: 2,
    transition: springs.snappy,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL ANIMATIONS
// ─────────────────────────────────────────────────────────────────────────────

// XP Pop Animation
export const xpPopAnimation = {
  initial: { scale: 0, opacity: 0, y: 20 },
  animate: { 
    scale: [0, 1.3, 1],
    opacity: 1,
    y: 0,
  },
  transition: {
    duration: 0.6,
    times: [0, 0.6, 1],
    ease: easings.overshoot,
  },
};

// Streak Fire Animation
export const streakFireAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    filter: [
      'brightness(1) hue-rotate(0deg)',
      'brightness(1.2) hue-rotate(10deg)',
      'brightness(1) hue-rotate(0deg)',
    ],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Legendary Achievement
export const legendaryAnimation = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: [0, 1.5, 1],
    rotate: [-180, 20, 0],
  },
  transition: {
    duration: 0.8,
    times: [0, 0.6, 1],
    ease: easings.anticipate,
  },
};

// Pulse Glow (for live indicators)
export const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(139, 92, 246, 0)',
      '0 0 20px rgba(139, 92, 246, 0.4)',
      '0 0 0px rgba(139, 92, 246, 0)',
    ],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Success Checkmark
export const successCheck = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1,
  },
  transition: {
    duration: 0.5,
    ease: easings.out,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BREATHING ANIMATION (Based on momentum)
// ─────────────────────────────────────────────────────────────────────────────

export function getBreathingAnimation(momentum: number) {
  // Higher momentum = faster, more intense breathing
  const duration = momentum >= 80 ? 1.5 : momentum >= 60 ? 2 : momentum >= 40 ? 2.5 : 3;
  const intensity = momentum >= 80 ? 1.03 : momentum >= 60 ? 1.02 : momentum >= 40 ? 1.015 : 1.01;
  
  return {
    animate: {
      scale: [1, intensity, 1],
      boxShadow: [
        '0 0 0px rgba(139, 92, 246, 0)',
        `0 0 ${momentum >= 80 ? 20 : 10}px rgba(139, 92, 246, ${momentum / 300})`,
        '0 0 0px rgba(139, 92, 246, 0)',
      ],
    },
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MOMENTUM COLOR HELPER
// Returns the appropriate color based on momentum percentage
// ─────────────────────────────────────────────────────────────────────────────

export function getMomentumColor(momentum: number): {
  color: string;
  glow: string;
  subtle: string;
  label: string;
} {
  if (momentum >= 80) {
    return {
      color: 'var(--momentum-fire)',
      glow: 'var(--momentum-fire-glow)',
      subtle: 'var(--momentum-fire-subtle)',
      label: 'On Fire',
    };
  }
  if (momentum >= 60) {
    return {
      color: 'var(--momentum-building)',
      glow: 'var(--momentum-building-glow)',
      subtle: 'var(--momentum-building-subtle)',
      label: 'Building',
    };
  }
  if (momentum >= 40) {
    return {
      color: 'var(--momentum-warming)',
      glow: 'var(--momentum-warming-glow)',
      subtle: 'var(--momentum-warming-subtle)',
      label: 'Warming Up',
    };
  }
  if (momentum >= 20) {
    return {
      color: 'var(--momentum-starting)',
      glow: 'var(--momentum-starting-glow)',
      subtle: 'var(--momentum-starting-subtle)',
      label: 'Getting Started',
    };
  }
  return {
    color: 'var(--momentum-attention)',
    glow: 'var(--momentum-attention-glow)',
    subtle: 'var(--momentum-attention-subtle)',
    label: 'Needs Attention',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION ANIMATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const notificationSlideIn: Variants = {
  hidden: { 
    opacity: 0, 
    x: 100,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: { 
    opacity: 0, 
    x: 100,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP ANIMATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const tooltipVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 5,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADING
// ─────────────────────────────────────────────────────────────────────────────

export const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};
