// src/pages/Profile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROFILE PAGE v4.0 - "The Gallery Walk" Light Theme
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
// NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import client from "../api/client";
import { getMe, getPublicUser, updateProfile } from "../api/user";
import {
  Camera,
  TrendingUp,
  Brain,
  Activity,
  ShieldCheck,
  Download,
  Star,
  Edit3,
} from "lucide-react";
import { toast } from "../components/ui/toast";
import UserAvatar from "../components/ui/UserAvatar";

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
  const first =
    user?.firstName ||
    user?.firstname ||
    user?.givenName ||
    user?.profile?.firstName ||
    user?.profile?.givenName ||
    "";

  const last =
    user?.lastName ||
    user?.lastname ||
    user?.familyName ||
    user?.profile?.lastName ||
    user?.profile?.familyName ||
    "";

  const fullFromParts = `${String(first).trim()} ${String(last).trim()}`.trim();

  const fullFallback =
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    user?.profile?.name ||
    user?.profile?.displayName ||
    "";

  const usernameFallback = user?.username || user?.handle || user?.email || "User";

  return {
    firstName: String(first || "").trim(),
    lastName: String(last || "").trim(),
    fullName:
      fullFromParts ||
      String(fullFallback || "").trim() ||
      String(usernameFallback || "").trim(),
  };
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
          <div className="w-full h-full rounded-full bg-white" />
        </div>
        
        {/* Avatar container */}
        <div className="absolute inset-2 rounded-full overflow-hidden border-4 border-white bg-slate-100 shadow-lg shadow-violet-100">
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
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="w-full max-w-sm p-6 bg-white border border-slate-200 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">Update Photo?</h3>
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
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl text-white font-medium transition-colors shadow-md shadow-blue-200"
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
const StatCard = ({ value, label, color = "text-slate-800", gradient = false }) => (
  <div 
    className="p-5 rounded-xl bg-white border border-slate-200 hover:border-violet-200 transition-all duration-200"
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
    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   SKILL BAR - Ocean Gradient
───────────────────────────────────────────────────────────────────────── */
const SkillBar = ({ value, max = 100 }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
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
  const { username: routeUsername } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [publicUser, setPublicUser] = useState(null);
  const [profileAnalytics, setProfileAnalytics] = useState(null);

  const isPublicRoute = useMemo(
    () => Boolean(routeUsername) && location.pathname.startsWith("/u/"),
    [routeUsername, location.pathname]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        setPublicUser(u);
      } else {
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
      }
    } catch (e) {
      console.error('[Profile] Failed to load user data:', e);
      console.error('[Profile] Error details:', e?.response?.data || e?.message);
    } finally {
      setLoading(false);
    }
  }, [isPublicRoute, routeUsername]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isPublicRoute) return;
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
  }, [isPublicRoute, load]);

  const user = isPublicRoute ? publicUser : me;
  const isOwnProfile = !isPublicRoute;
  const reliability = calculateReliability(user?.completedTasks, user?.totalTasks);
  const userId = user?._id || user?.id;
  const { skillProfile, evolution, suggestions, trends, loading: growthLoading } = useGrowthTrack(userId);
  const name = useMemo(() => resolveUserName(user), [user]);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6 lg:p-12 max-w-[1400px] mx-auto"
      style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%)' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col items-center mb-16">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />
        
        <div className="text-center mt-8">
          <h1 className="text-4xl font-semibold text-slate-800 mb-3">
            {name.fullName || user?.email?.split('@')[0] || 'Loading...'}
          </h1>
          
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500">
              ID: {user?.username || user?.handle || user?.email?.split('@')[0] || user?._id?.slice(-8) || "..."}
            </span>
            
            {/* Core Verified Badge - Teal (#2DD4BF) */}
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Core Verified
            </span>
            
            {skillProfile?.archetype?.current && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium border border-violet-200">
                <Star className="w-3.5 h-3.5" />
                {skillProfile.archetype.current}
              </span>
            )}
          </div>
          
          {user?.bio && (
            <p className="mt-6 text-slate-600 max-w-lg mx-auto leading-relaxed">{user.bio}</p>
          )}
          
          {/* Edit button - Blue action */}
          {isOwnProfile && (
            <button 
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md shadow-blue-200 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
              onClick={() => window.location.href = '/settings'}
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Impact Metrics */}
          <div 
            className="p-6 rounded-xl bg-white border border-slate-200"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-medium text-slate-600">Impact Metrics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard value={user?.totalShips || 0} label="Deployments" color="text-slate-800" />
              <StatCard value={`${user?.currentStreak || 0}d`} label="Momentum" gradient />
            </div>
            {skillProfile?.overallGrowth && (
              <div className="p-4 rounded-lg bg-teal-50 border border-teal-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700">
                    +{skillProfile.overallGrowth}% growth this quarter
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Operational Trust - with Ocean gradient bar */}
          <div 
            className="p-6 rounded-xl bg-white border border-slate-200"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-medium text-slate-600">Operational Trust</h3>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-semibold text-slate-800">{reliability}%</span>
              <span className="text-xs text-teal-600 font-medium mb-1">
                {reliability >= 70 ? "Excellent" : reliability >= 40 ? "Good" : "Building"}
              </span>
            </div>
            <SkillBar value={reliability} />
          </div>

          {isOwnProfile && <EvolutionMoments moments={evolution} loading={growthLoading} />}
        </div>

        {/* Middle Column */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Skill Profile - with radar chart */}
          {isOwnProfile && skillProfile?.skills && (
            <div 
              className="p-6 rounded-xl bg-white border border-slate-200"
              style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-medium text-slate-600">Skill Profile</h3>
                </div>
                {skillProfile.strengths?.length > 0 && (
                  <div className="flex gap-1">
                    {skillProfile.strengths.map((s) => (
                      <span 
                        key={s} 
                        className="px-2 py-0.5 rounded text-[10px] bg-violet-50 text-violet-700 border border-violet-100 capitalize"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <SkillRadarChart 
                  skills={skillProfile.skills} 
                  size={280} 
                  showLabels={true} 
                  showValues={true} 
                  showTrends={true} 
                />
              </div>
              {skillProfile.growthAreas?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">Focus areas for growth:</p>
                  <div className="flex flex-wrap gap-2">
                    {skillProfile.growthAreas.map((area) => (
                      <span 
                        key={area} 
                        className="px-2 py-1 rounded-lg text-xs bg-amber-50 text-amber-700 border border-amber-100 capitalize"
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
            className="p-6 rounded-xl bg-white border border-slate-200"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-8">
              <Brain className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-medium text-slate-600">Behavioral Analysis</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {profileAnalytics?.collaborationStyle && (
                <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />
              )}
              {profileAnalytics?.roleClassification && (
                <RoleClassificationCard data={profileAnalytics.roleClassification} />
              )}
            </div>
            <div className="mt-10 pt-8 border-t border-slate-100">
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
              className="p-6 rounded-xl bg-white border border-slate-200"
              style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-medium text-slate-600">Trends</h3>
                <span className="text-xs text-slate-400">12 weeks</span>
              </div>
              <div className="space-y-4">
                {["velocity", "quality", "collaboration"].map((metric) => {
                  const growth = trends.summary?.[`${metric}Growth`] || 0;
                  const latest = trends.data?.[trends.data.length - 1]?.[metric] || 0;
                  const isPositive = growth >= 0;
                  return (
                    <div key={metric} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-700 capitalize">{metric}</p>
                        <p className="text-xs text-slate-400">{latest}/100</p>
                      </div>
                      <span className={`text-sm font-medium ${isPositive ? "text-teal-600" : "text-red-500"}`}>
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
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group"
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
