// src/components/Navbar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC NAVBAR v2.0 - Phase 1: Emotional Color System
// ═══════════════════════════════════════════════════════════════════════════════
//
// NOW USING:
// - Deep Violet (#7C3AED) as primary brand color for actions
// - Surface hierarchy: surface-0/1/2 tokens
// - Text hierarchy: text-primary/secondary/tertiary
// - Brand color ONLY for primary action (+ button)
// - No glows at rest - clean and professional
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sun, Moon, LogOut, MessageCircle, 
  Palette, Camera, Search, Plus, Bell,
  ChevronRight, Layout
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

const DEFAULT_PIC = '/default-profile.png';

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
          {/* Profile Link */}
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
          
          {/* Change Photo */}
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

  return (
    <header className="
      sticky top-0 z-40 h-14
      bg-surface-0/80 backdrop-blur-md
      border-b border-white/[0.06]
      px-4 lg:px-6
    ">
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
          
          {/* Primary Action: New - Deep Violet brand gradient */}
          <button 
            className="
              w-8 h-8 rounded-lg
              bg-brand-600 text-white
              flex items-center justify-center
              hover:bg-brand-500
              hover:shadow-glow-brand
              transition-all duration-200
              mr-1
            "
            style={{
              background: 'linear-gradient(135deg, var(--brand-600, #7C3AED) 0%, var(--brand-700, #6D28D9) 100%)',
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
