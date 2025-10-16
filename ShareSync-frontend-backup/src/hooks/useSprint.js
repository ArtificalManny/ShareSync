// src/hooks/useSprint.js
import { useEffect, useRef, useCallback } from "react";
import { track } from "../utils/telemetry";

export default function useSprint(opts = {}) {
  const {
    durationMs = 25 * 60 * 1000,
    onDone,              // optional callback when sprint completes
  } = opts;

  const timerRef = useRef(null);
  const runningRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    runningRef.current = false;
  }, []);

  const start = useCallback(() => {
    clear();
    runningRef.current = true;
    try { track("sprint_started", { source: "useSprint" }); } catch {}
    timerRef.current = setTimeout(() => {
      runningRef.current = false;
      try { track("sprint_completed", { source: "auto" }); } catch {}
      try { window.dispatchEvent(new CustomEvent("sprint:done")); } catch {}
      try { onDone && onDone(); } catch {}
    }, Math.max(1, Number(durationMs) || 0));
  }, [clear, durationMs, onDone]);

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    clear();
    try { track("sprint_stopped", { source: "manual" }); } catch {}
  }, [clear]);

  // Listen for global start event
  useEffect(() => {
    const handler = () => start();
    window.addEventListener("start-tenx-sprint", handler);
    return () => window.removeEventListener("start-tenx-sprint", handler);
  }, [start]);

  // Cleanup on unmount
  useEffect(() => () => clear(), [clear]);

  // Expose controls in case you need programmatic control later
  return { startSprint: start, stopSprint: stop };
}
