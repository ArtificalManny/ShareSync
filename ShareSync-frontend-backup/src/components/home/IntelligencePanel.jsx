// src/components/home/IntelligencePanel.jsx
import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Zap,
} from "lucide-react";

function InsightCard({
  icon: Icon,
  iconColor,
  title,
  description,
  onClick,
  variant = "default",
  isLive = false,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const iconBgVariants = {
    default: "bg-slate-100",
    success: "bg-emerald-100/50",
    warning: "bg-amber-100/50",
  };

  return (
    <div
      className={`
        relative p-5 rounded-2xl cursor-pointer group
        bg-white dark:bg-[#1f1f23] border border-slate-200/80 dark:border-white/10
        transition-all duration-300 ease-out
        ${isLive && variant === "warning" ? "insight-breathing" : ""}
      `}
      style={{
        boxShadow: isHovered
          ? "0 8px 24px -4px rgba(139, 92, 246, 0.08), 0 4px 12px -2px rgba(139, 92, 246, 0.04)"
          : "0 2px 10px rgba(0, 0, 0, 0.02)",
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLive && (
        <div className="absolute top-5 right-5 flex items-center gap-1.5">
          <div
            className={`
              w-1.5 h-1.5 rounded-full
              ${variant === "warning" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}
            `}
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Live
          </span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div
          className={`
            p-2.5 rounded-xl transition-transform duration-300 shadow-sm
            ${iconBgVariants[variant] || iconBgVariants.default}
            ${isHovered ? "scale-110 -rotate-3" : "scale-100"}
          `}
        >
          <Icon
            className={`
              w-5 h-5 transition-all duration-300
              ${iconColor}
              ${isHovered && variant === "warning" ? "animate-pulse" : ""}
            `}
          />
        </div>

        <ChevronRight
          className={`
            w-5 h-5 text-slate-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100
            transition-all duration-300 transform group-hover:translate-x-1 mt-2 mr-1
          `}
        />
      </div>

      <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white mb-1.5 group-hover:text-violet-600 transition-colors">
        {title}
      </h3>

      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed pr-4">
        {description}
      </p>
    </div>
  );
}

function PeakWindow({ startHour = 14, endHour = 16, productivity = 65 }) {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [isInWindow, setIsInWindow] = useState(false);
  const [isApproaching, setIsApproaching] = useState(false);
  const [justEntered, setJustEntered] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setCurrentHour(hour);

      const wasInWindow = isInWindow;
      const nowInWindow = hour >= startHour && hour < endHour;
      const nowApproaching = hour === startHour - 1;

      setIsInWindow(nowInWindow);
      setIsApproaching(nowApproaching);

      if (nowInWindow && !wasInWindow) {
        setJustEntered(true);
        setTimeout(() => setJustEntered(false), 2000);
      }
    };

    checkTime();

    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [startHour, endHour, isInWindow]);

  const formatHour = (hourValue) => {
    const suffix = hourValue >= 12 ? "PM" : "AM";
    const hour = hourValue > 12 ? hourValue - 12 : hourValue === 0 ? 12 : hourValue;
    return `${hour}${suffix}`;
  };

  const timeDisplay = `${formatHour(startHour)} — ${formatHour(endHour)}`;

  return (
    <div
      className={`
        relative p-5 rounded-2xl transition-all duration-500 ease-out border
        ${
          isInWindow
            ? "bg-emerald-50/50 border-emerald-200/80 shadow-sm"
            : isApproaching
              ? "bg-amber-50/30 border-amber-200/50"
              : "bg-slate-50 border-slate-200/60"
        }
        ${justEntered ? "peak-window-entered" : ""}
      `}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Clock
            className={`
              w-4 h-4 transition-colors duration-300
              ${isInWindow ? "text-emerald-500" : "text-slate-400"}
            `}
          />

          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Peak Window
          </span>
        </div>

        <span
          className={`
            font-bold tabular-nums tracking-tight transition-all duration-300
            ${
              isInWindow
                ? "text-emerald-600 scale-105"
                : isApproaching
                  ? "text-amber-600"
                  : "text-slate-700"
            }
          `}
        >
          {timeDisplay}
        </span>
      </div>

      <div className="h-1.5 bg-slate-200/60 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <div
          className={`
            h-full rounded-full transition-all duration-700
            ${isInWindow ? "bg-emerald-500 peak-window-fill" : "bg-violet-500"}
          `}
          style={{ width: `${productivity}%` }}
        />
      </div>

      {isInWindow && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
          <Zap className="w-3.5 h-3.5" />
          <span>You're in your peak productivity window!</span>
        </div>
      )}

      {isApproaching && !isInWindow && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-600">
          <Clock className="w-3.5 h-3.5" />
          <span>Peak window starts in {60 - new Date().getMinutes()} min</span>
        </div>
      )}
    </div>
  );
}

