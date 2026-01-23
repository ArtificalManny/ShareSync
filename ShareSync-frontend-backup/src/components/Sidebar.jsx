// src/components/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SIDEBAR v2.0 - Phase 1: Emotional Color System
// ═══════════════════════════════════════════════════════════════════════════════
//
// NOW USING:
// - Deep Violet (#7C3AED) as primary brand color
// - Momentum Glow system for XP ring and progress
// - Surface hierarchy: surface-0 (deepest), surface-1, surface-2
// - Text hierarchy: text-primary, text-secondary, text-tertiary
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Settings,
  ChevronsLeft,
  Trophy,
  Flame,
  Terminal,
  LayoutGrid,
  ShieldCheck
} from "lucide-react";

import SidebarItem from "./nav/SidebarItem";
import Avatar from "./ui/Avatar";
import { useFlowState } from '../contexts/FlowStateContext';
import { useMomentumContext } from '../contexts/MomentumContext';
import useAnimatedNumber from '../hooks/useAnimatedNumber';

const LS_KEY = "ss.sidebar.collapsed";

/* ─────────────────────────────────────────────────────────────────────────
   PROGRESS RING - With Deep Violet brand color and momentum glow
───────────────────────────────────────────────────────────────────────── */
function ProgressRing({ 
  progress = 0.75, 
  level = 1,
  streak = 7, 
  collapsed = false,
  currentXP,
  maxXP,
}) {
  const { glowLevel } = useMomentumContext();
  
  const size = collapsed ? 40 : 56;
  const strokeWidth = collapsed ? 3 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress * circumference);
  
  const showStreak = streak >= 3;
  const isImpressiveStreak = streak >= 7;
  
  // Track previous values for animation triggers
  const prevProgressRef = useRef(progress);
  const prevLevelRef = useRef(level);
  
  const [isPulsing, setIsPulsing] = useState(false);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState('normal');
  
  // Animated percentage display
  const { value: displayPercent, isAnimating } = useAnimatedNumber(
    Math.round(progress * 100),
    { duration: 500, enabled: !collapsed }
  );
  
  // Detect progress increase and pulse
  useEffect(() => {
    const prevProgress = prevProgressRef.current;
    const currentProgress = progress;
    
    // Check for threshold crossings
    const THRESHOLDS = [0.25, 0.5, 0.75, 1.0];
    const crossedThreshold = THRESHOLDS.some(t => 
      prevProgress < t && currentProgress >= t
    );
    
    if (currentProgress > prevProgress) {
      setIsPulsing(true);
      setPulseIntensity(crossedThreshold ? 'strong' : 'normal');
      
      const timer = setTimeout(() => {
        setIsPulsing(false);
        setPulseIntensity('normal');
      }, 600);
      
      return () => clearTimeout(timer);
    }
    
    prevProgressRef.current = currentProgress;
  }, [progress]);
  
  // Detect level-up
  useEffect(() => {
    if (level > prevLevelRef.current) {
      setIsLevelingUp(true);
      const timer = setTimeout(() => setIsLevelingUp(false), 1200);
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = level;
  }, [level]);

  // Dynamic glow based on momentum level
  const getGlowStyle = () => {
    if (glowLevel === 0) return {};
    const intensity = glowLevel * 0.15;
    return {
      filter: `drop-shadow(0 0 ${8 + glowLevel * 4}px rgb(124 58 237 / ${intensity}))`,
    };
  };

  return (
    <div className="flex flex-col items-center py-6">
      <div 
        className={`
          relative 
          ${isPulsing ? 'animate-bounce-subtle' : ''}
          ${isLevelingUp ? 'scale-110' : 'scale-100'}
          transition-transform duration-300
        `}
        data-momentum={glowLevel}
      >
        {/* Pulse ring behind */}
        {isPulsing && (
          <div 
            className={`
              absolute inset-0 rounded-full
              ${pulseIntensity === 'strong' ? 'ring-pulse-strong' : 'ring-pulse'}
            `}
            style={{ width: size, height: size }}
          />
        )}
        
        {/* Level-up flash */}
        {isLevelingUp && (
          <div 
            className="absolute inset-0 rounded-full level-up-flash"
            style={{ 
              width: size, 
              height: size,
              background: 'radial-gradient(circle, var(--brand-400, #A78BFA) 0%, transparent 70%)',
            }}
          />
        )}
        
        <svg 
          width={size} 
          height={size} 
          className={`
            transform -rotate-90
            ${isPulsing ? 'scale-105' : 'scale-100'}
            transition-transform duration-200
          `}
          style={getGlowStyle()}
        >
          {/* Track - uses surface-2 token */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-2, #1A1A1D)"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress arc - Deep Violet brand color */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isLevelingUp ? 'var(--success-500, #10B981)' : 'var(--brand-600, #7C3AED)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`
              transition-all duration-700 ease-out
              ${isPulsing ? 'stroke-brand-400' : ''}
            `}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isLevelingUp ? (
            // Level-up display
            <div className="text-center level-up-number">
              <div className="text-[8px] text-brand-300 uppercase tracking-wider">
                Level Up!
              </div>
              <span className="text-lg font-bold text-brand-500">
                {level}
              </span>
            </div>
          ) : (
            // Normal display
            <span className={`
              font-semibold text-text-primary tabular-nums
              ${collapsed ? 'text-xs' : 'text-lg'}
              ${isPulsing || isAnimating ? 'scale-110 text-brand-500' : 'scale-100'}
              transition-all duration-200
            `}>
              {displayPercent}
            </span>
          )}
        </div>
      </div>

      {/* Streak badge */}
      {!collapsed && showStreak && (
        <div className={`
          mt-3 px-2 py-1 rounded-full text-[10px] font-medium
          flex items-center gap-1 transition-all duration-300
          ${isImpressiveStreak 
            ? 'bg-warning-500/10 text-warning-500 border border-warning-500/20' 
            : 'bg-surface-2 text-text-tertiary border border-transparent'
          }
        `}>
          <Flame className={`w-3 h-3 ${isImpressiveStreak ? 'text-warning-500' : 'text-text-tertiary'}`} />
          <span>{streak}d</span>
        </div>
      )}
      
      {/* Inline keyframes */}
      <style>{`
        @keyframes ring-pulse {
          0% {
            box-shadow: 0 0 0 0 var(--brand-500, #8B5CF6);
            opacity: 0.6;
          }
          100% {
            box-shadow: 0 0 0 12px transparent;
            opacity: 0;
          }
        }
        
        .ring-pulse {
          animation: ring-pulse 0.6s ease-out forwards;
        }
        
        @keyframes ring-pulse-strong {
          0% {
            box-shadow: 0 0 0 0 var(--brand-400, #A78BFA);
            opacity: 0.7;
          }
          50% {
            box-shadow: 0 0 16px 4px var(--brand-500, #8B5CF6);
            opacity: 0.5;
          }
          100% {
            box-shadow: 0 0 0 16px transparent;
            opacity: 0;
          }
        }
        
        .ring-pulse-strong {
          animation: ring-pulse-strong 0.8s ease-out forwards;
        }
        
        @keyframes level-up-flash {
          0% { transform: scale(0.8); opacity: 0; }
          30% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        .level-up-flash {
          animation: level-up-flash 0.6s ease-out forwards;
        }
        
        @keyframes level-up-number {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .level-up-number {
          animation: level-up-number 0.5s ease-out forwards;
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SHIP COUNTER - With animated tick-up and Deep Violet progress
───────────────────────────────────────────────────────────────────────── */
function ShipCounter({ current = 2, target = 5, collapsed = false }) {
  const prevCurrentRef = useRef(current);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justFilledIndex, setJustFilledIndex] = useState(-1);
  
  // Animated counter
  const { value: displayCurrent } = useAnimatedNumber(current, { duration: 400 });
  
  // Detect increment and animate segments
  useEffect(() => {
    if (current > prevCurrentRef.current) {
      setIsAnimating(true);
      setJustFilledIndex(current - 1);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setJustFilledIndex(-1);
      }, 500);
      
      return () => clearTimeout(timer);
    }
    prevCurrentRef.current = current;
  }, [current]);

  if (collapsed) {
    const progress = Math.min(1, current / target);
    return (
      <div className="mx-auto mt-4 w-8 h-1 bg-surface-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-brand-600 rounded-full transition-all duration-500" 
          style={{ width: `${progress * 100}%` }} 
        />
      </div>
    );
  }

  return (
    <div className={`
      mx-3 px-4 py-3 rounded-xl bg-surface-1 border border-white/[0.06]
      transition-all duration-200
      ${isAnimating ? 'ring-2 ring-brand-500/20' : ''}
    `}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          Ships today
        </span>
        <span className={`
          text-xs font-semibold tabular-nums
          ${isAnimating ? 'text-brand-500 scale-110' : 'text-text-primary scale-100'}
          transition-all duration-200
        `}>
          {displayCurrent}/{target}
        </span>
      </div>
      <div className="flex gap-1">
        {[...Array(target)].map((_, i) => (
          <div 
            key={i} 
            className={`
              h-1.5 flex-1 rounded-full transition-all duration-300
              ${i < current ? 'bg-brand-600' : 'bg-surface-3'}
              ${i === justFilledIndex ? 'scale-y-150 bg-brand-400' : 'scale-y-100'}
            `}
            style={{
              transitionDelay: i === justFilledIndex ? '0ms' : `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN SIDEBAR
───────────────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const navigate = useNavigate();
  const { shouldCollapseSidebar, isInFlow } = useFlowState();
  const { glowLevel } = useMomentumContext();
  
  const [userCollapsed, setUserCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === "1"; } 
    catch { return false; }
  });

  const collapsed = shouldCollapseSidebar || userCollapsed;

  useEffect(() => {
    localStorage.setItem(LS_KEY, userCollapsed ? "1" : "0");
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [userCollapsed, collapsed]);

  const handleToggle = () => {
    setUserCollapsed(!userCollapsed);
  };

  const me = { name: "Manny", status: "online" };

  return (
    <aside
      id="app-sidebar"
      className={`
        h-screen flex flex-col
        bg-surface-0 border-r border-white/[0.06]
        transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
        ${isInFlow ? 'opacity-90' : 'opacity-100'}
      `}
      data-momentum={glowLevel}
    >
      {/* Header with Deep Violet brand logo */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center shadow-glow-brand">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">ShareSync</span>
          </div>
        )}
        <button 
          onClick={handleToggle} 
          className={`
            p-2 rounded-lg text-text-tertiary 
            hover:bg-surface-2 hover:text-text-primary 
            transition-all duration-200 
            ${collapsed ? 'mx-auto' : ''}
          `}
          title={isInFlow && !userCollapsed ? 'Collapsed for focus mode' : (collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
        >
          <ChevronsLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Progress Ring */}
      <ProgressRing collapsed={collapsed} />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        <SidebarItem to="/home" label="Mission Control" icon={LayoutGrid} collapsed={collapsed} />
        <SidebarItem to="/projects" label="Project Deck" icon={Terminal} count={3} collapsed={collapsed} />
        <SidebarItem to="/discover" label="The Arena" icon={Trophy} collapsed={collapsed} />
        
        <div className="py-4"><div className="h-px bg-white/[0.06]" /></div>
        
        <SidebarItem to="/profile" label="Identity" icon={UserIcon} collapsed={collapsed} />
        <SidebarItem to="/settings" label="System" icon={Settings} collapsed={collapsed} />
        
        <div className="pt-4">
          <ShipCounter collapsed={collapsed} />
        </div>
      </nav>

      {/* User Card with brand accent on hover */}
      <div className="p-3">
        <div 
          onClick={() => navigate('/profile')}
          className={`
            flex items-center gap-3 p-2.5 rounded-xl cursor-pointer
            bg-surface-1 border border-white/[0.06]
            hover:bg-surface-2 hover:border-brand-500/20
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <Avatar name={me.name} size={32} status={me.status} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text-primary truncate">{me.name}</div>
              <div className="text-[10px] text-success-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Online</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
