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
  Sun,
  Moon,
  LogOut,
  MessageCircle,
  Camera,
  Search,
  Plus,
  ChevronRight,
  Layout,
  Zap,
  Flame,
  TrendingUp,
  StickyNote,
} from "lucide-react";

import { formatProfilePicture } from "../utils/imageUtils";
import { useChat } from "../context/ChatContext.jsx";
import UnreadBadge from "./messenger/UnreadBadge.jsx";
import { toast } from "./ui/toast";
import client from "../api/client";
import UserAvatar from "./ui/UserAvatar";

import TeamPresence from "./navbar/TeamPresence.jsx";
import QuickCapture from "./navbar/QuickCapture.jsx";

import NotificationCenter from "./navigation/NotificationCenter";
import { useMomentumContext } from "../contexts/MomentumContext";

import ShipNotification, { useShipNotifications } from "./social/ShipNotification";
import AchievementToast, { useAchievementToasts } from "./social/AchievementToast";

import { NavbarSoundToggle } from "./ui/SoundToggle";
import { useTeamActivitySound } from "../sounds/NotificationSounds";

import SubscriptionButton from "./subscription/SubscriptionButton";

import FocusBlockTimer from "./focus/FocusBlockTimer";
import { useFocusBlock } from "../hooks/useFocusBlock";
import FocusBlockScheduler from "./focus/FocusBlockScheduler";
import "./Navbar.css";

const DEFAULT_PIC = "/default-profile.png";

function getAvatarOverride() {
  try {
    return localStorage.getItem("ss.avatarOverride") || null;
  } catch {
    return null;
  }
}

function resolveAvatarUrl(user) {
  const override = getAvatarOverride();
  if (override) return override;

  return (
    user?.avatarUrl ||
    user?.profilePicture ||
    user?.avatar ||
    user?.photoUrl ||
    user?.profile?.avatarUrl ||
    user?.profile?.photoUrl ||
    null
  );
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
      0: {
        icon: null,
        color: "text-slate-400 dark:text-zinc-500",
        bg: "bg-transparent",
        show: false,
      },
      1: {
        icon: Zap,
        color: "text-violet-500 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-500/10",
        show: true,
      },
      2: {
        icon: Zap,
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-100 dark:bg-violet-500/20",
        show: true,
      },
      3: {
        icon: TrendingUp,
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-100 dark:bg-violet-500/20",
        show: true,
      },
      4: {
        icon: TrendingUp,
        color: "text-blue-500 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-500/10",
        show: true,
      },
      5: {
        icon: Flame,
        color: "text-orange-500 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-500/10",
        show: true,
      },
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
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${config.bg} border border-slate-200 dark:border-white/10 transition-all duration-300 ${
          isFireMode ? "animate-pulse border-orange-300 dark:border-orange-500/30" : ""
        }`}
      >
        {Icon && <Icon className={`w-3.5 h-3.5 ${config.color}`} />}
        <span className={`text-xs font-bold ${config.color}`}>
          {isFireMode ? "🔥" : `L${glowLevel}`}
        </span>
      </div>

      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`text-xs font-bold ${config.color}`}>
            {glowState.charAt(0).toUpperCase() + glowState.slice(1)}
          </div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            {message}
          </div>
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
  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.username ||
    "User";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await client.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const avatarUrl =
        res.data?.data?.profilePicture ||
        res.data?.profilePicture ||
        res.data?.url ||
        res.data?.avatarUrl;

      if (avatarUrl) {
        try {
          localStorage.removeItem("ss.avatarOverride");
        } catch {}

        applyUserEverywhere({ avatarUrl, profilePicture: avatarUrl });

        try {
          await client.put("/users/me", { avatarUrl });
        } catch {}

        toast({ title: "Photo updated", variant: "success" });
        setShowMenu(false);
        onUploadComplete?.();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");

        try {
          localStorage.setItem("ss.avatarOverride", dataUrl);
        } catch {}

        applyUserEverywhere({ avatarUrl: dataUrl });
        toast({ title: "Photo updated (local)", variant: "success" });
        setShowMenu(false);
        onUploadComplete?.();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "";

      if (
        status === 400 ||
        msg.includes("moderation") ||
        msg.includes("community guidelines") ||
        msg.includes("rejected") ||
        msg.includes("nudity") ||
        msg.includes("block")
      ) {
        toast({
          title: "Photo rejected",
          description: msg || "This image violates our community guidelines.",
          variant: "error",
        });
      } else {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result || "");

            try {
              localStorage.setItem("ss.avatarOverride", dataUrl);
            } catch {}

            applyUserEverywhere({ avatarUrl: dataUrl });
            toast({ title: "Photo updated (local)", variant: "success" });
            setShowMenu(false);
            onUploadComplete?.();
          };
          reader.readAsDataURL(file);
        } catch {
          toast({ title: "Failed to update photo", variant: "error" });
        }
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-full transition-transform duration-200 hover:scale-105"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-violet-300 dark:hover:border-violet-500/50 transition-colors duration-200">
          <UserAvatar
            size={32}
            name={displayName}
            avatarUrl={avatarUrl}
            ringClassName="ring-0"
          />
        </div>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-none overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 transition-colors"
            onClick={() => setShowMenu(false)}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <UserAvatar
                size={40}
                name={displayName}
                avatarUrl={avatarUrl}
                ringClassName="ring-0"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate transition-colors">
                {displayName}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 transition-colors">
                View profile
              </p>
            </div>
          </Link>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors focus-visible:outline-none"
          >
            <Camera className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-zinc-300 transition-colors">
              {uploading ? "Loading..." : "Change photo"}
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

const IconButton = ({
  children,
  onClick,
  className = "",
  badge = null,
  title = "",
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative p-2 text-slate-600 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-300 hover:scale-110 focus-visible:outline-none transition-all duration-200 ${className}`}
  >
    {children}
    {badge}
  </button>
);


