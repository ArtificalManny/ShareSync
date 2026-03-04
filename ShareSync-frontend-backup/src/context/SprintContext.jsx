// /src/context/SprintContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

// NEW: cadence analytics
import { addSession } from "../utils/cadenceAnalytics";

/**
 * SprintContext
 * - Serious, professional focus timer with global state.
 * - Persists across page navigations and refreshes via localStorage.
 * - Accurate timing based on endTime (not incremental counters) to avoid drift.
 * - Clean API: start, pause, resume, reset, setIntent, setDuration.
 *
 * Status values: 'idle' | 'running' | 'paused' | 'completed'
 */

const STORAGE_KEY = "sharesync.sprint.v1";

const defaultDurationMin = 25;

const defaultState = {
  intent: "",
  durationMin: defaultDurationMin,
  status: "idle",
  startTime: null, // ms epoch
  endTime: null,   // ms epoch
  remainingMs: defaultDurationMin * 60 * 1000,
  isFocusMode: false, // ⭐ PHASE 6.2: Focus Mode State
};

const SprintContext = createContext({
  ...defaultState,
  // actions (no-ops placeholders for intellisense)
  start: (_opts) => {},
  pause: () => {},
  resume: () => {},
  reset: (_opts) => {},
  setIntent: (_t) => {},
  setDuration: (_m) => {},
  toggleFocusMode: (_val) => {}, // ⭐ PHASE 6.2
  // event subscription
  addOnComplete: (_cb) => () => {},
  // helpers
  formatRemaining: () => "25:00",
  isActive: false,
});

export const useSprint = () => useContext(SprintContext);

// ---- Helpers ----
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const formatMMSS = (ms) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Basic shape guard
    if (typeof parsed !== "object" || parsed === null) return null;

    // If it was running, recompute remaining based on endTime
    if (parsed.status === "running" && parsed.endTime) {
      const left = Math.max(0, parsed.endTime - Date.now());
      if (left === 0) {
        return {
          ...parsed,
          status: "completed",
          remainingMs: 0,
          startTime: parsed.startTime ?? null,
          endTime: parsed.endTime ?? null,
          isFocusMode: false, // Force false on reload to prevent getting trapped
        };
      }
      return { ...parsed, remainingMs: left, isFocusMode: false };
    }

    // If paused or idle, ensure remaining matches duration bounds
    if (parsed.status === "paused" || parsed.status === "idle") {
      const expected = clamp(
        parsed.remainingMs ?? parsed.durationMin * 60 * 1000,
        0,
        parsed.durationMin * 60 * 1000
      );
      return { ...parsed, remainingMs: expected, isFocusMode: false };
    }

    // Completed state: keep remaining at 0
    if (parsed.status === "completed") {
      return { ...parsed, remainingMs: 0, isFocusMode: false };
    }

    return null;
  } catch {
    return null;
  }
};

const saveToStorage = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy errors
  }
};

