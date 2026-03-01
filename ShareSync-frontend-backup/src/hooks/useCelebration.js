// src/hooks/useCelebration.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Celebration hook
// Reads persona from context + user overrides from localStorage
// Returns triggerCelebration(type, data) which fires the appropriate animation
//
// Usage:
//   const { triggerCelebration } = useCelebration();
//   triggerCelebration('taskComplete', { taskTitle: 'Fix bug', xp: 50 });
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { getCelebrationConfig, INTENSITY_DURATION, DEFAULT_OVERRIDES } from '../config/celebrationConfig';

// ── LocalStorage key for user overrides ──────────────────────────────────
const OVERRIDES_KEY = 'ss:celebration-overrides';

function getStoredOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // no-op
  }
  return {};
}

export function saveOverrides(overrides) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // no-op
  }
}

export function getOverrides() {
  return getStoredOverrides();
}

export function resetOverrides() {
  try {
    localStorage.removeItem(OVERRIDES_KEY);
  } catch {
    // no-op
  }
}

// ── Main hook ────────────────────────────────────────────────────────────
export function useCelebration() {
  const [activeCelebration, setActiveCelebration] = useState(null);
  const timerRef = useRef(null);

  // Get persona safely
  let persona = 'creator';
  try {
    const cached = localStorage.getItem('ss:persona');
    if (cached && ['student', 'creator', 'professional', 'teamlead'].includes(cached)) {
      persona = cached;
    }
  } catch {
    // no-op
  }

  const triggerCelebration = useCallback((eventType, data = {}) => {
    // 1. Get persona + event config
    const config = getCelebrationConfig(persona, eventType);

    // 2. Apply user overrides (non-null values override persona defaults)
    const overrides = getStoredOverrides();
    const merged = { ...config };

    Object.keys(DEFAULT_OVERRIDES).forEach((key) => {
      if (overrides[key] !== null && overrides[key] !== undefined) {
        merged[key] = overrides[key];
      }
    });

    // 3. If animation intensity is 'none', skip everything
    if (merged.animationIntensity === 'none') {
      return;
    }

    // 4. Calculate duration
    const duration = INTENSITY_DURATION[merged.animationIntensity] || INTENSITY_DURATION.medium;

    // 5. Build celebration payload
    const celebration = {
      id: `${eventType}-${Date.now()}`,
      eventType,
      persona,
      config: merged,
      data,
      duration,
      startedAt: Date.now(),
    };

    // 6. Clear any existing celebration
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 7. Set active celebration
    setActiveCelebration(celebration);

    // 8. Auto-dismiss after duration
    timerRef.current = setTimeout(() => {
      setActiveCelebration(null);
      timerRef.current = null;
    }, duration + 500); // +500ms for exit animation

    return celebration;
  }, [persona]);

  const dismissCelebration = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActiveCelebration(null);
  }, []);

  return {
    activeCelebration,
    triggerCelebration,
    dismissCelebration,
    persona,
  };
}

export default useCelebration;