export default function Navbar({
  user,
  isDarkMode,
  toggleDarkMode,
  onLogout,
  onOpenQuickNotes = () => {},
  quickNotesCount = 0,
  onOpenCreateProject = () => {},
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const chat = typeof useChat === "function" ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;

  // NAVBAR THEME DETECTION BRIDGE
  // App.jsx does not currently pass isDarkMode/toggleDarkMode into Navbar.
  // Detect the real active theme from <html> so the navbar follows Settings.jsx.
  const readDocumentDarkMode = () => {
    if (typeof document === "undefined") return Boolean(isDarkMode);

    const root = document.documentElement;
    const dataTheme = root.getAttribute("data-theme");
    const storedTheme =
      window.localStorage.getItem("ss.theme") ||
      window.localStorage.getItem("theme") ||
      window.localStorage.getItem("openShareTheme") ||
      window.localStorage.getItem("sharesync-theme");

    return (
      root.classList.contains("dark") ||
      dataTheme === "dark" ||
      storedTheme === "dark" ||
      Boolean(isDarkMode)
    );
  };

  const [detectedDarkMode, setDetectedDarkMode] = useState(readDocumentDarkMode);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const syncTheme = () => {
      setDetectedDarkMode(readDocumentDarkMode());
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    window.addEventListener("storage", syncTheme);
    window.addEventListener("theme:toggled", syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("theme:toggled", syncTheme);
    };
  }, [isDarkMode]);

  const effectiveIsDarkMode = detectedDarkMode || Boolean(isDarkMode);

  const handleNavbarThemeToggle = () => {
    if (typeof toggleDarkMode === "function") {
      toggleDarkMode();
      return;
    }

    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const nextTheme = effectiveIsDarkMode ? "light" : "dark";

    root.classList.toggle("dark", nextTheme === "dark");
    root.setAttribute("data-theme", nextTheme);

    if (document.body) {
      document.body.dataset.theme = nextTheme;
      document.body.style.backgroundColor =
        nextTheme === "dark" ? "#09090B" : "#F8FAFC";
    }

    // Keep the new Settings.jsx source of truth and older legacy keys synced.
    window.localStorage.setItem("ss.theme", nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    window.localStorage.setItem("openShareTheme", nextTheme);
    window.localStorage.setItem("sharesync-theme", nextTheme);

    setDetectedDarkMode(nextTheme === "dark");

    try {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("theme:toggled", { detail: { theme: nextTheme } }));
    } catch {}
  };


  const { glowLevel, isFireMode } = useMomentumContext();
  const focusBlock = useFocusBlock();

  const {
    notifications: shipNotifications,
    addNotification: addShipNotification,
    dismissNotification: dismissShipNotification,
  } = useShipNotifications();

  const {
    toasts: achievementToasts,
    addToast: addAchievementToast,
    dismissToast: dismissAchievementToast,
  } = useAchievementToasts();

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



  // NAVBAR INLINE BACKGROUND FIX
  // Do not set `background` here. Inline background styles override Tailwind's
  // `dark:` classes. The navbar surface is controlled by className so it follows
  // the actual app theme reliably.
  const navbarGlowStyle = useMemo(() => {
    if (isFireMode) {
      return {
        boxShadow:
          "0 1px 0 rgba(249, 115, 22, 0.16), 0 4px 20px rgba(249, 115, 22, 0.10)",
        borderColor: "rgba(249, 115, 22, 0.18)",
      };
    }

    if (glowLevel >= 4) {
      return {
        boxShadow:
          "0 1px 0 rgba(139, 92, 246, 0.14), 0 4px 20px rgba(139, 92, 246, 0.10)",
        borderColor: "rgba(139, 92, 246, 0.16)",
      };
    }

    if (glowLevel >= 3) {
      return {
        boxShadow: "0 1px 0 rgba(139, 92, 246, 0.08)",
      };
    }

    return {};
  }, [glowLevel, isFireMode]);

  const navbarSurfaceStyle = useMemo(
    () => ({
      background: effectiveIsDarkMode
        ? "linear-gradient(90deg, rgba(9,9,11,0.94) 0%, rgba(15,15,20,0.91) 50%, rgba(9,9,11,0.94) 100%)"
        : "rgba(255,255,255,0.86)",
      borderColor: effectiveIsDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(226,232,240,0.78)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      ...navbarGlowStyle,
    }),
    [effectiveIsDarkMode, navbarGlowStyle]
  );

  return (
    <>
      <header
        className="navbar navbar-dark-surface-refined sticky top-0 z-40 h-14 border-b border-slate-200/70 bg-white/85 px-4 text-slate-900 backdrop-blur-xl transition-all duration-500 dark:border-white/[0.08] dark:!bg-[#09090B]/92 dark:text-zinc-100 lg:px-6"
        style={navbarSurfaceStyle}
        data-momentum={glowLevel}
      >
        <div className="h-full max-w-[1800px] mx-auto flex items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center transition-colors duration-200">
                <Layout className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="text-sm font-bold text-slate-800 dark:text-white transition-colors duration-200">
                {getPageName()}
              </span>
            </div>

            <div className="hidden lg:block h-5 w-px bg-slate-200 dark:bg-white/10 mx-2 transition-colors duration-200" />

            <form onSubmit={handleSearch} className="hidden md:flex items-center relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 mt-[1.5px] w-4 h-4 text-slate-500 dark:text-zinc-400 group-focus-within:text-violet-600 dark:group-focus-within:text-violet-300 transition-colors duration-200" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search everything..."
                className="navbar-dark-search bg-white/55 border border-slate-200/70 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-all duration-300 hover:border-slate-300 hover:bg-white/75 focus:w-72 focus:border-violet-400 focus:bg-white/90 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.06] dark:focus:border-violet-500/60 dark:focus:bg-white/[0.07] dark:focus:ring-violet-500/20 w-52"
              />
            </form>
          </div>

          <div className="flex-1 min-w-0 flex items-center justify-start px-4">
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
              <TeamPresence />
              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 transition-colors duration-200" />

              <button
                type="button"
                onClick={onOpenQuickNotes}
                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-700 transition-all duration-200 hover:bg-white/70 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-200 dark:hover:bg-white/[0.07] dark:hover:text-violet-300"
                title="Open Quick Notes"
              >
                <StickyNote className="h-4 w-4 text-violet-700 dark:text-violet-300" />
                <span>Quick Notes</span>
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                  {quickNotesCount}
                </span>
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block mr-2">
              <MomentumBadge />
            </div>

            <button
              onClick={onOpenCreateProject}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-all duration-200 mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 border-none bg-gradient-to-br ${
                isFireMode
                  ? "!bg-[#f97316] hover:!bg-[#ea580c] !text-white !shadow-lg !shadow-orange-500/30 animate-pulse"
                  : "!bg-[#7c3aed] hover:!bg-[#6d28d9] !text-white !shadow-lg !shadow-violet-500/30"
              } hover:-translate-y-0.5`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="text-sm hidden sm:inline">New</span>
            </button>

            <div className="hidden md:block shrink-0">
              <NavbarSoundToggle />
            </div>

            <BackgroundColorPicker />

            <div
              className="hidden md:flex shrink-0 items-center border-l border-slate-200/70 pl-3 ml-1 dark:border-white/10"
              aria-label="Subscription and plan status"
            >
              <div className="relative rounded-2xl bg-gradient-to-r from-violet-200/70 via-amber-200/70 to-cyan-200/70 p-[1px] shadow-sm shadow-violet-500/10 dark:from-violet-500/25 dark:via-amber-500/25 dark:to-cyan-500/25">
                <div className="rounded-[15px] bg-white/80 p-0.5 backdrop-blur-md dark:bg-[#0B0B10]/80">
                  <SubscriptionButton />
                </div>
              </div>
            </div>

            <NotificationCenter />

            <IconButton
              onClick={() => navigate("/messages")}
              badge={unreadTotal > 0 && <UnreadBadge count={unreadTotal} />}
              title="Messages"
            >
              <MessageCircle className="w-5 h-5" />
            </IconButton>

            <div className="hidden sm:block">
              <IconButton
                onClick={handleNavbarThemeToggle}
                title={effectiveIsDarkMode ? "Light mode" : "Dark mode"}
              >
                {effectiveIsDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </IconButton>
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block transition-colors duration-200" />

            <ProfileDropdown user={user} onUploadComplete={() => {}} />

            <div className="hidden sm:block">
              <IconButton
                onClick={onLogout}
                className="hover:text-red-500 dark:hover:text-red-400"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </IconButton>
            </div>
          </div>
        </div>
      </header>


      <ShipNotification
        notifications={shipNotifications}
        onDismissNotification={dismissShipNotification}
        position="top-right"
        maxVisible={3}
        autoDismiss={6000}
      />

      <AchievementToast
        toasts={achievementToasts}
        onDismissToast={dismissAchievementToast}
        position="top-right"
        maxVisible={2}
        autoDismiss={5000}
      />

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
