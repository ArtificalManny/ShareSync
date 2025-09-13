import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as api from "../api/habits";
import useSocket from "../hooks/useSocket";

const KEY = "ss.habits.ctx.v1";

const defaultState = {
  cadence: null,            // { activeDays14: number, range: 14 }
  momentum: [],             // [{ date: ISO, count: number }]
  latestReflection: null,   // { id, createdAt, wins, focus, blockers }
  dismissed: {},            // { [nudgeId]: true }
  prefs: null,              // from server (workdays, quietHours, nudge toggles)
  loading: false,
  error: "",
};

const HabitsContext = createContext({
  ...defaultState,
  refresh: () => {},
  setDismissed: () => {},
  setPrefs: () => {},
  setLatestReflection: () => {},
});

export function HabitsProvider({ children, room = "user:me" }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  // Persist minimal fields
  useEffect(() => {
    const snapshot = {
      cadence: state.cadence,
      momentum: state.momentum?.slice?.(0, 28) ?? [],
      latestReflection: state.latestReflection,
      dismissed: state.dismissed,
      prefs: state.prefs,
    };
    try { localStorage.setItem(KEY, JSON.stringify(snapshot)); } catch {}
  }, [state.cadence, state.momentum, state.latestReflection, state.dismissed, state.prefs]);

  const refresh = useCallback(async ({ range = 14 } = {}) => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const [cadence, momentum, prefs, latestReflection] = await Promise.all([
        api.getCadence({ range }).catch(() => null),
        api.getSprintMomentum({ range }).catch(() => []),
        api.getHabitsPrefs().catch(() => null),
        api.getLatestReflection().catch(() => null),
      ]);
      setState((s) => ({
        ...s,
        cadence,
        momentum,
        prefs: prefs ?? s.prefs,
        latestReflection: latestReflection ?? s.latestReflection,
        loading: false,
        error: "",
      }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e?.message || "Failed to load habits." }));
    }
  }, []);

  // Socket: auto-refresh when user activity or tasks change
  useSocket(room, {
    onEvents: {
      "activity:new": () => refresh({}),
      "tasks:completed": () => refresh({}),
      "sprint:finished": () => refresh({}),
      "habits:prefsUpdated": () => refresh({}),
      "habits:reflectionSaved": () => refresh({}),
    },
  });

  const setDismissed = useCallback(async (id) => {
    setState((s) => ({ ...s, dismissed: { ...s.dismissed, [id]: true } }));
    try { await api.dismissNudge(id); } catch { /* non-fatal */ }
  }, []);

  const setPrefs = useCallback(async (patch) => {
    try {
      const updated = await api.updateHabitsPrefs(patch);
      setState((s) => ({ ...s, prefs: updated ?? { ...(s.prefs || {}), ...(patch || {}) } }));
    } catch (e) {
      setState((s) => ({ ...s, error: e?.message || "Failed to update preferences." }));
    }
  }, []);

  const setLatestReflection = useCallback((r) => {
    setState((s) => ({ ...s, latestReflection: r }));
  }, []);

  // Initial load
  const didLoad = useRef(false);
  useEffect(() => {
    if (!didLoad.current) {
      didLoad.current = true;
      refresh({});
    }
  }, [refresh]);

  const value = useMemo(() => ({
    ...state,
    refresh,
    setDismissed,
    setPrefs,
    setLatestReflection,
  }), [state, refresh, setDismissed, setPrefs, setLatestReflection]);

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  return useContext(HabitsContext);
}
