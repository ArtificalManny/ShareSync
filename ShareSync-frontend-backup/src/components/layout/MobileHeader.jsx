// src/components/layout/MobileHeader.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.5: Compact mobile header replacing desktop sidebar header
// Hamburger → slide-out drawer. Logo, page title, notification bell. 48px height.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';

// Map paths to page titles
function getPageTitle(pathname) {
  if (pathname === '/home') return 'Mission Control';
  if (pathname === '/projects') return 'Projects';
  if (pathname.startsWith('/projects/')) return 'Project';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/profile' || pathname === '/me') return 'Profile';
  if (pathname === '/discover') return 'Arena';
  if (pathname === '/messages') return 'Messages';
  if (pathname === '/search') return 'Search';
  if (pathname === '/analytics') return 'Analytics';
  if (pathname === '/community') return 'Community';
  return 'ShareSync';
}

export default function MobileHeader({
  onMenuPress,
  onSearchPress,
  onNotificationPress,
  unreadCount = 0,
  className = '',
}) {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header
      className={`
        sticky top-0 z-[70]
        flex items-center justify-between
        h-12 px-4
        bg-white/95 dark:bg-[#111113]/95
        backdrop-blur-md
        border-b border-slate-200 dark:border-white/10
        md:hidden
        ${className}
      `}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Left: hamburger */}
      <button
        type="button"
        onClick={onMenuPress}
        className="
          flex items-center justify-center
          w-10 h-10 -ml-2
          rounded-lg
          text-slate-600 dark:text-zinc-300
          active:bg-slate-100 dark:active:bg-white/5
          transition-colors
        "
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center: title */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-violet-600 rounded-md flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">S</span>
        </div>
        <h1 className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[180px]">
          {title}
        </h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSearchPress}
          className="
            flex items-center justify-center
            w-10 h-10
            rounded-lg
            text-slate-500 dark:text-zinc-400
            active:bg-slate-100 dark:active:bg-white/5
            transition-colors
          "
          aria-label="Search"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        <button
          type="button"
          onClick={onNotificationPress}
          className="
            relative flex items-center justify-center
            w-10 h-10 -mr-2
            rounded-lg
            text-slate-500 dark:text-zinc-400
            active:bg-slate-100 dark:active:bg-white/5
            transition-colors
          "
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="
              absolute top-1.5 right-1.5
              min-w-[16px] h-4 px-1
              rounded-full
              bg-red-500 text-white
              text-[9px] font-bold
              flex items-center justify-center
            ">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
