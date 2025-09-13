import { useEffect, useMemo, useState } from "react";
import { useHabits } from "../context/HabitsContext";
import useWorkSchedule from "./useWorkSchedule";

/**
 * Returns { nudge, dismiss } where nudge = { id, kind, title, message, actions[] } | null
 */
export default function useNudges({ recentEvent } = {}) {
  const { prefs, dismissed, setDismissed } = useHabits();
  const { isInWorkWindow } = useWorkSchedule(prefs?.workdays, prefs?.quietHours);
  const [localGate, setLocalGate] = useState({ // minimal cooldown to avoid spam
    lastAt: 0, cooldownMs: 60_000,
  });

  // Simple rules: when a user posts an update, suggest a sprint.
  // When a sprint finishes, suggest logging an update or converting notes → task.
  const candidate = useMemo(() => {
    if (!isInWorkWindow()) return null;
    if (!recentEvent) return null;

    const now = Date.now();
    if (now - localGate.lastAt < localGate.cooldownMs) return null;

    // Respect prefs
    const allowSprint = prefs?.nudges?.sprint !== false;
    const allowUpdate = prefs?.nudges?.update !== false;

    if (recentEvent.type === "update" && allowSprint) {
      return {
        id: "nudge_sprint_after_update",
        kind: "sprint",
        title: "Great update — want to focus next?",
        message: "Kick off a short sprint to push this forward.",
        actions: [{ label: "Start sprint", href: "/home#focus-sprint" }],
      };
    }

    if (recentEvent.type === "sprint_finished" && allowUpdate) {
      return {
        id: "nudge_update_after_sprint",
        kind: "update",
        title: "Nice sprint! Close the loop?",
        message: "Share a quick update or create an action item.",
        actions: [
          { label: "Log quick update", href: "/home#recent-activity" },
        ],
      };
    }

    return null;
  }, [recentEvent, prefs, isInWorkWindow, localGate.lastAt, localGate.cooldownMs]);

  // Hide if user dismissed previously
  const nudge = useMemo(() => {
    if (!candidate) return null;
    if (dismissed?.[candidate.id]) return null;
    return candidate;
  }, [candidate, dismissed]);

  const dismiss = (id) => {
    setLocalGate((g) => ({ ...g, lastAt: Date.now() }));
    setDismissed(id);
  };

  // tiny auto-gate after surfacing
  useEffect(() => {
    if (!nudge) return;
    setLocalGate((g) => ({ ...g, lastAt: Date.now() }));
  }, [nudge]);

  return { nudge, dismiss };
}
