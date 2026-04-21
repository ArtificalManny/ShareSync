// src/components/streak/StreakProtectionModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// STREAK PROTECTION MODAL
// Frontend-only modal scaffold for backend-authoritative streak freeze flow.
// Safe to ship before backend is wired: if backend support is unavailable,
// the modal simply explains that protection is not ready yet.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect } from "react";
import { Shield, Snowflake, Flame, RefreshCw, Loader2, X } from "lucide-react";

export default function StreakProtectionModal({
  open,
  onClose,
  protection = null,
  onUseFreeze,
  onRefresh,
  isLoading = false,
  isSubmitting = false,
  error = "",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, isSubmitting]);

  if (!open) return null;

  const freezeCount = Number(
    protection?.freezeCount ??
      protection?.freezesRemaining ??
      protection?.remainingFreezes ??
      0
  );

  const streakDays = Number(
    protection?.streakDays ??
      protection?.currentStreakDays ??
      0
  );

  const isAtRisk = Boolean(
    protection?.isAtRisk ??
      protection?.atRisk ??
      protection?.streakAtRisk ??
      false
  );

  const allowFreeze = Boolean(
    protection?.allowFreeze ??
      protection?.canUseFreeze ??
      protection?.freezeAllowed ??
      false
  );

  const supported = Boolean(protection?.supported ?? false);

  const streakState =
    protection?.streakState ||
    protection?.status ||
    (isAtRisk ? "at_risk" : "safe");

  const message =
    protection?.message ||
    protection?.summary ||
    (supported
      ? isAtRisk
        ? "Your streak is at risk. You can use a freeze to protect it."
        : "Your streak is currently safe."
      : "Streak protection is not available yet.");

  const riskWindowText =
    protection?.riskWindowText ||
    protection?.riskWindow ||
    protection?.cooldownLabel ||
    "";

  const canUseFreeze =
    supported &&
    isAtRisk &&
    allowFreeze &&
    freezeCount > 0 &&
    !isLoading &&
    !isSubmitting;

  const statusPillClasses = supported
    ? isAtRisk
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
      : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20"
    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-white/10";

  return (
    <div
      className="fixed inset-0 z-[90] bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm"
      onClick={() => {
        if (!isSubmitting) onClose?.();
      }}
    >
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div
          className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111113] shadow-2xl shadow-slate-900/15 dark:shadow-black/50 overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20">
                {isAtRisk ? <Flame className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">
                  Streak Protection
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  Backend-authoritative protection for streak rescue.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onClose?.()}
              disabled={isSubmitting}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Close streak protection modal"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusPillClasses}`}>
                {isAtRisk ? <Flame className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                {supported ? (isAtRisk ? "At Risk" : "Protected") : "Not Ready"}
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 text-xs font-medium text-slate-600 dark:text-zinc-300">
                <Snowflake className="w-3.5 h-3.5" />
                {freezeCount} freeze{freezeCount === 1 ? "" : "s"} available
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 text-xs font-medium text-slate-600 dark:text-zinc-300">
                {streakDays} day{streakDays === 1 ? "" : "s"} current streak
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/70 p-4">
              <div className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                {streakState === "at_risk" ? "Protection Recommended" : "Current Status"}
              </div>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                {message}
              </p>

              {riskWindowText ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
                  {riskWindowText}
                </p>
              ) : null}
            </div>

            {!supported ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-transparent p-4">
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  The frontend is ready, but the backend streak protection endpoint is not available yet.
                  Once the backend routes are added, this modal will start auto-opening when the streak is at risk
                  and a freeze is available.
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-4">
                <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            ) : null}
          </div>

          <div className="px-6 py-5 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-zinc-500">
              {supported
                ? "Use a freeze only when the backend confirms your streak is truly at risk."
                : "No action is available until backend support is added."}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading || isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>

              <button
                type="button"
                onClick={onUseFreeze}
                disabled={!canUseFreeze}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Snowflake className="w-4 h-4" />}
                Use Freeze
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
