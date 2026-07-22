import React, { useState } from "react";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Flag,
  GaugeCircle,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

function readNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, readNumber(value, 0)));
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

/* finish-line-canonical-metrics-v1
 * OpenShare Goal Orbit Mark:
 * one central outcome with active work orbiting toward completion.
 */
function GoalOrbitMark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.2 12c0-4.3 3.5-7.8 7.8-7.8 2.4 0 4.5 1.1 5.9 2.8"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        opacity="0.72"
      />

      <path
        d="M19.8 12c0 4.3-3.5 7.8-7.8 7.8-2.4 0-4.5-1.1-5.9-2.8"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        opacity="0.42"
      />

      <circle
        cx="12"
        cy="12"
        r="3.35"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m10.5 12 1.05 1.05 2.15-2.45"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="18.25" cy="7.05" r="1.55" fill="currentColor" />

      <circle
        cx="5.75"
        cy="16.95"
        r="1.55"
        fill="currentColor"
        opacity="0.62"
      />
    </svg>
  );
}

function getFinishLineTitle(finishLine) {
  return finishLine?.title || finishLine?.name || "Finish Line";
}

function getStatusLabel(finishLine) {
  return (
    finishLine?.statusLabel ||
    finishLine?.status ||
    finishLine?.phaseLabel ||
    (finishLine?.isCompleted ? "Completed" : "Almost ready to close")
  );
}

function getPrimarySummary(finishLine) {
  return (
    finishLine?.summary ||
    finishLine?.headline ||
    finishLine?.primarySummary ||
    `${readNumber(finishLine?.blockers, 0)} blocker${
      readNumber(finishLine?.blockers, 0) === 1 ? "" : "s"
    } unresolved`
  );
}

function getSecondarySummary(finishLine) {
  return (
    finishLine?.secondarySummary ||
    finishLine?.subheadline ||
    finishLine?.closureSummary ||
    `${readNumber(
      finishLine?.closureBlockers ?? finishLine?.closeBlockers,
      0
    )} closure blocker${
      readNumber(
        finishLine?.closureBlockers ?? finishLine?.closeBlockers,
        0
      ) === 1
        ? ""
        : "s"
    }`
  );
}

function getReadiness(finishLine) {
  return clampPercent(
    finishLine?.readiness ??
      finishLine?.readinessScore ??
      finishLine?.score ??
      0
  );
}

function getPenaltyText(finishLine) {
  const explicit =
    finishLine?.penaltyText ||
    finishLine?.frictionText ||
    finishLine?.message;

  if (explicit) return explicit;

  const withheld = readNumber(
    finishLine?.withheldPoints ??
      finishLine?.pointsHeldBack ??
      finishLine?.riskPoints,
    0
  );

  if (withheld > 0) {
    return `${withheld} points are being held back by unfinished execution risk and closure friction.`;
  }

  return "Project closure readiness is being monitored across execution risk, blockers, and completion signals.";
}

function getBlockingReasons(finishLine) {
  return normalizeArray(
    finishLine?.blockingReasons ||
      finishLine?.reasons ||
      finishLine?.blockerReasons
  );
}

function getWarnings(finishLine) {
  return normalizeArray(finishLine?.warnings);
}

function getRecommendedText(finishLine) {
  if (typeof finishLine?.recommendedNextMove === "string") {
    return finishLine.recommendedNextMove;
  }

  if (typeof finishLine?.recommendation === "string") {
    return finishLine.recommendation;
  }

  if (typeof finishLine?.nextMoveText === "string") {
    return finishLine.nextMoveText;
  }

  if (finishLine?.nextMove?.title) {
    return `Finish "${finishLine.nextMove.title}" first, then review remaining closure blockers.`;
  }

  return "Review the remaining closure blockers and complete the highest-leverage finishing move first.";
}

function getRecommendedChipLabel(finishLine) {
  return (
    finishLine?.nextMove?.title ||
    finishLine?.nextMoveLabel ||
    finishLine?.ctaHint ||
    "Next move"
  );
}

function getPrimaryActionLabel(finishLine) {
  return (
    finishLine?.primaryActionLabel ||
    finishLine?.actionLabel ||
    "View Finish Readiness"
  );
}

function getMetric(finishLine, keys, fallback = 0) {
  for (const key of keys) {
    if (finishLine?.[key] != null) return readNumber(finishLine[key], fallback);
  }
  return fallback;
}

