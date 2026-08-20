// src/components/layout/MobileBottomNav.jsx
import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, Folder, Trophy, User } from 'lucide-react';

const TABS = [
  { id: 'home', path: '/home', icon: Home, label: 'Home' },
  { id: 'projects', path: '/projects', icon: Folder, label: 'Projects' },
  { id: 'create', path: null, icon: Plus, label: 'Create', isAction: true },
  { id: 'discover', path: '/discover', icon: Trophy, label: 'Discover' },
  { id: 'profile', path: '/profile', icon: User, label: 'Profile' },
];

export default function MobileBottomNav({
  onCreatePress,
  className = '',
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabPress = useCallback((tab) => {
    if (tab.isAction) {
      onCreatePress?.();
      try {
        window.dispatchEvent(new CustomEvent('shortcut-action', {
          detail: { action: 'QUICK_ADD_OPEN' },
        }));
      } catch {}
      return;
    }

    if (tab.path) navigate(tab.path);
  }, [navigate, onCreatePress]);

  const isActive = useCallback((tab) => {
    if (tab.isAction || !tab.path) return false;
    if (tab.path === '/home') return location.pathname === '/home';
    if (tab.path === '/profile') return location.pathname === '/profile' || location.pathname === '/me';
    return location.pathname.startsWith(tab.path);
  }, [location.pathname]);

  return (
    <nav
      data-mobile-bottom-nav="true"
      className={`
        fixed bottom-0 left-0 right-0 z-[80] overflow-hidden md:hidden
        border-t border-slate-900/10 dark:border-white/10
        bg-white/72 text-slate-700
        dark:bg-[#0b0d16]/78 dark:text-white
        shadow-[0_-6px_24px_rgba(15,23,42,0.10)]
        dark:shadow-[0_-8px_28px_rgba(0,0,0,0.28)]
        backdrop-blur-[28px] backdrop-saturate-150
        font-sans
        ${className}
      `}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.42),rgba(255,255,255,0.08))] dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.015))]" />

      <div
        className="relative"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid h-[60px] grid-cols-5 items-center px-2">
          {TABS.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;

            if (tab.isAction) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabPress(tab)}
                  data-mobile-nav-button="create"
                  className="mx-auto grid h-11 w-11 appearance-none place-items-center rounded-2xl border-0 bg-[linear-gradient(135deg,#8b5cf6_0%,#d946ef_52%,#38bdf8_100%)] p-0 text-white shadow-[0_8px_20px_rgba(124,58,237,0.30)] ring-1 ring-white/70 transition duration-150 active:scale-95 dark:ring-white/15"
                  aria-label={tab.label}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabPress(tab)}
                data-mobile-nav-button={tab.id}
                className={`
                  relative flex h-full min-w-0 appearance-none flex-col items-center justify-center gap-0.5
                  border-0 bg-transparent px-1 shadow-none outline-none
                  transition duration-150 active:scale-95
                  ${
                    active
                      ? 'text-violet-600 dark:text-violet-300'
                      : 'text-slate-500 dark:text-white/55'
                  }
                `}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                <span className="grid h-7 w-10 place-items-center">
                  <Icon
                    className="h-[23px] w-[23px]"
                    strokeWidth={active ? 2.45 : 2}
                  />
                </span>
                <span
                  className={`text-[11px] leading-none tracking-[-0.01em] ${
                    active ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute bottom-0.5 h-0.5 w-4 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
