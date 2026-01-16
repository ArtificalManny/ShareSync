// src/components/layout/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Quiet Confidence" + PHASE 3: Ambient Gamification
// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION RULES:
// 1. Progress ring is QUIET - the number speaks for itself
// 2. Streak badge is EARNED - only prominent at 7+ days
// 3. Ship counter segments fill without glowing
// 4. XP gains are ambient (tiny floats), not celebrations
// 5. Color is EARNED through achievement, not decoration
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const LS_KEY = "ss.sidebar.collapsed";

/* ─────────────────────────────────────────────────────────────────────────
   PROGRESS RING - Ambient, not attention-seeking
   - Clean SVG ring, no pulsing backgrounds
   - Number is the focus, not decoration
   - Streak badge earns its prominence (7+ days)
───────────────────────────────────────────────────────────────────────── */
function ProgressRing({ progress = 0.75, streak = 7, collapsed = false }) {
  const size = collapsed ? 40 : 56;
  const strokeWidth = collapsed ? 3 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress * circumference);
  
  // Streak is "earned" at 3+ days, "impressive" at 7+
  const showStreak = streak >= 3;
  const isImpressiveStreak = streak >= 7;

  return (
    <div className="flex flex-col items-center py-6">
      {/* Ring */}
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-surface-2"
          />
          {/* Progress arc */}
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
            className="text-brand transition-all duration-700 ease-out"
          />
        </svg>
        
        {/* Center number - just the number, nothing fancy */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`
            font-semibold text-text-primary
            ${collapsed ? 'text-xs' : 'text-lg'}
          `}>
            {Math.round(progress * 100)}
          </span>
        </div>
      </div>

      {/* Streak badge - EARNED, not default */}
      {!collapsed && showStreak && (
        <div className={`
          mt-3 px-2 py-1 rounded-full text-[10px] font-medium
          flex items-center gap-1
          transition-all duration-300
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
   SHIP COUNTER - Clean segmented progress
   - Filled segments are the reward, no glows needed
   - Quiet until you're making progress
───────────────────────────────────────────────────────────────────────── */
function ShipCounter({ current = 2, target = 5, collapsed = false }) {
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
    <div className="mx-3 px-4 py-3 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          Ships today
        </span>
        <span className="text-xs font-semibold text-text-primary">
          {current}/{target}
        </span>
      </div>
      
      {/* Segmented progress - no glows, filled is the reward */}
      <div className="flex gap-1">
        {[...Array(target)].map((_, i) => (
          <div 
            key={i} 
            className={`
              h-1.5 flex-1 rounded-full transition-colors duration-300
              ${i < current ? 'bg-brand' : 'bg-surface-3'}
            `}
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
  const location = useLocation();
  
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) === "1";
    } catch { 
      return false; 
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [collapsed]);

  // Mock user data - replace with actual user context
  const me = { name: "Manny", status: "online" };

  return (
    <aside
      id="app-sidebar"
      className={`
        h-screen flex flex-col
        bg-surface-0 border-r border-white/[0.06]
        transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-semibold text-text-primary tracking-wide">
              ShareSync
            </span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className={`
            p-2 rounded-lg text-text-tertiary
            hover:bg-surface-2 hover:text-text-primary
            transition-all duration-200
            ${collapsed ? 'mx-auto' : ''}
          `}
        >
          <ChevronsLeft className={`
            w-4 h-4 transition-transform duration-300
            ${collapsed ? 'rotate-180' : ''}
          `} />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          GAMIFICATION - Ambient, not screaming
      ═══════════════════════════════════════════════════════════════════ */}
      <ProgressRing collapsed={collapsed} />

      {/* ═══════════════════════════════════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════════════════════════════════ */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        <SidebarItem to="/home" label="Mission Control" icon={LayoutGrid} collapsed={collapsed} />
        <SidebarItem to="/projects" label="Project Deck" icon={Terminal} count={3} collapsed={collapsed} />
        <SidebarItem to="/discover" label="The Arena" icon={Trophy} collapsed={collapsed} />
        
        {/* Divider */}
        <div className="py-4">
          <div className="h-px bg-white/[0.06]" />
        </div>
        
        <SidebarItem to="/profile" label="Identity" icon={UserIcon} collapsed={collapsed} />
        <SidebarItem to="/settings" label="System" icon={Settings} collapsed={collapsed} />
        
        {/* Ship Counter - after nav */}
        <div className="pt-4">
          <ShipCounter collapsed={collapsed} />
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          USER CARD
      ═══════════════════════════════════════════════════════════════════ */}
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
              <div className="text-sm font-medium text-text-primary truncate">
                {me.name}
              </div>
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
