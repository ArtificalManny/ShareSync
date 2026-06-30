import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { useSprint } from "../../context/SprintContext";
import { useBreak } from "../../context/BreakContext";
import CadenceCoachTip from "../sprint/CadenceCoachTip";
import BreakModal from "../sprint/BreakModal";
import TraceOutline from "../ui/TraceOutline.jsx";
import Button from "../ui/Button.jsx";


/** feature flag */
const ENABLE_HABITS = (() => {
  const v = import.meta?.env?.VITE_FEATURE_HABITS ?? "";
  return /^(1|true|on|yes)$/i.test(String(v));
})();

export default function FocusSprint({
  nextTask = null,
  onFinish = () => {},
  initialDurationMin,
}) {
  if (!ENABLE_HABITS) return null;

  const {
    intent,
    durationMin,
    status,
    remainingMs,
    start,
    pause,
    resume,
    reset,
    setIntent,
    setDuration,
    formatRemaining,
  } = useSprint();
  const { startBreak } = useBreak();

  const [showBreak, setShowBreak] = useState(false);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (typeof initialDurationMin === "number" && initialDurationMin > 0) {
      if (status === "idle" || status === "completed") setDuration(initialDurationMin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDurationMin]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (status === "completed" && prev !== "completed") {
      try { onFinish(); } catch {}
      setShowBreak(true);
    }
    prevStatusRef.current = status;
  }, [status, onFinish]);

  const totalMs = durationMin * 60 * 1000;
  const clampedRemaining = Math.max(0, Math.min(remainingMs, totalMs));
  const pct = useMemo(() => (totalMs <= 0 ? 0 : 1 - clampedRemaining / totalMs), [clampedRemaining, totalMs]);
  const dash = 100 * Math.max(0, Math.min(1, pct));
  const timeLabel = formatRemaining();

  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isIdleOrDone = status === "idle" || status === "completed";

  const handleStart = () => start({ intent });
  const handlePause = () => pause();
  const handleResume = () => resume();
  const handleReset = () => reset({});

  const handleStartBreak = ({ minutes, reason }) => {
    try { startBreak?.({ minutes, reason }); } finally { setShowBreak(false); }
  };

  const handleReflectionSave = (text) => {
    try {
      const key = "sharesync.reflections.v1";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.unshift({ text, at: new Date().toISOString(), intentAtCompletion: intent || null, durationMin });
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 100)));
    } catch {}
  };

  return (
    <TraceOutline radius={16} speedMs={3200}>
      <section
        id="focus-sprint"
        className="card accent-bar shine hover-raise rounded-2xl border border-border overflow-hidden"
        aria-label="Focus Sprint"
      >
        <span className="accent-bar__left" aria-hidden="true" />

        {/* top bar */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            Focus Sprint
          </div>
          <div
            className="text-[11px] px-2 py-0.5 rounded-full border border-border"
            aria-hidden="true"
            title="Duration preset"
          >
            {String(durationMin).padStart(2, "0")}:00 Pomodoro
          </div>
        </div>

        {/* gradient body */}
        <div className="px-4 pb-4">
          <div className="rounded-xl p-4 gradient-shell shadow-[inset_0_0_1px_rgb(255_255_255/0.5)]">
            <div className="flex items-center gap-4">
              {/* progress ring */}
              <div className="relative h-16 w-16">
                <svg viewBox="0 0 40 40" className="h-16 w-16 -rotate-90">
                  <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" className="text-white/40 dark:text-slate-800/70" fill="none" />
                  <circle
                    cx="20" cy="20" r="16"
                    stroke="url(#grad)" strokeWidth="4"
                    strokeDasharray="100" strokeDashoffset={100 - dash}
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="Available" stopColor="var(--info)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 grid place-items-center text-sm font-semibold">
                  {timeLabel}
                </div>
              </div>

              {/* intent + next task */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-muted mb-1">What’s your intent for this sprint?</label>
                <input
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="e.g., Outline API tests"
                  className="w-full text-sm rounded-lg border border-border bg-surface px-3 py-2 focus-visible:outline-none focus-visible:ring-2"
                  aria-label="Sprint intent"
                />
                <div className="mt-2 text-xs text-muted line-clamp-1">
                  Next up: <span className="font-medium">{nextTask?.title || "Pick any task on Project pages"}</span>
                </div>
              </div>

                            {/* controls */}
                            <div className="shrink-0 flex items-center gap-2">
                {isIdleOrDone && (
                  <Button
                    variant="primary"
                    onClick={handleStart}
                    leftIcon={<Play className="w-4 h-4" />}
                  >
                    Start
                  </Button>
                )}
                {isRunning && (
                  <Button
                    variant="secondary"
                    onClick={handlePause}
                    leftIcon={<Pause className="w-4 h-4" />}
                  >
                    Pause
                  </Button>
                )}
                {isPaused && (
                  <Button
                    variant="primary"
                    onClick={handleResume}
                    leftIcon={<Play className="w-4 h-4" />}
                  >
                    Resume
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  aria-label="Reset timer"
                  title="Reset timer"
                  className="h-10 w-10 p-0 grid place-items-center"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Cadence Coach (AI-lite insight) */}
            <CadenceCoachTip />
          </div>
        </div>

        {/* Post-sprint Break Modal */}
        <BreakModal
          isOpen={showBreak}
          onClose={() => setShowBreak(false)}
          onStartBreak={handleStartBreak}
          onReflectionSave={handleReflectionSave}
        />
      </section>
    </TraceOutline>
  );
}
