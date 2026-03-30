// src/pages/Profile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROFILE PAGE v5.0.2 - The "Elon Musk" Zero-Latency Architecture
// Phase K: 3-6-3 Grid, High Density, Infinite Loop & 429 Protections
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import client from "../api/client";
import { getMe, getPublicUser, updateProfile } from "../api/user";
import {
  Camera, TrendingUp, Brain, Activity, ShieldCheck, Download,
  Star, Edit3, X, Save, Loader2, RefreshCw
} from "lucide-react";
import { toast } from "../components/ui/toast";
import UserAvatar from "../components/ui/UserAvatar";
import { resolveDisplayName } from "../utils/resolveDisplayName";

import CollaborationStyleCard from "../components/Profile/CollaborationStyleCard";
import WorkPersonality from "../components/analytics/WorkPersonality";
import RoleClassificationCard from "../components/Profile/RoleClassificationCard";
import SkillRadarChart from "../components/growth/SkillRadarChart";
import EvolutionMoments from "../components/growth/EvolutionMoments";
import GrowthSuggestions from "../components/growth/GrowthSuggestions";
import TrendCharts from "../components/growth/TrendCharts";
import { useGrowthTrack } from "../hooks/useGrowthTrack";
import ProfileStrength from "../components/profile/ProfileStrength";

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
  return resolveDisplayName(user);
}

