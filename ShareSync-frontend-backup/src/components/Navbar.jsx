// src/components/Navbar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC NAVBAR v4.2
// CLEANED: Completely removed hover background boxes to prevent "smudges" on glass
// ⭐ THEME: Global Semantic Theme enabled
// ⭐ ANIMATION: Added the "Signature Moment" rotating Sun/Moon toggle
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Sun, Moon, LogOut, MessageCircle, Camera, Search, Plus,
  ChevronRight, Layout, Zap, Flame, TrendingUp,
} from "lucide-react";

import { formatProfilePicture } from "../utils/imageUtils";
import { useChat } from "../context/ChatContext.jsx";
import UnreadBadge from "./messenger/UnreadBadge.jsx";
import { toast } from "./ui/toast";
import UserAvatar from "./ui/UserAvatar";

import NextMicroStep from "./navbar/NextMicroStep";
import FocusModeToggle from "./navbar/FocusModeToggle";
import SeasonBadge from "./navbar/SeasonBadge";
import TeamPresence from "./navbar/TeamPresence.jsx";
import QuickCapture from "./navbar/QuickCapture.jsx";

import NotificationCenter from "./navigation/NotificationCenter";
import { useMomentumContext } from "../contexts/MomentumContext";

import ShipNotification, { useShipNotifications } from "./social/ShipNotification";
import AchievementToast, { useAchievementToasts } from "./social/AchievementToast";
import { InlineOnlineIndicator } from "./social/OnlineIndicator";

import { NavbarSoundToggle } from "./ui/SoundToggle";
import { useTeamActivitySound } from "../sounds/NotificationSounds";

import ProjectsCreate from "../pages/ProjectsCreate";
import SubscriptionButton from "./subscription/SubscriptionButton";

// ⭐ Global Theme Hook
import { useTheme } from "../contexts/ThemeContext.jsx";

const DEFAULT_PIC = "/default-profile.png";

function getAvatarOverride() {
  try { return localStorage.getItem("ss.avatarOverride") || null; } catch { return null; }
}

function resolveAvatarUrl(user) {
  const override = getAvatarOverride();
  if (override) return override;
  return user?.avatarUrl || user?.profilePicture || user?.avatar || user?.photoUrl || user?.profile?.avatarUrl || user?.profile?.photoUrl || null;
}

function applyUserEverywhere(nextFields = {}) {
  try {
    const raw = localStorage.getItem("ss.user");
    const current = raw ? JSON.parse(raw) : {};
    const next = { ...current, ...nextFields };
    localStorage.setItem("ss.user", JSON.stringify(next));
    window.dispatchEvent(new Event("storage"));
  } catch {}
}

const BackgroundColorPicker = () => null;