function CoWorkingBoost({ multiplier = 2.1, isActive = true }) {
  if (!isActive) return null;

  return (
    <div className="p-5 rounded-2xl bg-violet-50 border border-violet-100/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-violet-400" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-violet-500" />
          </div>

          <span className="text-xs font-bold text-violet-700 uppercase tracking-widest">
            Co-working boost
          </span>
        </div>

        <span className="text-base font-black text-violet-600 tracking-tight">
          {multiplier}×
        </span>
      </div>
    </div>
  );
}

export default function IntelligencePanel({
  workload = null,
  workloadLoading = false,
  workloadError = "",
  isBalanced = false,
  onBalanceClick,
  peakWindowStart = 14,
  peakWindowEnd = 16,
  productivity = 65,
  coWorkingMultiplier = 2.1,
  isCoWorking = false,
}) {
  const workloadIsBalanced = workload?.isBalanced ?? isBalanced;

  const workloadTitle = workloadLoading
    ? "Reading Workload"
    : workloadError
      ? "Workload Offline"
      : workload?.title || (workloadIsBalanced ? "Load Balanced" : "High Workload");

  const workloadDescription = workloadLoading
    ? "Checking active projects and ship distribution..."
    : workloadError
      ? "Workload intelligence could not refresh."
      : workload?.description ||
        (workloadIsBalanced
          ? "Team shipping load is reasonably distributed."
          : "Workload needs review.");

  const workloadVariant = workloadError
    ? "default"
    : workloadIsBalanced
      ? "success"
      : "warning";

  const WorkloadIcon = workloadError
    ? AlertCircle
    : workloadIsBalanced
      ? CheckCircle2
      : AlertCircle;

  const workloadIconColor = workloadError
    ? "text-slate-400"
    : workloadIsBalanced
      ? "text-emerald-500"
      : "text-amber-500";

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#1f1f23] border border-slate-200/80 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-4 h-4 text-violet-500" />

        <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-widest">
          Intelligence
        </h2>
      </div>

      <div className="space-y-4">
        <InsightCard
          icon={WorkloadIcon}
          iconColor={workloadIconColor}
          variant={workloadVariant}
          title={workloadTitle}
          description={workloadDescription}
          onClick={onBalanceClick}
          isLive={!workloadLoading && !workloadError}
        />

        <PeakWindow
          startHour={peakWindowStart}
          endHour={peakWindowEnd}
          productivity={productivity}
        />

        <CoWorkingBoost multiplier={coWorkingMultiplier} isActive={isCoWorking} />
      </div>

      <style>{`
        @keyframes insight-breathing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15); }
        }
        .insight-breathing { animation: insight-breathing 3s ease-in-out infinite; }

        @keyframes peak-window-entered {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .peak-window-entered { animation: peak-window-entered 0.6s ease-out; }

        @keyframes peak-window-fill {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        .peak-window-fill { animation: peak-window-fill 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
