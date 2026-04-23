import React, { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Gauge,
  Target,
  Layers3,
  Sparkles,
  ArrowRight,
  Clock3,
  RotateCcw,
} from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatLabel(value) {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTone(state) {
  switch (state) {
    case "completed":
      return {
        shell:
          "border-emerald-200/80 dark:border-emerald-500/20 bg-white dark:bg-[#111113]",
        hero:
          "bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-500/10 dark:via-emerald-500/[0.03] dark:to-teal-500/[0.06]",
        icon:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        chip:
          "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
        button:
          "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/20 dark:hover:bg-emerald-500/15",
        meter: "from-emerald-500 to-teal-500",
        accent: "text-emerald-600 dark:text-emerald-300",
        soft:
          "bg-emerald-50/80 dark:bg-emerald-500/8 border-emerald-100 dark:border-emerald-500/10",
      };

    case "ready":
      return {
        shell:
          "border-teal-200/80 dark:border-teal-500/20 bg-white dark:bg-[#111113]",
        hero:
          "bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-teal-500/10 dark:via-teal-500/[0.03] dark:to-cyan-500/[0.06]",
        icon:
          "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
        chip:
          "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
        button:
          "bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-500/20",
        meter: "from-teal-500 to-cyan-500",
        accent: "text-teal-600 dark:text-teal-300",
        soft:
          "bg-teal-50/80 dark:bg-teal-500/8 border-teal-100 dark:border-teal-500/10",
      };

    case "almost_ready":
      return {
        shell:
          "border-amber-200/80 dark:border-amber-500/20 bg-white dark:bg-[#111113]",
        hero:
          "bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-500/10 dark:via-amber-500/[0.03] dark:to-orange-500/[0.06]",
        icon:
          "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        chip:
          "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
        button:
          "bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-500/20",
        meter: "from-amber-500 to-orange-500",
        accent: "text-amber-600 dark:text-amber-300",
        soft:
          "bg-amber-50/80 dark:bg-amber-500/8 border-amber-100 dark:border-amber-500/10",
      };

    default:
      return {
        shell:
          "border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#111113]",
        hero:
          "bg-gradient-to-br from-slate-50 via-white to-violet-50/70 dark:from-white/[0.03] dark:via-white/[0.015] dark:to-violet-500/[0.05]",
        icon:
          "bg-slate-100 text-slate-700 dark:bg-white/[0.07] dark:text-zinc-200",
        chip:
          "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:border-white/[0.08]",
        button:
          "bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-500/20",
        meter: "from-violet-500 to-fuchsia-500",
        accent: "text-violet-600 dark:text-violet-300",
        soft:
          "bg-slate-50/80 dark:bg-white/[0.03] border-slate-100 dark:border-white/[0.06]",
      };
  }
}

function getIcon(state, isCompleted) {
  if (isCompleted || state === "completed") return CheckCircle2;
  if (state === "ready") return Flag;
  if (state === "almost_ready") return Gauge;
  return AlertTriangle;
}

function MiniMetric({ icon: Icon, label, value, tone }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        "bg-white/70 dark:bg-white/[0.02]",
        "border-slate-200/80 dark:border-white/[0.06]"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn("w-3.5 h-3.5", tone)} />
        <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-500">
          {label}
        </span>
      </div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}

function EmptyListState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] px-4 py-4 text-sm text-slate-500 dark:text-zinc-400">
      {text}
    </div>
  );
}

