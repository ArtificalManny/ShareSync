// /src/components/home/FocusSprint.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { useSprint } from "../../context/SprintContext";
import { useBreak } from "../../context/BreakContext";
import CadenceCoachTip from "../sprint/CadenceCoachTip";
import BreakModal from "../sprint/BreakModal";

export default function FocusSprint({
  nextTask = null,     // { _id, title } or null
  onFinish = () => {}, // external callback when timer completes
  initialDurationMin,  // optional preset: applied when idle/completed
}) {
  const {
    intent,
    durationMin,
    status,           // 'idle' | 'running' | 'paused' | 'completed'
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

  // Local UI state: show post-sprint Break modal once per completion
  const [showBreak, setShowBreak] = useState(false);
  const prevStatusRef = useRef(status);

  // Initialize duration (once) if provided
  useEffect(() => {
    if (typeof initialDurationMin === "number" && initialDurationMin > 0) {
      if (status === "idle" || status === "completed") {
        setDuration(initialDurationMin);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDurationMin]);

  // External completion callback + open Break modal once
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (status === "completed" && prev !== "completed") {
      try { onFinish(); } catch {}
      setShowBreak(true);
    }
    prevStatusRef.current = status;
  }, [status, onFinish]);

  // Derived display values
  const totalMs = durationMin * 60 * 1000;
  const clampedRemaining = Math.max(0, Math.min(remainingMs, totalMs));
  const pct = useMemo(() => {
    if (totalMs <= 0) return 0;
    return 1 - clampedRemaining / totalMs;
  }, [clampedRemaining, totalMs]);
  const dash = 100 * Math.max(0, Math.min(1, pct));
  const timeLabel = formatRemaining();

  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isIdleOrDone = status === "idle" || status === "completed";

  const handleStart = () => start({ intent });
  const handlePause = () => pause();
  const handleResume = () => resume();
  const handleReset = () => reset({}); // keep intent; pass {clearIntent:true} to wipe

  // Break modal callbacks
  const handleStartBreak = ({ minutes, reason }) => {
    try {
      startBreak?.({ minutes, reason });
    } finally {
      // Close modal after starting the global break timer
      setShowBreak(false);
    }
  };

  const handleReflectionSave = (text) => {
    // For now, store locally; can be posted to project updates later
    try {
      const key = "sharesync.reflections.v1";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.unshift({
        text,
        at: new Date().toISOString(),
        intentAtCompletion: intent || null,
        durationMin,
      });
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 100)));
    } catch {
      /* non-fatal */
    }
  };

  return (
    <section
      id="focus-sprint"
      className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/85 shadow-sm overflow-hidden"
      aria-label="Focus Sprint"
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          Focus Sprint
        </div>
        <div
          className="text-[11px] px-2 py-0.5 rounded-full border border-indigo-200/70 text-indigo-700 bg-indigo-50/70 dark:border-indigo-900/60 dark:text-indigo-300 dark:bg-indigo-950/40"
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
                <circle
                  cx="20" cy="20" r="16"
                  stroke="currentColor" strokeWidth="4"
                  className="text-white/40 dark:text-slate-800/70" fill="none"
                />
                <circle
                  cx="20" cy="20" r="16"
                  stroke="url(#grad)" strokeWidth="4"
                  strokeDasharray="100" strokeDashoffset={100 - dash}
                  fill="none"
                />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgb(99,102,241)" />
                    <stop offset="100%" stopColor="rgb(236,72,153)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-slate-900/90 dark:text-white">
                {timeLabel}
              </div>
            </div>

            {/* intent + next task */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-slate-700/80 dark:text-slate-300 mb-1">
                What’s your intent for this sprint?
              </label>
              <input
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="e.g., Outline API tests"
                className="w-full text-sm rounded-lg border border-white/60 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Sprint intent"
              />
              <div className="mt-2 text-xs text-slate-700/80 dark:text-slate-300 line-clamp-1">
                Next up:{" "}
                <span className="font-medium">
                  {nextTask?.title || "Pick any task on Project pages"}
                </span>
              </div>
            </div>

            {/* controls */}
            <div className="shrink-0 flex items-center gap-1">
              {isIdleOrDone && (
                <button
                  onClick={handleStart}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Play className="w-4 h-4" /> Start
                </button>
              )}
              {isRunning && (
                <button
                  onClick={handlePause}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                >
                  <Pause className="w-4 h-4" /> Pause
                </button>
              )}
              {isPaused && (
                <button
                  onClick={handleResume}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                >
                  <Play className="w-4 h-4" /> Resume
                </button>
              )}
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 border border-slate-200/70 dark:border-slate-700 hover:bg-white/70 dark:hover:bg-slate-800"
                aria-label="Reset timer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
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
  );
}