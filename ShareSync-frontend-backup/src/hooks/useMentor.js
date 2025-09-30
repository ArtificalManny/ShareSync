import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVelocity, predict } from "../api/mentor";
import useSocket from "./useSocket";
import { track } from "../utils/telemetry";

/**
 * useMentor(projectId, { enabled })
 * Central state for the mentor MVP.
 *
 * - Fetches velocity + prediction on mount/project change.
 * - Debounced refetch on task socket events.
 * - Safe no-op when disabled or missing projectId.
 *
 * Returns:
 *  { loading, error, velocity, weeklyDone, forecast, suggestions, atRiskTasks, refetch }
 */
export default function useMentor(projectId, { enabled = true } = {}) {
  const [loading, setLoading] = useState(Boolean(enabled && projectId));
  const [error, setError] = useState("");
  const [velocity, setVelocity] = useState({ buckets: [], windowWeeks: 0 });
  const [forecast, setForecast] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [atRiskTasks, setAtRiskTasks] = useState([]);

  const pendingRef = useRef(false);
  const abortRef = useRef(null);
  const isMounted = useRef(true);
  const room = projectId ? `project:${projectId}` : null;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      try { abortRef.current?.abort(); } catch {}
    };
  }, []);

  const refetch = useCallback(async () => {
    if (!enabled || !projectId || pendingRef.current) return;

    // Cancel any prior in-flight request
    try { abortRef.current?.abort(); } catch {}
    const controller = new AbortController();
    abortRef.current = controller;

    pendingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const [vel, pred] = await Promise.all([
        getVelocity(projectId).catch(() => ({ buckets: [], windowWeeks: 0 })),
        predict(projectId, {}).catch(() => ({ atRiskTasks: [], forecast: null, suggestions: [] })),
      ]);

      if (!isMounted.current || controller.signal.aborted) return;

      setVelocity(vel || { buckets: [], windowWeeks: 0 });
      setForecast(pred?.forecast || null);
      setSuggestions(Array.isArray(pred?.suggestions) ? pred.suggestions : []);
      setAtRiskTasks(Array.isArray(pred?.atRiskTasks) ? pred.atRiskTasks : []);
    } catch (e) {
      if (!isMounted.current || controller.signal.aborted) return;
      setError(e?.message || "Mentor failed to load.");
    } finally {
      if (isMounted.current && !controller.signal.aborted) setLoading(false);
      pendingRef.current = false;
    }
  }, [enabled, projectId]);

  // Initial fetch + on project/enable toggle
  useEffect(() => {
    if (!enabled || !projectId) {
      // Reset to clean state when disabled or missing id
      setLoading(false);
      setError("");
      setVelocity({ buckets: [], windowWeeks: 0 });
      setForecast(null);
      setSuggestions([]);
      setAtRiskTasks([]);
      return;
    }
    refetch();
  }, [enabled, projectId, refetch]);

  // Debounced refetch on relevant socket events
  const debounceTimer = useRef(0);
  const scheduleRefetch = useCallback(() => {
    if (!enabled || !projectId) return;
    window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => refetch(), 300);
  }, [enabled, projectId, refetch]);

  useSocket(room, {
    onEvents: {
      "tasks:created": () => scheduleRefetch(),
      "tasks:updated": () => scheduleRefetch(),
      // future: "mentor:nudge": () => scheduleRefetch(),
    },
  });

  // Derived: simple average weekly completions
  const weeklyDone = useMemo(() => {
    const rows = velocity?.buckets || [];
    if (!rows.length) return 0;
    const total = rows.reduce((acc, r) => acc + Number(r.completed || 0), 0);
    return +(total / rows.length).toFixed(2);
  }, [velocity]);

  // Telemetry: hook initialized
  useEffect(() => {
    try {
      if (enabled && projectId) track("mentor_hook_ready", { projectId });
    } catch { /* noop */ }
  }, [enabled, projectId]);

  return {
    loading,
    error,
    velocity,
    weeklyDone,
    forecast,
    suggestions,
    atRiskTasks,
    refetch,
  };
}
