// /src/context/BreakContext.jsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
  } from "react";
  
  /**
   * BreakContext
   * - Global short-break countdown (serious, minimal).
   * - Accurate (uses endTime, not incremental counters).
   * - Persists across routes/refresh via localStorage.
   *
   * Status: 'idle' | 'running' | 'paused' | 'completed'
   */
  
  const STORAGE_KEY = "sharesync.break.v1";
  const defaultDurationMin = 5;
  
  const defaultState = {
    status: "idle",
    durationMin: defaultDurationMin,
    remainingMs: defaultDurationMin * 60 * 1000,
    startTime: null, // epoch ms
    endTime: null,   // epoch ms
    reason: "",      // e.g., "Stretch", "Water"
  };
  
  const BreakContext = createContext({
    ...defaultState,
    // actions
    startBreak: (_opts) => {},
    pauseBreak: () => {},
    resumeBreak: () => {},
    resetBreak: (_opts) => {},
    setDuration: (_m) => {},
    setReason: (_r) => {},
    // helpers
    isActive: false,
    formatRemaining: () => "05:00",
  });
  
  export const useBreak = () => useContext(BreakContext);
  
  // ---- utils ----
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const mmss = (ms) => {
    const total = Math.max(0, Math.round(ms / 1000));
    const mm = Math.floor(total / 60);
    const ss = total % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };
  
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || typeof s !== "object") return null;
  
      // Recompute remaining if running
      if (s.status === "running" && s.endTime) {
        const left = Math.max(0, s.endTime - Date.now());
        if (left === 0) {
          return { ...s, status: "completed", remainingMs: 0 };
        }
        return { ...s, remainingMs: left };
      }
  
      // Normalize remainingMs for idle/paused/completed
      const cap = (s.durationMin || defaultDurationMin) * 60 * 1000;
      const rem =
        s.status === "idle" || s.status === "completed"
          ? cap
          : clamp(s.remainingMs ?? cap, 0, cap);
      return { ...s, remainingMs: s.status === "completed" ? 0 : rem };
    } catch {
      return null;
    }
  }
  
  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
  
  // ---- Provider ----
  export const BreakProvider = ({ children }) => {
    const [state, setState] = useState(() => load() ?? defaultState);
    const stateRef = useRef(state);
    const intervalRef = useRef(null);
  
    useEffect(() => {
      stateRef.current = state;
      save(state);
    }, [state]);
  
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
          setState((prev) => ({ ...prev, status: "completed", remainingMs: 0 }));
        } else {
          setState((prev) => ({ ...prev, remainingMs: left }));
        }
      }, 1000);
    }, [clearTick]);
  
    // actions
    const startBreak = useCallback(
      ({ minutes, reason } = {}) => {
        const dur =
          typeof minutes === "number" && minutes > 0
            ? Math.round(minutes)
            : stateRef.current.durationMin || defaultDurationMin;
        const now = Date.now();
        const end = now + dur * 60 * 1000;
  
        setState((prev) => ({
          ...prev,
          status: "running",
          durationMin: dur,
          remainingMs: end - Date.now(),
          startTime: now,
          endTime: end,
          reason: typeof reason === "string" ? reason : prev.reason,
        }));
        startTick();
      },
      [startTick]
    );
  
    const pauseBreak = useCallback(() => {
      setState((prev) => {
        if (prev.status !== "running" || !prev.endTime) return prev;
        const left = Math.max(0, prev.endTime - Date.now());
        return { ...prev, status: "paused", remainingMs: left, endTime: null };
      });
      clearTick();
    }, [clearTick]);
  
    const resumeBreak = useCallback(() => {
      setState((prev) => {
        if (prev.status !== "paused" || prev.remainingMs <= 0) return prev;
        const now = Date.now();
        const end = now + prev.remainingMs;
        return { ...prev, status: "running", startTime: prev.startTime ?? now, endTime: end };
      });
      startTick();
    }, [startTick]);
  
    const resetBreak = useCallback(
      ({ minutes, clearReason = false } = {}) => {
        const dur =
          typeof minutes === "number" && minutes > 0
            ? Math.round(minutes)
            : stateRef.current.durationMin || defaultDurationMin;
        clearTick();
        setState((prev) => ({
          ...prev,
          status: "idle",
          durationMin: dur,
          remainingMs: dur * 60 * 1000,
          startTime: null,
          endTime: null,
          reason: clearReason ? "" : prev.reason,
        }));
      },
      [clearTick]
    );
  
    const setDuration = useCallback((minutes) => {
      if (typeof minutes !== "number" || minutes <= 0) return;
      setState((prev) => {
        const dur = Math.round(minutes);
        const cap = dur * 60 * 1000;
        const keep = prev.status === "idle" || prev.status === "completed";
        return {
          ...prev,
          durationMin: dur,
          remainingMs: keep ? cap : prev.remainingMs,
        };
      });
    }, []);
  
    const setReason = useCallback((r) => {
      setState((prev) => ({ ...prev, reason: r ?? "" }));
    }, []);
  
    // restore tick if needed
    useEffect(() => {
      if (state.status === "running") startTick();
      return clearTick;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    // re-sync on visibility/focus changes
    useEffect(() => {
      const sync = () => {
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
      document.addEventListener("visibilitychange", sync);
      window.addEventListener("focus", sync);
      return () => {
        document.removeEventListener("visibilitychange", sync);
        window.removeEventListener("focus", sync);
      };
    }, []);
  
    // cross-tab sync
    useEffect(() => {
      const onStorage = (e) => {
        if (e.key !== STORAGE_KEY || !e.newValue) return;
        try {
          const next = JSON.parse(e.newValue);
          setState((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
            return load() ?? prev;
          });
        } catch {
          /* ignore */
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, []);
  
    const value = {
      ...state,
      startBreak,
      pauseBreak,
      resumeBreak,
      resetBreak,
      setDuration,
      setReason,
      isActive: state.status === "running" || state.status === "paused",
      formatRemaining: () => mmss(state.remainingMs),
    };
  
    return <BreakContext.Provider value={value}>{children}</BreakContext.Provider>;
  };
  