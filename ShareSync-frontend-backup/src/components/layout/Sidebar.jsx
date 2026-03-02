// src/components/layout/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Quiet Confidence" + PHASE 3: Ambient Gamification
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
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-[#27272a] transition-colors duration-300"
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
            className="text-violet-500 transition-all duration-700 ease-out"
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`
            font-semibold text-slate-900 dark:text-white transition-colors duration-200
            ${collapsed ? 'text-xs' : 'text-lg'}
          `}>
            {Math.round(progress * 100)}
          </span>
        </div>
      </div>

      {!collapsed && showStreak && (
        <div className={`
          mt-3 px-2 py-1 rounded-full text-[10px] font-medium
          flex items-center gap-1
          transition-all duration-300
          ${isImpressiveStreak 
            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' 
            : 'bg-slate-100 dark:bg-[#1f1f23] text-slate-500 dark:text-zinc-400 border border-transparent'
          }
        `}>
          <Flame className={`w-3 h-3 ${isImpressiveStreak ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-500'}`} />
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
      <div className="mx-auto mt-4 w-8 h-1 bg-slate-200 dark:bg-[#1f1f23] rounded-full overflow-hidden">
        <div 
          className="h-full bg-violet-500 rounded-full transition-all duration-500" 
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    );
  }

  return (
    <div className="mx-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1f1f23] border border-slate-200 dark:border-[#27272a] transition-colors duration-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider transition-colors duration-200">
          Ships today
        </span>
        <span className="text-xs font-semibold text-slate-900 dark:text-white transition-colors duration-200">
          {current}/{target}
        </span>
      </div>
      
      <div className="flex gap-1">
        {[...Array(target)].map((_, i) => (
          <div 
            key={i} 
            className={`
              h-1.5 flex-1 rounded-full transition-colors duration-300
              ${i < current ? 'bg-violet-500' : 'bg-slate-200 dark:bg-[#27272a]'}
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

  // ✅ Priority 6.2: Use real authenticated user data (never "Demo User")
  let authUser = null;
  try { authUser = useAuth()?.user; } catch (e) { /* safe if outside provider */ }
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
        bg-white dark:bg-[#111113] border-r border-slate-200 dark:border-[#1f1f23]
        transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide transition-colors duration-200">
              ShareSync
            </span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className={`
            p-2 rounded-lg text-slate-500 dark:text-zinc-500
            hover:bg-slate-100 dark:hover:bg-[#1f1f23] hover:text-slate-800 dark:hover:text-white
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
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

      <ProgressRing collapsed={collapsed} />

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        <SidebarItem to="/home" label="Mission Control" icon={LayoutGrid} collapsed={collapsed} />
        <SidebarItem to="/projects" label="Project Deck" icon={Terminal} count={3} collapsed={collapsed} />
        <SidebarItem to="/discover" label="The Arena" icon={Trophy} collapsed={collapsed} />
        
        <div className="py-4">
          <div className="h-px bg-slate-100 dark:bg-[#1f1f23] transition-colors duration-200" />
        </div>
        
        <SidebarItem to="/profile" label="Identity" icon={UserIcon} collapsed={collapsed} />
        <SidebarItem to="/settings" label="System" icon={Settings} collapsed={collapsed} />
        
        <div className="pt-4">
          <ShipCounter collapsed={collapsed} />
        </div>
      </nav>

      <div className="p-3">
        <div 
          onClick={() => navigate('/profile')}
          className={`
            flex items-center gap-3 p-2.5 rounded-xl cursor-pointer
            bg-slate-50 dark:bg-[#1f1f23] border border-slate-200 dark:border-[#27272a]
            hover:bg-white dark:hover:bg-[#27272a] hover:border-violet-300 dark:hover:border-violet-500/30
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <Avatar name={me.name} size={32} status={me.status} src={me.avatarUrl} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900 dark:text-white truncate transition-colors duration-200">
                {me.name}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 transition-colors duration-200">
                <ShieldCheck className="w-3 h-3" />
                <span className="capitalize">{me.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
