// src/components/Sidebar.jsx - MISSION CONTROL NAVIGATION (METAlab EDITION)
import React, { useEffect, useState } from "react";
import {
  User as UserIcon,
  Settings,
  ChevronsLeft,
  Trophy,
  Flame,
  Terminal,
  Activity,
  LayoutGrid,
  ShieldCheck
} from "lucide-react";

import SidebarItem from "./nav/SidebarItem";
import Avatar from "./ui/Avatar";
import HeartbeatRing from "./realtime/HeartbeatRing";

import "./Sidebar.css";
import "./Sidebar.neon.css";

const LS_KEY = "ss.sidebar.collapsed";

/* ─────────────────────────────────────────────────────────────────────────
   LAYER 1: MOMENTUM PULSE (Health & Streak Visualization)
───────────────────────────────────────────────────────────────────────── */
function MomentumPulse({ todayProgress = 0.75, streak = 7, collapsed = false }) {
  const size = collapsed ? 40 : 64;
  const ringColor = streak >= 7 ? 'var(--brand-violet)' : '#475569';

  return (
    <div className="relative flex items-center justify-center py-8">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <HeartbeatRing size={size + 32} strokeWidth={1.5} />
      </div>
      <div className="relative z-10 transition-transform duration-500 hover:scale-105">
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="46" fill="none" stroke="#8B5CF6" strokeWidth="6"
            strokeDasharray={`${todayProgress * 289} 289`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000 ease-in-out"
          />
          <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="fill-white font-black" fontSize="26" style={{ letterSpacing: '-0.05em' }}>
            {Math.round(todayProgress * 100)}
          </text>
        </svg>
      </div>
      {!collapsed && (
        <div className="absolute -bottom-1 px-2.5 py-1 rounded-full bg-[#1C1E24] border border-white/10 flex items-center gap-1.5 shadow-2xl z-20 scale-90">
          <Flame className="w-3 h-3 text-violet-500" />
          <span className="text-[10px] font-extrabold text-white tracking-tight">{streak}D STREAK</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LAYER 2: DAILY SHIP (Task Progression)
───────────────────────────────────────────────────────────────────────── */
function DailyShipCounter({ current = 2, target = 5, collapsed = false }) {
  const progress = Math.min(1, current / target);
  if (collapsed) return <div className="h-1 w-8 bg-white/5 rounded-full overflow-hidden mx-auto mt-4"><div className="h-full bg-violet-500" style={{width: `${progress*100}%`}}/></div>;
  return (
    <div className="px-6 py-4 mx-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
      <div className="flex justify-between items-baseline mb-2.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ships</span>
        <span className="text-[11px] font-black text-white">{current} / {target}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex gap-1">
        {[...Array(target)].map((_, i) => (
          <div key={i} className={`h-full flex-1 rounded-full transition-all duration-500 ${i < current ? 'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.4)]' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw === "1";
    } catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [collapsed]);

  const me = { name: "Manny", status: "online" };

  return (
    <aside
      id="app-sidebar"
      className={["glass-sidebar", collapsed ? "w-[80px]" : "w-[280px]", "transition-all duration-300 ease-in-out h-screen flex flex-col"].join(" ")}
    >
      <div className="sb-head flex items-center justify-between p-6">
        {!collapsed && (
           <div className="flex items-center gap-3 group cursor-default">
             <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center text-[12px] text-white font-black shadow-lg group-hover:scale-110 transition-transform">O</div>
             <span className="text-[13px] font-black text-white uppercase tracking-[0.25em] metalab-heading">OpenShare</span>
           </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
          <ChevronsLeft className={`w-4 h-4 transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <MomentumPulse collapsed={collapsed} />
        
        <nav className="sb-nav mt-4 px-4 space-y-2">
          <SidebarItem to="/home" label="Mission Control" icon={LayoutGrid} collapsed={collapsed} />
          <SidebarItem to="/projects" label="Project Deck" icon={Terminal} count={3} collapsed={collapsed} />
          <SidebarItem to="/discover" label="The Arena" icon={Trophy} collapsed={collapsed} />
          
          <div className="py-6 px-4">
            <div className="h-[1px] bg-white/[0.06] w-full" />
          </div>
          
          <SidebarItem to="/profile" label="Identity" icon={UserIcon} collapsed={collapsed} />
          <SidebarItem to="/settings" label="System" icon={Settings} collapsed={collapsed} />
        </nav>
        
        {!collapsed && <DailyShipCounter collapsed={collapsed} />}
      </div>

      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all cursor-pointer group">
          <Avatar name={me.name} size={32} status={me.status} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold text-white truncate tracking-tight">{me.name}</div>
              <div className="text-[10px] font-medium text-emerald-400/80 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure Node
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
