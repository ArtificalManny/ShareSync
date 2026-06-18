// src/components/layout/MobileHeader.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Native/mobile header
// Hamburger → slide-out drawer. Page-aware icon/title, search, notifications.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Home,
  Folder,
  Trophy,
  User,
  Settings,
  MessageCircle,
  BarChart3,
  UsersRound,
} from 'lucide-react';
import OpenShareLogo from '../ui/OpenShareLogo';

// Map paths to page titles + page-specific icons
function getPageMeta(pathname) {
  if (pathname === '/home') return { title: 'Home', Icon: Home };
  if (pathname === '/projects') return { title: 'Projects', Icon: Folder };
  if (pathname.startsWith('/projects/')) return { title: 'Project', Icon: Folder };
  if (pathname === '/settings') return { title: 'Settings', Icon: Settings };
  if (pathname === '/profile' || pathname === '/me') return { title: 'Profile', Icon: User };
  if (pathname === '/discover') return { title: 'Discover', Icon: Trophy };
  if (pathname === '/messages') return { title: 'Messages', Icon: MessageCircle };
  if (pathname === '/search') return { title: 'Search', Icon: Search };
  if (pathname === '/analytics') return { title: 'Analytics', Icon: BarChart3 };
  if (pathname === '/community') return { title: 'Community', Icon: UsersRound };

  return { title: 'OpenShare', Icon: OpenShareLogo, isBrand: true };
}

export default function MobileHeader({
  onMenuPress,
  onSearchPress,
  onNotificationPress,
  unreadCount = 0,
  className = '',
}) {
  const location = useLocation();
  const { title, Icon: PageIcon, isBrand } = getPageMeta(location.pathname);

  return (
    <header
      data-mobile-header
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

      {/* Center: page-aware icon + title */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="
            w-6 h-6 rounded-lg
            bg-violet-50 dark:bg-violet-500/10
            ring-1 ring-violet-100 dark:ring-violet-400/15
            flex items-center justify-center
            shadow-[0_8px_20px_rgba(124,58,237,0.08)]
          "
        >
          {isBrand ? (
            <PageIcon
              className="w-5 h-5"
              title="OpenShare"
              aria-hidden="true"
            />
          ) : (
            <PageIcon
              className="w-[15px] h-[15px] text-violet-600 dark:text-violet-300"
              aria-hidden="true"
            />
          )}
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
          <Search className="w-[18px] h-[18px]" />
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
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span
              className="
                absolute top-1.5 right-1.5
                min-w-[16px] h-4 px-1
                rounded-full
                bg-red-500 text-white
                text-[9px] font-bold
                flex items-center justify-center
              "
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
