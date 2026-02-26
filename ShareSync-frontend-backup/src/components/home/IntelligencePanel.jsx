// src/components/home/IntelligencePanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8.5: Intelligence Panel - Realtime & Optical Audit
// UPGRADED: Now fetches its own data via useIntelligence hook.
// STYLING: Applied "Gallery Walk" Light Theme contrast and skeleton loaders.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';
import { useIntelligence } from '../../hooks/useIntelligence';

/* ─────────────────────────────────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────────────────────────────────── */
function IntelligenceSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200/60 shadow-[0_4px_24px_rgba(139,92,246,0.06)]">
      <div className="flex items-center gap-2 mb-6">
        <Activity strokeWidth={1.5} className="w-4 h-4 text-emerald-500 opacity-50" />
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="h-28 bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />
        <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />
        <div className="h-16 bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   INSIGHT CARD
───────────────────────────────────────────────────────────────────────── */
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

  const variants = {
    default: "bg-slate-50",
    success: "bg-emerald-50 border-emerald-100",
    warning: "bg-amber-50 border-amber-100",
  };

  return (
    <div 
      className={`
        relative p-5 rounded-xl cursor-pointer group
        bg-white border border-slate-200/60
        hover:border-violet-200/60 hover:shadow-md
        transition-all duration-200 active:scale-[0.98]
        ${isLive && variant === 'warning' ? 'insight-breathing' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <div className={`
            w-1.5 h-1.5 rounded-full
            ${variant === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}
          `} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className={`
          p-2.5 rounded-lg border transition-all duration-300
          ${variants[variant]}
          ${isHovered ? 'scale-110' : 'scale-100'}
        `}>
          <Icon strokeWidth={1.5} className={`
            w-5 h-5 transition-all duration-300
            ${iconColor}
            ${isHovered && variant === 'warning' ? 'animate-pulse' : ''}
          `} />
        </div>
        <ChevronRight strokeWidth={1.5} className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <h3 className="text-[15px] font-semibold text-slate-900 leading-tight mb-1">
        {title}
      </h3>
      <p className="text-[13px] text-slate-500 leading-snug">
        {description}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PEAK WINDOW
───────────────────────────────────────────────────────────────────────── */
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

  const formatHour = (h) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? (h === 24 ? 12 : h - 12) : (h === 0 ? 12 : h);
    return `${hour}${suffix}`;
  };

  const timeDisplay = `${formatHour(startHour)} — ${formatHour(endHour)}`;

  return (
    <div className={`
      relative p-4 rounded-xl transition-all duration-500
      ${isInWindow 
        ? 'bg-emerald-50 border border-emerald-200' 
        : isApproaching 
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-slate-50 border border-slate-100'
      }
      ${justEntered ? 'peak-window-entered' : ''}
    `}>
      <div className="flex justify-between items-center text-xs mb-3">
        <div className="flex items-center gap-1.5">
          <Clock strokeWidth={1.5} className={`
            w-3.5 h-3.5 shrink-0 transition-colors duration-300 relative -top-[0.5px]
            ${isInWindow ? 'text-emerald-500' : 'text-slate-400'}
          `} />
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Peak Window</span>
        </div>
        
        <span className={`
          font-bold text-[13px] transition-all duration-300
          ${isInWindow 
            ? 'text-emerald-600 scale-105' 
            : isApproaching 
              ? 'text-amber-600'
              : 'text-slate-700'
          }
        `}>
          {timeDisplay}
        </span>
      </div>
      
      <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
        <div 
          className={`
            h-full rounded-full transition-all duration-700
            ${isInWindow ? 'bg-emerald-500 peak-window-fill' : 'bg-violet-500'}
          `}
          style={{ width: `${productivity}%` }} 
        />
      </div>
      
      {isInWindow && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
          <Zap strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0" />
          <span>You're in your peak productivity window!</span>
        </div>
      )}
      
      {isApproaching && !isInWindow && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
          <Clock strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0" />
          <span>Peak window starts in {60 - new Date().getMinutes()} min</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CO-WORKING BOOST INDICATOR
───────────────────────────────────────────────────────────────────────── */
function CoWorkingBoost({ multiplier = 2.1, isActive = true }) {
  if (!isActive) return null;

  return (
    <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[13px] font-medium text-slate-600">Co-working boost</span>
        </div>
        <span className="text-[15px] font-bold text-violet-600">{multiplier}×</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────════════════════════════════────
   MAIN INTELLIGENCE PANEL
───────────────────────────────────────────────────────────────────────── */
export default function IntelligencePanel({ onBalanceClick }) {
  const { data: intelligenceData, isLoading } = useIntelligence();

  if (isLoading) {
    return <IntelligenceSkeleton />;
  }

  // Safe destructuring with fallback defaults in case the payload is incomplete
  const {
    isBalanced = true,
    workloadMsg = "Optimized across all nodes.",
    peakWindowStart = 14,
    peakWindowEnd = 16,
    productivity = 65,
    coWorkingMultiplier = 2.1,
    isCoWorking = false,
  } = intelligenceData || {};

  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200/60 shadow-[0_4px_24px_rgba(139,92,246,0.06)]">
      <div className="flex items-center gap-2 mb-6">
        <Activity strokeWidth={1.5} className="w-4 h-4 shrink-0 text-emerald-500" />
        <h2 className="text-sm font-semibold text-slate-800">
          Intelligence
        </h2>
      </div>
      
      <div className="space-y-4">
        <InsightCard
          icon={isBalanced ? CheckCircle2 : AlertCircle}
          iconColor={isBalanced ? "text-emerald-500" : "text-amber-500"}
          variant={isBalanced ? "success" : "warning"}
          title={isBalanced ? "Load Balanced" : "High Workload"}
          description={isBalanced ? workloadMsg : "You're doing 71% of ships. Rebalance suggested."}
          onClick={onBalanceClick}
          isLive={!isBalanced}
        />

        <PeakWindow 
          startHour={peakWindowStart}
          endHour={peakWindowEnd}
          productivity={productivity}
        />

        <CoWorkingBoost 
          multiplier={coWorkingMultiplier}
          isActive={isCoWorking}
        />
      </div>
      
      <style>{`
        @keyframes insight-breathing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1); }
        }
        .insight-breathing { animation: insight-breathing 3s ease-in-out infinite; }
        
        @keyframes peak-window-entered {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
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
