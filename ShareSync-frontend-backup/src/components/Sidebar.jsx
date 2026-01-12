import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FolderKanban,
  User as UserIcon,
  Settings,
  ChevronsLeft,
  Trophy,
  Zap,
  Flame,
  Play,
  Terminal,
  Activity
} from "lucide-react";

// Standardizing imports to be safe
import SidebarItem from "./nav/SidebarItem";
import Avatar from "./ui/Avatar";
import HeartbeatRing from "./realtime/HeartbeatRing";

import "./Sidebar.css";
import "./Sidebar.neon.css";

const LS_KEY = "ss.sidebar.collapsed";

/* ─────────────────────────────────────────────────────────────────────────
   LAYER 1: MOMENTUM PULSE
───────────────────────────────────────────────────────────────────────── */
function MomentumPulse({ todayProgress = 0.75, streak = 7, collapsed = false }) {
  const size = collapsed ? 44 : 64;
  const ringColor = streak >= 7 ? '#8b5cf6' : '#475569';

  return (
    <div className="relative flex items-center justify-center py-6">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <HeartbeatRing size={size + 24} strokeWidth={2} />
      </div>
      <div className="relative z-10">
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="46" fill="none" stroke={ringColor} strokeWidth="6"
            strokeDasharray={`${todayProgress * 289} 289`}
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-white font-black italic" fontSize="28">
            {Math.round(todayProgress * 100)}
          </text>
        </svg>
      </div>
      {!collapsed && (
        <div className="absolute -bottom-1 px-2 py-0.5 rounded-sm bg-slate-950 border border-white/10 flex items-center gap-1 shadow-lg">
          <Flame className="w-2.5 h-2.5 text-orange-500" />
          <span className="text-[9px] font-black text-white italic">{streak}D STREAK</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LAYER 2: DAILY SHIP
───────────────────────────────────────────────────────────────────────── */
function DailyShipCounter({ current = 2, target = 5, collapsed = false }) {
  const progress = Math.min(1, current / target);
  if (collapsed) return <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mx-2 mt-2"><div className="h-full bg-brand-500" style={{width: `${progress*100}%`}}/></div>;
  return (
    <div className="px-4 py-2 border-y border-white/[0.03] bg-white/[0.01]">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Ships</span>
        <span className="text-[10px] font-black text-white italic">{current}/{target}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
        {[...Array(target)].map((_, i) => (
          <div key={i} className={`h-full flex-1 ${i < current ? 'bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-white/10'}`} />
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
      className={["ss-sidebar", "neon-sidebar", collapsed ? "is-collapsed" : ""].join(" ")}
      style={{ backgroundColor: '#050505', height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <div className="sb-head flex items-center justify-between p-4">
        {!collapsed && (
           <div className="flex items-center gap-2">
             <div className="w-5 h-5 bg-brand-500 rounded flex items-center justify-center text-[10px] text-white font-black">S</div>
             <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">ShareSync</span>
           </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 transition-colors">
          <ChevronsLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <MomentumPulse collapsed={collapsed} />
      <DailyShipCounter collapsed={collapsed} />

      <nav className="sb-nav mt-8 px-3 space-y-1 flex-1">
        <SidebarItem to="/home" label="Dashboard" icon={Activity} collapsed={collapsed} />
        <SidebarItem to="/projects" label="Project Deck" icon={Terminal} count={3} collapsed={collapsed} />
        <SidebarItem to="/discover" label="The Arena" icon={Trophy} collapsed={collapsed} />
        <SidebarItem to="/profile" label="Identity" icon={UserIcon} collapsed={collapsed} />
        <SidebarItem to="/settings" label="System" icon={Settings} collapsed={collapsed} />
      </nav>

      <div className="p-4 border-t border-white/[0.03] bg-black/20">
        <div className="flex items-center gap-3">
          <Avatar name={me.name} size={32} status={me.status} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[11px] font-black text-white truncate uppercase tracking-wider">{me.name}</div>
              <div className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live System
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
