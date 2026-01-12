import { toast } from "../ui/toast";
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronsLeft,
  Zap,
  Flame,
  Play,
  Trophy,
  Settings,
  Terminal,
  Activity
} from "lucide-react";
import SidebarItem from "./nav/SidebarItem";
import Avatar from "./ui/Avatar";
import HeartbeatRing from "./realtime/HeartbeatRing";

import "./Sidebar.css";
import "./Sidebar.neon.css";

import { track } from "../../utils/telemetry";
import useBrandTheme from "../../hooks/useBrandTheme";

const LS_KEY = "ss.sidebar.collapsed";

function MomentumPulse({ todayProgress = 0.75, streak = 7, collapsed = false }) {
  const size = collapsed ? 44 : 64;
  return (
    <div className="relative flex items-center justify-center py-6">
      <div className="absolute inset-0 flex items-center justify-center">
        <HeartbeatRing size={size + 24} strokeWidth={2} />
      </div>
      <div className="relative z-10 rounded-full shadow-brand-500/20 transition-all duration-700">
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="6"
            strokeDasharray={`${todayProgress * 289} 289`}
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000 ease-out"
          />
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-white font-black italic" fontSize="28">
            {Math.round(todayProgress * 100)}
          </text>
        </svg>
      </div>
      {!collapsed && (
        <div className="absolute -bottom-1 px-2 py-0.5 rounded-sm bg-slate-950 border border-white/10 flex items-center gap-1">
          <Flame className="w-2.5 h-2.5 text-orange-500" />
          <span className="text-[9px] font-black text-white italic tracking-tighter">{streak}D STREAK</span>
        </div>
      )}
    </div>
  );
}

function DailyShipCounter({ current = 2, target = 5, collapsed = false }) {
  const progress = Math.min(1, current / target);
  if (collapsed) return <div className="h-1 w-full bg-white/5 mx-2 mt-2"><div className="h-full bg-brand-500" style={{width: `${progress*100}%`}}/></div>;
  return (
    <div className="px-4 py-2 border-y border-white/[0.03] bg-white/[0.01]">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Deployment</span>
        <span className="text-[10px] font-black text-white italic">{current}/{target} SHIPS</span>
      </div>
      <div className="h-1 bg-white/5 flex gap-0.5">
        {[...Array(target)].map((_, i) => (
          <div key={i} className={`h-full flex-1 ${i < current ? 'bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
}

function FocusDock({ isActive, onStart, onStop, timeRemaining, collapsed }) {
  const min = Math.floor(timeRemaining / 60);
  const sec = timeRemaining % 60;
  if (collapsed) return <button onClick={isActive ? onStop : onStart} className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-orange-500 animate-pulse' : 'bg-brand-600'}`}><Zap size={18} className="text-white" /></button>;
  return (
    <div className={`mx-4 p-1 rounded-xl border transition-all duration-500 ${isActive ? 'bg-orange-500/10 border-orange-500/50' : 'bg-white/[0.02] border-white/5'}`}>
      {isActive ? (
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center font-mono">
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest animate-pulse">Deep Work</span>
            <span className="text-xl font-black text-white italic">{String(min).padStart(2,'0')}:{String(sec).padStart(2,'0')}</span>
          </div>
          <button onClick={onStop} className="w-full py-2 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded">Abort</button>
        </div>
      ) : (
        <button onClick={onStart} className="w-full group p-3 flex items-center gap-3 hover:bg-white/[0.03] rounded-lg">
          <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Play size={12} className="text-white fill-current" /></div>
          <div className="text-left"><div className="text-[10px] font-black text-white uppercase tracking-widest">Start Focus</div><div className="text-[9px] font-bold text-neutral-500">25:00 Sprint</div></div>
        </button>
      )}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(LS_KEY) === "1");
  const { containerAttrs } = useBrandTheme({ enabled: true });
  const [focusActive, setFocusActive] = useState(false);
  const [focusTime, setFocusTime] = useState(1500);

  const toggle = useCallback(() => setCollapsed(prev => !prev), []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    if (!focusActive) return;
    const interval = setInterval(() => {
      setFocusTime(t => {
        if (t <= 0) { setFocusActive(false); toast.success('Mission Complete'); return 1500; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [focusActive]);

  return (
    <aside {...containerAttrs} id="app-sidebar" className={`ss-sidebar neon-sidebar ${collapsed ? "is-collapsed" : ""} ${focusActive ? "focus-mode" : ""}`}>
      <div className="flex items-center justify-between p-4 mb-2">
        {!collapsed && <div className="flex items-center gap-2"><div className="w-5 h-5 bg-brand-600 rounded flex items-center justify-center font-black text-[10px] text-white">S</div><span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">ShareSync</span></div>}
        <button onClick={toggle} className="p-2 text-neutral-500 hover:text-white"><ChevronsLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} /></button>
      </div>

      <MomentumPulse collapsed={collapsed} />
      <DailyShipCounter collapsed={collapsed} />
      <div className="mt-6"><FocusDock isActive={focusActive} onStart={() => setFocusActive(true)} onStop={() => setFocusActive(false)} timeRemaining={focusTime} collapsed={collapsed} /></div>

      <nav className="mt-8 px-3 space-y-1">
        <SidebarItem to="/home" label="Dashboard" icon={Activity} collapsed={collapsed} />
        <SidebarItem to="/projects" label="Project Deck" icon={Terminal} count={3} collapsed={collapsed} />
        <SidebarItem to="/discover" label="The Arena" icon={Trophy} collapsed={collapsed} />
        <SidebarItem to="/settings" label="System" icon={Settings} collapsed={collapsed} />
      </nav>

      <div className="flex-1" />
      <div className="p-4 border-t border-white/[0.03] flex items-center gap-3">
        <Avatar name="Manny" size={32} />
        {!collapsed && <div className="min-w-0"><div className="text-[10px] font-black text-white truncate uppercase">Manny Rivas</div><div className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live System</div></div>}
      </div>
    </aside>
  );
}