const MomentumBadge = () => {
  const { glowLevel, glowState, isFireMode, message } = useMomentumContext();
  const [showTooltip, setShowTooltip] = useState(false);

  const config = useMemo(() => {
    const configs = {
      0: { icon: null, color: "text-text-tertiary", bg: "bg-transparent", show: false },
      1: { icon: Zap, color: "text-brand-500", bg: "bg-brand-50/50 dark:bg-brand-500/10", show: true },
      2: { icon: Zap, color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-100/50 dark:bg-brand-500/20", show: true },
      3: { icon: TrendingUp, color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-100/50 dark:bg-brand-500/20", show: true },
      4: { icon: TrendingUp, color: "text-info-500 dark:text-info-400", bg: "bg-info-50/50 dark:bg-info-500/10", show: true },
      5: { icon: Flame, color: "text-energy-500", bg: "bg-energy-50/50 dark:bg-energy-500/10", show: true },
    };
    return configs[glowLevel] || configs[0];
  }, [glowLevel]);

  if (!config.show) return null;
  const Icon = config.icon;

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${config.bg} border border-border-subtle transition-all duration-300 ${isFireMode ? "animate-pulse border-energy-500/30" : ""}`}>
        {Icon && <Icon className={`w-3.5 h-3.5 ${config.color}`} />}
        <span className={`text-xs font-bold ${config.color}`}>{isFireMode ? "🔥" : `L${glowLevel}`}</span>
      </div>
      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-background-elevated border border-border-subtle shadow-xl z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`text-xs font-bold ${config.color}`}>{glowState.charAt(0).toUpperCase() + glowState.slice(1)}</div>
          <div className="text-[10px] font-medium text-text-tertiary mt-0.5">{message}</div>
        </div>
      )}
    </div>
  );
};

const ProfileDropdown = ({ user, onUploadComplete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  const avatarUrl = resolveAvatarUrl(user) || DEFAULT_PIC;
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "User";

  useEffect(() => {
    const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        try { localStorage.setItem("ss.avatarOverride", dataUrl); } catch {}
        applyUserEverywhere({ avatarUrl: dataUrl });
        toast({ title: "Photo updated (local)", description: "Backend upload isn't enabled yet — UI will still show your new photo.", variant: "success" });
        setShowMenu(false);
        onUploadComplete?.();
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Failed to update photo", variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setShowMenu(!showMenu)} className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-full transition-transform duration-200 hover:scale-105">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-brand-400 transition-colors duration-200">
          <UserAvatar size={32} name={displayName} avatarUrl={avatarUrl} ringClassName="ring-0" />
        </div>
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-background-elevated border border-border-subtle rounded-xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <Link to="/profile" className="flex items-center gap-3 p-3 hover:bg-surface-2 border-b border-border-subtle transition-colors" onClick={() => setShowMenu(false)}>
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <UserAvatar size={40} name={displayName} avatarUrl={avatarUrl} ringClassName="ring-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate transition-colors">{displayName}</p>
              <p className="text-xs font-medium text-text-tertiary transition-colors">View profile</p>
            </div>
          </Link>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 hover:bg-surface-2 text-left transition-colors focus-visible:outline-none">
            <Camera className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary transition-colors">{uploading ? "Loading..." : "Change photo"}</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>
      )}
    </div>
  );
};

// PURE ICON HOVER: No background boxes. Just color change and scale.
const IconButton = ({ children, onClick, className = "", badge = null, title = "" }) => (
  <button onClick={onClick} title={title} className={`relative p-2 text-text-tertiary hover:text-brand-500 hover:scale-110 focus-visible:outline-none transition-all duration-200 ${className}`}>
    {children}
    {badge}
  </button>
);

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const chat = typeof useChat === "function" ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;

  const [showCreateProject, setShowCreateProject] = useState(false);

  // ⭐ Global Theme Hook
  const { isDarkMode, toggleTheme } = useTheme();

  const { glowLevel, isFireMode } = useMomentumContext();
  const { notifications: shipNotifications, addNotification: addShipNotification, dismissNotification: dismissShipNotification } = useShipNotifications();
  const { toasts: achievementToasts, addToast: addAchievementToast, dismissToast: dismissAchievementToast } = useAchievementToasts();
  const { playTeamActivity } = useTeamActivitySound();

  useEffect(() => {
    const handleTeamShip = (event) => {
      const { user: shipUser, project, stats, isMilestone } = event.detail || {};
      if (shipUser && project) {
        addShipNotification(shipUser, project, stats, { isMilestone });
        playTeamActivity({ type: "ship", user: shipUser, project });
      }
    };
    const handleTeamAchievement = (event) => {
      const { user: achieveUser, achievement } = event.detail || {};
      if (achieveUser && achievement) {
        addAchievementToast(achievement, achieveUser);
        playTeamActivity({ type: "achievement", user: achieveUser, achievement });
      }
    };
    window.addEventListener("team-ship", handleTeamShip);
    window.addEventListener("team-achievement", handleTeamAchievement);
    return () => {
      window.removeEventListener("team-ship", handleTeamShip);
      window.removeEventListener("team-achievement", handleTeamAchievement);
    };
  }, [addShipNotification, addAchievementToast, playTeamActivity]);

  const getPageName = () => {
    const path = location.pathname.split("/")[1];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleProjectCreated = (project) => {
    const id = project?._id || project?.id || project?.projectId;
    if (id) {
      navigate(`/projects/${id}`);
    }
    setShowCreateProject(false);
  };

  const navbarGlowStyle = useMemo(() => {
    if (isFireMode) return { boxShadow: "0 1px 0 rgba(249, 115, 22, 0.1), 0 4px 20px rgba(249, 115, 22, 0.08)", borderColor: "rgba(249, 115, 22, 0.15)" };
    if (glowLevel >= 4) return { boxShadow: "0 1px 0 rgba(139, 92, 246, 0.08), 0 4px 20px rgba(139, 92, 246, 0.06)", borderColor: "rgba(139, 92, 246, 0.1)" };
    if (glowLevel >= 3) return { boxShadow: "0 1px 0 rgba(139, 92, 246, 0.04)" };
    return {};
  }, [glowLevel, isFireMode]);

  return (
    <>
      <header
        className={`navbar sticky top-0 z-40 h-14 bg-background-primary/80 backdrop-blur-md border-b border-border-subtle px-4 lg:px-6 transition-colors duration-500`}
        style={navbarGlowStyle}
        data-momentum={glowLevel}
      >
        <div className="h-full max-w-[1800px] mx-auto flex items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center transition-colors duration-200">
                <Layout className="w-4 h-4 text-text-tertiary" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-sm font-bold text-text-primary transition-colors duration-200">{getPageName()}</span>
            </div>
            <div className="hidden lg:block h-5 w-px bg-border-subtle mx-2 transition-colors duration-200" />
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative group">
              <Search className="absolute left-3 w-4 h-4 text-text-tertiary group-focus-within:text-brand-500 transition-colors duration-200" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search everything..." className="bg-transparent border border-transparent hover:border-border-default rounded-lg pl-9 pr-4 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:bg-background-elevated focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-52 focus:w-72 transition-all duration-300" />
            </form>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 transition-colors duration-200">
              <SeasonBadge />
              <div className="w-px h-4 bg-border-subtle transition-colors duration-200" />
              <NextMicroStep />
              <div className="w-px h-4 bg-border-subtle transition-colors duration-200" />
              <TeamPresence />
              <div className="w-px h-4 bg-border-subtle transition-colors duration-200" />
              <InlineOnlineIndicator />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block mr-2"><MomentumBadge /></div>
            
            <button 
              onClick={() => setShowCreateProject(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-brand text-white hover:scale-105 transition-all duration-200 mr-1 ${isFireMode ? "animate-pulse shadow-md" : "shadow-sm hover:shadow-brand"}`} 
              style={{ background: isFireMode ? "linear-gradient(135deg, #F97316 0%, #8B5CF6 100%)" : "" }}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">New</span>
            </button>
            
            <FocusModeToggle />
            <div className="h-5 w-px bg-border-subtle mx-1 hidden sm:block transition-colors duration-200" />
            
            <NavbarSoundToggle />
            <BackgroundColorPicker />
            
            <SubscriptionButton />
            
            <NotificationCenter />
            
            <IconButton onClick={() => navigate("/messages")} badge={unreadTotal > 0 && <UnreadBadge count={unreadTotal} />} title="Messages">
              <MessageCircle className="w-4 h-4" />
            </IconButton>
            
            {/* ⭐ ANIMATED THEME TOGGLE: Signature Cross-fade & Rotate */}
            <button 
              onClick={toggleTheme} 
              title={isDarkMode ? "Light mode" : "Dark mode"}
              className="relative p-2 w-8 h-8 flex items-center justify-center text-text-tertiary hover:text-brand-500 focus-visible:outline-none transition-all duration-200 rounded-lg hover:bg-surface-2 overflow-hidden"
            >
              <Sun 
                className={`absolute w-4 h-4 transition-all duration-500 ease-in-out ${
                  isDarkMode ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                }`} 
              />
              <Moon 
                className={`absolute w-4 h-4 transition-all duration-500 ease-in-out ${
                  isDarkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
                }`} 
              />
            </button>
            
            <div className="h-5 w-px bg-border-subtle mx-1 transition-colors duration-200" />
            
            <ProfileDropdown user={user} onUploadComplete={() => {}} />
            
            <IconButton onClick={onLogout} className="hover:text-error-500" title="Sign out">
              <LogOut className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      </header>
      
      {showCreateProject && (
        <ProjectsCreate 
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
      
      <ShipNotification notifications={shipNotifications} onDismissNotification={dismissShipNotification} position="top-right" maxVisible={3} autoDismiss={6000} />
      <AchievementToast toasts={achievementToasts} onDismissToast={dismissAchievementToast} position="top-right" maxVisible={2} autoDismiss={5000} />
    </>
  );
}
