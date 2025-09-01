// /src/components/sprint/CadenceCoachTip.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { getInsights } from "../../utils/cadenceAnalytics";

function formatHour(hour) {
  try {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    // Fallback: 0-23 -> "HH:00"
    return `${hour}:00`;
  }
}

function chooseTip(ins) {
  const {
    total,
    completionRate,
    successRateByDuration,
    typicalDropOffMin,
    preferredStartHour,
    avgFocusMinutes,
    recentIntent,
  } = ins;

  // No data yet → steady guidance
  if (!total) {
    return "Keep sprints small and specific. Finishing one clear task consistently beats starting three.";
  }

  // 1) Completion quality
  if (completionRate < 0.45) {
    return "Completion rate is under 45%. Consider shorter sprints and narrower intents to finish more consistently.";
  }
  if (completionRate > 0.85) {
    return "Strong consistency. You could experiment with slightly longer sprints or pairing two short ones back-to-back.";
  }

  // 2) Duration bucket guidance (prefer the strongest signal)
  const durBuckets = ["15", "25", "35", "50", "custom"];
  const present = durBuckets.filter((k) => successRateByDuration[k] != null);
  if (present.length) {
    const best = present
      .map((k) => ({ k, rate: successRateByDuration[k] ?? 0 }))
      .sort((a, b) => b.rate - a.rate)[0];

    if (best.rate >= 0.75) {
      if (best.k === "custom") {
        return "Your custom sprint lengths are performing best. Keep tuning durations to match the work.";
      }
      return `${best.k}-minute sprints show the highest completion for you. Favor that length for focused work.`;
    }
  }

  // 3) Drop-off signal
  if (typeof typicalDropOffMin === "number") {
    if (typicalDropOffMin <= 12) {
      return "Most interruptions happen ~10–12 minutes in. Try a 10–15 minute sprint to land consistent completions.";
    }
    if (typicalDropOffMin >= 30) {
      return "Interruptions tend to occur after the 30-minute mark. If needed, cap sprints at 25–30 minutes.";
    }
  }

  // 4) Time-of-day preference
  if (typeof preferredStartHour === "number") {
    const when = formatHour(preferredStartHour);
    return `You start most sprints around ${when}. Protect that window for high-value work.`;
  }

  // 5) Average focus
  if (avgFocusMinutes && avgFocusMinutes < 18) {
    return "Average focus duration is under 20 minutes. Shorten sprints to match your natural cadence.";
  }

  // Fallback with recent context
  if (recentIntent) {
    return `Stay specific: finish the current sprint intent (“${recentIntent}”), then immediately log the outcome.`;
  }
  return "Finish one concrete unit of work at a time. Keep intents precise and durations realistic.";
}

export default function CadenceCoachTip({ className = "", compact = false }) {
  const [insights, setInsights] = useState(() => getInsights());

  // Refresh when localStorage changes (cross-tab) or periodically while app is open
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "sharesync.cadence.sessions.v1") {
        setInsights(getInsights());
      }
    };
    window.addEventListener("storage", onStorage);

    // Light periodic refresh in case another part of the app adds sessions
    const id = setInterval(() => setInsights(getInsights()), 5000);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, []);

  const tip = useMemo(() => chooseTip(insights), [insights]);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 text-xs text-slate-800/80 dark:text-slate-300 ${className}`}
        role="note"
        aria-label="Cadence Coach tip"
      >
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
        <span className="line-clamp-2">{tip}</span>
      </div>
    );
  }

  return (
    <div
      className={`mt-3 text-xs text-slate-800/80 dark:text-slate-300 ${className}`}
      role="note"
      aria-label="Cadence Coach tip"
    >
      <span className="inline-flex items-center gap-2 font-semibold">
        <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
        Cadence Coach
      </span>
      <span className="ml-2 font-normal">{tip}</span>
    </div>
  );
}
