// src/hooks/useAnimatedNumber.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8: Animated Number Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Smoothly animates a number from one value to another.
// Used for XP counters, progress percentages, ship counts, etc.
//
// Features:
// - Eased animation (ease-out cubic)
// - Configurable duration
// - Respects prefers-reduced-motion
// - Returns both display value and isAnimating state
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';

/**
 * useAnimatedNumber - Smoothly animate between number values
 * 
 * @param {number} targetValue - The value to animate to
 * @param {object} options - Configuration options
 * @param {number} options.duration - Animation duration in ms (default: 500)
 * @param {boolean} options.enabled - Whether animation is enabled (default: true)
 * @param {function} options.easing - Easing function (default: ease-out cubic)
 * @param {number} options.decimals - Decimal places to round to (default: 0)
 * @returns {{ value: number, isAnimating: boolean }}
 */
export default function useAnimatedNumber(targetValue, options = {}) {
  const {
    duration = 500,
    enabled = true,
    easing = (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
    decimals = 0,
  } = options;

  const [displayValue, setDisplayValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const previousValueRef = useRef(targetValue);

  // Check for reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false
  );

  useEffect(() => {
    // Skip animation if disabled or reduced motion preferred
    if (!enabled || prefersReducedMotion.current) {
      setDisplayValue(targetValue);
      return;
    }

    // Skip if value hasn't changed
    if (targetValue === previousValueRef.current) {
      return;
    }

    const startValue = previousValueRef.current;
    const endValue = targetValue;
    const startTime = performance.now();

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsAnimating(true);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      const roundedValue = decimals > 0 
        ? parseFloat(currentValue.toFixed(decimals))
        : Math.round(currentValue);
      
      setDisplayValue(roundedValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        previousValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, enabled, easing, decimals]);

  // Update previous value ref when target changes (for non-animated updates)
  useEffect(() => {
    if (!enabled || prefersReducedMotion.current) {
      previousValueRef.current = targetValue;
    }
  }, [targetValue, enabled]);

  return { value: displayValue, isAnimating };
}

/**
 * useAnimatedPercentage - Convenience wrapper for 0-100 percentages
 */
export function useAnimatedPercentage(targetValue, duration = 500) {
  return useAnimatedNumber(targetValue, { duration, decimals: 0 });
}

/**
 * useAnimatedXP - Convenience wrapper for XP values (larger numbers)
 */
export function useAnimatedXP(targetValue, duration = 800) {
  return useAnimatedNumber(targetValue, { duration, decimals: 0 });
}
