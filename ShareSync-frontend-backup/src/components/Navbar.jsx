// src/components/Navbar.jsx
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, PanelLeftClose, MessageCircle, Palette } from 'lucide-react';
import { formatProfilePicture } from '../utils/imageUtils';
import { useChat } from "../context/ChatContext.jsx";
import UnreadBadge from './messenger/UnreadBadge.jsx';
import { BRAND_V2, ADMIN_CONSOLE_V1, KPI_TICKER_V1 } from '../config/flags.js';

// Neon skin (glass + glow)
import "./Navbar.neon.css";
import useBrandTheme from '../hooks/useBrandTheme.js';

// KPI ticker
import KPITicker from './global/KPITicker.jsx';
import { track } from '../utils/telemetry';

const BrandSwitcher = lazy(() => import('./global/BrandSwitcher.jsx'));
const DEFAULT_PIC = '/default-profile.png';
const LS_KEY = 'ss.sidebar.collapsed';

export default function Navbar({ user, isDarkMode, toggleDarkMode, onLogout }) {
  const navigate = useNavigate();

  // Chat context (optional if provider not mounted yet)
  const chat = typeof useChat === 'function' ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;

  const openMessenger = () => {
    try { chat?.toggleOpen?.(true); } catch {}
    navigate('/messages');
  };

  const [navQuery, setNavQuery] = useState("");

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

  // Brand / Accent utilities (used by Palette button)
  const { cycleAccent } = useBrandTheme({ enabled: true });

  // Compact-on-scroll effect for the neon bar
  const headRef = useRef(null);
  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const onScroll = () => {
      if (window.scrollY > 8) el.classList.add('is-compact');
      else el.classList.remove('is-compact');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Avatar: spin ring once per session on first render
  const [spinAvatar, setSpinAvatar] = useState(false);
  useEffect(() => {
    const key = 'seen.nav.avatar.spin';
    if (!sessionStorage.getItem(key)) {
      setSpinAvatar(true);
      const t = setTimeout(() => setSpinAvatar(false), 1600); // keep in sync with rings.css
      sessionStorage.setItem(key, '1');
      return () => clearTimeout(t);
    }
  }, []);

  // Old inline brand style not needed in v2 neon; CSS drives it
  const headerStyle = BRAND_V2 ? undefined : undefined;

  return (
    <header
      ref={headRef}
      className="with-sidebar neon-nav sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur"
      style={headerStyle}
    >
      <div className="px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between nav-wrap">
        {/* Left: sidebar toggle + (mobile-only) brand */}
        <div className="nav-left">
          <button
            type="button"
            onClick={toggleSidebar}
            className="btn-icon"
            title="Toggle sidebar ([)"
            aria-label="Toggle sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>

          {/* Brand / Home — keep on small screens, hide on md+ to avoid duplicate brand with sidebar */}
          <Link to="/home" className="logo sm:inline md:hidden" aria-label="ShareSync home">
            SS
          </Link>
        </div>

        {/* Middle: search */}
        <form
          onSubmit={onSubmitSearch}
          className="header-search hidden md:flex items-center mx-3 flex-1 max-w-md nav-center"
          role="search"
          aria-label="Site search"
        >
          <input
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder="Search..."
            className="searchbar search-bar w-full"
          />
        </form>

        {/* Right: KPI Ticker (flag), admin, messenger, theme, profile, logout */}
        <div className="flex items-center gap-1.5 nav-right">
          {/* KPI Ticker — CNBC-style, shows only on md+ to keep it compact */}
          {KPI_TICKER_V1 && (
            <div
              className="hidden md:flex items-center"
              onClick={() => { try { track('kpi_ticker_opened'); } catch {} }}
              onMouseEnter={() => { try { track('kpi_delta_hovered', { hint: 'enter' }); } catch {} }}
            >
              <KPITicker />
            </div>
          )}

          {BRAND_V2 && (
            <Suspense fallback={null}>
              <BrandSwitcher className="mr-1" />
            </Suspense>
          )}

          {/* Accent family cycler (Pandora / CNBC / Meta-styled accents) */}
          <button
            type="button"
            className="btn-icon"
            title="Switch accent"
            aria-label="Switch accent"
            onClick={cycleAccent}
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Admin Console shortcut (feature-gated) */}
          {ADMIN_CONSOLE_V1 && (
            <Link
              to="/admin/console"
              className="btn-icon"
              aria-label="Open admin console"
              title="Admin Console"
            >
              <span className="sr-only">Admin</span>
              <span aria-hidden>⚙️</span>
            </Link>
          )}

          {/* Messenger */}
          <button
            type="button"
            onClick={openMessenger}
            className="btn-icon relative"
            aria-label="Open messenger"
            title="Open messenger"
          >
            <MessageCircle className="w-4 h-4" />
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1">
                <UnreadBadge count={unreadTotal} />
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="btn-icon"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Profile (one-spin ring on first session) */}
          <Link to="/profile" className="inline-flex items-center gap-1.5 group">
            <div className={`story-ring story-ring--tight ${spinAvatar ? 'ring-spin-once' : ''}`}>
              <div className="avatar h-8 w-8 rounded-full overflow-hidden">
                <img
                  src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC}
                  alt={user?.firstName || 'User'}
                  className="h-8 w-8 object-cover"
                />
              </div>
            </div>
            <span
              className="text-xs hidden sm:inline group-hover:opacity-80"
              style={{ color: 'var(--nav-fg, #ECF4FF)' }}
            >
              {user?.firstName || 'Profile'}
            </span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="btn-icon"
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
