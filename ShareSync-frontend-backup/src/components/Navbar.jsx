// src/components/Navbar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC NAVBAR v4.0 - "The Gallery Walk" Light Theme
// Phase C: Momentum + Phase E: Social Proof + Phase F: Sound
// + Phase N: NotificationCenter Integration + Background Color Picker
// ═══════════════════════════════════════════════════════════════════════════════
//
// CHANGES IN v4.0:
// - Updated to light theme (white background, slate text)
// - Preserved ALL existing functionality
// - NO BACKEND CHANGES
//
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
} from "lucide-react";

import { formatProfilePicture } from "../utils/imageUtils";
import { useChat } from "../context/ChatContext.jsx";
import UnreadBadge from "./messenger/UnreadBadge.jsx";
import { toast } from "./ui/toast";
import UserAvatar from "./ui/UserAvatar";

// NAVBAR COMPONENTS
import NextMicroStep from "./navbar/NextMicroStep";
import FocusModeToggle from "./navbar/FocusModeToggle";
import SeasonBadge from "./navbar/SeasonBadge";
import TeamPresence from "./navbar/TeamPresence.jsx";
import QuickCapture from "./navbar/QuickCapture.jsx";

// ⭐ PHASE N: Import new NotificationCenter
import NotificationCenter from "./navigation/NotificationCenter";

// ⭐ PHASE C: Import momentum context
import { useMomentumContext } from "../contexts/MomentumContext";

// ⭐ PHASE E: Import social proof components
import ShipNotification, { useShipNotifications } from "./social/ShipNotification";
import AchievementToast, { useAchievementToasts } from "./social/AchievementToast";
import { InlineOnlineIndicator } from "./social/OnlineIndicator";

// ⭐ PHASE F: Import sound components and hooks
import { NavbarSoundToggle } from "./ui/SoundToggle";
import { useTeamActivitySound } from "../sounds/NotificationSounds";

const DEFAULT_PIC = "/default-profile.png";

