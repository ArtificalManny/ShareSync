// /src/components/sprint/BreakModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { X, Timer, CupSoda, PencilLine, Check, Pause, Play } from "lucide-react";
import { useBreak } from "../../context/BreakContext";

function fmtMMSS(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onStartBreak?: ({ minutes:number, reason:string }) => void
 * - onReflectionSave?: (text:string) => void
 */
export default function BreakModal({
  isOpen,
  onClose,
  onStartBreak,
  onReflectionSave,
}) {
  const [mode, setMode] = useState("options"); // 'options' | 'break' | 'reflect' | 'done'
  const [breakMs, setBreakMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [reason, setReason] = useState("");
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);

  const intervalRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!running || breakMs <= 0) return;
    intervalRef.current = setInterval(() => {
      setBreakMs((ms) => {
        const next = Math.max(0, ms - 1000);
        if (next === 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunning(false);
          setMode("done");
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (!isOpen) {
      // reset when fully closed
      setMode("options");
      setBreakMs(0);
      setRunning(false);
      setReason("");
      setReflection("");
      setSaved(false);
    }
  }, [isOpen]);

  const startBreak = (minutes, reasonLabel) => {
    const ms = Math.max(1, minutes) * 60 * 1000;
    setReason(reasonLabel);
    setBreakMs(ms);
    setRunning(true);
    setMode("break");
    onStartBreak?.({ minutes, reason: reasonLabel });
  };

  const stopTimer = () => setRunning(false);
  const resumeTimer = () => {
    if (breakMs > 0) setRunning(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed z-50 inset-x-4 top-20 md:left-1/2 md:-translate-x-1/2 md:inset-x-auto w-[min(560px,calc(100%-2rem))] rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Take a short break"
      >
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sprint complete — micro-break?
          </div>
          <button
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Options view */}
        {mode === "options" && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => startBreak(2, "Stretch")}
              className="group rounded-xl border border-slate-200/70 dark:border-slate-700 p-4 text-left hover:bg-white/70 dark:hover:bg-slate-800"
            >
              <div className="inline-flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                <Timer className="h-4 w-4 text-indigo-600" />
                Stretch · 2m
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Stand up, roll shoulders, look away from screen. Timer starts automatically.
              </p>
            </button>

            <button
              onClick={() => startBreak(1, "Water")}
              className="group rounded-xl border border-slate-200/70 dark:border-slate-700 p-4 text-left hover:bg-white/70 dark:hover:bg-slate-800"
            >
              <div className="inline-flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                <CupSoda className="h-4 w-4 text-indigo-600" />
                Water · 1m
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Hydrate, a quick reset. Timer starts automatically.
              </p>
            </button>

            <button
              onClick={() => setMode("reflect")}
              className="group rounded-xl border border-slate-200/70 dark:border-slate-700 p-4 text-left hover:bg-white/70 dark:hover:bg-slate-800"
            >
              <div className="inline-flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                <PencilLine className="h-4 w-4 text-indigo-600" />
                Write one-line reflection
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Capture what moved forward or what’s next.
              </p>
            </button>
          </div>
        )}

        {/* Break timer view */}
        {mode === "break" && (
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {reason} break
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 tabular-nums font-semibold">
                {fmtMMSS(breakMs)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-full bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-[width] duration-1000"
                style={{
                  width: `${Math.max(0, Math.min(100, ((reason === "Stretch" ? 2 : 1) * 60 * 1000 - breakMs) / ((reason === "Stretch" ? 2 : 1) * 60 * 10)))}%`,
                }}
                aria-hidden="true"
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              {running ? (
                <button
                  onClick={stopTimer}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-slate-200/70 dark:border-slate-700 hover:bg-white/70 dark:hover:bg-slate-800"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-slate-200/70 dark:border-slate-700 hover:bg-white/70 dark:hover:bg-slate-800"
                >
                  <Play className="h-4 w-4" />
                  Resume
                </button>
              )}

              <button
                onClick={onClose}
                className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Reflection view */}
        {mode === "reflect" && (
          <div className="p-4 space-y-3">
            <label className="block text-xs text-slate-600 dark:text-slate-400">
              One-line reflection
            </label>
            <input
              value={reflection}
              onChange={(e) => {
                setReflection(e.target.value);
                setSaved(false);
              }}
              placeholder="Shipped the draft API tests; next up: error handling."
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (reflection.trim()) {
                    onReflectionSave?.(reflection.trim());
                    setSaved(true);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-slate-200/70 dark:border-slate-700 hover:bg-white/70 dark:hover:bg-slate-800"
              >
                {saved ? <Check className="h-4 w-4 text-emerald-600" /> : <Check className="h-4 w-4" />}
                {saved ? "Saved" : "Save"}
              </button>
              <button
                onClick={() => startBreak(2, "Break")}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
                title="Start a short break"
              >
                <Timer className="h-4 w-4" />
                Start 2-min break
              </button>
              <button onClick={onClose} className="ml-auto text-sm text-slate-600 hover:underline">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Done view */}
        {mode === "done" && (
          <div className="p-4">
            <div className="text-sm text-slate-800 dark:text-slate-200">
              Break complete. Ease back in — pick the next small unit of work.
            </div>
            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
