// src/components/layout/MobileBottomNav.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.5: Bottom tab bar for mobile (visible below md breakpoint)
// Tabs: Home, Tasks, Create (+), Projects, Settings
// Fixed to bottom, 56px height, safe-area-inset padding for notched phones
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Plus, Folder, Settings } from 'lucide-react';

const TABS = [
  { id: 'home', path: '/home', icon: Home, label: 'Home' },
  { id: 'tasks', path: '/projects', icon: Folder, label: 'Projects' },
  { id: 'create', path: null, icon: Plus, label: 'Create', isAction: true },
  { id: 'discover', path: '/discover', icon: CheckSquare, label: 'Discover' },
  { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileBottomNav({
  onCreatePress,
  className = '',
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabPress = useCallback((tab) => {
    if (tab.isAction) {
      // Fire global event for quick-add task
      onCreatePress?.();
      try {
        window.dispatchEvent(new CustomEvent('shortcut-action', {
          detail: { action: 'QUICK_ADD_OPEN' },
        }));
      } catch { /* non-fatal */ }
      return;
    }
    if (tab.path) {
      navigate(tab.path);
    }
  }, [navigate, onCreatePress]);

  const isActive = useCallback((tab) => {
    if (tab.isAction) return false;
    if (!tab.path) return false;
    if (tab.path === '/home') return location.pathname === '/home';
    return location.pathname.startsWith(tab.path);
  }, [location.pathname]);

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-[80]
        bg-white dark:bg-[#111113]
        border-t border-slate-200 dark:border-white/10
        md:hidden
        ${className}
      `}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabPress(tab)}
                className="
                  flex items-center justify-center
                  w-12 h-12 -mt-5
                  rounded-full
                  bg-violet-600 dark:bg-violet-500
                  text-white
                  shadow-lg shadow-violet-500/30
                  active:scale-95
                  transition-transform duration-100
                "
                aria-label={tab.label}
              >
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabPress(tab)}
              className={`
                flex flex-col items-center justify-center
                min-w-[56px] py-1.5 px-2
                rounded-lg
                transition-colors duration-150
                active:bg-slate-100 dark:active:bg-white/5
                ${active
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-slate-400 dark:text-zinc-500'
                }
              `}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className={`
                text-[10px] mt-0.5
                ${active ? 'font-semibold' : 'font-medium'}
              `}>
                {tab.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-violet-600 dark:bg-violet-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
