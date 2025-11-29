// src/components/layout/Sidebar.jsx - THE MOST ADDICTIVE SIDEBAR EVER BUILT
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FolderKanban,
  User as UserIcon,
  Settings,
  ChevronsLeft,
  Trophy,
  ShieldCheck,
  Zap,
  Flame,
  Users as UsersIcon,
  Play,
  TrendingUp,
  Heart,
  Target
} from "lucide-react";
import SidebarItem from "./nav/SidebarItem";
import Avatar from "./ui/Avatar";

import "./Sidebar.css";
import "./Sidebar.neon.css";

import { track } from "../utils/telemetry";
import { DISCOVERY_V1, ADMIN_CONSOLE_V1 } from "../config/flags";
import useBrandTheme from "../hooks/useBrandTheme";

const LS_KEY = "ss.sidebar.collapsed";

// LAYER 1: GIANT MOMENTUM PULSE
function MomentumPulse({ todayProgress = 0.65, streak = 7, isTopHundred = false, collapsed = false }) {
  const getStreakColor = (s) => {
    if (s >= 100) return { gradient: 'from-indigo-900 to-purple-900', ring: '#312E81', glow: 'shadow-indigo-500/50' };
    if (s >= 75) return { gradient: 'from-purple-600 to-fuchsia-600', ring: '#7C3AED', glow: 'shadow-purple-500/50' };
    if (s >= 50) return { gradient: 'from-blue-600 to-cyan-600', ring: '#3B82F6', glow: 'shadow-blue-500/50' };
    if (s >= 30) return { gradient: 'from-orange-500 to-red-500', ring: '#F97316', glow: 'shadow-orange-500/50' };
    return { gradient: 'from-slate-500 to-slate-600', ring: '#94A3B8', glow: 'shadow-slate-500/30' };
  };

  const colors = getStreakColor(streak);
  const size = collapsed ? 48 : 72;

  return (
    <div className="relative flex items-center justify-center py-4" style={{ height: size + 32 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className={`transform transition-all duration-500 ${colors.glow} shadow-2xl`}>
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(148, 163, 184, 0.1)"
          strokeWidth="8"
        />
        
        {/* Progress ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.ring}
          strokeWidth="8"
          strokeDasharray={`${todayProgress * 283} 283`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-all duration-1000"
        />

        {/* Pulse effect */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.ring}
          strokeWidth="2"
          opacity="0.3"
          className="animate-ping"
        />

        {/* Center */}
        <circle cx="50" cy="50" r="35" className={`fill-current bg-gradient-to-br ${colors.gradient}`} />
        
        {/* Top 100 lightning */}
        {isTopHundred && (
          <g transform="translate(50, 50)">
            <path
              d="M -8 -15 L 2 -5 L -4 -5 L 4 10 L -2 0 L 4 0 Z"
              fill="#FDE047"
              className="animate-pulse"
            />
          </g>
        )}

        {/* Percentage */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white font-bold"
          fontSize={collapsed ? "18" : "24"}
        >
          {Math.round(todayProgress * 100)}%
        </text>
      </svg>

      {/* Streak day count */}
      {!collapsed && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-800 border border-purple-500/30 flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-500" />
          <span className="text-xs font-bold text-white">{streak}d</span>
        </div>
      )}
    </div>
  );
}

// LAYER 2: DAILY SHIP COUNTER
function DailyShipCounter({ current = 2, target = 5, collapsed = false }) {
  const progress = Math.min(1, current / target);
  const isComplete = current >= target;

  if (collapsed) {
    return (
      <div className="px-2 py-1 text-center">
        <div className={`text-xs font-bold ${isComplete ? 'text-yellow-400' : 'text-white'}`}>
          {current}/{target}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-slate-800/50 rounded-xl border border-purple-500/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">Ships today</span>
        <span className={`text-sm font-bold ${isComplete ? 'text-yellow-400' : 'text-white'}`}>
          {current} / {target}
        </span>
      </div>
      
      <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            isComplete 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
              : 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {isComplete && (
        <div className="mt-2 text-xs text-yellow-400 font-semibold text-center animate-pulse">
          ✨ Goal crushed!
        </div>
      )}
    </div>
  );
}

// LAYER 3: ACTIVE PROJECT MINI-CARDS
function ActiveProjectCard({ project, onReorder, collapsed = false }) {
  const momentum = project.momentum || 0;
  const liveCount = project.liveUsers?.length || 0;

  if (collapsed) {
    return (
      <div 
        className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
        title={project.name}
      >
        <span className="text-lg">{project.emoji || '📁'}</span>
      </div>
    );
  }

  return (
    <div
      className="group relative px-3 py-2 rounded-xl bg-slate-800/50 border border-purple-500/20 hover:border-purple-500/40 hover:bg-slate-800/70 transition-all cursor-pointer"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('projectId', project.id)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{project.emoji || '📁'}</span>
        <span className="text-xs font-medium text-white truncate flex-1">{project.name}</span>
        {liveCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400">{liveCount}</span>
          </div>
        )}
      </div>
      
      <div className="h-1 rounded-full bg-slate-700/50 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${momentum}%` }}
        />
      </div>
    </div>
  );
}

// LAYER 4: FOCUS DOCK
function FocusDock({ isActive = false, onStart, onStop, timeRemaining = 1500, collapsed = false }) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  if (collapsed) {
    return (
      <button
        onClick={isActive ? onStop : onStart}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
          isActive 
            ? 'bg-orange-500 hover:bg-orange-600' 
            : 'bg-purple-600 hover:bg-purple-500'
        }`}
        title={isActive ? 'Stop Focus' : 'Start Focus'}
      >
        <Zap className="w-5 h-5 text-white" />
      </button>
    );
  }

  return (
    <div className="px-4 py-3 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 rounded-xl border border-purple-500/30">
      {isActive ? (
        <>
          <div className="text-center mb-3">
            <div className="text-3xl font-bold text-white font-mono">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-400 mt-1">Focus mode active</div>
          </div>
          <button
            onClick={onStop}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
          >
            Stop Focus
          </button>
        </>
      ) : (
        <button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
        >
          <Play className="w-5 h-5" />
          Start Focus Session
        </button>
      )}
    </div>
  );
}

// LAYER 5: MOMENTUM FEED (Celebrations only)
function MomentumFeed({ events = [], collapsed = false }) {
  if (collapsed) return null;

  return (
    <div className="px-4 py-3 bg-slate-800/30 rounded-xl border border-slate-700/50 max-h-40 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-fuchsia-500" />
        <span className="text-xs font-semibold text-white uppercase">Live Momentum</span>
      </div>
      
      {events.length === 0 ? (
        <div className="text-xs text-slate-500 text-center py-4">
          Celebrations appear here
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event, i) => (
            <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
              <span className="text-base flex-shrink-0">{event.emoji}</span>
              <span className="line-clamp-2">{event.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// LAYER 6: LEGACY COUNTER
function LegacyCounter({ count = 1247, collapsed = false }) {
  if (collapsed) {
    return (
      <div className="px-2 py-2 text-center">
        <div className="text-xs font-bold text-fuchsia-400">{count}</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-gradient-to-r from-purple-900/20 to-fuchsia-900/20 rounded-xl border border-purple-500/20">
      <div className="flex items-center gap-2 mb-1">
        <Heart className="w-4 h-4 text-fuchsia-500" />
        <span className="text-xs font-semibold text-white">Your Legacy</span>
      </div>
      <div className="text-2xl font-bold text-white">{count.toLocaleString()}</div>
      <div className="text-[10px] text-slate-400">outcomes shipped</div>
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? raw === "1" : false;
    } catch {
      return false;
    }
  });

  const { containerAttrs } = useBrandTheme({ enabled: true });

  // Focus mode state
  const [focusActive, setFocusActive] = useState(false);
  const [focusTime, setFocusTime] = useState(1500); // 25 minutes

  // Mock data (replace with real data)
  const [activeProjects, setActiveProjects] = useState([
    { id: 1, name: 'ShareSync v2', emoji: '🚀', momentum: 82, liveUsers: [{ id: 1 }, { id: 2 }] },
    { id: 2, name: 'Biology Project', emoji: '🧬', momentum: 65, liveUsers: [] },
    { id: 3, name: 'Portfolio Site', emoji: '💼', momentum: 45, liveUsers: [{ id: 3 }] },
  ]);

  const [momentumEvents, setMomentumEvents] = useState([
    { emoji: '🎉', message: 'Alex hit a 100-day streak!' },
    { emoji: '🚀', message: 'Jordan just shipped v3...' },
    { emoji: '🔥', message: 'Sarah completed 15 tasks today' },
  ]);

  const tooltipWhenCollapsed = collapsed;

  const toggle = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      track("sidebar_toggled", { collapsed: next });
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
    } catch {}

    document.body.classList.add("has-sidebar");
    document.body.classList.toggle("sidebar-collapsed", collapsed);

    // Darken UI when in focus mode
    if (focusActive) {
      document.body.classList.add("focus-mode-active");
    } else {
      document.body.classList.remove("focus-mode-active");
    }

    try {
      window.dispatchEvent(new CustomEvent("sidebar:toggle", { detail: { collapsed } }));
    } catch {}
  }, [collapsed, focusActive]);

  // Focus timer countdown
  useEffect(() => {
    if (!focusActive) return;
    
    const interval = setInterval(() => {
      setFocusTime(prev => {
        if (prev <= 0) {
          setFocusActive(false);
          alert('Focus session complete! 🎉');
          return 1500;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [focusActive]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "[") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const counts = useMemo(
    () => ({
      projects: activeProjects.length,
      home: undefined,
      settings: undefined,
      profile: undefined,
    }),
    [activeProjects]
  );

  const me = { name: "You", status: "online", avatarUrl: undefined, avatarEmoji: undefined };

  return (
    <aside
      {...containerAttrs}
      id="app-sidebar"
      className={["ss-sidebar", "neon-sidebar", collapsed ? "is-collapsed" : "", focusActive ? "focus-mode" : ""].join(" ")}
      aria-label="Primary"
      aria-expanded={collapsed ? "false" : "true"}
    >
      <span className="sb-rail" aria-hidden="true" />
      <span className="sb-ambient" aria-hidden="true" />

      <div className="sb-head">
        <div className="sb-brand" aria-hidden={collapsed ? "true" : "false"}>
          <span className="sb-logo">◆</span>
          {!collapsed && <span className="sb-title">ShareSync</span>}
        </div>
        <button
          type="button"
          className="sb-toggle focus-ring"
          aria-pressed={collapsed ? "true" : "false"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title="Toggle sidebar ["
          onClick={toggle}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>

      {/* LAYER 1: MOMENTUM PULSE */}
      <MomentumPulse 
        todayProgress={0.75} 
        streak={7} 
        isTopHundred={false}
        collapsed={collapsed}
      />

      {/* LAYER 2: DAILY SHIP COUNTER */}
      <div className={collapsed ? "px-2" : "px-4"}>
        <DailyShipCounter current={2} target={5} collapsed={collapsed} />
      </div>

      {/* LAYER 3: ACTIVE PROJECTS */}
      {!focusActive && (
        <div className={`mt-4 ${collapsed ? "px-2" : "px-4"} space-y-2`}>
          {!collapsed && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Active Projects</span>
              <button 
                onClick={() => navigate('/projects')}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                + New
              </button>
            </div>
          )}
          {activeProjects.map(project => (
            <ActiveProjectCard
              key={project.id}
              project={project}
              collapsed={collapsed}
              onReorder={() => {}}
            />
          ))}
        </div>
      )}

      {/* LAYER 4: FOCUS DOCK */}
      <div className={`mt-4 ${collapsed ? "px-2" : "px-4"}`}>
        <FocusDock
          isActive={focusActive}
          onStart={() => setFocusActive(true)}
          onStop={() => {
            setFocusActive(false);
            setFocusTime(1500);
          }}
          timeRemaining={focusTime}
          collapsed={collapsed}
        />
      </div>

      {/* LAYER 5: MOMENTUM FEED (only when not in focus) */}
      {!focusActive && (
        <div className="mt-4">
          <MomentumFeed events={momentumEvents} collapsed={collapsed} />
        </div>
      )}

      {/* Navigation */}
      <nav className="sb-nav mt-4" aria-label="Primary">
        <SidebarItem
          to="/home"
          label="Home"
          icon={Home}
          badge="AI"
          count={counts.home}
          collapsed={tooltipWhenCollapsed}
        />

        <SidebarItem
          to="/projects"
          label="Projects"
          icon={FolderKanban}
          count={counts.projects}
          collapsed={tooltipWhenCollapsed}
        />

        <SidebarItem
          to="/discover"
          label="Discover"
          icon={Trophy}
          collapsed={tooltipWhenCollapsed}
        />

        <SidebarItem
          to="/profile"
          label="Profile"
          icon={UserIcon}
          collapsed={tooltipWhenCollapsed}
        />

        <SidebarItem
          to="/settings"
          label="Settings"
          icon={Settings}
          collapsed={tooltipWhenCollapsed}
        />

        {ADMIN_CONSOLE_V1 && (
          <SidebarItem
            to="/admin/console"
            label="Admin"
            icon={ShieldCheck}
            collapsed={tooltipWhenCollapsed}
          />
        )}
      </nav>

      <div className="sb-spacer" />

      {/* LAYER 6: LEGACY COUNTER */}
      <div className={collapsed ? "px-2 mb-4" : "px-4 mb-4"}>
        <LegacyCounter count={1247} collapsed={collapsed} />
      </div>

      {/* User */}
      <div className="sb-user">
        <Avatar
          src={me.avatarUrl}
          name={me.name}
          size={36}
          status={me.status}
          ringColor="emerald"
          className="sb-user-avatar"
        />
        {!collapsed && (
          <div className="sb-user-text">
            <div className="sb-user-name" title={me.name}>
              {me.name}
            </div>
            <div className="sb-user-sub">Online</div>
          </div>
        )}
      </div>

      {/* Focus mode darkening overlay style */}
      <style jsx>{`
        .focus-mode {
          background: rgba(0, 0, 0, 0.8) !important;
        }
        :global(body.focus-mode-active) {
          background: rgba(0, 0, 0, 0.95);
        }
        :global(body.focus-mode-active main) {
          filter: brightness(0.3);
          pointer-events: none;
        }
        :global(body.focus-mode-active #app-sidebar) {
          filter: brightness(1);
          pointer-events: all;
        }
      `}</style>
    </aside>
  );
}