// ---- Provider ----
export const SprintProvider = ({ children }) => {
  const [state, setState] = useState(() => loadFromStorage() ?? defaultState);
  const intervalRef = useRef(null);

  // NEW: completion listeners
  const completeListenersRef = useRef(new Set());

  // Keep a ref for tick to read latest state without stale closures
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
    saveToStorage(state);
  }, [state]);

  // Clear/set interval helpers
  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      const s = stateRef.current;
      if (s.status !== "running" || !s.endTime) return;

      const left = Math.max(0, s.endTime - Date.now());
      if (left === 0) {
        clearTick();
        setState((prev) => ({
          ...prev,
          status: "completed",
          remainingMs: 0,
        }));
      } else {
        setState((prev) => ({ ...prev, remainingMs: left }));
      }
    }, 1000);
  }, [clearTick]);

  // Start
  const start = useCallback(
    ({ durationMin, intent } = {}) => {
      const durMin =
        typeof durationMin === "number" && durationMin > 0
          ? Math.round(durationMin)
          : stateRef.current.durationMin || defaultDurationMin;

      const startTime = Date.now();
      const endTime = startTime + durMin * 60 * 1000;

      setState((prev) => ({
        ...prev,
        intent: typeof intent === "string" ? intent : prev.intent,
        durationMin: durMin,
        status: "running",
        startTime,
        endTime,
        remainingMs: endTime - Date.now(),
      }));

      startTick();
    },
    [startTick]
  );

  // Pause → record interrupted session snapshot
  const pause = useCallback(() => {
    let snapshot = null;
    setState((prev) => {
      if (prev.status !== "running" || !prev.endTime) return prev;
      const left = Math.max(0, prev.endTime - Date.now());
      snapshot = {
        intent: prev.intent,
        durationMin: prev.durationMin,
        startedAt: prev.startTime ?? Date.now(),
        endedAt: Date.now(),
        interrupted: true,
      };
      return {
        ...prev,
        status: "paused",
        remainingMs: left,
        endTime: null,
      };
    });
    if (snapshot) {
      addSession(snapshot);
    }
    clearTick();
  }, [clearTick]);

  // Resume
  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "paused" || prev.remainingMs <= 0) return prev;
      const startTime = Date.now();
      const endTime = startTime + prev.remainingMs;
      return {
        ...prev,
        status: "running",
        startTime: prev.startTime ?? startTime,
        endTime,
      };
    });
    startTick();
  }, [startTick]);

  // Reset → if currently running/paused, record interrupted session
  const reset = useCallback(
    ({ durationMin, clearIntent = false } = {}) => {
      const s = stateRef.current;
      if ((s.status === "running" || s.status === "paused") && s.startTime) {
        addSession({
          intent: s.intent,
          durationMin: s.durationMin,
          startedAt: s.startTime,
          endedAt: Date.now(),
          interrupted: true,
        });
      }

      const durMin =
        typeof durationMin === "number" && durationMin > 0
          ? Math.round(durationMin)
          : s.durationMin || defaultDurationMin;

      clearTick();
      setState((prev) => ({
        ...prev,
        intent: clearIntent ? "" : prev.intent,
        durationMin: durMin,
        status: "idle",
        startTime: null,
        endTime: null,
        remainingMs: durMin * 60 * 1000,
      }));
    },
    [clearTick]
  );

  // Setters
  const setIntent = useCallback((text) => {
    setState((prev) => ({ ...prev, intent: text ?? "" }));
  }, []);

  const setDuration = useCallback((minutes) => {
    if (typeof minutes !== "number" || minutes <= 0) return;
    setState((prev) => {
      const durMin = Math.round(minutes);
      // Only adjust remaining immediately if idle or completed.
      const shouldResetRemaining =
        prev.status === "idle" || prev.status === "completed";
      return {
        ...prev,
        durationMin: durMin,
        remainingMs: shouldResetRemaining ? durMin * 60 * 1000 : prev.remainingMs,
      };
    });
  }, []);

  // ⭐ PHASE 6.2: Toggle Focus Mode
  const toggleFocusMode = useCallback((val) => {
    setState((prev) => ({
      ...prev,
      isFocusMode: typeof val === "boolean" ? val : !prev.isFocusMode,
    }));
  }, []);

  // ⭐ PHASE 6.2: Global 'F' Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing inside an input/textarea or composing characters
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.isComposing
      ) {
        return;
      }

      // Check for standalone 'f' or 'F' keypress
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setState((prev) => ({ ...prev, isFocusMode: !prev.isFocusMode }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Restore running tick on mount (e.g., after refresh)
  useEffect(() => {
    if (state.status === "running") startTick();
    return clearTick;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep clock in sync if user changes system clock or tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      const s = stateRef.current;
      if (s.status === "running" && s.endTime) {
        const left = Math.max(0, s.endTime - Date.now());
        setState((prev) =>
          left === 0
            ? { ...prev, status: "completed", remainingMs: 0 }
            : { ...prev, remainingMs: left }
        );
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  // Optional: cross-tab sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue);
        setState((prev) => {
          // Avoid unnecessary re-renders if identical
          if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
          return loadFromStorage() ?? prev;
        });
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Notify completion listeners
  const notifyComplete = useCallback((payload) => {
    completeListenersRef.current.forEach((cb) => {
      try { cb(payload); } catch { /* isolate listener errors */ }
    });
  }, []);

  // Record a completed session + emit event when status transitions to "completed"
  const prevStatusRef = useRef(state.status);
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    if (prevStatus !== state.status && state.status === "completed") {
      const endedAt = state.endTime ?? Date.now();
      const startedAt = state.startTime ?? endedAt;
      const payload = {
        intent: state.intent,
        durationMin: state.durationMin,
        startedAt,
        endedAt,
        interrupted: false,
      };
      addSession(payload);
      notifyComplete(payload);
    }
    prevStatusRef.current = state.status;
  }, [
    state.status,
    state.intent,
    state.durationMin,
    state.startTime,
    state.endTime,
    notifyComplete,
  ]);

  // Public: register a completion listener. Returns an unsubscribe.
  const addOnComplete = useCallback((listener) => {
    if (typeof listener !== "function") return () => {};
    completeListenersRef.current.add(listener);
    return () => completeListenersRef.current.delete(listener);
  }, []);

  const value = {
    ...state,
    start,
    pause,
    resume,
    reset,
    setIntent,
    setDuration,
    toggleFocusMode, // ⬅️ exposed
    addOnComplete,
    formatRemaining: () => formatMMSS(state.remainingMs),
    isActive: state.status === "running" || state.status === "paused",
  };

  return (
    <SprintContext.Provider value={value}>{children}</SprintContext.Provider>
  );
};
