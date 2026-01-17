// src/components/home/IntelligencePanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8.4: Intelligence Panel with Breathing Animations
// ═══════════════════════════════════════════════════════════════════════════════
//
// DESIGN PHILOSOPHY:
// The Intelligence panel should feel "alive" - like a living dashboard that's
// actively monitoring your work. But NOT distracting or anxiety-inducing.
//
// MICRO-INTERACTIONS:
// - Workload indicator: Subtle pulse when status is warning
// - Peak Window: Highlights as you approach the window
// - Icon: Gentle rotation/glow on hover
// - Time display: Updates and briefly highlights
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Clock,
  Zap
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   INSIGHT CARD - With breathing animation for warning state
───────────────────────────────────────────────────────────────────────── */
function InsightCard({ 
  icon: Icon, 
  iconColor, 
  title, 
  description, 
  onClick, 
  variant = "default",
  isLive = false, // Shows subtle "breathing" animation
}) {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    default: "bg-surface-2",
    success: "bg-success/10",
    warning: "bg-warning/10",
  };

  return (
    <div 
      className={`
        relative p-5 rounded-xl cursor-pointer group
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${isLive && variant === 'warning' ? 'insight-breathing' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Live indicator dot */}
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <div className={`
            w-1.5 h-1.5 rounded-full
            ${variant === 'warning' ? 'bg-warning animate-pulse' : 'bg-success'}
          `} />
          <span className="text-[10px] text-text-tertiary">Live</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className={`
          p-2.5 rounded-lg transition-all duration-300
          ${variants[variant]}
          ${isHovered ? 'scale-110' : 'scale-100'}
        `}>
          <Icon className={`
            w-5 h-5 transition-all duration-300
            ${iconColor}
            ${isHovered && variant === 'warning' ? 'animate-pulse' : ''}
          `} />
        </div>
        <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <h3 className="text-base font-medium text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-text-secondary">
        {description}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PEAK WINDOW - Highlights as you approach the window
───────────────────────────────────────────────────────────────────────── */
function PeakWindow({ 
  startHour = 14, // 2PM
  endHour = 16,   // 4PM
  productivity = 65,
}) {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [isInWindow, setIsInWindow] = useState(false);
  const [isApproaching, setIsApproaching] = useState(false);
  const [justEntered, setJustEntered] = useState(false);

  // Update time and check window status
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setCurrentHour(hour);
      
      const wasInWindow = isInWindow;
      const nowInWindow = hour >= startHour && hour < endHour;
      const nowApproaching = hour === startHour - 1;
      
      setIsInWindow(nowInWindow);
      setIsApproaching(nowApproaching);
      
      // Trigger "just entered" animation
      if (nowInWindow && !wasInWindow) {
        setJustEntered(true);
        setTimeout(() => setJustEntered(false), 2000);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [startHour, endHour, isInWindow]);

  // Format time display
  const formatHour = (h) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h;
    return `${hour}${suffix}`;
  };

  const timeDisplay = `${formatHour(startHour)} — ${formatHour(endHour)}`;

  return (
    <div className={`
      relative p-4 rounded-xl transition-all duration-500
      ${isInWindow 
        ? 'bg-success/10 border border-success/20' 
        : isApproaching 
          ? 'bg-warning/5 border border-warning/10'
          : 'bg-surface-2 border border-transparent'
      }
      ${justEntered ? 'peak-window-entered' : ''}
    `}>
      {/* Header */}
      <div className="flex justify-between items-center text-xs mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`
            w-3.5 h-3.5 transition-colors duration-300
            ${isInWindow ? 'text-success' : 'text-text-tertiary'}
          `} />
          <span className="text-text-tertiary">Peak Window</span>
        </div>
        
        <span className={`
          font-medium transition-all duration-300
          ${isInWindow 
            ? 'text-success scale-105' 
            : isApproaching 
              ? 'text-warning'
              : 'text-text-secondary'
          }
        `}>
          {timeDisplay}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div 
          className={`
            h-full rounded-full transition-all duration-700
            ${isInWindow ? 'bg-success peak-window-fill' : 'bg-brand'}
          `}
          style={{ width: `${productivity}%` }} 
        />
      </div>
      
      {/* Status text */}
      {isInWindow && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-success">
          <Zap className="w-3 h-3" />
          <span>You're in your peak productivity window!</span>
        </div>
      )}
      
      {isApproaching && !isInWindow && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-warning">
          <Clock className="w-3 h-3" />
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
    <div className="p-4 rounded-xl bg-brand/5 border border-brand/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <span className="text-xs text-text-tertiary">Co-working boost</span>
        </div>
        <span className="text-sm font-semibold text-brand">{multiplier}×</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────════════════════════════════────
   MAIN INTELLIGENCE PANEL
───────────────────────────────────────────────────────────────────────── */
export default function IntelligencePanel({ 
  isBalanced = false,
  onBalanceClick,
  peakWindowStart = 14,
  peakWindowEnd = 16,
  productivity = 65,
  coWorkingMultiplier = 2.1,
  isCoWorking = false,
}) {
  return (
    <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-4 h-4 text-success" />
        <h2 className="text-sm font-medium text-text-secondary">
          Intelligence
        </h2>
      </div>
      
      <div className="space-y-4">
        {/* Workload Balance Card */}
        <InsightCard
          icon={isBalanced ? CheckCircle2 : AlertCircle}
          iconColor={isBalanced ? "text-success" : "text-warning"}
          variant={isBalanced ? "success" : "warning"}
          title={isBalanced ? "Load Balanced" : "High Workload"}
          description={isBalanced 
            ? "Optimized across all nodes." 
            : "You're doing 71% of ships. Rebalance suggested."
          }
          onClick={onBalanceClick}
          isLive={!isBalanced}
        />

        {/* Peak Window */}
        <PeakWindow 
          startHour={peakWindowStart}
          endHour={peakWindowEnd}
          productivity={productivity}
        />

        {/* Co-working Boost */}
        <CoWorkingBoost 
          multiplier={coWorkingMultiplier}
          isActive={isCoWorking}
        />
      </div>
      
      {/* Inline animations */}
      <style>{`
        @keyframes insight-breathing {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
          }
        }
        
        .insight-breathing {
          animation: insight-breathing 3s ease-in-out infinite;
        }
        
        @keyframes peak-window-entered {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 0 8px rgba(20, 184, 166, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(20, 184, 166, 0);
          }
        }
        
        .peak-window-entered {
          animation: peak-window-entered 0.6s ease-out;
        }
        
        @keyframes peak-window-fill {
          0% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.7;
          }
        }
        
        .peak-window-fill {
          animation: peak-window-fill 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
