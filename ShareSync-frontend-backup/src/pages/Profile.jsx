// src/pages/Profile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROFILE PAGE v4.1 - "The Gallery Walk" Light Theme
// Phase 7: Added Profile Edit Modal
// ⭐ Phase 1 Fix: Added error state with retry button
// ⭐ Phase 3 Fix: Smart URL ID handling to view other users' profiles
// ═══════════════════════════════════════════════════════════════════════════════
//
// THEME: "The Personal Gallery"
//
// COLOR MAP:
// - Page Background: #F8FAFC → #EEF2FF gradient
// - Avatar Ring: Aurora Gradient
// - Rank Badge: Violet → Indigo gradient
// - Stats Cards: #FFFFFF
// - Skill Bar Fill: Ocean Gradient
// - "Core Verified" Badge: #2DD4BF bg, white text (teal)
// - Edit Button: #3B82F6 (blue action)
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import client from "../api/client";
// ⭐ NEW: Imported getUserById
import { getMe, getPublicUser, updateProfile, getUserById } from "../api/user";
import {
  Camera,
  TrendingUp,
  Brain,
  Activity,
  ShieldCheck,
  Download,
  Star,
  Edit3,
  X,
  Save,
  Loader2,
  RefreshCw,
  Folder,
  CheckCircle2,
  Clock,
  Flame,
} from "lucide-react";
import { toast } from "../components/ui/toast";
import UserAvatar from "../components/ui/UserAvatar";
import { resolveDisplayName } from "../utils/resolveDisplayName";

// Analytics Components
import CollaborationStyleCard from "../components/Profile/CollaborationStyleCard";
import WorkPersonality from "../components/analytics/WorkPersonality";
import RoleClassificationCard from "../components/Profile/RoleClassificationCard";

// Growth Components (Phase K)
import SkillRadarChart from "../components/growth/SkillRadarChart";
import EvolutionMoments from "../components/growth/EvolutionMoments";
import GrowthSuggestions from "../components/growth/GrowthSuggestions";
import TrendCharts from "../components/growth/TrendCharts";

// Growth Hook
import { useGrowthTrack } from "../hooks/useGrowthTrack";
import ProfileStrength from "../components/profile/ProfileStrength";
import { useAnalytics } from "../contexts/AnalyticsContext";
import useDocumentTitle from "../hooks/useDocumentTitle";

/* ─────────────────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────────────────── */
const calculateReliability = (completed, total) =>
  !total || total === 0 ? 0 : Math.round((completed / total) * 100);

function xpForLevel(level) {
  if (level <= 1) return 0;
  let sum = 0;
  for (let i = 1; i < level; i++) sum += Math.round(75 + Math.pow(i, 1.35) * 35);
  return sum;
}

function levelForXp(xp = 0) {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}

function resolveUserName(user) {
  // Delegates to shared utility — never returns "User" as fallback
  return resolveDisplayName(user);
}

