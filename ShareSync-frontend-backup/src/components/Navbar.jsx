import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, PanelLeftClose } from 'lucide-react';
import { formatProfilePicture } from '../utils/imageUtils';

const DEFAULT_PIC = '/default-profile.png';
const LS_KEY = 'ss.sidebar.collapsed';

export default function Navbar({ user, isDarkMode, toggleDarkMode, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (typeof onLogout === 'function') return onLogout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    const collapsed = document.body.classList.contains('sidebar-collapsed');
    const next = !collapsed;
    document.body.classList.toggle('sidebar-collapsed', next);
    localStorage.setItem(LS_KEY, next ? '1' : '0');
    try { window.dispatchEvent(new CustomEvent('sidebar:toggle', { detail: { collapsed: next } })); } catch {}
  };

  return (
    <header className="with-sidebar sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        {/* Left: brand (click → home) and an optional sidebar toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Toggle sidebar ([)"
            aria-label="Toggle sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
          <Link to="/home" className="font-semibold text-sm hover:opacity-90">
            ShareSync
          </Link>
        </div>

        {/* Right: theme, profile, logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link to="/profile" className="inline-flex items-center gap-2 group">
            <img
              src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC}
              alt={user?.firstName || 'User'}
              className="h-7 w-7 rounded-full border border-border object-cover"
            />
            <span className="text-xs text-muted hidden sm:inline group-hover:opacity-80">
              {user?.firstName || 'Profile'}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
