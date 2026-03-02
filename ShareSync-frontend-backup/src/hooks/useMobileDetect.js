// src/hooks/useMobileDetect.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.5: Touch device capability detection
// Returns { isTouchDevice, hasFinePointer, prefersReducedMotion }
// Used to swap drag-and-drop for long-press-to-reorder on mobile.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';

export function useMobileDetect() {
  const [state, setState] = useState(() => detect());

  useEffect(() => {
    // Re-detect on resize (some devices change capabilities)
    const handler = () => setState(detect());

    // Listen for media query changes
    const motionMql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const pointerMql = window.matchMedia?.('(pointer: fine)');

    const motionHandler = () => setState(detect());

    if (motionMql?.addEventListener) {
      motionMql.addEventListener('change', motionHandler);
      pointerMql?.addEventListener('change', motionHandler);
    } else {
      motionMql?.addListener(motionHandler);
      pointerMql?.addListener(motionHandler);
    }

    return () => {
      if (motionMql?.removeEventListener) {
        motionMql.removeEventListener('change', motionHandler);
        pointerMql?.removeEventListener('change', motionHandler);
      } else {
        motionMql?.removeListener(motionHandler);
        pointerMql?.removeListener(motionHandler);
      }
    };
  }, []);

  return state;
}

function detect() {
  if (typeof window === 'undefined') {
    return {
      isTouchDevice: false,
      hasFinePointer: true,
      prefersReducedMotion: false,
      isStandalone: false,
      hasHover: true,
    };
  }

  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia?.('(pointer: coarse)')?.matches === true;

  const hasFinePointer =
    window.matchMedia?.('(pointer: fine)')?.matches === true;

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

  // PWA standalone mode
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    window.navigator?.standalone === true;

  const hasHover =
    window.matchMedia?.('(hover: hover)')?.matches === true;

  return {
    isTouchDevice,
    hasFinePointer,
    prefersReducedMotion,
    isStandalone,
    hasHover,
  };
}

export default useMobileDetect;