function safeParseJSON(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem("ss.user");
    if (!raw) return null;
    const parsed = safeParseJSON(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readAvatarOverride() {
  try {
    return localStorage.getItem("ss.avatarOverride") || null;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   PROFILE EDIT MODAL - Phase 7
───────────────────────────────────────────────────────────────────────── */
const ProfileEditModal = ({ user, onClose, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    jobTitle: user?.jobTitle || '',
    company: user?.company || '',
  });

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.put('/users/me', editData);
      toast({ title: 'Profile updated!', variant: 'success' });
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({ 
        title: 'Update failed', 
        description: error?.response?.data?.message || error?.message || 'Could not save profile',
        variant: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
      <div className="w-full max-w-lg bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={editData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={editData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Bio
            </label>
            <textarea
              value={editData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
              placeholder="Tell others about yourself..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={editData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="City, Country"
            />
          </div>

          {/* Work Info Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={editData.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Company
              </label>
              <input
                type="text"
                value={editData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="Company name"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Website
            </label>
            <input
              type="url"
              value={editData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all shadow-md disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   PROFILE PHOTO EDITOR - Light theme with Aurora ring
───────────────────────────────────────────────────────────────────────── */
const ProfilePhotoEditor = ({ user, isOwnProfile, onPhotoUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const localOverride = readAvatarOverride();
  const storedUser = readStoredUser();
  const storedAvatar = storedUser?.avatarUrl || storedUser?.profilePicture || null;

  const backendAvatar =
    user?.avatarUrl ||
    user?.profilePicture ||
    user?.avatar ||
    user?.photoUrl ||
    user?.profile?.avatarUrl ||
    user?.profile?.photoUrl ||
    null;

  const displayUrl =
    previewUrl || localOverride || storedAvatar || backendAvatar || "/default-profile.png";

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setIsEditing(true);
  };

  const applyUserEverywhere = (nextFields = {}) => {
    try {
      const raw = localStorage.getItem("ss.user");
      const current = raw ? JSON.parse(raw) : {};
      const next = { ...current, ...nextFields };
      localStorage.setItem("ss.user", JSON.stringify(next));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", variant: "error" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedFile);
      formData.append("avatar", selectedFile);
      const out = await updateProfile(formData);
      const avatarUrl =
        out?.avatarUrl || out?.user?.avatarUrl || out?.data?.avatarUrl ||
        out?.profilePicture || out?.user?.profilePicture || out?.data?.profilePicture || null;

      if (avatarUrl) {
        try { localStorage.removeItem("ss.avatarOverride"); } catch {}
        applyUserEverywhere({ avatarUrl, profilePicture: avatarUrl });
        toast({ title: "Photo updated", variant: "success" });
        setIsEditing(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        onPhotoUpdate?.();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        try { localStorage.setItem("ss.avatarOverride", dataUrl); } catch {}
        applyUserEverywhere({ avatarUrl: dataUrl, profilePicture: dataUrl });
        toast({ title: "Photo updated (local)", variant: "success" });
        setIsEditing(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        onPhotoUpdate?.();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || "");
          try { localStorage.setItem("ss.avatarOverride", dataUrl); } catch {}
          applyUserEverywhere({ avatarUrl: dataUrl, profilePicture: dataUrl });
          toast({ title: "Photo updated (local)", variant: "success" });
          setIsEditing(false);
          setSelectedFile(null);
          setPreviewUrl(null);
          onPhotoUpdate?.();
        };
        reader.readAsDataURL(selectedFile);
        return;
      } catch {}
      toast({
        title: "Update failed",
        description: error?.response?.data?.message || error?.message || "Could not upload photo",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  // Aurora gradient for avatar ring
  const auroraGradient = 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)';

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-40 h-40 group">
        {/* Aurora gradient ring */}
        <div 
          className="absolute inset-0 rounded-full p-1"
          style={{ background: auroraGradient }}
        >
          <div className="w-full h-full rounded-full bg-white dark:bg-black" />
        </div>
        
        {/* Avatar container */}
        <div className="absolute inset-2 rounded-full overflow-hidden border-4 border-white dark:border-[#111113] bg-slate-100 dark:bg-zinc-800 shadow-lg shadow-violet-100 dark:shadow-violet-900/20">
          <UserAvatar
            size={144}
            name={user?.name || user?.username || "User"}
            avatarUrl={displayUrl}
            className="w-full h-full"
            ringClassName="ring-0"
          />
          {isOwnProfile && (
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-violet-500 rounded-full hover:bg-violet-600 transition-colors shadow-lg"
                aria-label="Change profile photo"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
        
        {/* Rank badge with violet gradient */}
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg shadow-md"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
        >
          <span className="text-xs font-medium text-white">Rank {levelForXp(user?.xp)}</span>
        </div>
      </div>
      
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      
      {/* Upload modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="w-full max-w-sm p-6 bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 text-center">Update Photo?</h3>
            <div 
              className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-6 p-0.5 shadow-lg"
              style={{ background: auroraGradient }}
            >
              <img src={previewUrl} className="w-full h-full object-cover rounded-full" alt="Preview" />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setSelectedFile(null); setPreviewUrl(null); }}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl text-white font-medium transition-colors shadow-md shadow-blue-200 dark:shadow-blue-900/20"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
              >
                {uploading ? "Uploading..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   STAT CARD - Light theme with violet shadows
───────────────────────────────────────────────────────────────────────── */
const StatCard = ({ value, label, color = "text-slate-800 dark:text-zinc-100", gradient = false }) => (
  <div 
    className="p-5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all duration-200"
    style={{
      boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)',
    }}
  >
    <div 
      className={`text-3xl font-semibold ${gradient ? '' : color}`}
      style={gradient ? {
        background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      } : {}}
    >
      {value}
    </div>
    <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mt-1">{label}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   SKILL BAR - Ocean Gradient
───────────────────────────────────────────────────────────────────────── */
const SkillBar = ({ value, max = 100 }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-700"
        style={{ 
          width: `${percentage}%`,
          background: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)'
        }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE - "The Personal Gallery"
───────────────────────────────────────────────────────────────────────── */
export default function Profile() {
  useDocumentTitle("Profile");
  // ⭐ FIX: Safely pull the ID directly from the URL if it exists
  const { username: routeUsername, id, userId: routeUserId } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [publicUser, setPublicUser] = useState(null);
  const [profileAnalytics, setProfileAnalytics] = useState(null);
  
  // Phase 7: Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [userProjects, setUserProjects] = useState([]);
  const [recentShips, setRecentShips] = useState([]);

  // ⭐ PHASE 1 FIX: Error state with retry capability
  const [error, setError] = useState(false);

  // ⭐ FIX: Treat this as a public route if an ID is present in the URL
  const isPublicRoute = useMemo(
    () => Boolean(routeUsername) && location.pathname.startsWith("/u/"),
    [id, routeUsername, location.pathname]
  );

  const isViewingOtherUser = useMemo(
    () => Boolean(id || routeUserId),
    [id, routeUserId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      if (isPublicRoute) {
        // ⭐ FIX: If we have an ID, grab that exact user from the database
        const u = (id || routeUserId) ? await getUserById(id || routeUserId) : await getPublicUser(routeUsername);
        setPublicUser(u);

        // We still need to fetch "Me" silently to check if we happen to be viewing our own profile
        try {
          const rawResponse = await getMe();
          let userData = null;
          if (rawResponse?.user && typeof rawResponse.user === 'object') userData = rawResponse.user;
          else if (rawResponse?.data?.user && typeof rawResponse.data.user === 'object') userData = rawResponse.data.user;
          else if (rawResponse?.data && typeof rawResponse.data === 'object' && !Array.isArray(rawResponse.data)) userData = rawResponse.data;
          else if (rawResponse && typeof rawResponse === 'object' && (rawResponse._id || rawResponse.id || rawResponse.email)) userData = rawResponse;
          else userData = rawResponse || {};

          const storedUser = readStoredUser();
          const storedOverride = readAvatarOverride();
          const storedAvatar = storedOverride || storedUser?.avatarUrl || storedUser?.profilePicture || null;
          const merged = storedAvatar ? { ...userData, avatarUrl: storedAvatar, profilePicture: storedAvatar } : userData;
          setMe(merged);
        } catch (e) {
          // Ignore error silently. It just means edit privileges will default to false.
        }

      } else if (isViewingOtherUser) {
        const otherUser = await getUserById(id || routeUserId);
        console.log('[Profile] getUserById response:', otherUser);
        setMe(otherUser);
      } else {
        // EXACT EXISTING GET ME LOGIC
        const rawResponse = await getMe();
        console.log('[Profile] getMe() raw response:', rawResponse);

        let userData = null;
        if (rawResponse?.user && typeof rawResponse.user === 'object') {
          userData = rawResponse.user;
          console.log('[Profile] Extracted user from response.user');
        } else if (rawResponse?.data?.user && typeof rawResponse.data.user === 'object') {
          userData = rawResponse.data.user;
          console.log('[Profile] Extracted user from response.data.user');
        } else if (rawResponse?.data && typeof rawResponse.data === 'object' && !Array.isArray(rawResponse.data)) {
          userData = rawResponse.data;
          console.log('[Profile] Extracted user from response.data');
        } else if (rawResponse && typeof rawResponse === 'object' && (rawResponse._id || rawResponse.id || rawResponse.email)) {
          userData = rawResponse;
          console.log('[Profile] Using response directly as user object');
        } else {
          console.warn('[Profile] Could not extract user from response:', rawResponse);
          userData = rawResponse || {};
        }

        console.log('[Profile] Final userData:', userData);
        console.log('[Profile] User fields available:', Object.keys(userData || {}));

        const storedUser = readStoredUser();
        const storedOverride = readAvatarOverride();
        const storedAvatar = storedOverride || storedUser?.avatarUrl || storedUser?.profilePicture || null;
        const merged = storedAvatar ? { ...userData, avatarUrl: storedAvatar, profilePicture: storedAvatar } : userData;
        setMe(merged);

        try {
          const analytics = await client.get("/users/profile-analytics");
          setProfileAnalytics(analytics.data);
        } catch (err) {
          console.warn("[Profile] analytics load failed", err?.message || err);
          setProfileAnalytics(null);
        }

        // Fetch real stats and merge into user object
        try {
          const statsRes = await client.get("/users/me/stats");
          const stats = statsRes.data?.data || statsRes.data;
          if (stats) {
            setMe(prev => ({
              ...prev,
              totalShips: stats.totalShips ?? stats.ships ?? prev?.totalShips ?? 0,
              currentStreak: stats.streakDays ?? prev?.currentStreak ?? 0,
              weeklyShips: stats.weeklyShips ?? 0,
              completionRate: stats.completionRate ?? stats.focus ?? 0,
              efficiency: stats.efficiency ?? 0,
            }));
          }
        } catch (err) {
          console.warn("[Profile] stats load failed", err?.message || err);
        }

        // Fetch user's projects for portfolio
        try {
          const projRes = await client.get("/projects");
          const projs = Array.isArray(projRes.data) ? projRes.data : (projRes.data?.data || projRes.data?.projects || []);
          setUserProjects(projs.slice(0, 6));
        } catch (_) {}

        // Fetch recent completed tasks
        try {
          const shipsRes = await client.get("/tasks", { params: { status: "done", limit: 5, sortBy: "completedAt", sortOrder: "desc" } });
          const tasks = shipsRes.data?.data?.tasks || shipsRes.data?.tasks || (Array.isArray(shipsRes.data?.data) ? shipsRes.data.data : []);
          setRecentShips(Array.isArray(tasks) ? tasks.slice(0, 5) : []);
        } catch (_) {}
      }
    } catch (e) {
      console.error('[Profile] Failed to load user data:', e);
      console.error('[Profile] Error details:', e?.response?.data || e?.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isPublicRoute, isViewingOtherUser, routeUsername, id, routeUserId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isPublicRoute || isViewingOtherUser) return;
    let poll = null;
    const onFocus = () => load();
    const onVisibility = () => { if (document.visibilityState === "visible") load(); };
    const onStorage = (e) => {
      const key = e?.key || "";
      if (key.includes("user") || key.includes("profile") || key.includes("token") || key.includes("auth") || !key) load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    poll = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      if (poll) window.clearInterval(poll);
    };
  }, [isPublicRoute, isViewingOtherUser, load]);

  const user = isPublicRoute ? publicUser : me;
  
  // ⭐ FIX: Safely check if the profile we are viewing belongs to us
  const myId = me?._id || me?.id;
  const viewId = user?._id || user?.id;
  const isOwnProfile = !isPublicRoute || (myId && viewId && String(myId) === String(viewId));

  const reliability = Math.min(100, user?.completionRate ?? calculateReliability(user?.completedTasks, user?.totalTasks));
  const userId = user?._id || user?.id;
  
  // Growth hook will silently return empty objects if it doesn't have permission to view private tasks
  const { skillProfile, evolution, suggestions, trends, loading: growthLoading } = useGrowthTrack(userId);
  
  const name = useMemo(() => resolveUserName(user), [user]);

  // Phase 7: Handle edit profile
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-page, linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%))' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-zinc-500">Loading...</span>
        </div>
      </div>
    );
  }

  {/* ═══════════════════════════════════════════════════════════════════════
      ⭐ PHASE 1 FIX: Error state with branded retry UI
      Shows when getMe() fails instead of falling back to "Anonymous".
      Matches the app's visual style with violet accent.
  ═══════════════════════════════════════════════════════════════════════ */}
  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-page, linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%))' }}
      >
        <div className="flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Could not load profile
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 max-w-xs">
            We had trouble loading your profile data. Check your connection and try again.
          </p>
          <button
            onClick={load}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6 lg:p-12 max-w-[1400px] mx-auto"
      style={{ background: 'var(--bg-page, linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%))' }}
    >
      {/* Phase 7: Edit Modal */}
      {isEditing && (
        <ProfileEditModal 
          user={user} 
          onClose={() => setIsEditing(false)} 
          onSave={load} 
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col items-center mb-16">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />
        
        <div className="text-center mt-8">
          <h1 className="text-4xl font-semibold text-slate-800 dark:text-white mb-3">
            {name.fullName || user?.email?.split('@')[0] || 'Loading...'}
          </h1>
          
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500 dark:text-zinc-400">
              ID: {user?.username || user?.handle || user?.email?.split('@')[0] || user?._id?.slice(-8) || "..."}
            </span>
            
            {/* Core Verified Badge - Teal (#2DD4BF) */}
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm shadow-teal-500/20"
              style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Core Verified
            </span>
            
            {skillProfile?.archetype?.current && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-medium border border-violet-200 dark:border-violet-500/20">
                <Star className="w-3.5 h-3.5" />
                {skillProfile.archetype.current}
              </span>
            )}
          </div>
          
          {user?.bio && (
            <p className="mt-6 text-slate-600 dark:text-zinc-300 max-w-lg mx-auto leading-relaxed">{user.bio}</p>
          )}
          
          {/* Edit button - Blue action */}
          {isOwnProfile && (
            <button 
              onClick={handleEditProfile}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR — Compact social proof
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-6 mb-12 text-sm text-slate-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-violet-500" />
          <strong className="text-slate-800 dark:text-white">{user?.totalShips || 0}</strong> ships
        </span>
        <span className="text-slate-300 dark:text-zinc-600">·</span>
        <span className="flex items-center gap-1.5">
          <Folder className="w-4 h-4 text-blue-500" />
          <strong className="text-slate-800 dark:text-white">{userProjects.length}</strong> projects
        </span>
        <span className="text-slate-300 dark:text-zinc-600">·</span>
        <span className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-500" />
          <strong className="text-slate-800 dark:text-white">{user?.currentStreak || 0}d</strong> streak
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PROJECT PORTFOLIO — What they're building
      ═══════════════════════════════════════════════════════════════════ */}
      {userProjects.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Projects</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {userProjects.map(p => (
              <a
                key={p._id || p.id}
                href={'/projects/' + (p._id || p.id)}
                className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-500/30 transition-all group"
                style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
              >
                <span className="text-2xl shrink-0">{p.emoji || p.icon || '📁'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate group-hover:text-violet-600 transition-colors">
                    {p.name || p.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{p.description || 'No description'}</p>
                </div>
                {(p.streakDays > 0) && (
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                    🔥{p.streakDays}d
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          RECENT SHIPS — Proof of work
      ═══════════════════════════════════════════════════════════════════ */}
      {recentShips.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
            <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Recent Ships</h3>
          </div>
          <div className="space-y-2">
            {recentShips.map(task => (
              <div
                key={task._id || task.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06]"
                style={{ boxShadow: '0 1px 6px rgba(139, 92, 246, 0.03)' }}
              >
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <p className="text-sm text-slate-800 dark:text-white truncate flex-1">{task.title}</p>
                {task.completedAt && (
                  <span className="text-xs text-slate-400 dark:text-zinc-500 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Impact Metrics */}
          <div 
            className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Impact Metrics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard value={user?.totalShips || 0} label="Deployments" color="text-slate-800 dark:text-white" />
              <StatCard value={`${user?.currentStreak || 0}d`} label="Momentum" gradient />
            </div>
            {skillProfile?.overallGrowth && (
              <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
                    +{skillProfile.overallGrowth}% growth this quarter
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Operational Trust - with Ocean gradient bar */}
          <div 
            className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Operational Trust</h3>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-semibold text-slate-800 dark:text-white">{reliability}%</span>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-1">
                {reliability >= 70 ? "Excellent" : reliability >= 40 ? "Good" : "Building"}
              </span>
            </div>
            <SkillBar value={reliability} />
          </div>
          {/* ✅ Priority 1: Profile Strength */}
          {isOwnProfile && <ProfileStrength onEditClick={handleEditProfile} />}

          {<EvolutionMoments moments={evolution} loading={growthLoading} />}
        </div>

        {/* Middle Column */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Skill Profile - with radar chart */}
          {skillProfile?.skills && (
            <div 
              className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
              style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Skill Profile</h3>
                </div>
                {skillProfile.strengths?.length > 0 && (
                  <div className="flex gap-1">
                    {skillProfile.strengths.map((s) => (
                      <span 
                        key={s} 
                        className="px-2 py-0.5 rounded text-[10px] bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 capitalize"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <SkillRadarChart 
                  skills={(() => {
                    const raw = skillProfile.skills;
                    if (Array.isArray(raw)) return raw;
                    // Map backend fields to radar chart expected names
                    const fieldMap = {
                      velocity: 'execution',
                      execution: 'technical',
                      quality: 'strategy',
                      consistency: 'communication',
                      collaboration: 'collaboration',
                      initiative: 'leadership',
                    };
                    return Object.entries(raw).map(([key, val]) => ({
                      name: fieldMap[key] || key,
                      score: typeof val === 'number' ? val : (val?.score ?? val?.value ?? 0),
                    }));
                  })()} 
                  size={280} 
                  showLabels={true} 
                  showValues={true} 
                  showTrends={true} 
                />
              </div>
              {skillProfile.growthAreas?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">Focus areas for growth:</p>
                  <div className="flex flex-wrap gap-2">
                    {skillProfile.growthAreas.map((area) => (
                      <span 
                        key={area} 
                        className="px-2 py-1 rounded-lg text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 capitalize"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Behavioral Analysis */}
          <div 
            className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-8">
              <Brain className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Behavioral Analysis</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {profileAnalytics?.collaborationStyle && (
                <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />
              )}
              {profileAnalytics?.roleClassification && (
                <RoleClassificationCard data={profileAnalytics.roleClassification} />
              )}
            </div>
            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5">
              {user && <WorkPersonality userId={user._id || user.id} />}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {isOwnProfile && <GrowthSuggestions suggestions={suggestions} loading={growthLoading} />}
          
          {/* Trends */}
          {isOwnProfile && trends && (
            <div 
              className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
              style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Trends</h3>
                <span className="text-xs text-slate-400 dark:text-zinc-500">12 weeks</span>
              </div>
              <div className="space-y-4">
                {["velocity", "quality", "collaboration"].map((metric) => {
                  const growth = trends.summary?.[`${metric}Growth`] || 0;
                  const latest = trends.data?.[trends.data.length - 1]?.[metric] || 0;
                  const isPositive = growth >= 0;
                  return (
                    <div key={metric} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-700 dark:text-zinc-300 capitalize">{metric}</p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">{latest}/100</p>
                      </div>
                      <span className={`text-sm font-medium ${isPositive ? "text-teal-600 dark:text-teal-400" : "text-red-500 dark:text-red-400"}`}>
                        {isPositive ? "+" : ""}{growth}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Trend Charts - Full Width */}
        {isOwnProfile && (
          <div className="col-span-12">
            <TrendCharts trends={trends} loading={growthLoading} />
          </div>
        )}

        {/* Export Button */}
        <div className="col-span-12 flex justify-center pt-8">
          <button 
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 group"
            style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-sm">Export Profile Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
