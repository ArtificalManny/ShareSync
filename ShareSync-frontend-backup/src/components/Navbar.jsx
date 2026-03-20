// src/components/Navbar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC NAVBAR v4.1 - With CreateProject Modal Integration
// CLEANED: Completely removed hover background boxes to prevent "smudges" on glass
// ADDED: SubscriptionButton integration
// OPTICAL FIX: Baseline aligned Search icon & Congruent 20px (w-5) right-side icons
// RESILIENCE FIX: Bulletproof "!bg-[#HEX]" CTA button with CSS immunity shield
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

import FocusBlockTimer from "./focus/FocusBlockTimer";
import { useFocusBlock } from "../hooks/useFocusBlock";
import FocusBlockScheduler from "./focus/FocusBlockScheduler";

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
      0: { icon: null, color: "text-slate-400 dark:text-zinc-500", bg: "bg-transparent", show: false },
      1: { icon: Zap, color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", show: true },
      2: { icon: Zap, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/20", show: true },
      3: { icon: TrendingUp, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/20", show: true },
      4: { icon: TrendingUp, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", show: true },
      5: { icon: Flame, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", show: true },
    };
    return configs[glowLevel] || configs[0];
  }, [glowLevel]);

  if (!config.show) return null;
  const Icon = config.icon;

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${config.bg} border border-slate-200 dark:border-white/10 transition-all duration-300 ${isFireMode ? "animate-pulse border-orange-300 dark:border-orange-500/30" : ""}`}>
        {Icon && <Icon className={`w-3.5 h-3.5 ${config.color}`} />}
        <span className={`text-xs font-bold ${config.color}`}>{isFireMode ? "🔥" : `L${glowLevel}`}</span>
      </div>
      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`text-xs font-bold ${config.color}`}>{glowState.charAt(0).toUpperCase() + glowState.slice(1)}</div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">{message}</div>
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
      <button onClick={() => setShowMenu(!showMenu)} className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-full transition-transform duration-200 hover:scale-105">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-violet-300 dark:hover:border-violet-500/50 transition-colors duration-200">
          <UserAvatar size={32} name={displayName} avatarUrl={avatarUrl} ringClassName="ring-0" />
        </div>
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-none overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <Link to="/profile" className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 transition-colors" onClick={() => setShowMenu(false)}>
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <UserAvatar size={40} name={displayName} avatarUrl={avatarUrl} ringClassName="ring-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate transition-colors">{displayName}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 transition-colors">View profile</p>
            </div>
          </Link>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors focus-visible:outline-none">
            <Camera className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-zinc-300 transition-colors">{uploading ? "Loading..." : "Change photo"}</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>
      )}
    </div>
  );
};

const IconButton = ({ children, onClick, className = "", badge = null, title = "" }) => (
  <button onClick={onClick} title={title} className={`relative p-2 text-slate-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:scale-110 focus-visible:outline-none transition-all duration-200 ${className}`}>
    {children}
    {badge}
  </button>
);

export default function Navbar({ user, isDarkMode, toggleDarkMode, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const chat = typeof useChat === "function" ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;

  const [showCreateProject, setShowCreateProject] = useState(false);

  const { glowLevel, isFireMode } = useMomentumContext();
  const focusBlock = useFocusBlock();
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
        className={`navbar sticky top-0 z-40 h-14 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 lg:px-6 transition-all duration-500`}
        style={navbarGlowStyle}
        data-momentum={glowLevel}
      >
        <div className="h-full max-w-[1800px] mx-auto flex items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center transition-colors duration-200">
                <Layout className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600" />
              <span className="text-sm font-bold text-slate-800 dark:text-white transition-colors duration-200">{getPageName()}</span>
            </div>
            <div className="hidden lg:block h-5 w-px bg-slate-200 dark:bg-white/10 mx-2 transition-colors duration-200" />
            
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative group">
              {/* Precision optical alignment: top-1/2 -translate-y-1/2 mt-[1.5px] pushes it down to match text baseline perfectly */}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 mt-[1.5px] w-4 h-4 text-slate-400 dark:text-zinc-500 group-focus-within:text-violet-500 transition-colors duration-200" />
              <input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search everything..." 
                className="bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/20 w-52 focus:w-72 transition-all duration-300" 
              />
            </form>

          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            {focusBlock.isActive && (
              <FocusBlockTimer
                isActive={focusBlock.isActive}
                formattedTime={focusBlock.formattedTime}
                progress={focusBlock.progress}
                taskName={focusBlock.taskName}
                presetLabel={focusBlock.presetLabel}
                elapsedMinutes={focusBlock.elapsedMinutes}
                onStop={focusBlock.stop}
                onExtend={() => focusBlock.extend(15)}
                className="mr-4"
              />
            )}
            <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 transition-colors duration-200">
              <SeasonBadge />
              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 transition-colors duration-200" />
              <NextMicroStep />
              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 transition-colors duration-200" />
              <TeamPresence />
              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 transition-colors duration-200" />
              <InlineOnlineIndicator />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block mr-2"><MomentumBadge /></div>
            
            {/* ENGINEERING FIX: 
              1. 'bg-gradient-to-br' is kept as a dummy class to bypass the destructive Navbar.css hover rule.
              2. '!bg-[#7c3aed]' uses Tailwind's arbitrary !important modifier to mathematically guarantee the violet color renders regardless of CSS cascade wars. 
            */}
            <button 
              onClick={() => setShowCreateProject(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-all duration-200 mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 border-none bg-gradient-to-br ${
                isFireMode 
                  ? "!bg-[#f97316] hover:!bg-[#ea580c] !text-white !shadow-lg !shadow-orange-500/30 animate-pulse" 
                  : "!bg-[#7c3aed] hover:!bg-[#6d28d9] !text-white !shadow-lg !shadow-violet-500/30"
              } hover:-translate-y-0.5`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="text-sm hidden sm:inline">New</span>
            </button>
            
            <FocusModeToggle />
            <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block transition-colors duration-200" />
            
            <NavbarSoundToggle />
            <BackgroundColorPicker />
            
            <SubscriptionButton />
            
            <NotificationCenter />
            
            <IconButton onClick={() => navigate("/messages")} badge={unreadTotal > 0 && <UnreadBadge count={unreadTotal} />} title="Messages">
              <MessageCircle className="w-5 h-5" />
            </IconButton>
            
            <IconButton onClick={toggleDarkMode} title={isDarkMode ? "Light mode" : "Dark mode"}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </IconButton>
            
            <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1 transition-colors duration-200" />
            
            <ProfileDropdown user={user} onUploadComplete={() => {}} />
            
            <IconButton onClick={onLogout} className="hover:text-red-500 dark:hover:text-red-400" title="Sign out">
              <LogOut className="w-5 h-5" />
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

      <FocusBlockScheduler
        isOpen={focusBlock.showScheduler}
        onClose={() => focusBlock.setShowScheduler(false)}
        onStart={(config) => {
          focusBlock.start(config);
          focusBlock.setShowScheduler(false);
        }}
        suggestedTasks={[]}
      />
    </>
  );
}
