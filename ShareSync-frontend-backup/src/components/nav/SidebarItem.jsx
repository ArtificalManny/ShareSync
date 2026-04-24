// src/components/nav/SidebarItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR NAV ITEM v5.1 - Semantic Tone System (Acrobat-style icon treatment)
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { NavLink } from "react-router-dom";

const TONE_STYLES = {
  violet: {
    activeRow: "bg-violet-50 dark:bg-violet-500/10",
    activeBorder: "border-violet-200 dark:border-violet-500/20",
    activeText: "text-violet-700 dark:text-violet-300",
    activeIndicator: "bg-violet-500",
    activeIconShell:
      "bg-violet-100 border-violet-200 dark:bg-violet-500/15 dark:border-violet-500/25",
    idleIconShell:
      "bg-slate-50 border-slate-200 dark:bg-[#1a1a1f] dark:border-white/10 group-hover:bg-violet-50 group-hover:border-violet-200 dark:group-hover:bg-violet-500/10 dark:group-hover:border-violet-500/20",
    activeIcon: "text-violet-600 dark:text-violet-300",
    idleIcon:
      "text-slate-500 dark:text-zinc-500 group-hover:text-violet-600 dark:group-hover:text-violet-300",
    activeCount: "bg-violet-200 dark:bg-violet-500/25 text-violet-700 dark:text-violet-200",
    collapsedCount: "bg-violet-500 text-white",
    tooltipAccent: "text-violet-300 dark:text-violet-500",
  },

  sky: {
    activeRow: "bg-sky-50 dark:bg-sky-500/10",
    activeBorder: "border-sky-200 dark:border-sky-500/20",
    activeText: "text-sky-700 dark:text-sky-300",
    activeIndicator: "bg-sky-500",
    activeIconShell:
      "bg-sky-100 border-sky-200 dark:bg-sky-500/15 dark:border-sky-500/25",
    idleIconShell:
      "bg-slate-50 border-slate-200 dark:bg-[#1a1a1f] dark:border-white/10 group-hover:bg-sky-50 group-hover:border-sky-200 dark:group-hover:bg-sky-500/10 dark:group-hover:border-sky-500/20",
    activeIcon: "text-sky-600 dark:text-sky-300",
    idleIcon:
      "text-slate-500 dark:text-zinc-500 group-hover:text-sky-600 dark:group-hover:text-sky-300",
    activeCount: "bg-sky-200 dark:bg-sky-500/25 text-sky-700 dark:text-sky-200",
    collapsedCount: "bg-sky-500 text-white",
    tooltipAccent: "text-sky-300 dark:text-sky-500",
  },

  amber: {
    activeRow: "bg-amber-50 dark:bg-amber-500/10",
    activeBorder: "border-amber-200 dark:border-amber-500/20",
    activeText: "text-amber-700 dark:text-amber-300",
    activeIndicator: "bg-amber-500",
    activeIconShell:
      "bg-amber-100 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/25",
    idleIconShell:
      "bg-slate-50 border-slate-200 dark:bg-[#1a1a1f] dark:border-white/10 group-hover:bg-amber-50 group-hover:border-amber-200 dark:group-hover:bg-amber-500/10 dark:group-hover:border-amber-500/20",
    activeIcon: "text-amber-600 dark:text-amber-300",
    idleIcon:
      "text-slate-500 dark:text-zinc-500 group-hover:text-amber-600 dark:group-hover:text-amber-300",
    activeCount: "bg-amber-200 dark:bg-amber-500/25 text-amber-700 dark:text-amber-200",
    collapsedCount: "bg-amber-500 text-white",
    tooltipAccent: "text-amber-300 dark:text-amber-500",
  },

  emerald: {
    activeRow: "bg-emerald-50 dark:bg-emerald-500/10",
    activeBorder: "border-emerald-200 dark:border-emerald-500/20",
    activeText: "text-emerald-700 dark:text-emerald-300",
    activeIndicator: "bg-emerald-500",
    activeIconShell:
      "bg-emerald-100 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/25",
    idleIconShell:
      "bg-slate-50 border-slate-200 dark:bg-[#1a1a1f] dark:border-white/10 group-hover:bg-emerald-50 group-hover:border-emerald-200 dark:group-hover:bg-emerald-500/10 dark:group-hover:border-emerald-500/20",
    activeIcon: "text-emerald-600 dark:text-emerald-300",
    idleIcon:
      "text-slate-500 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-300",
    activeCount: "bg-emerald-200 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-200",
    collapsedCount: "bg-emerald-500 text-white",
    tooltipAccent: "text-emerald-300 dark:text-emerald-500",
  },

  slate: {
    activeRow: "bg-slate-100 dark:bg-white/[0.06]",
    activeBorder: "border-slate-300 dark:border-white/10",
    activeText: "text-slate-800 dark:text-zinc-100",
    activeIndicator: "bg-slate-500",
    activeIconShell:
      "bg-slate-200 border-slate-300 dark:bg-white/[0.08] dark:border-white/10",
    idleIconShell:
      "bg-slate-50 border-slate-200 dark:bg-[#1a1a1f] dark:border-white/10 group-hover:bg-slate-100 group-hover:border-slate-300 dark:group-hover:bg-white/[0.06] dark:group-hover:border-white/10",
    activeIcon: "text-slate-700 dark:text-zinc-200",
    idleIcon:
      "text-slate-500 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-200",
    activeCount: "bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-zinc-200",
    collapsedCount: "bg-slate-600 text-white",
    tooltipAccent: "text-slate-300 dark:text-zinc-400",
  },
};

function getToneStyles(tone) {
  return TONE_STYLES[tone] || TONE_STYLES.violet;
}

export default function SidebarItem({
  to,
  label,
  icon: Icon,
  count,
  collapsed = false,
  onClick,
  tone = "violet",
}) {
  const styles = getToneStyles(tone);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-2xl
        transition-all duration-200 group relative border
        ${collapsed ? "justify-center" : ""}
        ${
          isActive
            ? `${styles.activeRow} ${styles.activeText} font-semibold ${styles.activeBorder} shadow-sm`
            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f23] hover:text-slate-800 dark:hover:text-white border-transparent"
        }
      `}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full ${styles.activeIndicator}`}
            />
          )}

          {Icon && (
            <div
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
                isActive ? styles.activeIconShell : styles.idleIconShell
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                  isActive ? styles.activeIcon : styles.idleIcon
                }`}
              />
            </div>
          )}

          {!collapsed && (
            <span className="flex-1 truncate text-sm">{label}</span>
          )}

          {count !== undefined && count > 0 && !collapsed && (
            <span
              className={`
                min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium
                flex items-center justify-center
                ${
                  isActive
                    ? styles.activeCount
                    : "bg-slate-200 dark:bg-[#27272a] text-slate-600 dark:text-zinc-300"
                }
              `}
            >
              {count > 99 ? "99+" : count}
            </span>
          )}

          {count !== undefined && count > 0 && collapsed && (
            <span
              className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm ${styles.collapsedCount}`}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}

          {collapsed && (
            <div
              className="
                absolute left-full ml-2 px-2 py-1
                bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs rounded-md
                opacity-0 group-hover:opacity-100
                pointer-events-none transition-opacity duration-200
                whitespace-nowrap z-50 shadow-lg
              "
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className={`ml-1 ${styles.tooltipAccent}`}>({count})</span>
              )}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}
