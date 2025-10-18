import React, { Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, PanelLeftClose, MessageCircle } from 'lucide-react';
import { formatProfilePicture } from '../utils/imageUtils';
import { useChat } from "../context/ChatContext.jsx";
import UnreadBadge from './messenger/UnreadBadge.jsx';
import { BRAND_V2, ADMIN_CONSOLE_V1 } from '../config/flags.js';

const BrandSwitcher = lazy(() => import('./global/BrandSwitcher.jsx'));
const DEFAULT_PIC = '/default-profile.png';
const LS_KEY = 'ss.sidebar.collapsed';

export default function Navbar({ user, isDarkMode, toggleDarkMode, onLogout }) {
  const navigate = useNavigate();

  // Chat context is optional here; Navbar renders even if provider is not mounted yet.
  const chat = typeof useChat === 'function' ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;

  const openMessenger = () => {
    try { chat?.toggleOpen?.(true); } catch {}
    navigate('/messages');
  };

  const [navQuery, setNavQuery] = React.useState("");

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const q = (navQuery || "").trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

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

  const headerStyle = BRAND_V2
    ? {
      background: 'rgb(var(--brand-v2-header))',
      color: 'rgb(var(--brand-v2-text))',
      borderBottomColor: 'rgb(var(--brand-v2-border))'
    }
    : undefined;

  return (
    <header className="with-sidebar sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur"
      style={headerStyle}
    >
      <div className="px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        {/* Left: brand + sidebar toggle */}
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
          {/*<Link to="/home" className="font-semibold text-sm hover:opacity-90">
            ShareSync
          </Link>*/}
        </div>

        {/* Middle: search */}
        <form
          onSubmit={onSubmitSearch}
          className="header-search hidden md:flex items-center mx-3 flex-1 max-w-md"
          role="search"
          aria-label="Site search"
        >
          <input
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder="Search..."
            className="search-bar w-full"
          />
        </form>

        {/* Right: admin (flag), messenger, theme, profile, logout */}
        <div className="flex items-center gap-3">
          {BRAND_V2 && (
            <Suspense fallback={null}>
              <BrandSwitcher className='mr-1' />
            </Suspense>
          )}

          {/* ⬇️ NEW: Admin Console shortcut (feature-gated) */}
          {ADMIN_CONSOLE_V1 && (
            <Link
              to="/admin/console"
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Open admin console"
              title="Admin Console"
            >
              Admin
            </Link>
          )}

          {/* Messenger */}
          <button
            type="button"
            onClick={openMessenger}
            className="relative rounded-md border border-border px-2 py-1 text-xs hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Open messenger"
            title="Open messenger"
          >
            <MessageCircle className="w-4 h-4 text-indigo-600" />
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1">
                <UnreadBadge count={unreadTotal} />
              </span>
            )}
          </button>

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
