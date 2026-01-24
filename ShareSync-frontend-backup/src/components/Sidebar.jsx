// src/components/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SIDEBAR v3.0 - Phase C: Momentum Engine + Phase E: Social Proof
// ═══════════════════════════════════════════════════════════════════════════════
//
// NOW USING:
// - Deep Violet (#7C3AED) as primary brand color
// - Momentum Glow system for XP ring and progress
// - ENTRANCE ANIMATION: XP ring animates from 0 → current value on app load
// - ⭐ PHASE C: XP ring responds to momentum level (breathing, glow intensity)
// - ⭐ PHASE C: Fire mode badge when level 5
// - ⭐ PHASE C: Momentum indicator in sidebar
// - ⭐ PHASE E: Mini leaderboard widget
// - ⭐ PHASE E: Online teammates indicator
// - ⭐ PHASE E: League badge display
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Settings,
  ChevronsLeft,
  Trophy,
  Flame,
  Terminal,
  LayoutGrid,
  ShieldCheck,
  Zap,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import SidebarItem from "./nav/SidebarItem";
import Avatar from "./ui/Avatar";
import { useFlowState } from '../contexts/FlowStateContext';
import { useMomentumContext } from '../contexts/MomentumContext';
import { useEntrance } from './onboarding/AppEntrance';
import useAnimatedNumber from '../hooks/useAnimatedNumber';

// ⭐ PHASE E: Import social proof components
import { MiniLeaderboard } from './social/Leaderboard';
import OnlineIndicator from './social/OnlineIndicator';
import { MiniLeagueIndicator } from './social/MomentumLeague';

const LS_KEY = "ss.sidebar.collapsed";

