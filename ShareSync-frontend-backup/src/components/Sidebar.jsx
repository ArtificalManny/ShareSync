// src/components/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SIDEBAR v6.1 - "Telemetry & Telepresence HUD" + Custom Logo
// ═══════════════════════════════════════════════════════════════════════════════
//
// CHANGES in v6.1:
// - Implemented custom OpenShareLogo component in the header.
// - Cleaned out all deprecated v5.1 components (ProgressRing, ShipCounter, etc.)
// - Retained the v6.0 Momentum Core and Team Telepresence HUD.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Settings,
  Trophy,
  Terminal,
  LayoutGrid,
  Zap,
} from "lucide-react";

import SidebarItem from "./nav/SidebarItem";
import UserAvatar from "./ui/UserAvatar";
import OpenShareLogo from "./ui/OpenShareLogo";
import { useFlowState } from "../contexts/FlowStateContext";
import { useMomentumContext } from "../contexts/MomentumContext";

const LS_KEY = "ss.sidebar.collapsed";
const LS_AUTOHIDE_KEY = "ss.sidebar.autohide";

function safeParseJSON(v) {
  try { return JSON.parse(v); } catch { return null; }
}

function buildDisplayName(u) {
  const first = (u?.firstName || "").trim();
  const last = (u?.lastName || "").trim();
  const full = [first, last].filter(Boolean).join(" ").trim();
  if (full) return full;
  const username = (u?.username || "").trim();
  if (username) return username;
  const email = (u?.email || "").trim();
  if (email) return email;
  return "User";
}

