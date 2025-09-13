// Timing & easing tokens + tiny guards for reduced-motion.

export const MOTION = {
    duration: {
      xs: 120,
      sm: 200,
      md: 300,
      lg: 450,
    },
    easing: {
      standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      entrance: "cubic-bezier(0.16, 1, 0.3, 1)", // overshoot-in
      exit: "cubic-bezier(0.7, 0, 0.84, 0)",     // swift-out
    },
  };
  
  /**
   * Guard a motion value based on reduced-motion.
   * ifMotion(prefersReducedMotion, animatedValue, fallbackValue)
   */
  export function ifMotion(prefersReduced, animatedValue, fallbackValue = null) {
    return prefersReduced ? fallbackValue : animatedValue;
  }
  
  /**
   * Apply a style object only when motion is allowed.
   * withMotionStyles(prefersReduced, { animation: '...' })
   */
  export function withMotionStyles(prefersReduced, stylesIfAllowed = {}, fallback = {}) {
    return prefersReduced ? fallback : stylesIfAllowed;
  }
  
  /**
   * Compose animation shorthand strings consistently.
   */
  export function animationShorthand(name, duration = MOTION.duration.md, easing = MOTION.easing.entrance, delay = 0, fill = "both") {
    return `${name} ${duration}ms ${easing} ${delay}ms ${fill}`;
  }
  