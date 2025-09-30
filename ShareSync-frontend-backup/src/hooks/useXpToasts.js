import { useEffect, useRef } from "react";
import useSocket from "./useSocket";
import { toastXp } from "../components/ui/Toaster.jsx";
import { fireConfetti } from "../components/ui/Confetti.jsx";
import { trackXpAwardedPunctual } from "../utils/telemetry";

/**
 * useXpToasts
 * Listens for task updates; when a task transitions to a punctual state
 * (early | on_time) with a completedAt timestamp, show a toast and confetti.
 *
 * This is resilient to duplicate socket events via a sessionStorage guard.
 *
 * Usage:
 *   useXpToasts(projectId);
 */
export default function useXpToasts(projectId) {
  const room = projectId ? `project:${projectId}` : null;
  const seenRef = useRef(new Set());

  // hydrate seen set from session storage on mount
  useEffect(() => {
    try {
      const all = Object.keys(sessionStorage);
      const set = new Set();
      for (const k of all) {
        if (k.startsWith("ss.xp.task.")) set.add(k);
      }
      seenRef.current = set;
    } catch {
      /* ignore */
    }
  }, []);

  useSocket(room, {
    onEvents: {
      "tasks:updated": (payload = {}) => {
        const t = payload.task || {};
        const id = t._id || t.id;
        if (!id) return;

        const state = (t.scheduleState || "").toLowerCase();
        const completedAt = t.completedAt || null;

        // only reward when completed and punctual
        const punctual = state === "early" || state === "on_time";
        if (!punctual || !completedAt) return;

        const key = `ss.xp.task.${id}.${String(completedAt)}`;
        if (seenRef.current.has(key)) return;

        // mark as seen
        seenRef.current.add(key);
        try { sessionStorage.setItem(key, "1"); } catch {}

        // telemetry + UI
        try {
          trackXpAwardedPunctual({
            projectId,
            taskId: id,
            scheduleState: state,
            amount: 10,
          });
        } catch { /* ignore */ }

        try {
          toastXp({
            amount: 10,
            reason: state === "early" ? "early completion" : "on-time completion",
          });
        } catch { /* ignore */ }

        // celebration (motion aware inside)
        try { fireConfetti(); } catch {}
      },
    },
  });
}