/* ─────────────────────────────────────────────────────────────────────────
   MOMENTUM LEVEL INDICATOR - Shows current momentum state
───────────────────────────────────────────────────────────────────────── */
function MomentumLevelIndicator({ collapsed = false }) {
  const { glowLevel, glowState, isFireMode, message } = useMomentumContext();
  
  const levelConfig = {
    0: { icon: null, color: 'text-text-tertiary', bg: 'bg-surface-2', label: 'Idle' },
    1: { icon: Zap, color: 'text-brand-400', bg: 'bg-brand-500/10', label: 'Warming' },
    2: { icon: Zap, color: 'text-brand-500', bg: 'bg-brand-500/15', label: 'Building' },
    3: { icon: TrendingUp, color: 'text-brand-400', bg: 'bg-brand-500/20', label: 'Flowing' },
    4: { icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Peak' },
    5: { icon: Flame, color: 'text-energy-500', bg: 'bg-energy-500/20', label: 'On Fire' },
  };
  
  const config = levelConfig[glowLevel] || levelConfig[0];
  const Icon = config.icon;
  
  if (collapsed) {
    // Just show an icon when collapsed
    if (!Icon) return null;
    return (
      <div className={`
        mx-auto w-8 h-8 rounded-lg flex items-center justify-center
        ${config.bg}
        ${isFireMode ? 'animate-pulse' : ''}
      `}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
    );
  }
  
  return (
    <div className={`
      mx-3 px-3 py-2 rounded-xl
      ${config.bg} border border-white/[0.06]
      transition-all duration-500
      ${isFireMode ? 'border-energy-500/30' : ''}
    `}>
      <div className="flex items-center gap-2">
        {Icon && (
          <div className={`
            w-6 h-6 rounded-lg flex items-center justify-center
            ${glowLevel >= 3 ? 'bg-white/10' : 'bg-surface-2'}
            ${isFireMode ? 'animate-bounce' : ''}
          `}>
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </div>
          <div className="text-[10px] text-text-tertiary truncate">
            Level {glowLevel}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PROGRESS RING - With entrance animation, momentum glow, and Phase C breathing
───────────────────────────────────────────────────────────────────────── */
function ProgressRing({ 
  progress: actualProgress = 0.75, 
  level = 1,
  streak = 7, 
  collapsed = false,
  currentXP,
  maxXP,
}) {
  const { glowLevel, isFireMode } = useMomentumContext();
  
  // ⭐ PHASE A: Get entrance animation state
  const entrance = useEntrance();
  const { progress: entranceProgress, isAnimatingRing, isComplete } = entrance || {
    progress: 100,
    isAnimatingRing: false,
    isComplete: true,
  };
  
  // During entrance, use animated progress. After, use actual.
  const displayProgress = isComplete 
    ? actualProgress 
    : (entranceProgress / 100) * actualProgress;
  
  const size = collapsed ? 40 : 56;
  const strokeWidth = collapsed ? 3 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayProgress * circumference);
  
  const showStreak = streak >= 3;
  const isImpressiveStreak = streak >= 7;
  
  // Track previous values for animation triggers
  const prevProgressRef = useRef(actualProgress);
  const prevLevelRef = useRef(level);
  
  const [isPulsing, setIsPulsing] = useState(false);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState('normal');
  
  // Animated percentage display
  const displayValue = isComplete 
    ? Math.round(actualProgress * 100)
    : Math.round(displayProgress * 100);
  
  const { value: animatedPercent, isAnimating: isCountAnimating } = useAnimatedNumber(
    displayValue,
    { duration: 500, enabled: !collapsed && isComplete }
  );
  
  // Detect progress increase and pulse (only after entrance completes)
  useEffect(() => {
    if (!isComplete) return;
    
    const prevProgress = prevProgressRef.current;
    const currentProgress = actualProgress;
    
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
  }, [actualProgress, isComplete]);
  
  // Detect level-up
  useEffect(() => {
    if (level > prevLevelRef.current) {
      setIsLevelingUp(true);
      const timer = setTimeout(() => setIsLevelingUp(false), 1200);
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = level;
  }, [level]);

  // ⭐ PHASE C: Dynamic glow based on momentum level (enhanced)
  const glowStyle = useMemo(() => {
    // Extra glow during entrance animation
    if (isAnimatingRing) {
      return {
        filter: `drop-shadow(0 0 16px rgb(124 58 237 / 0.5))`,
      };
    }
    
    // ⭐ PHASE C: Fire mode gets special treatment
    if (isFireMode) {
      return {
        filter: `drop-shadow(0 0 20px rgb(124 58 237 / 0.6)) drop-shadow(0 0 40px rgb(244 63 94 / 0.3))`,
      };
    }
    
    if (glowLevel === 0) return {};
    
    // Scale glow with momentum level
    const intensity = glowLevel * 0.15;
    const blur = 8 + glowLevel * 4;
    return {
      filter: `drop-shadow(0 0 ${blur}px rgb(124 58 237 / ${intensity}))`,
    };
  }, [glowLevel, isAnimatingRing, isFireMode]);

  // ⭐ PHASE C: Breathing animation class based on momentum
  const breathingClass = useMemo(() => {
    if (isFireMode) return 'animate-ring-fire';
    if (glowLevel >= 4) return 'animate-ring-breathe-strong';
    if (glowLevel >= 3) return 'animate-ring-breathe';
    return '';
  }, [glowLevel, isFireMode]);

  return (
    <div className="flex flex-col items-center py-6">
      <div 
        className={`
          relative 
          ${isPulsing ? 'animate-bounce-subtle' : ''}
          ${isLevelingUp ? 'scale-110' : 'scale-100'}
          ${isAnimatingRing ? 'progress-ring-entrance' : ''}
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
        
        {/* ⭐ PHASE C: Fire mode outer ring */}
        {isFireMode && (
          <div 
            className="absolute inset-0 rounded-full animate-fire-ring"
            style={{ 
              width: size + 8, 
              height: size + 8,
              top: -4,
              left: -4,
              border: '2px solid rgb(244 63 94 / 0.5)',
            }}
          />
        )}
        
        <svg 
          width={size} 
          height={size} 
          className={`
            xp-ring-progress
            transform -rotate-90
            ${isPulsing ? 'scale-105' : 'scale-100'}
            ${breathingClass}
            transition-transform duration-200
          `}
          style={glowStyle}
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
          
          {/* Progress arc - Deep Violet brand color, fire color at level 5 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={
              isLevelingUp 
                ? 'var(--success-500, #10B981)' 
                : isFireMode 
                  ? 'var(--energy-500, #F43F5E)'
                  : 'var(--brand-600, #7C3AED)'
            }
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={isPulsing ? 'stroke-brand-400' : ''}
            style={{
              transition: isAnimatingRing 
                ? 'stroke-dashoffset 50ms linear' 
                : 'stroke-dashoffset 700ms ease-out, stroke 300ms ease',
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isLevelingUp ? (
            <div className="text-center level-up-number">
              <div className="text-[8px] text-brand-300 uppercase tracking-wider">
                Level Up!
              </div>
              <span className="text-lg font-bold text-brand-500">
                {level}
              </span>
            </div>
          ) : isFireMode ? (
            // ⭐ PHASE C: Fire mode display
            <span className="text-lg animate-pulse">🔥</span>
          ) : (
            <span className={`
              font-semibold text-text-primary tabular-nums
              ${collapsed ? 'text-xs' : 'text-lg'}
              ${isPulsing || isCountAnimating ? 'scale-110 text-brand-500' : 'scale-100'}
              ${isAnimatingRing ? 'text-brand-400' : ''}
              transition-all duration-200
            `}>
              {isComplete ? animatedPercent : Math.round(displayProgress * 100)}
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
          0% { box-shadow: 0 0 0 0 var(--brand-500, #8B5CF6); opacity: 0.6; }
          100% { box-shadow: 0 0 0 12px transparent; opacity: 0; }
        }
        .ring-pulse { animation: ring-pulse 0.6s ease-out forwards; }
        
        @keyframes ring-pulse-strong {
          0% { box-shadow: 0 0 0 0 var(--brand-400, #A78BFA); opacity: 0.7; }
          50% { box-shadow: 0 0 16px 4px var(--brand-500, #8B5CF6); opacity: 0.5; }
          100% { box-shadow: 0 0 0 16px transparent; opacity: 0; }
        }
        .ring-pulse-strong { animation: ring-pulse-strong 0.8s ease-out forwards; }
        
        @keyframes level-up-flash {
          0% { transform: scale(0.8); opacity: 0; }
          30% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .level-up-flash { animation: level-up-flash 0.6s ease-out forwards; }
        
        @keyframes level-up-number {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .level-up-number { animation: level-up-number 0.5s ease-out forwards; }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 0.3s ease-out; }
        
        .progress-ring-entrance {
          animation: ring-entrance 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes ring-entrance {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* ⭐ PHASE C: Breathing animations */
        @keyframes ring-breathe {
          0%, 100% { filter: drop-shadow(0 0 12px rgb(124 58 237 / 0.35)); }
          50% { filter: drop-shadow(0 0 16px rgb(124 58 237 / 0.45)); }
        }
        .animate-ring-breathe { animation: ring-breathe 3s ease-in-out infinite; }
        
        @keyframes ring-breathe-strong {
          0%, 100% { filter: drop-shadow(0 0 16px rgb(124 58 237 / 0.5)); }
          50% { filter: drop-shadow(0 0 22px rgb(167 139 250 / 0.6)); }
        }
        .animate-ring-breathe-strong { animation: ring-breathe-strong 2.5s ease-in-out infinite; }
        
        @keyframes ring-fire {
          0%, 100% { 
            filter: drop-shadow(0 0 20px rgb(124 58 237 / 0.6));
          }
          50% { 
            filter: drop-shadow(0 0 25px rgb(167 139 250 / 0.7)) drop-shadow(0 0 40px rgb(244 63 94 / 0.3));
          }
        }
        .animate-ring-fire { animation: ring-fire 2s ease-in-out infinite; }
        
        @keyframes fire-ring {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-fire-ring { animation: fire-ring 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SHIP COUNTER - With animated tick-up and Deep Violet progress
───────────────────────────────────────────────────────────────────────── */
function ShipCounter({ current = 2, target = 5, collapsed = false }) {
  const { glowLevel } = useMomentumContext();
  const prevCurrentRef = useRef(current);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justFilledIndex, setJustFilledIndex] = useState(-1);
  
  const { value: displayCurrent } = useAnimatedNumber(current, { duration: 400 });
  
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
   ⭐ PHASE E: COLLAPSIBLE SECTION
───────────────────────────────────────────────────────────────────────── */
function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true, collapsed: sidebarCollapsed = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (sidebarCollapsed) return null;
  
  return (
    <div className="mx-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-surface-1 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-text-tertiary" />}
          <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 text-text-tertiary" />
        ) : (
          <ChevronDown className="w-3 h-3 text-text-tertiary" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN SIDEBAR
───────────────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const navigate = useNavigate();
  const { shouldCollapseSidebar, isInFlow } = useFlowState();
  const { glowLevel, isFireMode, leaderboardData, teamActivity } = useMomentumContext();
  
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
        sidebar-item
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
            <div className={`
              sidebar-logo w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center
              transition-all duration-500
              ${isFireMode ? 'shadow-glow-energy' : ''}
            `}>
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

      {/* Progress Ring - Now with entrance animation and Phase C breathing */}
      <ProgressRing collapsed={collapsed} />
      
      {/* ⭐ PHASE C: Momentum Level Indicator */}
      <div className="mb-4">
        <MomentumLevelIndicator collapsed={collapsed} />
      </div>
      
      {/* ⭐ PHASE E: League Badge (when not collapsed) */}
      {!collapsed && (
        <div className="mx-3 mb-4">
          <MiniLeagueIndicator 
            currentXP={1250}
            onClick={() => navigate('/leaderboard')}
          />
        </div>
      )}

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
        
        {/* ⭐ PHASE E: Social Proof Section */}
        {!collapsed && (
          <>
            <div className="pt-4"><div className="h-px bg-white/[0.06]" /></div>
            
            {/* Online Teammates */}
            <CollapsibleSection 
              title="Team" 
              icon={Users} 
              defaultOpen={true}
              collapsed={collapsed}
            >
              <OnlineIndicator 
                variant="compact"
                showAvatars={true}
                showCount={true}
                maxAvatars={3}
                expandable={true}
                defaultExpanded={false}
              />
            </CollapsibleSection>
            
            {/* Mini Leaderboard */}
            <div className="mt-4">
              <CollapsibleSection 
                title="Leaderboard" 
                icon={Trophy} 
                defaultOpen={false}
                collapsed={collapsed}
              >
                <MiniLeaderboard 
                  maxVisible={5}
                  onViewAll={() => navigate('/leaderboard')}
                />
              </CollapsibleSection>
            </div>
          </>
        )}
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
