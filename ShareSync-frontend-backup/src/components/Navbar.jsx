// src/components/Navbar.jsx - UPDATED WITH PROFILE PHOTO UPLOAD
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, PanelLeftClose, MessageCircle, Palette, Camera } from 'lucide-react';
import { formatProfilePicture } from '../utils/imageUtils';
import { useChat } from "../context/ChatContext.jsx";
import UnreadBadge from './messenger/UnreadBadge.jsx';
import { BRAND_V2, ADMIN_CONSOLE_V1, KPI_TICKER_V1 } from '../config/flags.js';

import "./Navbar.neon.css";
import useBrandTheme from '../hooks/useBrandTheme.js';
import KPITicker from './global/KPITicker.jsx';
import { track } from '../utils/telemetry';
import { updateProfile } from '../api/user';
import { toast } from './ui/toast';

const BrandSwitcher = lazy(() => import('./global/BrandSwitcher.jsx'));
const DEFAULT_PIC = '/default-profile.png';
const LS_KEY = 'ss.sidebar.collapsed';

// ⭐ QUICK PROFILE PHOTO UPLOAD
const QuickPhotoUpload = ({ user, onUploadComplete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Please select an image file", variant: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "error" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      await updateProfile(formData);
      
      toast({ title: "Profile photo updated! 🎉", variant: "success" });
      setShowMenu(false);
      
      if (onUploadComplete) onUploadComplete();
      
      track('profile_photo_updated_quick');
    } catch (error) {
      toast({ title: "Failed to update photo", variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="relative inline-flex items-center gap-1.5 group"
        title="Profile & Settings"
      >
        <div className="story-ring story-ring--tight story-ring--proton">
          <div className="avatar rounded-full overflow-hidden relative" style={{ width: 32, height: 32 }}>
            <img
              src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC}
              alt={user?.firstName || 'User'}
              className="object-cover w-full h-full"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <span
          className="text-xs hidden sm:inline group-hover:opacity-80"
          style={{ color: 'rgb(var(--nav-fg, 236 244 255))' }}
        >
          {user?.firstName || 'Profile'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Profile preview */}
          <Link
            to="/profile"
            className="flex items-center gap-3 p-4 hover:bg-slate-800 transition-colors border-b border-slate-700"
            onClick={() => setShowMenu(false)}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30">
              <img
                src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC}
                alt={user?.firstName || 'User'}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-slate-400 text-xs truncate">View profile</p>
            </div>
          </Link>

          {/* Upload photo */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center gap-3 p-4 hover:bg-slate-800 transition-colors text-left disabled:opacity-50"
          >
            <Camera className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-white text-sm font-medium">
                {uploading ? 'Uploading...' : 'Change photo'}
              </p>
              <p className="text-slate-400 text-xs">Update your profile picture</p>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default function Navbar({ user, isDarkMode, toggleDarkMode, onLogout }) {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

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

  const { cycleAccent } = useBrandTheme({ enabled: true });

  useEffect(() => {
    const onCycle = () => { try { cycleAccent(); } catch {} };
    window.addEventListener("accent:cycle", onCycle);
    return () => window.removeEventListener("accent:cycle", onCycle);
  }, [cycleAccent]);

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

  const handlePhotoUploadComplete = () => {
    // Force re-render to show new photo
    setRefreshKey(prev => prev + 1);
    // Reload user data
    window.location.reload();
  };

  const headerStyle = BRAND_V2 ? undefined : undefined;

  return (
    <header
      ref={headRef}
      className="with-sidebar neon-nav sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur"
      style={headerStyle}
    >
      <div className="px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between nav-wrap">
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

          <Link to="/home" className="logo sm:inline md:hidden" aria-label="ShareSync home">
            SS
          </Link>
        </div>

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

        <div className="flex items-center gap-1.5 nav-right">
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

          <button
            type="button"
            className="btn-icon"
            title="Switch accent"
            aria-label="Switch accent"
            onClick={cycleAccent}
          >
            <Palette className="w-4 h-4" />
          </button>

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

          <button
            onClick={toggleDarkMode}
            className="btn-icon"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* ⭐ QUICK PHOTO UPLOAD */}
          <QuickPhotoUpload
            key={refreshKey}
            user={user}
            onUploadComplete={handlePhotoUploadComplete}
          />

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