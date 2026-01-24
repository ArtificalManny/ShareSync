// src/components/Navbar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC NAVBAR v3.0 - Phase C: Momentum Engine Integration
// ═══════════════════════════════════════════════════════════════════════════════
//
// NOW USING:
// - Deep Violet (#7C3AED) as primary brand color for actions
// - Surface hierarchy: surface-0/1/2 tokens
// - ⭐ PHASE C: Momentum indicator badge in navbar
// - ⭐ PHASE C: Navbar glows subtly at high momentum levels
// - ⭐ PHASE C: Fire mode special treatment
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sun, Moon, LogOut, MessageCircle, 
  Palette, Camera, Search, Plus, Bell,
  ChevronRight, Layout, Zap, Flame, TrendingUp
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
import NotificationDropdown from './NotificationDropdown';
import QuickCapture from './navbar/QuickCapture.jsx';

// ⭐ PHASE C: Import momentum context
import { useMomentumContext } from '../contexts/MomentumContext';

const DEFAULT_PIC = '/default-profile.png';

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
  
  // Don't show at level 0
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
        {Icon && (
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        )}
        <span className={`text-xs font-medium ${config.color}`}>
          {isFireMode ? '🔥' : `L${glowLevel}`}
        </span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute top-full mt-2 left-1/2 -translate-x-1/2
          px-3 py-2 rounded-lg
          bg-surface-1 border border-white/[0.08]
          shadow-xl z-50 whitespace-nowrap
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          <div className={`text-xs font-medium ${config.color}`}>
            {glowState.charAt(0).toUpperCase() + glowState.slice(1)}
          </div>
          <div className="text-[10px] text-text-tertiary mt-0.5">
            {message}
          </div>
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
      <button 
        onClick={() => setShowMenu(!showMenu)} 
        className="flex items-center outline-none"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-brand-500/50 transition-colors">
          <img 
            src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC} 
            className="w-full h-full object-cover" 
            alt="Profile" 
          />
        </div>
      </button>
      
      {showMenu && (
        <div className="
          absolute right-0 top-full mt-2 w-56 
          bg-surface-1 border border-white/[0.08] rounded-xl 
          shadow-xl overflow-hidden z-[100]
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          <Link 
            to="/profile" 
            className="flex items-center gap-3 p-3 hover:bg-surface-2 border-b border-white/[0.06] transition-colors" 
            onClick={() => setShowMenu(false)}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img 
                src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC} 
                className="w-full h-full object-cover" 
                alt="" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-text-tertiary">View profile</p>
            </div>
          </Link>
          
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full flex items-center gap-3 p-3 hover:bg-surface-2 text-left transition-colors"
          >
            <Camera className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">
              {uploading ? 'Uploading...' : 'Change photo'}
            </span>
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

/* ─────────────────────────────────────────────────────────────────────────
   ICON BUTTON - Reusable nav button
───────────────────────────────────────────────────────────────────────── */
const IconButton = ({ children, onClick, className = '', badge = null }) => (
  <button 
    onClick={onClick} 
    className={`
      relative p-2 rounded-lg
      text-text-tertiary hover:text-text-primary
      hover:bg-surface-2
      transition-all duration-200
      ${className}
    `}
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
  const { cycleAccent } = useBrandTheme({ enabled: true });
  
  // ⭐ PHASE C: Get momentum state for navbar glow
  const { glowLevel, isFireMode } = useMomentumContext();

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
      return {
        boxShadow: '0 1px 0 rgb(var(--brand-600-rgb) / 0.05)',
      };
    }
    return {};
  }, [glowLevel, isFireMode]);

  return (
    <header 
      className={`
        navbar
        sticky top-0 z-40 h-14
        bg-surface-0/80 backdrop-blur-md
        border-b border-white/[0.06]
        px-4 lg:px-6
        transition-all duration-500
      `}
      style={navbarGlowStyle}
      data-momentum={glowLevel}
    >
      <div className="h-full max-w-[1800px] mx-auto flex items-center">
        
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT: Breadcrumb + Search
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-1 flex items-center justify-center">
              <Layout className="w-3.5 h-3.5 text-text-tertiary" />
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="text-sm font-medium text-text-primary">
              {getPageName()}
            </span>
          </div>

          {/* Divider */}
          <div className="hidden lg:block h-5 w-px bg-white/[0.06] mx-2" />

          {/* Search - focus ring uses Deep Violet */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex items-center relative"
          >
            <Search className="absolute left-3 w-4 h-4 text-text-tertiary" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search everything..." 
              className="
                bg-surface-1 border border-white/[0.06] rounded-lg
                pl-9 pr-4 py-2 text-sm text-text-primary
                placeholder:text-text-tertiary
                focus:border-brand-500/50 focus:outline-none
                focus:ring-2 focus:ring-brand-500/20
                w-52 focus:w-72 transition-all duration-200
              "
            />
          </form>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CENTER: Status Bar (optional, shows on large screens)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-full bg-surface-1 border border-white/[0.06]">
            <SeasonBadge />
            <div className="w-px h-4 bg-white/[0.06]" />
            <NextMicroStep />
            <div className="w-px h-4 bg-white/[0.06]" />
            <TeamPresence />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT: Actions
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-1">
          
          {/* ⭐ PHASE C: Momentum Badge */}
          <div className="hidden sm:block mr-2">
            <MomentumBadge />
          </div>
          
          {/* Primary Action: New - Deep Violet brand gradient */}
          <button 
            className={`
              w-8 h-8 rounded-lg
              bg-brand-600 text-white
              flex items-center justify-center
              hover:bg-brand-500
              hover:shadow-glow-brand
              transition-all duration-200
              mr-1
              ${isFireMode ? 'animate-pulse shadow-glow-energy' : ''}
            `}
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

          {/* Divider */}
          <div className="h-5 w-px bg-white/[0.06] mx-1 hidden sm:block" />

          {/* Secondary Actions */}
          <IconButton onClick={cycleAccent}>
            <Palette className="w-4 h-4" />
          </IconButton>
          
          <NotificationDropdown />
          
          <IconButton 
            onClick={() => navigate('/messages')}
            badge={unreadTotal > 0 && <UnreadBadge count={unreadTotal} />}
          >
            <MessageCircle className="w-4 h-4" />
          </IconButton>

          <IconButton onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconButton>

          {/* Divider */}
          <div className="h-5 w-px bg-white/[0.06] mx-1" />

          {/* Profile & Logout */}
          <ProfileDropdown 
            user={user} 
            onUploadComplete={() => window.location.reload()} 
          />
          
          <IconButton 
            onClick={onLogout}
            className="hover:text-error-500 hover:bg-error-500/10"
          >
            <LogOut className="w-4 h-4" />
          </IconButton>
        </div>

      </div>
    </header>
  );
}
