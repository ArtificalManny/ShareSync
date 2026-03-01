// src/hooks/usePulseCheck.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.4: Pulse Check Hook
// ═══════════════════════════════════════════════════════════════════════════════
//
// Manages:
// - Whether pulse is needed today
// - Submit flow
// - History fetching
// - Burnout detection (3+ consecutive energy ≤ 2)
// - Snooze/dismiss state (localStorage)
//
// Gracefully handles backend not being ready (falls back to localStorage).
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { submitPulse, getPulseHistory, checkPulseToday } from '../api/pulse';

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────
const STORAGE_KEY_SUBMITTED = 'ss.pulse.submittedDate';
const STORAGE_KEY_SNOOZED = 'ss.pulse.snoozedUntil';
const STORAGE_KEY_DISMISSED = 'ss.pulse.dismissedDate';
const STORAGE_KEY_ENABLED = 'ss.pulse.enabled';
const STORAGE_KEY_LOCAL_HISTORY = 'ss.pulse.localHistory';

const XP_REWARD = 15;

// ─────────────────────────────────────────────────────────────────────────
// ENERGY LEVELS
// ─────────────────────────────────────────────────────────────────────────
export const ENERGY_LEVELS = [
  { value: 1, emoji: '😤', label: 'Frustrated', color: '#EF4444', bg: 'bg-red-50 dark:bg-red-500/10' },
  { value: 2, emoji: '😔', label: 'Low', color: '#F97316', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { value: 3, emoji: '😐', label: 'Okay', color: '#EAB308', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
  { value: 4, emoji: '😊', label: 'Good', color: '#22C55E', bg: 'bg-green-50 dark:bg-green-500/10' },
  { value: 5, emoji: '🔥', label: 'On Fire', color: '#8B5CF6', bg: 'bg-violet-50 dark:bg-violet-500/10' },
];

export function getEnergyConfig(value) {
  return ENERGY_LEVELS.find((e) => e.value === value) || ENERGY_LEVELS[2];
}

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toDateString();
}

function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === todayStr();
}

function getLocalHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToLocalHistory(pulse) {
  try {
    const history = getLocalHistory();
    history.unshift(pulse);
    // Keep last 90 entries
    const trimmed = history.slice(0, 90);
    localStorage.setItem(STORAGE_KEY_LOCAL_HISTORY, JSON.stringify(trimmed));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────
// BURNOUT DETECTION
// ─────────────────────────────────────────────────────────────────────────
export function detectBurnout(pulses) {
  if (!Array.isArray(pulses) || pulses.length < 3) return { isBurnout: false, streak: 0 };

  // Sort newest first
  const sorted = [...pulses].sort((a, b) => {
    const tA = new Date(a.date || a.createdAt).getTime();
    const tB = new Date(b.date || b.createdAt).getTime();
    return tB - tA;
  });

  // Check last 3 consecutive
  let lowStreak = 0;
  for (const pulse of sorted) {
    const energy = pulse.energy ?? pulse.energyLevel ?? 3;
    if (energy <= 2) {
      lowStreak++;
    } else {
      break;
    }
  }

  return {
    isBurnout: lowStreak >= 3,
    streak: lowStreak,
    severity: lowStreak >= 5 ? 'critical' : lowStreak >= 3 ? 'warning' : 'none',
  };
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────────────────
export function usePulseCheck() {
  const [submittedToday, setSubmittedToday] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [error, setError] = useState(null);

  // ── Enabled preference ──
  const [pulseEnabled, setPulseEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
      return stored === null ? true : stored === '1';
    } catch {
      return true;
    }
  });

  const updatePulseEnabled = useCallback((value) => {
    setPulseEnabled(value);
    try { localStorage.setItem(STORAGE_KEY_ENABLED, value ? '1' : '0'); } catch {}
  }, []);

  // ── Snooze / Dismiss ──
  const [isSnoozed, setIsSnoozed] = useState(() => {
    try {
      const snoozedUntil = localStorage.getItem(STORAGE_KEY_SNOOZED);
      if (!snoozedUntil) return false;
      return Date.now() < Number(snoozedUntil);
    } catch {
      return false;
    }
  });

  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DISMISSED) === todayStr();
    } catch {
      return false;
    }
  });

  const snooze = useCallback((minutes = 30) => {
    const until = Date.now() + minutes * 60 * 1000;
    try { localStorage.setItem(STORAGE_KEY_SNOOZED, String(until)); } catch {}
    setIsSnoozed(true);
    // Auto-unsnooze
    setTimeout(() => setIsSnoozed(false), minutes * 60 * 1000);
  }, []);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY_DISMISSED, todayStr()); } catch {}
    setIsDismissed(true);
  }, []);

  // ── Check if already submitted today ──
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function check() {
      // Check localStorage first (fast)
      try {
        const localDate = localStorage.getItem(STORAGE_KEY_SUBMITTED);
        if (localDate === todayStr()) {
          if (!cancelled) {
            setSubmittedToday(true);
            setIsLoading(false);
          }
          return;
        }
      } catch {}

      // Then check backend
      try {
        const done = await checkPulseToday();
        if (!cancelled) {
          setSubmittedToday(done);
          if (done) {
            try { localStorage.setItem(STORAGE_KEY_SUBMITTED, todayStr()); } catch {}
          }
        }
      } catch {
        // Backend not ready — use localStorage state
        if (!cancelled) setSubmittedToday(false);
      }

      if (!cancelled) setIsLoading(false);
    }

    check();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch history ──
  const fetchHistory = useCallback(async (days = 30) => {
    try {
      const data = await getPulseHistory(days);
      const pulses = data?.pulses || [];
      setHistory(pulses);
      return pulses;
    } catch {
      // Fallback to local history
      const local = getLocalHistory();
      setHistory(local);
      return local;
    }
  }, []);

  // ── Submit pulse ──
  const submit = useCallback(async ({ energy, focusTaskId, blocker }) => {
    setIsSubmitting(true);
    setError(null);

    const pulseData = {
      energy,
      focusTaskId: focusTaskId || null,
      blocker: blocker || { hasBlocker: false, description: '' },
      date: new Date().toISOString(),
      xpAwarded: XP_REWARD,
    };

    try {
      const result = await submitPulse(pulseData);
      setSubmittedToday(true);
      setLastSubmission(result);
      try { localStorage.setItem(STORAGE_KEY_SUBMITTED, todayStr()); } catch {}

      // Add to local history as backup
      addToLocalHistory({ ...pulseData, _id: result?.pulse?._id || `local-${Date.now()}` });

      // Dispatch XP event for momentum system
      window.dispatchEvent(
        new CustomEvent('local-xp', {
          detail: { xp: XP_REWARD, source: 'pulse-check' },
        })
      );

      return result;
    } catch (err) {
      // If backend fails, still save locally so user isn't nagged again
      console.warn('[usePulseCheck] Backend submit failed, saving locally:', err?.message);
      addToLocalHistory(pulseData);
      setSubmittedToday(true);
      try { localStorage.setItem(STORAGE_KEY_SUBMITTED, todayStr()); } catch {}

      setError(err?.response?.data?.message || err?.message || 'Failed to submit');
      setLastSubmission(pulseData);
      return pulseData;
    } finally {
      setIsSubmitting(false);
      setShowModal(false);
    }
  }, []);

  // ── Burnout status ──
  const burnoutStatus = useMemo(() => detectBurnout(history), [history]);

  // ── Should show prompt? ──
  const shouldShowPrompt = useMemo(() => {
    if (!pulseEnabled) return false;
    if (submittedToday) return false;
    if (isSnoozed) return false;
    if (isDismissed) return false;
    if (isLoading) return false;
    return true;
  }, [pulseEnabled, submittedToday, isSnoozed, isDismissed, isLoading]);

  return {
    // State
    submittedToday,
    isSubmitting,
    isLoading,
    showModal,
    setShowModal,
    lastSubmission,
    error,

    // History
    history,
    fetchHistory,

    // Actions
    submit,
    snooze,
    dismiss,

    // Preferences
    pulseEnabled,
    setPulseEnabled: updatePulseEnabled,

    // Derived
    shouldShowPrompt,
    burnoutStatus,

    // Constants
    XP_REWARD,
  };
}

export default usePulseCheck;
