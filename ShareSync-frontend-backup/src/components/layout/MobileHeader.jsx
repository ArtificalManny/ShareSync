// src/components/layout/MobileHeader.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import NotificationsBell from '../notifications/NotificationsBell';
import OpenShareLogo from '../ui/OpenShareLogo';

function getPageTitle(pathname) {
  if (pathname === '/home') return 'Home';
  if (pathname === '/projects') return 'Projects';
  if (pathname.startsWith('/projects/')) return 'Project';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/profile' || pathname === '/me') return 'Profile';
  if (pathname === '/discover') return 'Discover';
  if (pathname === '/messages') return 'Messages';
  if (pathname === '/search') return 'Search';
  if (pathname === '/analytics') return 'Analytics';
  if (pathname === '/community') return 'Community';
  return 'OpenShare';
}

export default function MobileHeader({
  onMenuPress,
  onSearchPress,
  className = '',
}) {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header
      className={`
        sticky top-0 z-[70] md:hidden
        border-b border-white/10
        bg-[#080914]/90 text-white
        backdrop-blur-2xl
        ${className}
      `}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(124,58,237,0.42),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.28),transparent_32%)]" />

        <div className="relative flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={onMenuPress}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white shadow-lg shadow-black/20 active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 px-3">
            <div className="flex items-center justify-center gap-2.5">
              <OpenShareLogo
                className="h-8 w-8 shrink-0 drop-shadow-[0_0_14px_rgba(168,85,247,0.42)]"
                title="OpenShare"
                animated
              />
              <h1 className="truncate text-[17px] font-black leading-tight text-white drop-shadow-sm">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onSearchPress}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white/90 shadow-lg shadow-black/20 active:scale-95"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 shadow-lg shadow-black/20">
              <NotificationsBell
                dropdownWidthClassName="!w-[calc(100vw-24px)] !max-w-[420px]"
                anchorClassName="!fixed !left-1/2 !right-auto !top-[calc(env(safe-area-inset-top,0px)+68px)] !z-[9999] !-translate-x-1/2 !mt-0"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
