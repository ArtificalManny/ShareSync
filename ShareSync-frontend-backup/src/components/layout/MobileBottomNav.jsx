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
        fixed bottom-0 left-0 right-0 z-[80] md:hidden
        border-t border-white/10
        bg-[#080914]/97 text-white
        shadow-[0_-12px_36px_rgba(0,0,0,0.36)]
        backdrop-blur-2xl
        ${className}
      `}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.28),transparent_42%)]" />
        <div className="relative flex h-16 items-center justify-around px-2">
          {TABS.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;

            if (tab.isAction) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabPress(tab)}
                  className="grid h-14 w-14 -translate-y-4 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-400 text-white shadow-2xl shadow-violet-500/35 ring-4 ring-[#080914] active:scale-95"
                  aria-label={tab.label}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.7} />
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabPress(tab)}
                className={`
                  relative flex min-w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2
                  transition duration-150 active:scale-95
                  ${active ? 'text-white' : 'text-white/48'}
                `}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                <span className={`
                  grid h-8 w-10 place-items-center rounded-2xl
                  ${active ? 'bg-white/12 shadow-lg shadow-violet-500/15' : 'bg-transparent'}
                `}>
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.6 : 2} />
                </span>
                <span className={`text-[10px] leading-none ${active ? 'font-bold' : 'font-semibold'}`}>
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute -bottom-0.5 h-1 w-6 rounded-full bg-gradient-to-r from-violet-400 to-sky-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