/* ─────────────────────────────────────────────────────────────────────────
   AVATAR RESOLUTION (frontend-safe) - UNCHANGED
───────────────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────────────
   BACKGROUND COLOR PICKER - UNCHANGED (kept as-is)
───────────────────────────────────────────────────────────────────────── */
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

  const hexToRgb = (hex) => {
    if (!hex) return null;
    const clean = hex.replace("#", "").trim();
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
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

  const rgbToHex = ({ r, g, b }) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;

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

  const applySurfaceTheme = (baseHex) => {
    const root = document.documentElement;
    const app = document.querySelector(".app-container");

    if (!baseHex) {
      ["--surface-0", "--surface-1", "--surface-2", "--surface-3"].forEach((v) => {
        setVarPair(root, v, null);
        setVarPair(app, v, null);
      });
      document.body.style.background = "";
      return;
    }

    const base = hexToRgb(baseHex);
    if (!base) return;

    const white = { r: 255, g: 255, b: 255 };
    const s0 = baseHex;
    const s1 = rgbToHex(mixRgb(base, white, 0.06));
    const s2 = rgbToHex(mixRgb(base, white, 0.1));
    const s3 = rgbToHex(mixRgb(base, white, 0.14));

    setVarPair(root, "--surface-0", s0);
    setVarPair(root, "--surface-1", s1);
    setVarPair(root, "--surface-2", s2);
    setVarPair(root, "--surface-3", s3);

    setVarPair(app, "--surface-0", s0);
    setVarPair(app, "--surface-1", s1);
    setVarPair(app, "--surface-2", s2);
    setVarPair(app, "--surface-3", s3);

    document.body.style.background = `radial-gradient(1200px 800px at 20% 0%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 55%), ${s0}`;
    document.documentElement.setAttribute("data-ss-bg", selectedColor);
  };

  React.useEffect(() => {
    const onDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
    };
    if (showPicker) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showPicker]);

  React.useEffect(() => {
    const found = BACKGROUND_COLORS.find((c) => c.id === selectedColor);
    applySurfaceTheme(found?.value ?? null);

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
        className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200" 
        onClick={() => setShowPicker((s) => !s)} 
        aria-label="Background color" 
        title="Background color"
      >
        🎨
      </button>

      {showPicker && (
        <div className="absolute right-0 top-full mt-2 w-80 p-4 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100]">
          <div className="text-xs font-medium text-slate-600 mb-3">Background Color</div>

          <div className="grid grid-cols-4 gap-3">
            {BACKGROUND_COLORS.map((c) => (
              <div key={c.id} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleSelect(c.id)}
                  className={`
                    relative w-12 h-12 rounded-2xl overflow-hidden
                    border transition-all duration-200
                    ${selectedColor === c.id ? "border-violet-500 ring-2 ring-violet-200 scale-[1.03]" : "border-slate-200 hover:border-slate-400"}
                  `}
                  style={{
                    background: `radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%), ${c.preview}`,
                  }}
                  title={c.name}
                >
                  {selectedColor === c.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-violet-500 text-lg">✓</span>
                    </div>
                  )}
                </button>

                <div className={`text-[10px] leading-none w-14 text-center truncate ${selectedColor === c.id ? "text-slate-700" : "text-slate-500"}`}>
                  {c.name}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-[10px] text-slate-500">Selected: {selectedName}</div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MOMENTUM BADGE - Compact indicator for navbar
   ✅ UPDATED: Light theme colors
───────────────────────────────────────────────────────────────────────── */
const MomentumBadge = () => {
  const { glowLevel, glowState, isFireMode, message } = useMomentumContext();
  const [showTooltip, setShowTooltip] = useState(false);

  const config = useMemo(() => {
    const configs = {
      0: { icon: null, color: "text-slate-400", bg: "bg-slate-100", show: false },
      1: { icon: Zap, color: "text-violet-500", bg: "bg-violet-50", show: true },
      2: { icon: Zap, color: "text-violet-600", bg: "bg-violet-100", show: true },
      3: { icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-100", show: true },
      4: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50", show: true },
      5: { icon: Flame, color: "text-orange-500", bg: "bg-orange-50", show: true },
    };
    return configs[glowLevel] || configs[0];
  }, [glowLevel]);

  if (!config.show) return null;

  const Icon = config.icon;

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <div
        className={`
          flex items-center gap-1.5
          px-2.5 py-1.5 rounded-lg
          ${config.bg} border border-slate-200
          transition-all duration-300
          ${isFireMode ? "animate-pulse border-orange-300" : ""}
        `}
      >
        {Icon && <Icon className={`w-3.5 h-3.5 ${config.color}`} />}
        <span className={`text-xs font-medium ${config.color}`}>{isFireMode ? "🔥" : `L${glowLevel}`}</span>
      </div>

      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-xl z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`text-xs font-medium ${config.color}`}>{glowState.charAt(0).toUpperCase() + glowState.slice(1)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{message}</div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   PROFILE DROPDOWN - ✅ UPDATED: Light theme
───────────────────────────────────────────────────────────────────────── */
const ProfileDropdown = ({ user, onUploadComplete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  const avatarUrl = resolveAvatarUrl(user) || DEFAULT_PIC;
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "User";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
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

        try {
          localStorage.setItem("ss.avatarOverride", dataUrl);
        } catch {}

        applyUserEverywhere({ avatarUrl: dataUrl });

        toast({
          title: "Photo updated (local)",
          description: "Backend upload isn't enabled yet — UI will still show your new photo.",
          variant: "success",
        });

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
      <button onClick={() => setShowMenu(!showMenu)} className="flex items-center outline-none">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-violet-300 transition-colors">
          <UserAvatar size={32} name={displayName} avatarUrl={avatarUrl} ringClassName="ring-0" />
        </div>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 transition-colors"
            onClick={() => setShowMenu(false)}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <UserAvatar size={40} name={displayName} avatarUrl={avatarUrl} ringClassName="ring-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
              <p className="text-xs text-slate-500">View profile</p>
            </div>
          </Link>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left transition-colors"
          >
            <Camera className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">{uploading ? "Loading..." : "Change photo"}</span>
          </button>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   ICON BUTTON - ✅ UPDATED: Light theme
───────────────────────────────────────────────────────────────────────── */
const IconButton = ({ children, onClick, className = "", badge = null, title = "" }) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 ${className}`}
  >
    {children}
    {badge}
  </button>
);

/* ─────────────────────────────────────────────────────────────────────────
   MAIN NAVBAR - ✅ UPDATED: Light theme
───────────────────────────────────────────────────────────────────────── */
export default function Navbar({ user, isDarkMode, toggleDarkMode, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const chat = typeof useChat === "function" ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;

  // PHASE C: Get momentum state for navbar glow
  const { glowLevel, isFireMode } = useMomentumContext();

  // PHASE E: Ship notification and achievement toast managers
  const { notifications: shipNotifications, addNotification: addShipNotification, dismissNotification: dismissShipNotification } = useShipNotifications();
  const { toasts: achievementToasts, addToast: addAchievementToast, dismissToast: dismissAchievementToast } = useAchievementToasts();

  // PHASE F: Team activity sound
  const { playTeamActivity } = useTeamActivitySound();

  // PHASE E + F: Listen for team ship events with sounds (UNCHANGED)
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

  // Get current page name from path
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

  // ✅ UPDATED: Light theme navbar glow styles
  const navbarGlowStyle = useMemo(() => {
    if (isFireMode) {
      return {
        boxShadow: "0 1px 0 rgba(249, 115, 22, 0.1), 0 4px 20px rgba(249, 115, 22, 0.08)",
        borderColor: "rgba(249, 115, 22, 0.15)",
      };
    }
    if (glowLevel >= 4) {
      return {
        boxShadow: "0 1px 0 rgba(139, 92, 246, 0.08), 0 4px 20px rgba(139, 92, 246, 0.06)",
        borderColor: "rgba(139, 92, 246, 0.1)",
      };
    }
    if (glowLevel >= 3) {
      return { boxShadow: "0 1px 0 rgba(139, 92, 246, 0.04)" };
    }
    return {};
  }, [glowLevel, isFireMode]);

  return (
    <>
      {/* ✅ UPDATED: Light theme navbar */}
      <header
        className={`navbar sticky top-0 z-40 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 transition-all duration-500`}
        style={navbarGlowStyle}
        data-momentum={glowLevel}
      >
        <div className="h-full max-w-[1800px] mx-auto flex items-center">
          {/* LEFT: Breadcrumb + Search */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <Layout className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-medium text-slate-800">{getPageName()}</span>
            </div>

            <div className="hidden lg:block h-5 w-px bg-slate-200 mx-2" />

            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search everything..."
                className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 w-52 focus:w-72 transition-all duration-200"
              />
            </form>
          </div>

          {/* CENTER: Status Bar - ✅ UPDATED: Light theme */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200">
              <SeasonBadge />
              <div className="w-px h-4 bg-slate-200" />
              <NextMicroStep />
              <div className="w-px h-4 bg-slate-200" />
              <TeamPresence />
              <div className="w-px h-4 bg-slate-200" />
              <InlineOnlineIndicator />
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1">
            {/* Momentum Badge */}
            <div className="hidden sm:block mr-2">
              <MomentumBadge />
            </div>

            {/* Primary Action: New - ✅ UPDATED: Light theme shadow */}
            <button
              className={`w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white flex items-center justify-center hover:from-violet-600 hover:to-violet-700 hover:shadow-lg hover:shadow-violet-200 transition-all duration-200 mr-1 ${
                isFireMode ? "animate-pulse shadow-lg shadow-orange-200" : "shadow-md shadow-violet-200"
              }`}
              style={{
                background: isFireMode
                  ? "linear-gradient(135deg, #F97316 0%, #8B5CF6 100%)"
                  : "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
              }}
            >
              <Plus className="w-4 h-4" />
            </button>

            <QuickCapture />
            <FocusModeToggle />

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Sound Toggle */}
            <NavbarSoundToggle />

            {/* Background Color Picker */}
            <BackgroundColorPicker />

            {/* NotificationCenter */}
            <NotificationCenter />

            {/* Messages */}
            <IconButton
              onClick={() => navigate("/messages")}
              badge={unreadTotal > 0 && <UnreadBadge count={unreadTotal} />}
              title="Messages"
            >
              <MessageCircle className="w-4 h-4" />
            </IconButton>

            {/* Dark Mode Toggle */}
            <IconButton onClick={toggleDarkMode} title={isDarkMode ? "Light mode" : "Dark mode"}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </IconButton>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Profile */}
            <ProfileDropdown user={user} onUploadComplete={() => {}} />

            {/* Logout - ✅ UPDATED: Light theme hover */}
            <IconButton onClick={onLogout} className="hover:text-red-500 hover:bg-red-50" title="Sign out">
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
