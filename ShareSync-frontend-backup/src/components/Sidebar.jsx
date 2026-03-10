// src/components/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SIDEBAR v5.2 - "The Gallery Walk" (Unified Permanent Rail)
// Phase C: Momentum Engine + Phase E: Social Proof
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Settings,
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
import UserAvatar from "./ui/UserAvatar";
import { useFlowState } from "../contexts/FlowStateContext";
import { useMomentumContext } from "../contexts/MomentumContext";
import { useEntrance } from "./onboarding/AppEntrance";
import useAnimatedNumber from "../hooks/useAnimatedNumber";

import { MiniLeaderboard } from "./social/Leaderboard";
import OnlineIndicator from "./social/OnlineIndicator";
import { MiniLeagueIndicator } from "./social/MomentumLeague";

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

function getAvatarOverride() {
  try { return localStorage.getItem("ss.avatarOverride") || null; } catch { return null; }
}

function resolveAvatarUrl(u) {
  const override = getAvatarOverride();
  if (override) return override;
  return u?.avatarUrl || u?.profilePicture || u?.avatar || u?.photoUrl || u?.profile?.avatarUrl || u?.profile?.photoUrl || null;
}

/* ─────────────────────────────────────────────────────────────────────────
   MOMENTUM LEVEL INDICATOR - Light Theme
───────────────────────────────────────────────────────────────────────── */
function MomentumLevelIndicator({ collapsed = false }) {
  const { glowLevel, isFireMode } = useMomentumContext();

  const levelConfig = {
    0: { icon: null, color: "text-slate-400", bg: "bg-slate-50", label: "Idle" },
    1: { icon: Zap, color: "text-violet-500", bg: "bg-violet-50", label: "Warming" },
    2: { icon: Zap, color: "text-violet-600", bg: "bg-violet-100", label: "Building" },
    3: { icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-100", label: "Flowing" },
    4: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50", label: "Peak" },
    5: { icon: Flame, color: "text-orange-500", bg: "bg-orange-50", label: "On Fire" },
  };

  const config = levelConfig[glowLevel] || levelConfig[0];
  const Icon = config.icon;

  if (collapsed) {
    if (!Icon) return null;
    return (
      <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${config.bg} ${isFireMode ? "animate-pulse" : ""}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
    );
  }

  return (
    <div className={`mx-3 px-3 py-2 rounded-xl transition-all duration-500 ${config.bg} border border-slate-200 ${isFireMode ? "border-orange-300" : ""}`}>
      <div className="flex items-center gap-2">
        {Icon && (
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${glowLevel >= 3 ? "bg-white/80" : "bg-white"} ${isFireMode ? "animate-bounce" : ""}`}>
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold ${config.color} transition-colors duration-300`}>{config.label}</div>
          <div className="text-[10px] text-slate-500 truncate font-medium transition-colors duration-300">Level {glowLevel}</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PROGRESS RING - Light Theme (ALL animations preserved)
───────────────────────────────────────────────────────────────────────── */
function ProgressRing({ progress: actualProgress = 0.75, level = 1, streak = 7, collapsed = false }) {
  const { glowLevel, isFireMode } = useMomentumContext();
  const entrance = useEntrance();
  const { progress: entranceProgress, isAnimatingRing, isComplete } = entrance || { progress: 100, isAnimatingRing: false, isComplete: true };
  const displayProgress = isComplete ? actualProgress : (entranceProgress / 100) * actualProgress;
  const size = collapsed ? 40 : 56;
  const strokeWidth = collapsed ? 3 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - displayProgress * circumference;
  const showStreak = streak >= 3;
  const isImpressiveStreak = streak >= 7;

  const prevProgressRef = useRef(actualProgress);
  const prevLevelRef = useRef(level);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState("normal");

  const displayValue = isComplete ? Math.round(actualProgress * 100) : Math.round(displayProgress * 100);
  const { value: animatedPercent, isAnimating: isCountAnimating } = useAnimatedNumber(displayValue, { duration: 500, enabled: !collapsed && isComplete });

  useEffect(() => {
    if (!isComplete) return;
    const prevProgress = prevProgressRef.current;
    const currentProgress = actualProgress;
    const THRESHOLDS = [0.25, 0.5, 0.75, 1.0];
    const crossedThreshold = THRESHOLDS.some((t) => prevProgress < t && currentProgress >= t);

    if (currentProgress > prevProgress) {
      setIsPulsing(true);
      setPulseIntensity(crossedThreshold ? "strong" : "normal");
      const timer = setTimeout(() => { setIsPulsing(false); setPulseIntensity("normal"); }, 600);
      prevProgressRef.current = currentProgress;
      return () => clearTimeout(timer);
    }
    prevProgressRef.current = currentProgress;
  }, [actualProgress, isComplete]);

  useEffect(() => {
    if (level > prevLevelRef.current) {
      setIsLevelingUp(true);
      const timer = setTimeout(() => setIsLevelingUp(false), 1200);
      prevLevelRef.current = level;
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = level;
  }, [level]);

  const glowStyle = useMemo(() => {
    if (isAnimatingRing) return { filter: `drop-shadow(0 0 12px rgb(139 92 246 / 0.4))` };
    if (isFireMode) return { filter: `drop-shadow(0 0 16px rgb(139 92 246 / 0.5)) drop-shadow(0 0 30px rgb(249 115 22 / 0.3))` };
    if (glowLevel === 0) return {};
    return { filter: `drop-shadow(0 0 ${6 + glowLevel * 3}px rgb(139 92 246 / ${glowLevel * 0.12}))` };
  }, [glowLevel, isAnimatingRing, isFireMode]);

  const breathingClass = useMemo(() => {
    if (isFireMode) return "animate-ring-fire";
    if (glowLevel >= 4) return "animate-ring-breathe-strong";
    if (glowLevel >= 3) return "animate-ring-breathe";
    return "";
  }, [glowLevel, isFireMode]);

  return (
    <div className="flex flex-col items-center py-6">
      <div className={`relative ${isPulsing ? "animate-bounce-subtle" : ""} ${isLevelingUp ? "scale-110" : "scale-100"} ${isAnimatingRing ? "progress-ring-entrance" : ""} transition-transform duration-300`} data-momentum={glowLevel}>
        {isPulsing && <div className={`absolute inset-0 rounded-full ${pulseIntensity === "strong" ? "ring-pulse-strong" : "ring-pulse"}`} style={{ width: size, height: size }} />}
        {isLevelingUp && <div className="absolute inset-0 rounded-full level-up-flash" style={{ width: size, height: size, background: "radial-gradient(circle, rgb(167 139 250) 0%, transparent 70%)" }} />}
        {isFireMode && <div className="absolute inset-0 rounded-full animate-fire-ring" style={{ width: size + 8, height: size + 8, top: -4, left: -4, border: "2px solid rgb(249 115 22 / 0.4)" }} />}

        <svg width={size} height={size} className={`xp-ring-progress transform -rotate-90 ${isPulsing ? "scale-105" : "scale-100"} ${breathingClass} transition-transform duration-200`} style={glowStyle}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-slate-200 transition-colors duration-300" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={isLevelingUp ? "#10B981" : isFireMode ? "#F97316" : "#8B5CF6"} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={isPulsing ? "stroke-violet-400" : ""} style={{ transition: isAnimatingRing ? "stroke-dashoffset 50ms linear" : "stroke-dashoffset 700ms ease-out, stroke 300ms ease" }} />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          {isLevelingUp ? (
            <div className="text-center level-up-number">
              <div className="text-[8px] text-violet-500 uppercase tracking-wider font-bold">Level Up!</div>
              <span className="text-lg font-bold text-violet-600">{level}</span>
            </div>
          ) : isFireMode ? (
            <span className="text-lg animate-pulse">🔥</span>
          ) : (
            <span className={`font-bold text-slate-800 tabular-nums ${collapsed ? "text-xs" : "text-lg"} ${isPulsing || isCountAnimating ? "scale-110 text-violet-600" : "scale-100"} ${isAnimatingRing ? "text-violet-500" : ""} transition-all duration-200`}>
              {isComplete ? animatedPercent : Math.round(displayProgress * 100)}
            </span>
          )}
        </div>
      </div>

      {!collapsed && showStreak && (
        <div className={`mt-3 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all duration-300 ${isImpressiveStreak ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-slate-100 text-slate-500 border border-transparent"}`}>
          <Flame className={`w-3 h-3 ${isImpressiveStreak ? "text-amber-500" : "text-slate-400"}`} />
          <span>{streak}d</span>
        </div>
      )}

      <style>{`
        @keyframes ring-pulse { 0% { box-shadow: 0 0 0 0 rgb(139 92 246 / 0.5); opacity: 0.6; } 100% { box-shadow: 0 0 0 12px transparent; opacity: 0; } }
        .ring-pulse { animation: ring-pulse 0.6s ease-out forwards; }
        @keyframes ring-pulse-strong { 0% { box-shadow: 0 0 0 0 rgb(167 139 250 / 0.6); opacity: 0.7; } 50% { box-shadow: 0 0 16px 4px rgb(139 92 246 / 0.4); opacity: 0.5; } 100% { box-shadow: 0 0 0 16px transparent; opacity: 0; } }
        .ring-pulse-strong { animation: ring-pulse-strong 0.8s ease-out forwards; }
        @keyframes level-up-flash { 0% { transform: scale(0.8); opacity: 0; } 30% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
        .level-up-flash { animation: level-up-flash 0.6s ease-out forwards; }
        @keyframes level-up-number { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .level-up-number { animation: level-up-number 0.5s ease-out forwards; }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        .animate-bounce-subtle { animation: bounce-subtle 0.3s ease-out; }
        .progress-ring-entrance { animation: ring-entrance 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes ring-entrance { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes ring-breathe { 0%, 100% { filter: drop-shadow(0 0 10px rgb(139 92 246 / 0.25)); } 50% { filter: drop-shadow(0 0 14px rgb(139 92 246 / 0.35)); } }
        .animate-ring-breathe { animation: ring-breathe 3s ease-in-out infinite; }
        @keyframes ring-breathe-strong { 0%, 100% { filter: drop-shadow(0 0 12px rgb(139 92 246 / 0.35)); } 50% { filter: drop-shadow(0 0 18px rgb(167 139 250 / 0.45)); } }
        .animate-ring-breathe-strong { animation: ring-breathe-strong 2.5s ease-in-out infinite; }
        @keyframes ring-fire { 0%, 100% { filter: drop-shadow(0 0 14px rgb(139 92 246 / 0.4)); } 50% { filter: drop-shadow(0 0 20px rgb(167 139 250 / 0.5)) drop-shadow(0 0 30px rgb(249 115 22 / 0.25)); } }
        .animate-ring-fire { animation: ring-fire 2s ease-in-out infinite; }
        @keyframes fire-ring { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
        .animate-fire-ring { animation: fire-ring 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SHIP COUNTER - Light Theme
───────────────────────────────────────────────────────────────────────── */
function ShipCounter({ current = 2, target = 5, collapsed = false }) {
  const prevCurrentRef = useRef(current);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justFilledIndex, setJustFilledIndex] = useState(-1);
  const { value: displayCurrent } = useAnimatedNumber(current, { duration: 400 });

  useEffect(() => {
    if (current > prevCurrentRef.current) {
      setIsAnimating(true);
      setJustFilledIndex(current - 1);
      const timer = setTimeout(() => { setIsAnimating(false); setJustFilledIndex(-1); }, 500);
      prevCurrentRef.current = current;
      return () => clearTimeout(timer);
    }
    prevCurrentRef.current = current;
  }, [current]);

  if (collapsed) {
    const progress = Math.min(1, current / target);
    return (
      <div className="mx-auto mt-4 w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>
    );
  }

  return (
    <div className={`mx-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 transition-all duration-200 ${isAnimating ? "ring-2 ring-violet-200" : ""}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ships today</span>
        <span className={`text-xs font-bold tabular-nums ${isAnimating ? "text-violet-600 scale-110" : "text-slate-700 scale-100"} transition-all duration-200`}>
          {displayCurrent}/{target}
        </span>
      </div>
      <div className="flex gap-1">
        {[...Array(target)].map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < current ? "bg-violet-500" : "bg-slate-200"} ${i === justFilledIndex ? "scale-y-150 bg-violet-400" : "scale-y-100"}`} style={{ transitionDelay: i === justFilledIndex ? "0ms" : `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COLLAPSIBLE SECTION - Light Theme
───────────────────────────────────────────────────────────────────────── */
function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true, collapsed: sidebarCollapsed = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (sidebarCollapsed) return null;

  return (
    <div className="mx-3">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
      </button>
      {isOpen && <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">{children}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   HOVER TRIGGER ZONE (Auto-hide functionality preserved)
───────────────────────────────────────────────────────────────────────── */
function HoverTriggerZone({ onHover, onLeave }) {
  return <div className="fixed left-0 top-0 w-4 h-screen z-[60] cursor-pointer" onMouseEnter={onHover} onMouseLeave={onLeave} style={{ background: "transparent" }} />;
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN SIDEBAR COMPONENT - Light Theme "Gallery Wall"
───────────────────────────────────────────────────────────────────────── */
export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const { shouldCollapseSidebar, isInFlow } = useFlowState();
  const { glowLevel, isFireMode } = useMomentumContext();
  const sidebarRef = useRef(null);

  // ⭐ The magic sauce for Scenario B: Force skinny rail on mobile screens
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [autoHideEnabled] = useState(() => {
    try { return localStorage.getItem(LS_AUTOHIDE_KEY) === "1"; } catch { return false; }
  });

  const [userCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
  });

  const [isHovering, setIsHovering] = useState(false);
  const [isMouseInSidebar, setIsMouseInSidebar] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Priority 3.3: Focus Block auto-collapse
  const [focusBlockCollapse, setFocusBlockCollapse] = useState(false);
  useEffect(() => {
    const checkFocusBlock = () => {
      try { setFocusBlockCollapse(localStorage.getItem('ss.focusBlock.active') === '1'); } catch {}
    };
    checkFocusBlock();
    window.addEventListener('focus-block-change', checkFocusBlock);
    return () => window.removeEventListener('focus-block-change', checkFocusBlock);
  }, []);

  // ⭐ Override desktop collapse logic if we are on a mobile device!
  const collapsed = isMobile || (autoHideEnabled ? !isHovering && !isMouseInSidebar : shouldCollapseSidebar || userCollapsed || focusBlockCollapse);

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
      status: "online",
      avatarUrl: resolveAvatarUrl(effectiveUser),
    };
  }, [effectiveUser]);

  return (
    <>
      {autoHideEnabled && collapsed && <HoverTriggerZone onHover={handleTriggerHover} onLeave={handleTriggerLeave} />}
      {autoHideEnabled && <div className="w-[72px] h-screen shrink-0" aria-hidden="true" />}

      {/* ⭐ Fixed to top left with z-[100] so it NEVER gets pushed around by other layout shifts */}
      <aside
        ref={sidebarRef}
        id="app-sidebar"
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        className={`
          sidebar-item h-screen flex flex-col fixed left-0 top-0 z-[100]
          bg-white border-r border-slate-200
          transition-all duration-300 ease-out
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${isInFlow ? "opacity-90" : "opacity-100"}
          ${autoHideEnabled ? "shadow-xl" : ""}
          translate-x-0
        `}
        data-momentum={glowLevel}
        data-autohide={autoHideEnabled}
      >
        <div className="flex items-center justify-center p-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className={`sidebar-logo w-7 h-7 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center transition-all duration-500 shadow-md shadow-violet-200 ${isFireMode ? "shadow-orange-200" : ""}`}>
                <span className="text-xs font-bold text-white">S</span>
              </div>
              <span className="text-sm font-bold text-slate-800">OpenShare</span>
            </div>
          )}
        </div>

        <ProgressRing collapsed={collapsed} />

        <div className="mb-4">
          <MomentumLevelIndicator collapsed={collapsed} />
        </div>

        {!collapsed && (
          <div className="mx-3 mb-4">
            <MiniLeagueIndicator currentXP={1250} onClick={() => navigate("/leaderboard")} />
          </div>
        )}

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          <SidebarItem to="/home" label="Mission Control" icon={LayoutGrid} collapsed={collapsed} />
          <SidebarItem to="/projects" label="Project Deck" icon={Terminal} count={3} collapsed={collapsed} />
          <SidebarItem to="/discover" label="The Arena" icon={Trophy} collapsed={collapsed} />
          
          <div className="py-4"><div className="h-px bg-slate-200" /></div>
          
          <SidebarItem to="/profile" label="Identity" icon={UserIcon} collapsed={collapsed} />
          <SidebarItem to="/settings" label="System" icon={Settings} collapsed={collapsed} />
          
          <div className="pt-4"><ShipCounter collapsed={collapsed} /></div>
          
          {!collapsed && (
            <>
              <div className="pt-4"><div className="h-px bg-slate-200" /></div>
              <CollapsibleSection title="Team" icon={Users} defaultOpen={true} collapsed={collapsed}>
                <OnlineIndicator variant="compact" showAvatars={true} showCount={true} maxAvatars={3} expandable={true} defaultExpanded={false} />
              </CollapsibleSection>
              <div className="mt-4">
                <CollapsibleSection title="Leaderboard" icon={Trophy} defaultOpen={false} collapsed={collapsed}>
                  <MiniLeaderboard maxVisible={5} onViewAll={() => navigate("/leaderboard")} />
                </CollapsibleSection>
              </div>
            </>
          )}
        </nav>

        <div className="p-3">
          <div onClick={() => navigate("/profile")} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer bg-slate-50 border border-slate-200 hover:bg-white hover:border-violet-200 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${collapsed ? "justify-center" : ""}`}>
            <div className="relative">
              <UserAvatar size={32} name={me.name} avatarUrl={me.avatarUrl} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-800 truncate transition-colors">{me.name}</div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 transition-colors">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Online</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop for auto-hide */}
      {autoHideEnabled && !collapsed && <div className="fixed inset-0 bg-slate-900/20 z-40 transition-opacity duration-300" onClick={() => setIsHovering(false)} />}
    </>
  );
}
