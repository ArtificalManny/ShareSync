// src/components/layout/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v4.0 - "The Gallery Walk" + PHASE 3: Ambient Gamification
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
import { useAuth } from "../../context/AuthContext";
import { resolveDisplayName } from "../../utils/resolveDisplayName";

const LS_KEY = "ss.sidebar.collapsed";

function ProgressRing({ progress = 0.75, streak = 7, collapsed = false }) {
  const size = collapsed ? 40 : 56;
  const strokeWidth = collapsed ? 3 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress * circumference);
  
  const showStreak = streak >= 3;
  const isImpressiveStreak = streak >= 7;

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90 drop-shadow-sm"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-[#27272a] transition-colors duration-300"
          />
          {/* Progress (Deep Purple Identity) */}
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
            className="text-brand transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)"
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`
            font-bold text-slate-800 dark:text-white transition-colors duration-200
            ${collapsed ? 'text-[11px]' : 'text-[15px] tracking-tight'}
          `}>
            {Math.round(progress * 100)}
          </span>
        </div>
      </div>

      {!collapsed && showStreak && (
        <div className={`
          mt-4 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase
          flex items-center gap-1.5 shadow-sm
          transition-all duration-300 hover:-translate-y-0.5
          ${isImpressiveStreak 
            ? 'bg-warning-subtle text-warning border border-warning-200 shadow-[0_0_10px_rgba(217,119,6,0.1)]' 
            : 'bg-surface-secondary text-text-secondary border border-border-default'
          }
        `}>
          <Flame className={`w-3 h-3 ${isImpressiveStreak ? 'text-warning animate-pulse' : 'text-text-tertiary'}`} />
          <span>{streak}d</span>
        </div>
      )}
    </div>
  );
}

function ShipCounter({ current = 2, target = 5, collapsed = false }) {
  if (collapsed) {
    const progress = Math.min(1, current / target);
    return (
      <div className="mx-auto mt-6 w-8 h-1.5 bg-slate-100 dark:bg-[#1f1f23] rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-brand rounded-full transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)" 
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    );
  }

  return (
    <div className="mx-4 px-4 py-3.5 rounded-xl bg-surface-secondary border border-border-default hover:border-brand-200 transition-colors duration-300">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
          Ships today
        </span>
        <span className="text-[13px] font-black text-text-primary tabular-nums">
          {current}/{target}
        </span>
      </div>
      
      <div className="flex gap-1.5">
        {[...Array(target)].map((_, i) => (
          <div 
            key={i} 
            className={`
              h-1.5 flex-1 rounded-full transition-all duration-500
              ${i < current ? 'bg-brand shadow-[0_0_5px_rgba(124,58,237,0.3)]' : 'bg-slate-200 dark:bg-[#27272a] shadow-inner'}
            `}
          />
        ))}
      </div>
    </div>
  );
}

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

  let authUser = null;
  try { authUser = useAuth()?.user; } catch (e) { }
  const resolvedName = resolveDisplayName(authUser);
  const me = {
    name: resolvedName.fullName,
    initials: resolvedName.initials,
    status: authUser ? "online" : "offline",
    avatarUrl: authUser?.avatarUrl || authUser?.profilePicture || authUser?.avatar || null,
  };

  return (
    <aside
      id="app-sidebar"
      className={`
        h-screen hidden md:flex flex-col
        bg-surface-primary border-r border-border-default
        transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) z-50
        ${collapsed ? 'w-[80px]' : 'w-[280px]'}
      `}
    >
      <div className="flex items-center justify-between p-6">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl flex items-center justify-center shadow-md shadow-brand-500/20">
              <span className="text-[13px] font-black text-white tracking-wider">S</span>
            </div>
            <span className="text-[15px] font-bold text-text-primary tracking-tight">
              OpenShare
            </span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className={`
            p-2 rounded-lg text-text-tertiary
            hover:bg-surface-secondary hover:text-text-primary
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
            transition-all duration-200
            ${collapsed ? 'mx-auto bg-surface-secondary' : ''}
          `}
        >
          <ChevronsLeft className={`
            w-4 h-4 transition-transform duration-300
            ${collapsed ? 'rotate-180' : ''}
          `} />
        </button>
      </div>

      <ProgressRing collapsed={collapsed} />

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto overflow-x-hidden mt-2">
        <SidebarItem to="/home" label="Home" icon={LayoutGrid} collapsed={collapsed} />
        <SidebarItem to="/projects" label="Project Deck" icon={Terminal} count={3} collapsed={collapsed} />
        <SidebarItem to="/discover" label="Discover" icon={Trophy} collapsed={collapsed} />
        
        <div className="py-5">
          <div className="h-px w-full bg-border-default opacity-50" />
        </div>
        
        <SidebarItem to="/profile" label="Identity" icon={UserIcon} collapsed={collapsed} />
        <SidebarItem to="/settings" label="System" icon={Settings} collapsed={collapsed} />
        
        <div className="pt-6 pb-4">
          <ShipCounter collapsed={collapsed} />
        </div>
      </nav>

      {/* Profile Footer (No Dead Space) */}
      <div className="p-4 mt-auto border-t border-border-default/50 bg-surface-primary/50">
        <div 
          onClick={() => navigate('/profile')}
          className={`
            flex items-center gap-3 p-3 rounded-xl cursor-pointer
            bg-surface-secondary border border-transparent
            hover:bg-white hover:border-brand-200 hover:shadow-md hover:-translate-y-0.5
            transition-all duration-300
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <Avatar name={me.name} size={36} status={me.status} src={me.avatarUrl} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-text-primary truncate">
                {me.name}
              </div>
              <div className="text-[10px] font-bold text-success flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                <span>{me.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