function getTheme(readiness) {
  if (readiness >= 85) {
    return {
      rail: "from-emerald-500 via-lime-400 to-cyan-400",
      pill:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      soft:
        "from-emerald-50 via-cyan-50 to-white dark:from-emerald-500/10 dark:via-cyan-500/5 dark:to-transparent",
      icon:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }

  if (readiness >= 60) {
    return {
      rail: "from-amber-500 via-orange-500 to-yellow-400",
      pill:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300",
      soft:
        "from-amber-50 via-orange-50 to-white dark:from-amber-500/10 dark:via-orange-500/5 dark:to-transparent",
      icon:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300",
    };
  }

  return {
    rail: "from-rose-500 via-orange-500 to-amber-400",
    pill:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300",
    soft:
      "from-rose-50 via-orange-50 to-white dark:from-rose-500/10 dark:via-orange-500/5 dark:to-transparent",
    icon:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300",
  };
}

function MetricCard({ icon: Icon, label, value, tone = "neutral" }) {
  const toneClasses = {
    danger: "text-rose-500 dark:text-rose-300",
    warning: "text-amber-500 dark:text-amber-300",
    accent: "text-violet-500 dark:text-violet-300",
    success: "text-emerald-500 dark:text-emerald-300",
    info: "text-cyan-600 dark:text-cyan-300",
    neutral: "text-slate-500 dark:text-zinc-400",
  }[tone] || "text-slate-500 dark:text-zinc-400";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03]">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${toneClasses}`} />
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
          {label}
        </span>
      </div>
      <div className="text-[22px] font-black leading-none text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

export default function FinishLineCard({ finishLine, onPrimaryAction, onNextMoveClick }) {
  const title = getFinishLineTitle(finishLine);
  const statusLabel = getStatusLabel(finishLine);
  const primarySummary = getPrimarySummary(finishLine);
  const secondarySummary = getSecondarySummary(finishLine);
  const readiness = getReadiness(finishLine);
  const penaltyText = getPenaltyText(finishLine);
  const blockingReasons = getBlockingReasons(finishLine);
  const warnings = getWarnings(finishLine);
  const recommendedText = getRecommendedText(finishLine);
  const recommendedChipLabel = getRecommendedChipLabel(finishLine);
  const primaryActionLabel = getPrimaryActionLabel(finishLine);

  const [isNextMoveOpen, setIsNextMoveOpen] = useState(false);

  const nextMove = finishLine?.nextMove || null;
  const nextMoveTitle =
    nextMove?.title ||
    nextMove?.name ||
    recommendedChipLabel ||
    "Next move";

  const nextMoveDescription =
    nextMove?.description ||
    nextMove?.summary ||
    recommendedText ||
    "Review the recommended next move for this project.";

  const nextMoveMeta = [
    nextMove?.status,
    nextMove?.priority,
    nextMove?.type,
  ]
    .filter(Boolean)
    .join(" • ");

  const handleNextMoveClick = () => {
    if (typeof onNextMoveClick === "function") {
      onNextMoveClick(nextMove || finishLine);
      return;
    }

    if (typeof onPrimaryAction === "function") {
      onPrimaryAction(finishLine);
      return;
    }

    setIsNextMoveOpen(true);
  };

  const openTasks = getMetric(
    finishLine,
    ["openTasks", "openTaskCount"]
  );

  const criticalOpen = getMetric(
    finishLine,
    [
      "criticalOpen",
      "criticalOpenCount",
      "openCriticalTaskCount",
    ]
  );

  const blockers = getMetric(
    finishLine,
    [
      "blockers",
      "blockerCount",
      "blockedTaskCount",
    ]
  );

  const activeGoals = getMetric(
    finishLine,
    ["activeGoals", "activeGoalCount"]
  );

  const goalsDone = getMetric(
    finishLine,
    [
      "goalsDone",
      "goalsCompleted",
      "completedGoals",
      "completedGoalCount",
    ]
  );

  const explicitClosureBlockers = getMetric(
    finishLine,
    [
      "closureBlockers",
      "closeBlockers",
      "closureBlockerCount",
    ]
  );

  /*
   * Each normalized blocking reason represents one distinct
   * closeout condition. This keeps the badge synchronized with
   * the reasons displayed directly below it.
   */
  const closureBlockers = Math.max(
    explicitClosureBlockers,
    blockingReasons.length
  );

  const hasActiveSprint = Boolean(
    finishLine?.hasActiveSprint
  );

  const warningsCount =
    warnings.length ||
    getMetric(finishLine, ["warningCount"], 0);

  const theme = getTheme(readiness);

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readiness / 100) * circumference;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${theme.rail}`} />
      <div className={`pointer-events-none absolute right-0 top-0 h-48 w-48 bg-gradient-to-br ${theme.soft} blur-3xl`} />

      <div className="relative p-6 md:p-7">
        <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-4">
              <div
                className={`mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${theme.icon}`}
              >
                <GaugeCircle className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[20px] font-black tracking-tight text-slate-950 dark:text-white md:text-[22px]">
                    {title}
                  </h3>

                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${theme.pill}`}>
                    {statusLabel}
                  </span>
                </div>

                <p className="mt-3 text-[16px] font-bold tracking-tight text-slate-900 dark:text-zinc-100 md:text-[18px]">
                  {primarySummary}
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-zinc-400">
                  {secondarySummary}
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 xl:w-auto xl:min-w-[420px]">
            <div className="rounded-[24px] border border-slate-200 bg-white/85 px-4 py-4 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="relative flex h-[86px] w-[86px] items-center justify-center shrink-0">
                  <svg width="86" height="86" viewBox="0 0 86 86" className="-rotate-90">
                    <circle
                      cx="43"
                      cy="43"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-200 dark:text-zinc-800"
                    />
                    <circle
                      cx="43"
                      cy="43"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="text-amber-500 transition-all duration-700"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[18px] font-black leading-none text-slate-950 dark:text-white">
                      {readiness}
                    </span>
                    <span className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                      Readiness
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                    Close readiness
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-white">
                    Execution, risk, and completion alignment
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    A quick read on how close this project is to wrapping cleanly.
                  </p>
                </div>
              </div>
            </div>

            <button
              data-openshare-finish-readiness-cta="amber-safe-v2"
              type="button"
              onClick={() => onPrimaryAction?.(finishLine)}
              className="finish-readiness-cta inline-flex min-h-[48px] min-w-[225px] items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-black shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              style={{
                backgroundColor: "#f59e0b",
                backgroundImage:
                  "linear-gradient(135deg, #fde68a 0%, #fbbf24 28%, #f59e0b 62%, #ea580c Available)",
                color: "#111827",
                borderColor: "#f59e0b",
                boxShadow:
                  "0 18px 44px rgba(245,158,11,0.38), inset 0 1px 0 rgba(255,255,255,0.42)",
              }}
            >
              <span style={{ color: "#111827" }}>{primaryActionLabel}</span>
              <ArrowRight className="h-4 w-4" style={{ color: "#111827", stroke: "#111827" }} />
            </button>
          </div>
        </div>

        <div className="mb-5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
          <div
            className={`h-3 rounded-full bg-gradient-to-r ${theme.rail} transition-all duration-700`}
            style={{ width: `${readiness}%` }}
          />
        </div>

        <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-zinc-300">
          {penaltyText}
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
            {closureBlockers} blocker{closureBlockers === 1 ? "" : "s"}
          </span>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300">
            {warningsCount} warning{warningsCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            icon={ClipboardList}
            label="Open Tasks"
            value={openTasks}
            tone={openTasks > 0 ? "info" : "neutral"}
          />

          <MetricCard
            icon={TriangleAlert}
            label="Critical Open"
            value={criticalOpen}
            tone={criticalOpen > 0 ? "warning" : "neutral"}
          />

          <MetricCard
            icon={AlertTriangle}
            label="Blockers"
            value={blockers}
            tone={blockers > 0 ? "danger" : "neutral"}
          />

          <MetricCard
            icon={GoalOrbitMark}
            label="Active Goals"
            value={activeGoals}
            tone={activeGoals > 0 ? "accent" : "neutral"}
          />

          <MetricCard
            icon={CheckCircle2}
            label="Goals Done"
            value={goalsDone}
            tone={goalsDone > 0 ? "success" : "neutral"}
          />

          <MetricCard
            icon={Flag}
            label="Sprint State"
            value={hasActiveSprint ? "Active" : "Clear"}
            tone={hasActiveSprint ? "warning" : "success"}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-[26px] border border-slate-200 bg-white/75 p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h4 className="text-[13px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-zinc-300">
                Blocking Reasons
              </h4>
            </div>

            {blockingReasons.length > 0 ? (
              <div className="space-y-3">
                {blockingReasons.map((reason, index) => (
                  <div
                    key={`${reason}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400">
                No blocking reasons have been recorded.
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-[26px] border border-slate-200 bg-white/75 p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="mb-4 flex items-center gap-2">
                <Flag className="h-4 w-4 text-violet-500" />
                <h4 className="text-[13px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-zinc-300">
                  Recommended Next Move
                </h4>
              </div>

              <p className="text-sm leading-6 text-slate-700 dark:text-zinc-300">
                {recommendedText}
              </p>

              <button
                type="button"
                onClick={handleNextMoveClick}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-200"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>{recommendedChipLabel}</span>
              </button>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white/75 p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-500" />
                <h4 className="text-[13px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-zinc-300">
                  Warnings
                </h4>
              </div>

              {warnings.length > 0 ? (
                <div className="space-y-3">
                  {warnings.map((warning, index) => (
                    <div
                      key={`${warning}-${index}`}
                      className="text-sm leading-6 text-slate-700 dark:text-zinc-300"
                    >
                      {warning}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 dark:text-zinc-400">
                  No warnings are currently flagged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isNextMoveOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Recommended next move"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            aria-label="Close recommended next move"
            onClick={() => setIsNextMoveOpen(false)}
          />

          <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#111113]">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

            <div className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-500">
                    Recommended next move
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    {nextMoveTitle}
                  </h3>
                  {nextMoveMeta ? (
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      {nextMoveMeta}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setIsNextMoveOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <p className="text-sm leading-6 text-slate-700 dark:text-zinc-300">
                  {nextMoveDescription}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNextMoveOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsNextMoveOpen(false);
                    onPrimaryAction?.(finishLine);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01]"
                >
                  <span>Open finish readiness</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </section>
  );
}