export default function FinishLineCard({
  finishLine,
  onPrimaryAction,
  className = "",
}) {
  const data = finishLine || {};

  const state = data?.state || "not_ready";
  const isCompleted = Boolean(data?.isCompleted);
  const isReadyToClose = Boolean(data?.isReadyToClose);
  const readinessScore = safeNumber(data?.readinessScore, 0);
  const blockingReasons = Array.isArray(data?.blockingReasons)
    ? data.blockingReasons
    : [];
  const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
  const closureSummary = data?.closureSummary || "";
  const completedAt = formatDate(data?.completedAt);
  const outcomeStatus = formatLabel(data?.outcomeStatus);
  const recommendation =
    data?.recommendedAction || "Finish-line guidance will appear here.";
  const primaryLabel = data?.primaryActionLabel || "View Finish Line";

  const tone = useMemo(() => getTone(state), [state]);
  const Icon = useMemo(() => getIcon(state, isCompleted), [state, isCompleted]);

  const progressRing = clamp(readinessScore, 0, 100);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (progressRing / 100) * circumference;

  const blockerHeadline = useMemo(() => {
    if (isCompleted) return "Closed cleanly";
    if (isReadyToClose) return "Core closure checks passed";
    if (blockingReasons.length > 0) {
      return `${blockingReasons.length} closure blocker${blockingReasons.length === 1 ? "" : "s"}`;
    }
    if (warnings.length > 0) {
      return `${warnings.length} follow-up note${warnings.length === 1 ? "" : "s"}`;
    }
    return "Finish-line signals are warming up";
  }, [isCompleted, isReadyToClose, blockingReasons.length, warnings.length]);

  return (
    <section
      className={cn(
        "rounded-[28px] border shadow-sm dark:shadow-none overflow-hidden",
        tone.shell,
        className
      )}
    >
      <div className={cn("p-5 md:p-6", tone.hero)}>
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                tone.icon
              )}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                  Finish Line
                </h3>

                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    tone.chip
                  )}
                >
                  {data?.headline || "Finish status"}
                </span>

                {completedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium bg-white/70 text-slate-600 border border-slate-200/80 dark:bg-white/[0.05] dark:text-zinc-300 dark:border-white/[0.08]">
                    <Clock3 className="w-3 h-3" />
                    {completedAt}
                  </span>
                ) : null}
              </div>

              <p className="text-sm md:text-[15px] leading-relaxed text-slate-700 dark:text-zinc-200 mb-3">
                {data?.subheadline || "Closure readiness details will appear here."}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <span className={cn("font-semibold", tone.accent)}>
                  {blockerHeadline}
                </span>

                {outcomeStatus ? (
                  <span className="text-slate-500 dark:text-zinc-400">
                    Outcome: <span className="text-slate-700 dark:text-zinc-200 font-medium">{outcomeStatus}</span>
                  </span>
                ) : null}

                {Boolean(data?.hasActiveSprint) && !isCompleted ? (
                  <span className="text-amber-600 dark:text-amber-300 font-medium">
                    Active sprint still running
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 xl:pl-4">
            <div className="relative w-[92px] h-[92px] flex-shrink-0">
              <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
                <circle
                  cx="46"
                  cy="46"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-zinc-800"
                />
                <circle
                  cx="46"
                  cy="46"
                  r={radius}
                  fill="none"
                  stroke="url(#finish-line-grad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="finish-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop
                      offset="0%"
                      stopColor={
                        state === "completed"
                          ? "#10B981"
                          : state === "ready"
                            ? "#14B8A6"
                            : state === "almost_ready"
                              ? "#F59E0B"
                              : "#7C3AED"
                      }
                    />
                    <stop
                      offset="100%"
                      stopColor={
                        state === "completed"
                          ? "#14B8A6"
                          : state === "ready"
                            ? "#06B6D4"
                            : state === "almost_ready"
                              ? "#F97316"
                              : "#D946EF"
                      }
                    />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[26px] font-semibold text-slate-900 dark:text-zinc-100 leading-none">
                  {progressRing}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 mt-1">
                  readiness
                </div>
              </div>
            </div>

            {typeof onPrimaryAction === "function" ? (
              <button
                type="button"
                onClick={onPrimaryAction}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-4 py-3",
                  "text-sm font-medium transition-all duration-200",
                  "hover:-translate-y-0.5 active:translate-y-0",
                  tone.button
                )}
              >
                {isCompleted ? (
                  <RotateCcw className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>{primaryLabel}</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 h-2 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 bg-gradient-to-r",
              tone.meter
            )}
            style={{ width: `${progressRing}%` }}
          />
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-5">
          <MiniMetric
            icon={Layers3}
            label="Open tasks"
            value={safeNumber(data?.openTaskCount, 0)}
            tone="text-slate-500"
          />
          <MiniMetric
            icon={AlertTriangle}
            label="Critical open"
            value={safeNumber(data?.openCriticalTaskCount, 0)}
            tone="text-amber-500"
          />
          <MiniMetric
            icon={Sparkles}
            label="Blockers"
            value={safeNumber(data?.blockedTaskCount, 0)}
            tone="text-rose-500"
          />
          <MiniMetric
            icon={Target}
            label="Active goals"
            value={safeNumber(data?.activeGoalCount, 0)}
            tone="text-violet-500"
          />
          <MiniMetric
            icon={CheckCircle2}
            label="Goals done"
            value={safeNumber(data?.completedGoalCount, 0)}
            tone="text-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4">
          <div className={cn("rounded-[24px] border p-4", tone.soft)}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                Blocking reasons
              </h4>
            </div>

            {blockingReasons.length > 0 ? (
              <ul className="space-y-2.5">
                {blockingReasons.slice(0, 4).map((item, index) => (
                  <li
                    key={`blocking-${index}`}
                    className="rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] px-3.5 py-3 text-sm text-slate-700 dark:text-zinc-200 leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyListState
                text={
                  isCompleted || isReadyToClose
                    ? "No blockers remain. The project has crossed the finish line cleanly."
                    : "No blocking reasons are currently reported."
                }
              />
            )}
          </div>

          <div className="space-y-4">
            <div className={cn("rounded-[24px] border p-4", tone.soft)}>
              <div className="flex items-center gap-2 mb-3">
                <Flag className="w-4 h-4 text-violet-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                  Recommended next move
                </h4>
              </div>

              <p className="text-sm leading-relaxed text-slate-700 dark:text-zinc-200">
                {recommendation}
              </p>

              {data?.nextMoveTitle ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium bg-white/80 text-slate-700 border border-slate-200/80 dark:bg-white/[0.03] dark:text-zinc-200 dark:border-white/[0.08]">
                  <ArrowRight className="w-3 h-3" />
                  {data.nextMoveTitle}
                </div>
              ) : null}
            </div>

            {warnings.length > 0 ? (
              <div className="rounded-[24px] border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Warnings
                  </h4>
                </div>

                <ul className="space-y-2">
                  {warnings.slice(0, 3).map((item, index) => (
                    <li
                      key={`warning-${index}`}
                      className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {closureSummary ? (
              <div className="rounded-[24px] border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Closure summary
                  </h4>
                </div>

                <p className="text-sm leading-relaxed text-slate-700 dark:text-zinc-200">
                  {closureSummary}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