function safeParseJSON(v) {
  try { return JSON.parse(v); } catch { return null; }
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem("ss.user");
    if (!raw) return null;
    const parsed = safeParseJSON(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch { return null; }
}

function readAvatarOverride() {
  try { return localStorage.getItem("ss.avatarOverride") || null; } catch { return null; }
}

/* ─────────────────────────────────────────────────────────────────────────
   PROFILE EDIT MODAL
───────────────────────────────────────────────────────────────────────── */
const ProfileEditModal = ({ user, onClose, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '', bio: user?.bio || '',
    location: user?.location || '', website: user?.website || '', jobTitle: user?.jobTitle || '',
    company: user?.company || '',
  });

  const handleChange = (field, value) => setEditData(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.put('/users/me', editData);
      toast({ title: 'Profile updated!', variant: 'success' });
      onSave?.();
      onClose();
    } catch (error) {
      toast({ title: 'Update failed', description: error?.response?.data?.message || 'Could not save profile', variant: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-zinc-200 mb-1.5">First Name</label>
              <input type="text" value={editData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-zinc-200 mb-1.5">Last Name</label>
              <input type="text" value={editData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-zinc-200 mb-1.5">Bio</label>
            <textarea value={editData.bio} onChange={(e) => handleChange('bio', e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none font-medium" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-zinc-200 mb-1.5">Location</label>
            <input type="text" value={editData.location} onChange={(e) => handleChange('location', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-zinc-200 mb-1.5">Job Title</label>
              <input type="text" value={editData.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-zinc-200 mb-1.5">Company</label>
              <input type="text" value={editData.company} onChange={(e) => handleChange('company', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors font-bold">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold shadow-md shadow-violet-500/20 hover:shadow-lg disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   PROFILE PHOTO EDITOR
───────────────────────────────────────────────────────────────────────── */
const ProfilePhotoEditor = ({ user, isOwnProfile, onPhotoUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const localOverride = readAvatarOverride();
  const storedUser = readStoredUser();
  const backendAvatar = user?.avatarUrl || user?.profilePicture || user?.avatar || null;
  const displayUrl = previewUrl || localOverride || storedUser?.profilePicture || backendAvatar || "/default-profile.png";

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsEditing(true);
  };

  const applyUserEverywhere = (nextFields = {}) => {
    try {
      const raw = localStorage.getItem("ss.user");
      const current = raw ? JSON.parse(raw) : {};
      localStorage.setItem("ss.user", JSON.stringify({ ...current, ...nextFields }));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedFile);
      const out = await updateProfile(formData);
      const avatarUrl = out?.avatarUrl || out?.user?.profilePicture || null;
      if (avatarUrl) {
        localStorage.removeItem("ss.avatarOverride");
        applyUserEverywhere({ avatarUrl, profilePicture: avatarUrl });
        toast({ title: "Photo updated", variant: "success" });
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        localStorage.setItem("ss.avatarOverride", dataUrl);
        applyUserEverywhere({ avatarUrl: dataUrl, profilePicture: dataUrl });
        toast({ title: "Photo updated locally", variant: "success" });
      };
      reader.readAsDataURL(selectedFile);
    } finally {
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploading(false);
      onPhotoUpdate?.();
    }
  };

  const auroraGradient = 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%)';

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-44 h-44 group">
        <div className="absolute inset-0 rounded-full p-1 shadow-2xl shadow-violet-500/20" style={{ background: auroraGradient }}>
          <div className="w-full h-full rounded-full bg-white dark:bg-[#0a0a0c]" />
        </div>
        <div className="absolute inset-[5px] rounded-full overflow-hidden border-4 border-white dark:border-[#111113] bg-slate-100 dark:bg-zinc-800">
          <UserAvatar size={160} name={user?.name || user?.username || "User"} avatarUrl={displayUrl} className="w-full h-full" ringClassName="ring-0" />
          {isOwnProfile && (
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <button type="button" className="p-4 bg-violet-600 rounded-full shadow-lg hover:scale-105 transition-transform">
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
          )}
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full shadow-xl border-2 border-white dark:border-[#0a0a0c]" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}>
          <span className="text-xs font-black tracking-widest text-white uppercase">RANK {levelForXp(user?.xp)}</span>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="w-full max-w-sm p-8 bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 text-center">Update Photo</h3>
            <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-8 p-1 shadow-xl shadow-violet-500/20" style={{ background: auroraGradient }}>
              <div className="w-full h-full rounded-full border-4 border-white dark:border-[#1a1a1c] overflow-hidden">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setIsEditing(false); setSelectedFile(null); }} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-200 font-bold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleUpload} disabled={uploading} className="flex-1 py-3 rounded-xl text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
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
   STAT CARD 
───────────────────────────────────────────────────────────────────────── */
const StatCard = ({ value, label, gradient = false }) => (
  <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-violet-500/10">
    <div className={`text-4xl font-black tracking-tight mb-1 ${gradient ? '' : 'text-slate-900 dark:text-white'}`}
      style={gradient ? { background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : {}}
    >
      {value}
    </div>
    <div className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">{label}</div>
  </div>
);

const SkillBar = ({ value, max = 100 }) => (
  <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-inner">
    <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${Math.min(Math.max((value / max) * 100, 0), 100)}%`, background: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)' }}>
      <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }} />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────── */
export default function Profile() {
  const { username: routeUsername } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [publicUser, setPublicUser] = useState(null);
  const [profileAnalytics, setProfileAnalytics] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(false);

  const isPublicRoute = useMemo(() => Boolean(routeUsername) && location.pathname.startsWith("/u/"), [routeUsername, location.pathname]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setError(false);
    try {
      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        setPublicUser(u);
      } else {
        const rawResponse = await getMe();
        let userData = rawResponse?.user || rawResponse?.data?.user || rawResponse?.data || rawResponse || {};
        
        const storedUser = readStoredUser();
        const storedAvatar = readAvatarOverride() || storedUser?.avatarUrl || storedUser?.profilePicture || null;
        setMe(storedAvatar ? { ...userData, avatarUrl: storedAvatar, profilePicture: storedAvatar } : userData);

        try {
          const analytics = await client.get("/users/profile-analytics");
          setProfileAnalytics(analytics.data);
        } catch (err) { setProfileAnalytics(null); }
      }
    } catch (e) {
      // If we get a 429 rate limit, don't crash the UI, just fall back to stored user
      if (e?.response?.status === 429) {
        console.warn("[Profile] Rate limited. Using cached profile data if available.");
        const storedUser = readStoredUser();
        if (storedUser) setMe(storedUser);
      } else {
        if (!silent) setError(true);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isPublicRoute, routeUsername]);

  // ⭐ INITIAL LOAD ONLY (Decoupled from refreshGrowth to prevent infinite loops)
  useEffect(() => {
    load();
  }, [load]);

  // Derived user values
  const user = isPublicRoute ? publicUser : me;
  const isOwnProfile = !isPublicRoute;
  const userId = user?._id || user?.id;
  
  // Connect the real-time Growth Engine Hook
  const { skillProfile, evolution, suggestions, trends, loading: growthLoading, refresh: refreshGrowth } = useGrowthTrack(userId);

  // ⭐ ZERO-LATENCY REAL-TIME EVENT LISTENERS
  useEffect(() => {
    if (isPublicRoute) return;

    const handleUpdate = () => {
      console.log('[Profile] Auto-refresh triggered via global event (Zero-Latency mode)');
      load(true); // silent refetch
      refreshGrowth(true); // silent refetch
    };
    
    // Bind to custom DOM events emitted by the rest of the application
    window.addEventListener("taskCompleted", handleUpdate);
    window.addEventListener("taskUpdated", handleUpdate);
    window.addEventListener("ss:update", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    // Polite polling fallback (15s instead of 8s to prevent 429s)
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        load(true);
        refreshGrowth(true);
      }
    }, 15000);

    return () => {
      window.removeEventListener("taskCompleted", handleUpdate);
      window.removeEventListener("taskUpdated", handleUpdate);
      window.removeEventListener("ss:update", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      clearInterval(poll);
    };
  }, [isPublicRoute, load, refreshGrowth]);

  // High-Density Metrics calculation
  const totalShips = user?.totalShips || 0;
  const completedTasks = user?.totalTasksCompleted || user?.completedTasks || 0;
  const currentStreak = user?.streakDays || user?.currentStreak || 0;
  // Calculate operational reliability dynamically based on real task completion ratios
  const reliability = Math.min(calculateReliability(completedTasks, (user?.totalTasks || Math.max(completedTasks, 1))), 100) || 0; 
  const name = useMemo(() => resolveUserName(user), [user]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c]">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c]">
        <div className="flex flex-col items-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center mb-6 text-4xl shadow-sm">⚠️</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Could not load profile</h2>
          <button onClick={() => { load(); refreshGrowth(); }} className="mt-6 flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[1440px] mx-auto bg-slate-50/50 dark:bg-[#0a0a0c]">
      {isEditing && <ProfileEditModal user={user} onClose={() => setIsEditing(false)} onSave={() => { load(true); refreshGrowth(true); }} />}

      <section className="flex flex-col items-center mb-16 relative">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />
        
        <div className="text-center mt-12">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4 drop-shadow-sm">
            {name.fullName || user?.email?.split('@')[0]}
          </h1>
          
          <div className="flex items-center justify-center gap-3 flex-wrap mt-2">
            <span className="text-sm font-bold text-slate-600 bg-white dark:bg-[#1a1a1c] px-4 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
              ID: {user?.username || user?._id?.slice(-8) || "..."}
            </span>
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)' }}>
              <ShieldCheck className="w-4 h-4" /> Core Verified
            </span>
            {skillProfile?.archetype?.current && (
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-900 dark:text-violet-300 text-xs font-black uppercase tracking-widest border border-violet-200 dark:border-violet-500/30">
                <Star className="w-4 h-4" /> {skillProfile.archetype.current}
              </span>
            )}
          </div>
          
          {user?.bio && <p className="mt-8 text-lg font-medium text-slate-700 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">{user.bio}</p>}
          
          {isOwnProfile && (
            <button onClick={() => setIsEditing(true)} className="mt-8 inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-black uppercase tracking-wider shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all border border-blue-400/50" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}>
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* ⭐ ELON MUSK GRID: 3-6-3 High-Density Architecture */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        
        {/* LEFT COLUMN: Impact & Execution (col-span-3) */}
        <div className="col-span-12 lg:col-span-3 space-y-6 lg:space-y-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-base font-black uppercase tracking-wide text-slate-900 dark:text-white">Impact Metrics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard value={totalShips} label="Ships" />
              <StatCard value={`${currentStreak}d`} label="Streak" gradient />
            </div>
            {skillProfile?.overallGrowth !== undefined && (
              <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 shadow-inner">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <span className="text-sm font-bold text-teal-900 dark:text-teal-300">+{skillProfile.overallGrowth}% velocity</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-base font-black uppercase tracking-wide text-slate-900 dark:text-white">Operational Trust</h3>
            </div>
            <div className="flex items-end gap-3 mb-5">
              <span className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{reliability}%</span>
              <span className="text-sm font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-1.5">
                {reliability >= 85 ? "Elite" : reliability >= 60 ? "Solid" : "Building"}
              </span>
            </div>
            <SkillBar value={reliability} />
          </div>

          {isOwnProfile && <ProfileStrength onEditClick={() => setIsEditing(true)} />}
          {isOwnProfile && <EvolutionMoments moments={evolution} loading={growthLoading} />}
        </div>

        {/* MIDDLE COLUMN: Deep Analytics (col-span-6) */}
        <div className="col-span-12 lg:col-span-6 space-y-6 lg:space-y-8">
          {isOwnProfile && skillProfile?.skills && (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Brain className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white">Skill Matrix</h3>
                </div>
              </div>
              <div className="flex justify-center my-4">
                <SkillRadarChart skills={skillProfile.skills} size={360} showLabels={true} showValues={true} />
              </div>
            </div>
          )}

          <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Brain className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white">Behavioral Profile</h3>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {profileAnalytics?.collaborationStyle && <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />}
              {profileAnalytics?.roleClassification && <RoleClassificationCard data={profileAnalytics.roleClassification} />}
            </div>
            <div className="mt-10 pt-8 border-t border-slate-200 dark:border-white/5">
              {user && <WorkPersonality userId={userId} />}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Growth & Forward Looking (col-span-3) */}
        <div className="col-span-12 lg:col-span-3 space-y-6 lg:space-y-8">
          {isOwnProfile && <GrowthSuggestions suggestions={suggestions} loading={growthLoading} />}
          
          {isOwnProfile && trends && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-base font-black uppercase tracking-wide text-slate-900 dark:text-white">Trend Vector</h3>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">12W</span>
              </div>
              <div className="space-y-5">
                {["velocity", "quality", "collaboration"].map((metric) => {
                  const growth = trends.summary?.[`${metric}Growth`] || 0;
                  const latest = trends.data?.[trends.data.length - 1]?.[metric] || 0;
                  const isPositive = growth >= 0;
                  return (
                    <div key={metric} className="flex items-center justify-between group">
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-zinc-200 capitalize tracking-wide">{metric}</p>
                        <p className="text-xs font-bold text-slate-500 dark:text-zinc-500 mt-0.5">Score: {latest}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider border ${isPositive ? "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20" : "bg-red-50 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}>
                        {isPositive ? "+" : ""}{growth}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {isOwnProfile && (
          <div className="col-span-12 mt-4">
            <TrendCharts trends={trends} loading={growthLoading} />
          </div>
        )}

      </div>
    </div>
  );
}
