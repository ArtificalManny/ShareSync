/**
 * src/hooks/usePolling.js
 * Generic polling hook with:
 * - intervalMs (base)
 * - immediate (run once on mount)
 * - pauseWhenHidden (skip when tab hidden/offline)
 * - backoff on errors (optional)
 * - abort controller support via your callback (you can accept { signal })
 *
 * Usage:
 * const { refreshNow } = usePolling(async ({ signal }) => { ... }, { intervalMs: 20000 });
 */

import { useCallback, useEffect, useRef } from "react";
import { shouldPoll, jitterMs, nextIntervalMs } from "../utils/polling";

export default function usePolling(
  pollFn,
  {
    intervalMs = 20000,
    immediate = true,
    pauseWhenHidden = true,
    jitter = true,
    jitterPct = 0.12,
    backoffOnError = true,
    backoffMaxMs = 120000,
  } = {}
) {
  const fnRef = useRef(pollFn);
  const timerRef = useRef(null);
  const stoppedRef = useRef(false);
  const attemptRef = useRef(0); // backoff attempt counter

  useEffect(() => {
    fnRef.current = pollFn;
  }, [pollFn]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (ms) => {
      clearTimer();
      if (stoppedRef.current) return;

      timerRef.current = setTimeout(async () => {
        // Skip if hidden/offline (optional)
        if (pauseWhenHidden && !shouldPoll()) {
          schedule(ms);
          return;
        }

        try {
          await fnRef.current?.();
          attemptRef.current = 0; // reset backoff after success
          const nextBase = intervalMs;
          const next = jitter ? jitterMs(nextBase, jitterPct) : nextBase;
          schedule(next);
        } catch {
          // If poll fails, optionally backoff.
          if (backoffOnError) {
            attemptRef.current = Math.min(attemptRef.current + 1, 10);
            const backoff = nextIntervalMs(intervalMs, attemptRef.current, backoffMaxMs);
            const next = jitter ? jitterMs(backoff, jitterPct) : backoff;
            schedule(next);
          } else {
            const next = jitter ? jitterMs(intervalMs, jitterPct) : intervalMs;
            schedule(next);
          }
        }
      }, ms);
    },
    [
      backoffMaxMs,
      backoffOnError,
      clearTimer,
      intervalMs,
      jitter,
      jitterPct,
      pauseWhenHidden,
    ]
  );

  const start = useCallback(() => {
    stoppedRef.current = false;
    attemptRef.current = 0;

    const base = intervalMs;
    const firstDelay = immediate ? 0 : (jitter ? jitterMs(base, jitterPct) : base);
    schedule(firstDelay);
  }, [immediate, intervalMs, jitter, jitterPct, schedule]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    clearTimer();
  }, [clearTimer]);

  const refreshNow = useCallback(async () => {
    // Run now, and keep future schedule alive.
    if (pauseWhenHidden && !shouldPoll()) return;
    await fnRef.current?.();
  }, [pauseWhenHidden]);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return { refreshNow, stop, start };
}