function getUserFromLocalStorage() {
  const candidates = ["ss.user", "sharesync.user", "user", "auth.user", "currentUser"];
  for (const k of candidates) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = safeParseJSON(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  return null;
}

function resolveAvatarUrl(u) {
  try {
    const override = localStorage.getItem("ss.avatarOverride");
    if (override) return override;
  } catch {}
  return u?.avatarUrl || u?.profilePicture || u?.avatar || u?.photoUrl || u?.profile?.avatarUrl || null;
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENT 1: PERSONAL TELEMETRY (The Momentum Core)
───────────────────────────────────────────────────────────────────────── */
function PersonalTelemetryHUD({ user, glowLevel, isFireMode, collapsed }) {
  // In a real implementation, pull streak from your real-time backend hook.
  const streak = 7; 
  
  // Color Theory: Slate for rest, Violet for building, Orange/Rose for flow.
  const sparklineColor = isFireMode 
    ? "bg-gradient-to-r from-orange-400 to-rose-500" 
    : glowLevel > 0 
      ? "bg-gradient-to-r from-violet-400 to-violet-600" 
      : "bg-slate-300 dark:bg-zinc-600";
      
  const statusText = isFireMode 
    ? "Fire Mode 🔥" 
    : glowLevel >= 3 
      ? "Deep Flow" 
      : glowLevel > 0 
        ? "Gaining Traction" 
        : "Warming up...";

  const ringStyle = isFireMode 
    ? 'ring-orange-500 animate-pulse' 
    : glowLevel >= 3 
      ? 'ring-violet-500' 
      : 'ring-transparent';

  if (collapsed) {
    return (
      <div className="flex justify-center mt-2 mb-4 relative" title={statusText}>
        <div className="relative">
          <UserAvatar size={32} name={user.name} avatarUrl={user.avatarUrl} />
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#111113] ${isFireMode ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 mx-3 mb-2 bg-slate-50 dark:bg-[#1f1f23] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <UserAvatar size={32} name={user.name} avatarUrl={user.avatarUrl} />
            <div className={`absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#1f1f23] ${ringStyle} transition-all duration-300`} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[90px]">{user.name}</div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">{statusText}</div>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20 shadow-sm">
            {streak}-Day 🔥
          </span>
        </div>
      </div>
      
      {/* Energy Sparkline */}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
        <div className={`h-full ${sparklineColor} transition-all duration-1000 ease-out`} style={{ width: `${Math.max(10, glowLevel * 20)}%` }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENT 2: TEAM TELEPRESENCE (Communal Contagion)
───────────────────────────────────────────────────────────────────────── */
function TeamTelepresenceHUD({ collapsed }) {
  // Hardcoded visual mock representing network activity (to be wired to backend later)
  const team = [
    { id: 1, initial: "A", color: "bg-blue-500", ring: "ring-violet-500", shadow: "shadow-[0_0_8px_rgba(139,92,246,0.6)]" }, // Deep flow
    { id: 2, initial: "S", color: "bg-emerald-500", ring: "ring-emerald-500", shadow: "" }, // Online
    { id: 3, initial: "J", color: "bg-orange-400", ring: "ring-amber-500", shadow: "shadow-[0_0_8px_rgba(245,158,11,0.6)]" } // Shipping
  ];

  if (collapsed) {
    return (
      <div className="flex justify-center mb-6" title="3 in flow · 2 shipping">
        <div className="flex -space-x-2">
          {team.slice(0, 2).map(t => (
            <div key={t.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#111113] ${t.color}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 mb-3">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 shrink-0">
          {team.map(t => (
            <div key={t.id} className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#111113] ${t.color}`}>
              {t.initial}
              <div className={`absolute inset-0 rounded-full border border-transparent ${t.ring} ${t.shadow} scale-110`} />
            </div>
          ))}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 truncate">3 in deep flow · 2 shipping</span>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate">The factory is humming</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENT 3: CATALYST BUTTON (Time to Action)
───────────────────────────────────────────────────────────────────────── */
function CatalystButton({ collapsed }) {
  return (
    <div className="px-3 pb-5">
      <button 
        className={`
          w-full flex items-center justify-center gap-2 py-2.5 rounded-xl 
          border border-slate-200 dark:border-white/10 shadow-sm
          bg-white dark:bg-[#111113] text-slate-700 dark:text-zinc-300
          hover:border-violet-300 dark:hover:border-violet-500/30 
          hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300 
          transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-violet-500
        `}
        title="Focus Next Mission"
      >
        <Zap className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
        {!collapsed && <span className="text-xs font-bold tracking-wide">Focus Next Mission</span>}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   HOVER TRIGGER ZONE
───────────────────────────────────────────────────────────────────────── */
function HoverTriggerZone({ onHover, onLeave }) {
  return <div className="fixed left-0 top-0 w-4 h-screen z-[60] cursor-pointer" onMouseEnter={onHover} onMouseLeave={onLeave} style={{ background: "transparent" }} />;
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN SIDEBAR COMPONENT
───────────────────────────────────────────────────────────────────────── */
export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const { shouldCollapseSidebar, isInFlow } = useFlowState();
  const { glowLevel, isFireMode } = useMomentumContext();
  const sidebarRef = useRef(null);

  const [autoHideEnabled] = useState(() => {
    try { return localStorage.getItem(LS_AUTOHIDE_KEY) === "1"; } catch { return false; }
  });

  const [userCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
  });

  const [isHovering, setIsHovering] = useState(false);
  const [isMouseInSidebar, setIsMouseInSidebar] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const [focusBlockCollapse, setFocusBlockCollapse] = useState(false);
  useEffect(() => {
    const checkFocusBlock = () => {
      try { setFocusBlockCollapse(localStorage.getItem('ss.focusBlock.active') === '1'); } catch {}
    };
    checkFocusBlock();
    window.addEventListener('focus-block-change', checkFocusBlock);
    return () => window.removeEventListener('focus-block-change', checkFocusBlock);
  }, []);

  const collapsed = autoHideEnabled ? !isHovering && !isMouseInSidebar : shouldCollapseSidebar || userCollapsed || focusBlockCollapse;

  useEffect(() => {
    localStorage.setItem(LS_KEY, userCollapsed ? "1" : "0");
    localStorage.setItem(LS_AUTOHIDE_KEY, autoHideEnabled ? "1" : "0");
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [userCollapsed, autoHideEnabled, collapsed]);

  const handleTriggerHover = () => {
    if (!autoHideEnabled) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovering(true);
  };

  const handleTriggerLeave = () => {
    if (!autoHideEnabled) return;
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isMouseInSidebar) setIsHovering(false);
    }, 100);
  };

  const handleSidebarEnter = () => {
    if (!autoHideEnabled) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsMouseInSidebar(true);
    setIsHovering(true);
  };

  const handleSidebarLeave = () => {
    if (!autoHideEnabled) return;
    setIsMouseInSidebar(false);
    hoverTimeoutRef.current = setTimeout(() => { setIsHovering(false); }, 300);
  };

  useEffect(() => {
    return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); };
  }, []);

  const localUser = useMemo(() => getUserFromLocalStorage(), []);
  const effectiveUser = user || localUser;

  const me = useMemo(() => {
    return {
      name: buildDisplayName(effectiveUser),
      avatarUrl: resolveAvatarUrl(effectiveUser),
    };
  }, [effectiveUser]);

  return (
    <>
      {autoHideEnabled && collapsed && <HoverTriggerZone onHover={handleTriggerHover} onLeave={handleTriggerLeave} />}
      {autoHideEnabled && <div className="w-[72px] h-screen shrink-0" aria-hidden="true" />}

      <aside
        ref={sidebarRef}
        id="app-sidebar"
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        className={`
          sidebar-item h-screen flex flex-col 
          bg-white border-r border-slate-200
          transition-all duration-300 ease-out
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${isInFlow ? "opacity-90" : "opacity-100"}
          ${autoHideEnabled ? "fixed left-0 top-0 z-50 shadow-xl" : ""}
          translate-x-0
        `}
        data-momentum={glowLevel}
        data-autohide={autoHideEnabled}
      >
        {/* Header - Integrating OpenShareLogo */}
        <div className="flex items-center justify-center p-4 pt-6 pb-6">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <OpenShareLogo 
                className={`w-7 h-7 transition-all duration-500 ${isFireMode ? "drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] scale-110" : ""}`} 
                monochrome={false} 
              />
              <span className="text-sm font-bold text-slate-800 tracking-wide">OpenShare</span>
            </div>
          )}
        </div>

        {/* Navigation - Structural and Muted */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden pt-2">
          <SidebarItem to="/home" label="Mission Control" icon={LayoutGrid} collapsed={collapsed} />
          <SidebarItem to="/projects" label="Project Deck" icon={Terminal} count={3} collapsed={collapsed} />
          <SidebarItem to="/discover" label="The Arena" icon={Trophy} collapsed={collapsed} />
          
          <div className="py-4"><div className="h-px bg-slate-100" /></div>
          
          <SidebarItem to="/profile" label="Identity" icon={UserIcon} collapsed={collapsed} />
          <SidebarItem to="/settings" label="System" icon={Settings} collapsed={collapsed} />
        </nav>

        {/* ═══════════════════════════════════════════════════════════════════
            THE NEW TELEMETRY HUD (Replaces all bottom stats/collapsibles)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-auto flex flex-col">
          <PersonalTelemetryHUD user={me} glowLevel={glowLevel} isFireMode={isFireMode} collapsed={collapsed} />
          <TeamTelepresenceHUD collapsed={collapsed} />
          <CatalystButton collapsed={collapsed} />
        </div>
      </aside>

      {/* Backdrop for auto-hide */}
      {autoHideEnabled && !collapsed && <div className="fixed inset-0 bg-slate-900/20 z-40 transition-opacity duration-300" onClick={() => setIsHovering(false)} />}
    </>
  );
}
