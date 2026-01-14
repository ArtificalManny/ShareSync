// src/components/Navbar.jsx - METAlab STREAMLINED (NO REDUNDANCY)
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sun, Moon, LogOut, MessageCircle, 
  Palette, Camera, Search, Plus, Bell, Command, Zap,
  ChevronRight, Layout
} from 'lucide-react';
import { formatProfilePicture } from '../utils/imageUtils';
import { useChat } from "../context/ChatContext.jsx";
import UnreadBadge from './messenger/UnreadBadge.jsx';
import { BRAND_V2, ADMIN_CONSOLE_V1, KPI_TICKER_V1 } from '../config/flags.js';
import useBrandTheme from '../hooks/useBrandTheme.js';
import { track } from '../utils/telemetry';
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
   REFINED QUICK PHOTO UPLOAD
───────────────────────────────────────────────────────────────────────── */
const QuickPhotoUpload = ({ user, onUploadComplete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
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
      toast({ title: "Identity Updated", variant: "success" });
      setShowMenu(false);
      if (onUploadComplete) onUploadComplete();
    } catch (error) { toast({ title: "Failed to update", variant: "error" }); }
    finally { setUploading(false); }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setShowMenu(!showMenu)} className="flex items-center group outline-none">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-violet-500/50 transition-colors">
          <img src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC} className="w-full h-full object-cover" alt="Profile" />
        </div>
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-4 w-56 bg-[#16171B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95">
          <Link to="/profile" className="flex items-center gap-3 p-4 hover:bg-white/5 border-b border-white/5" onClick={() => setShowMenu(false)}>
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={formatProfilePicture(user?.profilePicture) || DEFAULT_PIC} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">View Identity</p>
            </div>
          </Link>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 text-left text-xs font-bold text-slate-400">
            <Camera className="w-4 h-4 text-violet-400" /> {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN NAVBAR
───────────────────────────────────────────────────────────────────────── */
export default function Navbar({ user, isDarkMode, toggleDarkMode, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [navQuery, setNavQuery] = useState("");
  const chat = typeof useChat === 'function' ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;
  const { cycleAccent } = useBrandTheme({ enabled: true });

  // Get current path for breadcrumbs
  const pathName = location.pathname.split('/')[1] || 'Dashboard';

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#0B0C0E]/80 backdrop-blur-md border-b border-white/[0.04] px-6">
      <div className="h-full max-w-[1800px] mx-auto flex items-center">
        
        {/* 1. BREADCRUMBS (Replaces Logo & Toggle) */}
        <div className="flex items-center gap-3 min-w-fit">
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-slate-500">
            <Layout size={16} />
          </div>
          <ChevronRight size={14} className="text-slate-700" />
          <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
            {pathName}
          </span>
          
          <div className="h-6 w-[1px] bg-white/10 mx-4 hidden lg:block" />

          {/* Expanded Search */}
          <form 
            onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(navQuery)}`); }}
            className="hidden md:flex items-center relative group"
          >
            <Search className="absolute left-3 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
            <input 
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="Search everything..." 
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-1.5 text-xs text-white focus:w-80 w-64 transition-all focus:border-violet-500/40 outline-none"
            />
          </form>
        </div>

        {/* 2. DYNAMIC CENTER: The Status Bar */}
        <div className="flex-1 flex items-center justify-center gap-6 px-8 overflow-hidden">
          <div className="hidden xl:flex items-center gap-6 bg-white/[0.02] border border-white/[0.04] px-4 py-1.5 rounded-full">
            <SeasonBadge />
            <div className="w-[1px] h-3 bg-white/5" />
            <NextMicroStep />
            <div className="w-[1px] h-3 bg-white/5" />
            <TeamPresence />
          </div>
        </div>

        {/* 3. RIGHT PINNED: Global Actions */}
        <div className="flex items-center gap-3">
          {/* Action Hub */}
          <div className="flex items-center gap-1.5 mr-2">
            <button className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-all shadow-lg shadow-violet-600/20 active:scale-95">
              <Plus size={18} strokeWidth={3} />
            </button>
            <QuickCapture />
            <FocusModeToggle />
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1">
            <button onClick={cycleAccent} className="p-2 text-slate-500 hover:text-white transition-colors">
              <Palette className="w-4 h-4" />
            </button>
            
            <NotificationDropdown />
            
            <button onClick={() => navigate('/messages')} className="p-2 text-slate-500 hover:text-white transition-colors relative">
              <MessageCircle className="w-4 h-4" />
              {unreadTotal > 0 && <UnreadBadge count={unreadTotal} />}
            </button>

            <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:text-white transition-colors">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="h-8 w-[1px] bg-white/10 mx-2" />

          <div className="flex items-center gap-4">
            <QuickPhotoUpload user={user} onUploadComplete={() => window.location.reload()} />
            <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
