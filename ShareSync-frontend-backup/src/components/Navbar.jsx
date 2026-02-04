// src/components/Navbar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC NAVBAR v3.2 - Phase C: Momentum + Phase E: Social Proof + Phase F: Sound
// + PHASE N: NotificationCenter Integration + Background Color Picker
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sun, Moon, LogOut, MessageCircle, 
  Palette, Camera, Search, Plus, Bell,
  ChevronRight, Layout, Zap, Flame, TrendingUp,
  Check
} from 'lucide-react';
import { formatProfilePicture } from '../utils/imageUtils';
import { useChat } from "../context/ChatContext.jsx";
import UnreadBadge from './messenger/UnreadBadge.jsx';
import useBrandTheme from '../hooks/useBrandTheme.js';
import { updateProfile } from '../api/user';
import { toast } from './ui/toast';

// NAVBAR COMPONENTS
import NextMicroStep from './navbar/NextMicroStep';
import FocusModeToggle from './navbar/FocusModeToggle';
import SeasonBadge from './navbar/SeasonBadge';
import TeamPresence from './navbar/TeamPresence.jsx';
import QuickCapture from './navbar/QuickCapture.jsx';

// ⭐ PHASE N: Import new NotificationCenter
import NotificationCenter from './navigation/NotificationCenter';

// ⭐ PHASE C: Import momentum context
import { useMomentumContext } from '../contexts/MomentumContext';

// ⭐ PHASE E: Import social proof components
import ShipNotification, { useShipNotifications } from './social/ShipNotification';
import AchievementToast, { useAchievementToasts } from './social/AchievementToast';
import { InlineOnlineIndicator } from './social/OnlineIndicator';

// ⭐ PHASE F: Import sound components and hooks
import { NavbarSoundToggle } from './ui/SoundToggle';
import { useTeamActivitySound } from '../sounds/NotificationSounds';

const DEFAULT_PIC = '/default-profile.png';

// ⭐ PHASE N: Background color presets
const BACKGROUND_COLORS = [
  { id: 'default', name: 'Default', value: null, preview: '#0F0F12' },
  { id: 'midnight', name: 'Midnight', value: '#0A0A0F', preview: '#0A0A0F' },
  { id: 'deep-violet', name: 'Deep Violet', value: '#0D0B14', preview: '#0D0B14' },
  { id: 'ocean', name: 'Ocean', value: '#0A0F14', preview: '#0A0F14' },
  { id: 'forest', name: 'Forest', value: '#0A140D', preview: '#0A140D' },
  { id: 'charcoal', name: 'Charcoal', value: '#121212', preview: '#121212' },
  { id: 'pure-black', name: 'Pure Black', value: '#000000', preview: '#000000' },
  { id: 'warm-dark', name: 'Warm Dark', value: '#14120F', preview: '#14120F' },
];

// ⭐ PHASE N: Persisted background key + global apply helper (MINIMAL)
const BG_STORAGE_KEY = 'ss.bg.color';

function applyBackgroundColor(colorId, { persist = true } = {}) {
  if (typeof document === 'undefined') return;

  const id = colorId || 'default';
  const color = BACKGROUND_COLORS.find(c => c.id === id) || BACKGROUND_COLORS[0];

  // Helpful for future CSS targeting if you want it
  try {
    document.documentElement.setAttribute('data-ss-bg', id);
  } catch {}

  if (color?.value) {
    document.documentElement.style.setProperty('--surface-0', color.value);
    if (document.body) document.body.style.backgroundColor = color.value;
  } else {
    document.documentElement.style.removeProperty('--surface-0');
    if (document.body) document.body.style.backgroundColor = '';
  }

  if (persist) {
    try { localStorage.setItem(BG_STORAGE_KEY, id); } catch {}
  }
}

// ⭐ Apply saved background ONCE at module load so it’s consistent across ALL pages/routes
(() => {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem(BG_STORAGE_KEY) || 'default';
    applyBackgroundColor(saved, { persist: false });
  } catch {}
})();

