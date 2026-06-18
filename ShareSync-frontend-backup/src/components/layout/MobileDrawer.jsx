// src/components/layout/MobileDrawer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Slide-from-left mobile navigation drawer
// Branded OpenShare header, full navigation links, user avatar, theme toggle.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X, Home, Folder, Trophy, User, Settings, Moon, Sun,
  ShieldCheck, LogOut,
} from 'lucide-react';
import OpenShareLogo from '../ui/OpenShareLogo';

const NAV_ITEMS = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/projects', icon: Folder, label: 'Projects' },
  { path: '/discover', icon: Trophy, label: 'Discover' },
  { divider: true },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileDrawer({
  isOpen = false,
  onClose,
  userName = 'User',
  userStatus = 'online',
  onLogout,
  className = '',
}) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    onClose?.();
  }, [navigate, onClose]);

  const isActive = useCallback((path) => {
    if (path === '/home') return location.pathname === '/home';
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const [isDark, setIsDark] = React.useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = useCallback(() => {
    const newDark = !isDark;
    setIsDark(newDark);

    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-[90]
          bg-black/40 backdrop-blur-sm
          transition-opacity duration-200
          md:hidden
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`
          fixed top-0 left-0 bottom-0 z-[91]
          w-[280px] max-w-[85vw]
          bg-white dark:bg-[#111113]
          border-r border-slate-200 dark:border-white/10
          shadow-2xl
          transition-transform duration-300 ease-out
          md:hidden
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => handleNavigate('/home')}
            className="
              flex items-center gap-2.5
              min-w-0
              rounded-xl
              active:scale-[0.98]
              transition-transform
            "
            aria-label="Go to Home"
          >
            <div
              className="
                w-8 h-8 rounded-xl
                bg-white dark:bg-white/5
                ring-1 ring-violet-100 dark:ring-violet-400/15
                shadow-[0_10px_24px_rgba(124,58,237,0.12)]
                flex items-center justify-center
              "
            >
              <OpenShareLogo
                className="w-7 h-7"
                title="OpenShare"
              />
            </div>

            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              OpenShare
            </span>
          </button>

          <div className="flex items-center gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={() => { onLogout(); onClose?.(); }}
                className="
                  p-2 rounded-lg
                  text-red-500 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-500/10
                  active:bg-red-100 dark:active:bg-red-500/15
                  transition-colors
                "
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="
                p-2 rounded-lg
                text-slate-400
                hover:bg-slate-100 dark:hover:bg-white/5
                transition-colors
              "
              aria-label="Close menu"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-4">
          <div
            className="
              flex items-center gap-3 p-3 rounded-xl
              bg-slate-50 dark:bg-white/5
              border border-slate-200 dark:border-white/10
              cursor-pointer active:bg-slate-100 dark:active:bg-white/10
            "
            onClick={() => handleNavigate('/profile')}
          >
            <div
              className="
                w-10 h-10 rounded-full
                bg-violet-100 dark:bg-violet-500/15
                flex items-center justify-center
              "
            >
              <span className="text-sm font-bold text-violet-700 dark:text-violet-300">
                {initial}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                {userName}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span className="capitalize">{userStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item, i) => {
            if (item.divider) {
              return (
                <div
                  key={`div-${i}`}
                  className="h-px bg-slate-100 dark:bg-white/5 my-2 mx-1"
                />
              );
            }

            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center gap-3
                  px-3 py-3 rounded-xl mb-0.5
                  text-left
                  transition-colors duration-150
                  active:scale-[0.98]
                  ${active
                    ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                    : 'text-slate-600 dark:text-zinc-300 active:bg-slate-50 dark:active:bg-white/5'
                  }
                `}
              >
                <Icon
                  className={`
                    w-5 h-5 flex-shrink-0
                    ${active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'}
                  `}
                />
                <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-100 dark:border-white/5 space-y-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="
              w-full flex items-center gap-3
              px-3 py-3 rounded-xl
              text-slate-600 dark:text-zinc-300
              active:bg-slate-50 dark:active:bg-white/5
              transition-colors
            "
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-400" />
            )}
            <span className="text-sm font-medium">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={() => { onLogout(); onClose?.(); }}
              className="
                w-full flex items-center gap-3
                px-3 py-3 rounded-xl
                text-red-500 dark:text-red-400
                active:bg-red-50 dark:active:bg-red-500/5
                transition-colors
              "
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
