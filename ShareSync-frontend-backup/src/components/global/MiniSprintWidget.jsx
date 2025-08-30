// /src/components/global/MiniSprintWidget.jsx
import React, { useMemo } from "react";
import { Play, Pause, RotateCcw, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSprint } from "../../context/SprintContext";

export default function MiniSprintWidget() {
  const navigate = useNavigate();
  const {
    intent,
    durationMin,
    status,        // 'idle' | 'running' | 'paused' | 'completed'
    remainingMs,
    pause,
    resume,
    reset,
    formatRemaining,
  } = useSprint();

  // Compute hook-based values UNCONDITIONALLY (avoid hook order changes)
  const totalMs = Math.max(1, durationMin * 60 * 1000);
  const clampedRemaining = Math.max(0, Math.min(remainingMs, totalMs));
  const pct = useMemo(
    () => 1 - clampedRemaining / totalMs,
    [clampedRemaining, totalMs]
  );
  const dash = 100 * Math.max(0, Math.min(1, pct));
  const timeLabel = formatRemaining();
  const isRunning = status === "running";
  const isPaused  = status === "paused";
  const visible   = isRunning || isPaused;

  if (!visible) return null;

  const goToFull = () => {
    navigate("/home#focus-sprint");
    setTimeout(() => {
      const el = document.getElementById("focus-sprint");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleReset = () => reset({});

  return (
    <aside
      className="
        fixed bottom-4 right-4 z-50
        rounded-2xl border border-slate-200/70 dark:border-slate-700
        bg-white/90 dark:bg-slate-900/85
        shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm
        px-3 py-2
        max-w-[380px]
      "
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {/* Progress ring */}
        <div className="relative h-10 w-10">
          <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
            <circle
              cx="20" cy="20" r="16"
              stroke="currentColor" strokeWidth="4"
              className="text-slate-200 dark:text-slate-800" fill="none"
            />
            <circle
              cx="20" cy="20" r="16"
              stroke="url(#miniGrad)" strokeWidth="4"
              strokeDasharray="100" strokeDashoffset={100 - dash}
              fill="none"
            />
            <defs>
              <linearGradient id="miniGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgb(99,102,241)" />
                <stop offset="100%" stopColor="rgb(236,72,153)" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-slate-900 dark:text-white"
            aria-label="Time remaining"
          >
            {timeLabel}
          </div>
        </div>

        {/* Intent + meta */}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">
            Focus Sprint
            <span className="ml-2 text-[10px] font-normal text-slate-600 dark:text-slate-400">
              {String(durationMin).padStart(2, "0")}:00
            </span>
          </div>
          <div className="text-[12px] text-slate-700 dark:text-slate-300 truncate">
            {intent || "No intent set"}
          </div>
        </div>

        {/* Controls */}
        <div className="shrink-0 flex items-center gap-1">
          {isRunning && (
            <button
              onClick={pause}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              aria-label="Pause sprint"
              title="Pause"
            >
              <Pause className="h-4 w-4" />
            </button>
          )}
          {isPaused && (
            <button
              onClick={resume}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Resume sprint"
              title="Resume"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200/70 dark:border-slate-700 hover:bg-white/70 dark:hover:bg-slate-800"
            aria-label="Reset sprint"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={goToFull}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200/70 dark:border-slate-700 hover:bg-white/70 dark:hover:bg-slate-800"
            aria-label="Open full Focus Sprint"
            title="Open full"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}