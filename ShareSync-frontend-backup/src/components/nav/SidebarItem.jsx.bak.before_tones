// src/components/nav/SidebarItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR NAV ITEM v5.0.1 - "The Gallery Walk" (Dark Mode Ready)
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { NavLink } from "react-router-dom";

export default function SidebarItem({ 
  to, 
  label, 
  icon: Icon, 
  count, 
  collapsed = false,
  onClick,
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200 group relative
        ${collapsed ? "justify-center" : ""}
        ${isActive 
          ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 font-medium border border-violet-200 dark:border-violet-500/20" 
          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f23] hover:text-slate-800 dark:hover:text-white border border-transparent"
        }
      `}
    >
      {({ isActive }) => (
        <>
          {/* Active indicator line */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full" />
          )}
          
          {/* Icon */}
          {Icon && (
            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
              isActive ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-white"
            }`} />
          )}
          
          {/* Label */}
          {!collapsed && (
            <span className="flex-1 truncate text-sm">{label}</span>
          )}
          
          {/* Count badge */}
          {count !== undefined && count > 0 && !collapsed && (
            <span className={`
              min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium 
              flex items-center justify-center
              ${isActive 
                ? "bg-violet-200 dark:bg-violet-500/30 text-violet-700 dark:text-violet-300" 
                : "bg-slate-200 dark:bg-[#27272a] text-slate-600 dark:text-zinc-300"
              }
            `}>
              {count > 99 ? "99+" : count}
            </span>
          )}
          
          {/* Collapsed count badge */}
          {count !== undefined && count > 0 && collapsed && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {count > 9 ? "9+" : count}
            </span>
          )}
          
          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="
              absolute left-full ml-2 px-2 py-1 
              bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs rounded-md
              opacity-0 group-hover:opacity-100 
              pointer-events-none transition-opacity duration-200
              whitespace-nowrap z-50 shadow-lg
            ">
              {label}
              {count !== undefined && count > 0 && (
                <span className="ml-1 text-violet-300 dark:text-violet-600">({count})</span>
              )}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}
