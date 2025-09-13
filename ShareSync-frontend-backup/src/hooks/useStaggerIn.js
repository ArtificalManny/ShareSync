// Lightweight stagger helper that respects reduced-motion.
// Usage:
// const { className, style } = useStaggerIn(idx)
// <div className={className} style={style}>...</div>

import usePrefersReducedMotion from "./usePrefersReducedMotion";
import { MOTION } from "../utils/motion";

export default function useStaggerIn(
  index = 0,
  {
    baseDelay = 70,          // ms per item
    maxItems = 8,            // cap to avoid huge delays
    duration = MOTION.duration.md, // should match .fade-in-soft in CSS
    distance = 6,            // px translateY distance (handled by CSS class)
    className = "fade-in-soft",
  } = {}
) {
  const reduce = usePrefersReducedMotion();

  // The CSS class handles opacity/translate/easing; we only set delay inline.
  const delayMs = Math.min(index, maxItems) * baseDelay;

  if (reduce) {
    return { className: "", style: {} };
  }

  return {
    className,
    style: {
      // Used by .fade-in-soft; safe no-ops if class isn’t present.
      animationDelay: `${delayMs}ms`,
      animationDuration: `${duration}ms`,
      willChange: "opacity, transform",
    },
  };
}

// Convenience style-only helper (when you already applied your own class)
export function getStaggerStyle(index = 0, baseDelay = 70, maxItems = 8) {
  const d = Math.min(index, maxItems) * baseDelay;
  return { animationDelay: `${d}ms` };
}
