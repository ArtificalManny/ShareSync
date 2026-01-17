// src/components/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8: Micro-Interactions - Animated Ship Counter
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

const LS_KEY = "ss.sidebar.collapsed";

/* ─────────────────────────────────────────────────────────────────────────
   PROGRESS RING - With pulse on change
───────────────────────────────────────────────────────────────────────── */
function ProgressRing({ progress = 0.75, streak = 7, collapsed = false }) {
  const size = collapsed ? 40 : 56;
  const strokeWidth = collapsed ? 3 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress * circumference);
  
  const showStreak = streak >= 3;
  const isImpressiveStreak = streak >= 7;
  
  const prevProgressRef = useRef(progress);
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Detect progress increase and pulse
  useEffect(() => {
    if (progress > prevProgressRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
    prevProgressRef.current = progress;
  }, [progress]);

  return (
    <div className="flex flex-col items-center py-6">
      <div className={`relative ${isPulsing ? 'animate-bounce-subtle' : ''}`}>
        {/* Pulse ring behind */}
        {isPulsing && (
          <div 
            className="absolute inset-0 rounded-full ring-pulse"
            style={{ 
              width: size, 
              height: size,
            }}
          />
        )}
        
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-surface-2"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`text-brand transition-all duration-700 ease-out ${isPulsing ? 'text-brand-400' : ''}`}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`
            font-semibold text-text-primary tabular-nums
            ${collapsed ? 'text-xs' : 'text-lg'}
            ${isPulsing ? 'scale-110' : 'scale-100'}
            transition-transform duration-200
          `}>
            {Math.round(progress * 100)}
          </span>
        </div>
      </div>

      {!collapsed && showStreak && (
        <div className={`
          mt-3 px-2 py-1 rounded-full text-[10px] font-medium
          flex items-center gap-1 transition-all duration-300
          ${isImpressiveStreak 
            ? 'bg-warning/10 text-warning border border-warning/20' 
            : 'bg-surface-2 text-text-tertiary border border-transparent'
          }
        `}>
          <Flame className={`w-3 h-3 ${isImpressiveStreak ? 'text-warning' : 'text-text-tertiary'}`} />
          <span>{streak}d</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SHIP COUNTER - With animated tick-up
───────────────────────────────────────────────────────────────────────── */
function ShipCounter({ current = 2, target = 5, collapsed = false }) {
  const prevCurrentRef = useRef(current);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayCurrent, setDisplayCurrent] = useState(current);
  const [justFilledIndex, setJustFilledIndex] = useState(-1);
  
  // Detect increment and animate
  useEffect(() => {
    if (current > prevCurrentRef.current) {
      setIsAnimating(true);
      setJustFilledIndex(current - 1); // Index of the segment that just filled
      
      // Animate the number counting up
      const startValue = prevCurrentRef.current;
      const endValue = current;
      const duration = 400;
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(startValue + (endValue - startValue) * eased);
        
        setDisplayCurrent(value);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setTimeout(() => setJustFilledIndex(-1), 300);
        }
      };
      
      requestAnimationFrame(animate);
    }
    prevCurrentRef.current = current;
  }, [current]);

  if (collapsed) {
    const progress = Math.min(1, current / target);
    return (
      <div className="mx-auto mt-4 w-8 h-1 bg-surface-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-brand rounded-full transition-all duration-500" 
          style={{ width: `${progress * 100}%` }} 
        />
      </div>
    );
  }

  return (
    <div className={`
      mx-3 px-4 py-3 rounded-xl bg-surface-1 border border-white/[0.06]
      transition-all duration-200
      ${isAnimating ? 'ring-2 ring-brand/20' : ''}
    `}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          Ships today
        </span>
        <span className={`
          text-xs font-semibold tabular-nums
          ${isAnimating ? 'text-brand scale-110' : 'text-text-primary scale-100'}
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
              ${i < current ? 'bg-brand' : 'bg-surface-3'}
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
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
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

      {/* User Card */}
      <div className="p-3">
        <div 
          onClick={() => navigate('/profile')}
          className={`
            flex items-center gap-3 p-2.5 rounded-xl cursor-pointer
            bg-surface-1 border border-white/[0.06]
            hover:bg-surface-2 hover:border-white/[0.1]
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <Avatar name={me.name} size={32} status={me.status} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text-primary truncate">{me.name}</div>
              <div className="text-[10px] text-success flex items-center gap-1">
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