/* ─────────────────────────────────────────────────────────────────────────
   ⭐ PHASE N: BACKGROUND COLOR PICKER
───────────────────────────────────────────────────────────────────────── */
// Replace your BackgroundColorPicker with THIS exact component
const BackgroundColorPicker = () => {
  const BG_STORAGE_KEY = "ss.bg.color";

  const BACKGROUND_COLORS = [
    { id: "midnight", name: "Midnight", value: "#0A0A0F", preview: "#0A0A0F" },
    { id: "deepViolet", name: "Deep Violet", value: "#0D0B14", preview: "#1A1230" },
    { id: "ocean", name: "Ocean", value: "#061018", preview: "#0B2B3A" },
    { id: "forest", name: "Forest", value: "#07120B", preview: "#12301C" },
    { id: "slate", name: "Slate", value: "#0B0F16", preview: "#1B2433" },
    { id: "carbon", name: "Carbon", value: "#0B0B0D", preview: "#2A2A30" },
    { id: "ember", name: "Ember", value: "#120A0A", preview: "#3A1414" },
    { id: "default", name: "Default", value: null, preview: "#232327" },
  ];

  const [showPicker, setShowPicker] = React.useState(false);
  const [selectedColor, setSelectedColor] = React.useState(() => {
    try {
      return localStorage.getItem(BG_STORAGE_KEY) || "midnight";
    } catch {
      return "midnight";
    }
  });

  const pickerRef = React.useRef(null);

  // ---------- color utils ----------
  const hexToRgb = (hex) => {
    if (!hex) return null;
    const clean = hex.replace("#", "").trim();
    const full =
      clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    if (full.length !== 6) return null;

    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  };

  const mixRgb = (a, b, t) => {
    const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
    return {
      r: clamp(a.r + (b.r - a.r) * t),
      g: clamp(a.g + (b.g - a.g) * t),
      b: clamp(a.b + (b.b - a.b) * t),
    };
  };

  const rgbToHex = ({ r, g, b }) =>
    `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;

  // Set CSS var + its `-rgb` companion, WITH priority important.
  const setVarPair = (el, varName, hexOrNull) => {
    if (!el) return;

    if (!hexOrNull) {
      el.style.removeProperty(varName);
      el.style.removeProperty(`${varName}-rgb`);
      return;
    }

    const rgb = hexToRgb(hexOrNull);
    el.style.setProperty(varName, hexOrNull, "important");
    if (rgb) el.style.setProperty(`${varName}-rgb`, `${rgb.r} ${rgb.g} ${rgb.b}`, "important");
  };

  const applyTheme = (themeId) => {
    const root = document.documentElement;
    const app = document.querySelector(".app-container");

    const found = BACKGROUND_COLORS.find((c) => c.id === themeId);
    const baseHex = found?.value ?? null;
    const tintHex = found?.preview ?? baseHex;

    // Default: clear everything
    if (!baseHex) {
      [
        "--surface-0", "--surface-1", "--surface-2", "--surface-3",
        "--chrome-nav", "--chrome-sidebar", "--chrome-border",
      ].forEach((v) => {
        setVarPair(root, v, null);
        setVarPair(app, v, null);
      });

      if (document.body) document.body.style.background = "";
      document.documentElement.removeAttribute("data-ss-bg");
      return;
    }

    const base = hexToRgb(baseHex);
    const tint = hexToRgb(tintHex) || base;
    if (!base) return;

    const white = { r: 255, g: 255, b: 255 };

    // ✅ Make surfaces more distinct (bigger lifts)
    const s0 = baseHex;
    const s1 = rgbToHex(mixRgb(base, white, 0.12));
    const s2 = rgbToHex(mixRgb(base, white, 0.20));
    const s3 = rgbToHex(mixRgb(base, white, 0.28));

    // ✅ ProtonMail-style chroming:
    // Nav slightly tinted, Sidebar more tinted
    const nav = rgbToHex(mixRgb(base, tint, 0.35));
    const sidebar = rgbToHex(mixRgb(base, tint, 0.70));
    const border = rgbToHex(mixRgb(base, white, 0.18));

    // Apply to BOTH documentElement and .app-container
    [
      ["--surface-0", s0],
      ["--surface-1", s1],
      ["--surface-2", s2],
      ["--surface-3", s3],
      ["--chrome-nav", nav],
      ["--chrome-sidebar", sidebar],
      ["--chrome-border", border],
    ].forEach(([k, v]) => {
      setVarPair(root, k, v);
      setVarPair(app, k, v);
    });

    // Page background updates immediately (canvas feel)
    document.body.style.background =
      `radial-gradient(1200px 800px at 20% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 55%), ${s0}`;

    document.documentElement.setAttribute("data-ss-bg", themeId);
  };

  // Close on click outside
  React.useEffect(() => {
    const onDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showPicker]);

  // Apply theme whenever selection changes
  React.useEffect(() => {
    applyTheme(selectedColor);
    try {
      localStorage.setItem(BG_STORAGE_KEY, selectedColor);
    } catch {}
  }, [selectedColor]);

  const handleSelect = (id) => {
    setSelectedColor(id);
    setShowPicker(false);
  };

  const selectedName = BACKGROUND_COLORS.find((c) => c.id === selectedColor)?.name;

  return (
    <div className="relative" ref={pickerRef}>
      <button
        className="icon-btn"
        onClick={() => setShowPicker((s) => !s)}
        aria-label="Background color"
        title="Background color"
      >
        🎨
      </button>

      {showPicker && (
        <div
          className="
            absolute right-0 top-full mt-2
            w-80 p-4
            bg-surface-1 border border-white/[0.08] rounded-2xl
            shadow-xl z-[100]
          "
        >
          <div className="text-xs font-medium text-text-secondary mb-3">
            Background Color
          </div>

          <div className="grid grid-cols-4 gap-3">
            {BACKGROUND_COLORS.map((c) => (
              <div key={c.id} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleSelect(c.id)}
                  className={`
                    relative w-12 h-12 rounded-2xl overflow-hidden
                    border transition-all duration-200
                    ${selectedColor === c.id
                      ? "border-brand-500 ring-2 ring-brand-500/25 scale-[1.03]"
                      : "border-white/[0.12] hover:border-white/[0.35]"
                    }
                  `}
                  style={{
                    background: `radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%), ${c.preview}`,
                  }}
                  title={c.name}
                >
                  {selectedColor === c.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-brand-500 text-lg">✓</span>
                    </div>
                  )}
                </button>

                <div className={`text-[10px] leading-none w-14 text-center truncate ${selectedColor === c.id ? "text-text-secondary" : "text-text-tertiary"}`}>
                  {c.name}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="text-[10px] text-text-tertiary">Selected: {selectedName}</div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MOMENTUM BADGE - Compact indicator for navbar
───────────────────────────────────────────────────────────────────────── */
const MomentumBadge = () => {
  const { glowLevel, glowState, isFireMode, message } = useMomentumContext();
  const [showTooltip, setShowTooltip] = useState(false);
  
  const config = useMemo(() => {
    const configs = {
      0: { icon: null, color: 'text-text-tertiary', bg: 'bg-surface-2', show: false },
      1: { icon: Zap, color: 'text-brand-400', bg: 'bg-brand-500/10', show: true },
      2: { icon: Zap, color: 'text-brand-500', bg: 'bg-brand-500/15', show: true },
      3: { icon: TrendingUp, color: 'text-brand-400', bg: 'bg-brand-500/20', show: true },
      4: { icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/20', show: true },
      5: { icon: Flame, color: 'text-energy-500', bg: 'bg-energy-500/20', show: true },
    };
    return configs[glowLevel] || configs[0];
  }, [glowLevel]);
  
  if (!config.show) return null;
  
  const Icon = config.icon;
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`
        flex items-center gap-1.5
        px-2.5 py-1.5 rounded-lg
        ${config.bg} border border-white/[0.06]
        transition-all duration-300
        ${isFireMode ? 'animate-pulse border-energy-500/30' : ''}
      `}>
        {Icon && <Icon className={`w-3.5 h-3.5 ${config.color}`} />}
        <span className={`text-xs font-medium ${config.color}`}>
          {isFireMode ? '🔥' : `L${glowLevel}`}
        </span>
      </div>
      
      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-surface-1 border border-white/[0.08] shadow-xl z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`text-xs font-medium ${config.color}`}>
            {glowState.charAt(0).toUpperCase() + glowState.slice(1)}
          </div>
          <div className="text-[10px] text-text-tertiary mt-0.5">{message}</div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   PROFILE DROPDOWN
───────────────────────────────────────────────────────────────────────── */
const ProfileDropdown = ({ user, onUploadComplete }) => {
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
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      await updateProfile(formData);
      toast({ title: "Photo updated", variant: "success" });
      setShowMenu(false);
      if (onUploadComplete) onUploadComplete();
    } catch (error) { 
      toast({ title: "Failed to update", variant: "error" }); 
    } finally { 
      setUploading(false); 
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setShowMenu(!showMenu)} className="flex items-center outline-none">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-brand-500/50 transition-colors">
          <img src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC} className="w-full h-full object-cover" alt="Profile" />
        </div>
      </button>
      
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-1 border border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <Link to="/profile" className="flex items-center gap-3 p-3 hover:bg-surface-2 border-b border-white/[0.06] transition-colors" onClick={() => setShowMenu(false)}>
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-text-tertiary">View profile</p>
            </div>
          </Link>
          
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 hover:bg-surface-2 text-left transition-colors">
            <Camera className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">{uploading ? 'Uploading...' : 'Change photo'}</span>
          </button>
          
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   ICON BUTTON
───────────────────────────────────────────────────────────────────────── */
const IconButton = ({ children, onClick, className = '', badge = null, title = '' }) => (
  <button 
    onClick={onClick} 
    title={title}
    className={`relative p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-all duration-200 ${className}`}
  >
    {children}
    {badge}
  </button>
);

/* ─────────────────────────────────────────────────────────────────────────
   MAIN NAVBAR
───────────────────────────────────────────────────────────────────────── */
export default function Navbar({ user, isDarkMode, toggleDarkMode, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const chat = typeof useChat === 'function' ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;
  
  // ⭐ PHASE C: Get momentum state for navbar glow
  const { glowLevel, isFireMode, teamActivity } = useMomentumContext();
  
  // ⭐ PHASE E: Ship notification and achievement toast managers
  const { notifications: shipNotifications, addNotification: addShipNotification, dismissNotification: dismissShipNotification } = useShipNotifications();
  const { toasts: achievementToasts, addToast: addAchievementToast, dismissToast: dismissAchievementToast } = useAchievementToasts();

  // ⭐ PHASE F: Team activity sound
  const { playTeamActivity } = useTeamActivitySound();

  // ⭐ PHASE E + F: Listen for team ship events with sounds
  useEffect(() => {
    const handleTeamShip = (event) => {
      const { user: shipUser, project, stats, isMilestone } = event.detail || {};
      if (shipUser && project) {
        addShipNotification(shipUser, project, stats, { isMilestone });
        playTeamActivity({ type: 'ship', user: shipUser, project });
      }
    };
    
    const handleTeamAchievement = (event) => {
      const { user: achieveUser, achievement } = event.detail || {};
      if (achieveUser && achievement) {
        addAchievementToast(achievement, achieveUser);
        playTeamActivity({ type: 'achievement', user: achieveUser, achievement });
      }
    };
    
    window.addEventListener('team-ship', handleTeamShip);
    window.addEventListener('team-achievement', handleTeamAchievement);
    
    return () => {
      window.removeEventListener('team-ship', handleTeamShip);
      window.removeEventListener('team-achievement', handleTeamAchievement);
    };
  }, [addShipNotification, addAchievementToast, playTeamActivity]);

  // Get current page name from path
  const getPageName = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // ⭐ PHASE C: Dynamic navbar styles based on momentum
  const navbarGlowStyle = useMemo(() => {
    if (isFireMode) {
      return {
        boxShadow: '0 1px 0 rgb(var(--energy-500-rgb) / 0.15), 0 4px 20px rgb(var(--energy-500-rgb) / 0.1)',
        borderColor: 'rgb(var(--energy-500-rgb) / 0.1)',
      };
    }
    if (glowLevel >= 4) {
      return {
        boxShadow: '0 1px 0 rgb(var(--brand-600-rgb) / 0.1), 0 4px 20px rgb(var(--brand-600-rgb) / 0.08)',
        borderColor: 'rgb(var(--brand-600-rgb) / 0.08)',
      };
    }
    if (glowLevel >= 3) {
      return { boxShadow: '0 1px 0 rgb(var(--brand-600-rgb) / 0.05)' };
    }
    return {};
  }, [glowLevel, isFireMode]);

  return (
    <>
      <header 
        className={`navbar sticky top-0 z-40 h-14 bg-surface-0/80 backdrop-blur-md border-b border-white/[0.06] px-4 lg:px-6 transition-all duration-500`}
        style={navbarGlowStyle}
        data-momentum={glowLevel}
      >
        <div className="h-full max-w-[1800px] mx-auto flex items-center">
          
          {/* LEFT: Breadcrumb + Search */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-1 flex items-center justify-center">
                <Layout className="w-3.5 h-3.5 text-text-tertiary" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-sm font-medium text-text-primary">{getPageName()}</span>
            </div>

            <div className="hidden lg:block h-5 w-px bg-white/[0.06] mx-2" />

            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <Search className="absolute left-3 w-4 h-4 text-text-tertiary" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search everything..." 
                className="bg-surface-1 border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-52 focus:w-72 transition-all duration-200"
              />
            </form>
          </div>

          {/* CENTER: Status Bar */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-full bg-surface-1 border border-white/[0.06]">
              <SeasonBadge />
              <div className="w-px h-4 bg-white/[0.06]" />
              <NextMicroStep />
              <div className="w-px h-4 bg-white/[0.06]" />
              <TeamPresence />
              <div className="w-px h-4 bg-white/[0.06]" />
              <InlineOnlineIndicator />
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1">
            
            {/* Momentum Badge */}
            <div className="hidden sm:block mr-2">
              <MomentumBadge />
            </div>
            
            {/* Primary Action: New */}
            <button 
              className={`w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center hover:bg-brand-500 hover:shadow-glow-brand transition-all duration-200 mr-1 ${isFireMode ? 'animate-pulse shadow-glow-energy' : ''}`}
              style={{
                background: isFireMode 
                  ? 'linear-gradient(135deg, var(--energy-500, #F43F5E) 0%, var(--brand-600, #7C3AED) 100%)'
                  : 'linear-gradient(135deg, var(--brand-600, #7C3AED) 0%, var(--brand-700, #6D28D9) 100%)',
              }}
            >
              <Plus className="w-4 h-4" />
            </button>
            
            <QuickCapture />
            <FocusModeToggle />

            <div className="h-5 w-px bg-white/[0.06] mx-1 hidden sm:block" />

            {/* Sound Toggle */}
            <NavbarSoundToggle />

            {/* ⭐ PHASE N: Background Color Picker (replaces old Palette button) */}
            <BackgroundColorPicker />
            
            {/* ⭐ PHASE N: New NotificationCenter (replaces old NotificationDropdown) */}
            <NotificationCenter />
            
            {/* Messages */}
            <IconButton 
              onClick={() => navigate('/messages')}
              badge={unreadTotal > 0 && <UnreadBadge count={unreadTotal} />}
              title="Messages"
            >
              <MessageCircle className="w-4 h-4" />
            </IconButton>

            {/* Dark Mode Toggle */}
            <IconButton onClick={toggleDarkMode} title={isDarkMode ? 'Light mode' : 'Dark mode'}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </IconButton>

            <div className="h-5 w-px bg-white/[0.06] mx-1" />

            {/* Profile & Logout */}
            <ProfileDropdown user={user} onUploadComplete={() => window.location.reload()} />
            
            <IconButton onClick={onLogout} className="hover:text-error-500 hover:bg-error-500/10" title="Sign out">
              <LogOut className="w-4 h-4" />
            </IconButton>
          </div>

        </div>
      </header>
      
      {/* Ship Notifications */}
      <ShipNotification
        notifications={shipNotifications}
        onDismissNotification={dismissShipNotification}
        position="top-right"
        maxVisible={3}
        autoDismiss={6000}
      />
      
      {/* Achievement Toasts */}
      <AchievementToast
        toasts={achievementToasts}
        onDismissToast={dismissAchievementToast}
        position="top-right"
        maxVisible={2}
        autoDismiss={5000}
      />
    </>
  );
}
