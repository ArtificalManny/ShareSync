// src/components/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC SIDEBAR v6.6 - Cross-browser auto-hide with surgical clarity pass
// ═══════════════════════════════════════════════════════════════════════════════
//
// FIX in v6.6:
// - Keeps the current visual/sidebar structure intact
// - Keeps auto-hide behavior exactly as-is
// - Keeps local storage behavior exactly as-is
// - Tightens product-owned sidebar labels for clarity:
//   Mission Control -> Home
//   Project Deck -> Projects
//   The Arena -> Discover
//   Identity -> Profile
//   System -> Settings
// - Fixes Fire Mode label rendering
//
// NO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
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

const EDGE_TRIGGER_WIDTH = 18;

function safeParseJSON(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
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
  const candidates = [
    "ss.user",
    "sharesync.user",
    "user",
    "auth.user",
    "currentUser",
  ];

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

  return (
    u?.avatarUrl ||
    u?.profilePicture ||
    u?.avatar ||
    u?.photoUrl ||
    u?.profile?.avatarUrl ||
    null
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENT 1: PERSONAL TELEMETRY (The Momentum Core)
───────────────────────────────────────────────────────────────────────── */
function PersonalTelemetryHUD({ user, glowLevel, isFireMode, collapsed }) {
  const streak = 7;

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
    ? "ring-orange-500 animate-pulse"
    : glowLevel >= 3
      ? "ring-violet-500"
      : "ring-transparent";

  if (collapsed) {
    return (
      <div className="sidebar-telemetry-collapsed flex justify-center mt-2 mb-4 relative" title={statusText}>
        <div className="relative">
          <UserAvatar size={32} name={user.name} user={user} avatarUrl={resolveAvatarUrl(user)} />
          <div
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#111113] ${
              isFireMode ? "bg-orange-500 animate-pulse" : "bg-emerald-500"
            }`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-telemetry-card px-3 py-3 mx-3 mb-2 bg-slate-50 dark:bg-[#1f1f23] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <UserAvatar size={32} name={user.name} user={user} avatarUrl={resolveAvatarUrl(user)} />
            <div
              className={`absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#1f1f23] ${ringStyle} transition-all duration-300`}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[90px]">
              {user.name}
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
              {statusText}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20 shadow-sm">
            {streak}-Day 🔥
          </span>
        </div>
      </div>

      <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
        <div
          className={`h-full ${sparklineColor} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.max(10, glowLevel * 20)}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENT 2: TEAM TELEPRESENCE (Communal Contagion)
───────────────────────────────────────────────────────────────────────── */
function TeamTelepresenceHUD({ collapsed }) {
  const team = [
    {
      id: 1,
      initial: "A",
      color: "bg-blue-500",
      ring: "ring-violet-500",
      shadow: "shadow-[0_0_8px_rgba(139,92,246,0.6)]",
    },
    {
      id: 2,
      initial: "S",
      color: "bg-emerald-500",
      ring: "ring-emerald-500",
      shadow: "",
    },
    {
      id: 3,
      initial: "J",
      color: "bg-orange-400",
      ring: "ring-amber-500",
      shadow: "shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    },
  ];

  if (collapsed) {
    return (
      <div className="flex justify-center mb-6" title="3 in flow · 2 shipping">
        <div className="flex -space-x-2">
          {team.slice(0, 2).map((t) => (
            <div
              key={t.id}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#111113] ${t.color}`}
            >
              {t.initial}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-team-hud px-4 py-2 mb-3">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 shrink-0">
          {team.map((t) => (
            <div
              key={t.id}
              className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#111113] ${t.color}`}
            >
              {t.initial}
              <div
                className={`absolute inset-0 rounded-full border border-transparent ${t.ring} ${t.shadow} scale-110`}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 truncate">
            3 in deep flow · 2 shipping
          </span>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate">
            The factory is humming
          </span>
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
          sidebar-catalyst-button w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
          border border-slate-200 dark:border-white/10 shadow-sm
          bg-white dark:bg-[#111113] text-slate-700 dark:text-zinc-300
          hover:border-violet-300 dark:hover:border-violet-500/30
          hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300
          transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-violet-500
        `}
        title="Focus Next Mission"
      >
        <Zap className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
        {!collapsed && (
          <span className="text-xs font-bold tracking-wide">
            Focus Next Mission
          </span>
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN SIDEBAR COMPONENT
───────────────────────────────────────────────────────────────────────── */
export default function Sidebar({ user }) {
  const { shouldCollapseSidebar, isInFlow } = useFlowState();
  const { glowLevel, isFireMode } = useMomentumContext();
  const sidebarRef = useRef(null);
  const autoHideOpenRef = useRef(false);

  // Force ON for now so browser-stored stale values cannot block testing.
  const autoHideEnabled = true;

  const [userCollapsed] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [autoHideOpen, setAutoHideOpen] = useState(false);

  const setAutoHideOpenSafe = useCallback((next) => {
    if (autoHideOpenRef.current === next) return;
    autoHideOpenRef.current = next;
    setAutoHideOpen(next);
  }, []);

  const [focusBlockCollapse, setFocusBlockCollapse] = useState(false);

  useEffect(() => {
    const checkFocusBlock = () => {
      try {
        setFocusBlockCollapse(localStorage.getItem("ss.focusBlock.active") === "1");
      } catch {}
    };

    checkFocusBlock();
    window.addEventListener("focus-block-change", checkFocusBlock);

    return () => window.removeEventListener("focus-block-change", checkFocusBlock);
  }, []);

  const collapsed = autoHideEnabled
    ? !autoHideOpen
    : shouldCollapseSidebar || userCollapsed || focusBlockCollapse;

  useEffect(() => {
    try {
      localStorage.setItem(LS_AUTOHIDE_KEY, "1");
      localStorage.setItem(LS_KEY, userCollapsed ? "1" : "0");
    } catch {}

    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [userCollapsed, collapsed]);

  useEffect(() => {
    if (!autoHideEnabled) return;

    const updateFromCoords = (x, y) => {
      const sidebarEl = sidebarRef.current;

      if (!sidebarEl) {
        setAutoHideOpenSafe(x <= EDGE_TRIGGER_WIDTH);
        return;
      }

      const rect = sidebarEl.getBoundingClientRect();

      const pointerInsideSidebar =
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom;

      const pointerNearLeftEdge = x <= EDGE_TRIGGER_WIDTH;

      setAutoHideOpenSafe(pointerInsideSidebar || pointerNearLeftEdge);
    };

    const handlePointerMove = (event) => {
      updateFromCoords(event.clientX, event.clientY);
    };

    const handleMouseMove = (event) => {
      updateFromCoords(event.clientX, event.clientY);
    };

    const handleWindowBlur = () => {
      setAutoHideOpenSafe(false);
    };

    const handleDocumentLeave = () => {
      setAutoHideOpenSafe(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAutoHideOpenSafe(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("mouseleave", handleDocumentLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("mouseleave", handleDocumentLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoHideEnabled, setAutoHideOpenSafe]);

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
      {autoHideEnabled && <div className="w-[72px] h-screen shrink-0" aria-hidden="true" />}

      <style>{`
        /* OpenShare Sidebar visual strike v2
           Safe pass: styling only. No routing, no state, no auto-hide logic changes.
        */

        #app-sidebar {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          transform: translateX(0) !important;
          translate: 0 0 !important;
          left: 0 !important;
          z-index: 80 !important;

          background:
            radial-gradient(circle at 18% 10%, rgba(139, 92, 246, 0.16), transparent 32%),
            radial-gradient(circle at 86% 26%, rgba(34, 211, 238, 0.12), transparent 34%),
            radial-gradient(circle at 24% 88%, rgba(16, 185, 129, 0.10), transparent 34%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94)) !important;

          border-right: 1px solid rgba(203, 213, 225, 0.92) !important;
          box-shadow:
            22px 0 60px rgba(15, 23, 42, 0.08),
            inset -1px 0 0 rgba(255, 255, 255, 0.9) !important;
        }

        #app-sidebar > * {
          visibility: visible !important;
          opacity: 1 !important;
        }

        #app-sidebar .sidebar-brand-zone {
          position: relative;
        }

        #app-sidebar .sidebar-brand-zone::after {
          content: "";
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 8px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(139, 92, 246, 0.28),
            rgba(34, 211, 238, 0.22),
            transparent
          );
        }

        #app-sidebar .openshare-sidebar-wordmark {
          color: #0f172a !important;
          font-weight: 950 !important;
          letter-spacing: -0.02em !important;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.75);
        }

        #app-sidebar .openshare-sidebar-nav {
          padding-top: 0.65rem !important;
        }

        #app-sidebar .openshare-sidebar-nav a,
        #app-sidebar .openshare-sidebar-nav button {
          position: relative !important;
          min-height: 52px;
          border-radius: 22px !important;
          color: #334155 !important;
          font-weight: 850 !important;
          opacity: 1 !important;
          border: 1px solid transparent !important;
          text-decoration-color: transparent !important;
          transition:
            transform 180ms ease,
            background 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            color 180ms ease !important;
        }

        #app-sidebar .openshare-sidebar-nav a span,
        #app-sidebar .openshare-sidebar-nav button span {
          color: inherit !important;
          font-weight: 900 !important;
          opacity: 1 !important;
        }

        #app-sidebar .openshare-sidebar-nav svg {
          color: #475569 !important;
          stroke-width: 2.45 !important;
          opacity: 1 !important;
          transition:
            transform 180ms ease,
            color 180ms ease,
            filter 180ms ease !important;
        }

        #app-sidebar .openshare-sidebar-nav a:hover,
        #app-sidebar .openshare-sidebar-nav button:hover {
          color: #0f172a !important;
          transform: translateX(2px);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(245, 243, 255, 0.88)) !important;
          border-color: rgba(196, 181, 253, 0.62) !important;
          box-shadow:
            0 16px 34px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;
        }

        #app-sidebar .openshare-sidebar-nav a:hover svg,
        #app-sidebar .openshare-sidebar-nav button:hover svg {
          color: #7c3aed !important;
          transform: scale(1.08);
          filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.24));
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"],
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"],
        #app-sidebar .openshare-sidebar-nav .active {
          color: #0f172a !important;
          font-weight: 950 !important;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.99), rgba(245, 243, 255, 0.96)) !important;
          border: 1px solid rgba(196, 181, 253, 0.95) !important;
          box-shadow:
            0 18px 42px rgba(139, 92, 246, 0.17),
            0 0 0 4px rgba(139, 92, 246, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"]::before,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"]::before,
        #app-sidebar .openshare-sidebar-nav .active::before {
          content: "";
          position: absolute;
          left: -9px;
          top: 50%;
          width: 4px;
          height: 34px;
          border-radius: 999px;
          transform: translateY(-50%);
          background: linear-gradient(180deg, #8b5cf6 0%, #22d3ee Available);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"] span,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"] span,
        #app-sidebar .openshare-sidebar-nav .active span {
          color: #0f172a !important;
          font-weight: 950 !important;
        }

        #app-sidebar .openshare-sidebar-nav a[aria-current="page"] svg,
        #app-sidebar .openshare-sidebar-nav a[aria-current="true"] svg,
        #app-sidebar .openshare-sidebar-nav .active svg {
          color: #7c3aed !important;
          stroke-width: 2.8 !important;
          filter: drop-shadow(0 0 13px rgba(124, 58, 237, 0.28));
        }

        #app-sidebar .sidebar-telemetry-card {
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.86)) !important;
          border-color: rgba(226, 232, 240, 0.9) !important;
          border-radius: 20px !important;
          box-shadow:
            0 14px 34px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
        }

        #app-sidebar .sidebar-team-hud {
          margin-left: 0.75rem;
          margin-right: 0.75rem;
          border-radius: 18px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.76), rgba(240, 253, 250, 0.42));
          border: 1px solid rgba(203, 213, 225, 0.52);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        #app-sidebar .sidebar-catalyst-button {
          min-height: 46px;
          border-radius: 18px !important;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.99), rgba(245, 243, 255, 0.94)) !important;
          border-color: rgba(196, 181, 253, 0.95) !important;
          color: #6d28d9 !important;
          box-shadow:
            0 16px 34px rgba(139, 92, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;
        }

        #app-sidebar .sidebar-catalyst-button span,
        #app-sidebar .sidebar-catalyst-button svg {
          color: #6d28d9 !important;
        }

        #app-sidebar .sidebar-catalyst-button:hover {
          transform: translateY(-1px);
          background:
            linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 Available) !important;
          border-color: rgba(221, 214, 254, 0.95) !important;
          color: #ffffff !important;
          box-shadow:
            0 20px 44px rgba(124, 58, 237, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
        }

        #app-sidebar .sidebar-catalyst-button:hover span,
        #app-sidebar .sidebar-catalyst-button:hover svg {
          color: #ffffff !important;
        }


        /* FIX: Sidebar wordmark follows manual app dark mode */
        html.dark #app-sidebar .openshare-sidebar-wordmark,
        html[data-theme="dark"] #app-sidebar .openshare-sidebar-wordmark,
        [data-theme="dark"] #app-sidebar .openshare-sidebar-wordmark {
          color: #f8fafc !important;
          -webkit-text-fill-color: #f8fafc !important;
          opacity: 1 !important;
          font-size: 15px !important;
          line-height: 1rem !important;
          font-weight: 950 !important;
          letter-spacing: -0.015em !important;
          text-shadow:
            0 0 1px rgba(255, 255, 255, 0.95),
            0 0 16px rgba(139, 92, 246, 0.58),
            0 2px 12px rgba(0, 0, 0, 0.65) !important;
        }

        html.dark #app-sidebar .sidebar-brand-zone,
        html[data-theme="dark"] #app-sidebar .sidebar-brand-zone,
        [data-theme="dark"] #app-sidebar .sidebar-brand-zone {
          background:
            radial-gradient(circle at 42% 35%, rgba(139, 92, 246, 0.16), transparent 44%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent) !important;
        }

        @media (prefers-color-scheme: dark) {
          #app-sidebar {
            background:
              radial-gradient(circle at 18% 10%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 86% 26%, rgba(34, 211, 238, 0.10), transparent 36%),
              radial-gradient(circle at 24% 88%, rgba(16, 185, 129, 0.08), transparent 36%),
              linear-gradient(180deg, rgba(8, 12, 22, 0.99), rgba(10, 13, 24, 0.97)) !important;
            border-right-color: rgba(255, 255, 255, 0.08) !important;
            box-shadow: 22px 0 60px rgba(0, 0, 0, 0.32) !important;
          }

          #app-sidebar .openshare-sidebar-wordmark {
            color: #f8fafc !important;
            text-shadow: 0 0 18px rgba(139, 92, 246, 0.26);
          }

          #app-sidebar .openshare-sidebar-nav a,
          #app-sidebar .openshare-sidebar-nav button,
          #app-sidebar .openshare-sidebar-nav a span,
          #app-sidebar .openshare-sidebar-nav button span {
            color: #dbeafe !important;
          }

          #app-sidebar .openshare-sidebar-nav svg {
            color: #cbd5e1 !important;
          }

          #app-sidebar .openshare-sidebar-nav a:hover,
          #app-sidebar .openshare-sidebar-nav button:hover {
            color: #ffffff !important;
            background:
              linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(76, 29, 149, 0.26)) !important;
            border-color: rgba(167, 139, 250, 0.28) !important;
          }

          #app-sidebar .openshare-sidebar-nav a[aria-current="page"],
          #app-sidebar .openshare-sidebar-nav a[aria-current="true"],
          #app-sidebar .openshare-sidebar-nav .active {
            color: #ffffff !important;
            background:
              linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(76, 29, 149, 0.38)) !important;
            border-color: rgba(167, 139, 250, 0.42) !important;
            box-shadow:
              0 18px 44px rgba(0, 0, 0, 0.38),
              0 0 0 4px rgba(139, 92, 246, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          #app-sidebar .openshare-sidebar-nav a[aria-current="page"] span,
          #app-sidebar .openshare-sidebar-nav a[aria-current="true"] span,
          #app-sidebar .openshare-sidebar-nav .active span {
            color: #ffffff !important;
          }

          #app-sidebar .sidebar-telemetry-card,
          #app-sidebar .sidebar-team-hud {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.52)) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }
        }
      `}</style>

      <aside
        ref={sidebarRef}
        id="app-sidebar"
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
        <div className="sidebar-brand-zone flex items-center justify-center p-4 pt-6 pb-6">
          <div className="flex items-center gap-2.5">
            <OpenShareLogo className="w-10 h-10 drop-shadow-[0_0_18px_rgba(168,85,247,0.55)] dark:drop-shadow-[0_0_22px_rgba(45,212,191,0.34)]"
              className={`w-7 h-7 shrink-0 transition-all duration-500 ${
                isFireMode ? "drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] scale-110" : ""
              }`}
              monochrome={false} animated />
            {!collapsed && (
              <span className="openshare-sidebar-wordmark text-[15px] font-black text-slate-950 dark:text-white tracking-wide whitespace-nowrap animate-in fade-in duration-200">
                OpenShare
              </span>
            )}
          </div>
        </div>

        <nav className="openshare-sidebar-nav flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden pt-2">
          <SidebarItem to="/home" label="Home" icon={LayoutGrid} tone="violet" collapsed={collapsed} />
          <SidebarItem to="/projects" label="Projects" icon={Terminal} tone="sky" collapsed={collapsed} />
          <SidebarItem to="/discover" label="Discover" icon={Trophy} tone="amber" collapsed={collapsed} />

          <div className="py-4">
            <div className="h-px bg-slate-200/80" />
          </div>

          <SidebarItem to="/profile" label="Profile" icon={UserIcon} tone="emerald" collapsed={collapsed} />
          <SidebarItem to="/settings" label="Settings" icon={Settings} tone="slate" collapsed={collapsed} />
        </nav>

        <div className="mt-auto flex flex-col">
          <PersonalTelemetryHUD
            user={me}
            glowLevel={glowLevel}
            isFireMode={isFireMode}
            collapsed={collapsed}
          />
          <TeamTelepresenceHUD collapsed={collapsed} />
          <CatalystButton collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}
