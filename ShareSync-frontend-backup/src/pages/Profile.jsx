// src/pages/Profile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROFILE PAGE - Phase 2.7 Polish
// - Horizontal Header layout to keep content above the fold.
// - Fixed Jargon ("Reliability Score", "Ships").
// - Tactile surfaces and 8px grid alignment.
// - Fixed handleEditProfile reference.
// - Darkened typography for high-contrast readability.
// - Integrated RecentActivityTimeline.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import client from "../api/client";
import { getMe, getPublicUser, updateProfile } from "../api/user";
import {
  Camera, TrendingUp, Brain, Activity, ShieldCheck, Download, Star, Edit3, X, Save, Loader2, RefreshCw, AlertTriangle
} from "lucide-react";
import { toast } from "../components/ui/toast";
import UserAvatar from "../components/ui/UserAvatar";
import { resolveDisplayName } from "../utils/resolveDisplayName";

// Analytics Components
import CollaborationStyleCard from "../components/Profile/CollaborationStyleCard";
import WorkPersonality from "../components/analytics/WorkPersonality";
import RoleClassificationCard from "../components/Profile/RoleClassificationCard";
import ProfileStatGrid from "../components/Profile/ProfileStatGrid";

// Growth Components
import SkillRadarChart from "../components/growth/SkillRadarChart";
import EvolutionMoments from "../components/growth/EvolutionMoments";
import GrowthSuggestions from "../components/growth/GrowthSuggestions";
import TrendCharts from "../components/growth/TrendCharts";
import { useGrowthTrack } from "../hooks/useGrowthTrack";
import ProfileStrength from "../components/profile/ProfileStrength";

// Timeline Component
import RecentActivityTimeline from "../components/profile/RecentActivityTimeline";

/* ─────────────────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────────────────── */
const calculateReliability = (completed, total) => !total || total === 0 ? 0 : Math.round((completed / total) * 100);
function xpForLevel(level) { if (level <= 1) return 0; let sum = 0; for (let i = 1; i < level; i++) sum += Math.round(75 + Math.pow(i, 1.35) * 35); return sum; }
function levelForXp(xp = 0) { let lvl = 1; while (xp >= xpForLevel(lvl + 1)) lvl++; return lvl; }
function resolveUserName(user) { return resolveDisplayName(user); }
function safeParseJSON(v) { try { return JSON.parse(v); } catch { return null; } }
function readStoredUser() { try { const raw = localStorage.getItem("ss.user"); if (!raw) return null; const parsed = safeParseJSON(raw); return parsed && typeof parsed === "object" ? parsed : null; } catch { return null; } }
function readAvatarOverride() { try { return localStorage.getItem("ss.avatarOverride") || null; } catch { return null; } }

/* ─────────────────────────────────────────────────────────────────────────
   PROFILE EDIT MODAL
───────────────────────────────────────────────────────────────────────── */
const ProfileEditModal = ({ user, onClose, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', bio: user?.bio || '', location: user?.location || '', website: user?.website || '', jobTitle: user?.jobTitle || '', company: user?.company || '' });
  const handleChange = (field, value) => setEditData(prev => ({ ...prev, [field]: value }));
  const handleSave = async () => {
    setSaving(true);
    try { await client.put('/users/me', editData); toast({ title: 'Profile updated!', variant: 'success' }); onSave?.(); onClose(); } 
    catch (error) { toast({ title: 'Update failed', description: error?.response?.data?.message || error?.message || 'Could not save profile', variant: 'error' }); } 
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
      <div className="w-full max-w-lg card-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0">
          <h2 className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-secondary transition-colors"><X className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">First Name</label>
              <input type="text" value={editData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="w-full px-4 py-3 border border-border-default rounded-xl bg-surface-secondary text-[14px] font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand outline-none transition-all shadow-inner" placeholder="First name" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
              <input type="text" value={editData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="w-full px-4 py-3 border border-border-default rounded-xl bg-surface-secondary text-[14px] font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand outline-none transition-all shadow-inner" placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Bio</label>
            <textarea value={editData.bio} onChange={(e) => handleChange('bio', e.target.value)} rows={3} className="w-full px-4 py-3 border border-border-default rounded-xl bg-surface-secondary text-[14px] font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand outline-none transition-all resize-none shadow-inner" placeholder="Tell others about yourself..." />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Location</label>
            <input type="text" value={editData.location} onChange={(e) => handleChange('location', e.target.value)} className="w-full px-4 py-3 border border-border-default rounded-xl bg-surface-secondary text-[14px] font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand outline-none transition-all shadow-inner" placeholder="City, Country" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Job Title</label>
              <input type="text" value={editData.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} className="w-full px-4 py-3 border border-border-default rounded-xl bg-surface-secondary text-[14px] font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand outline-none transition-all shadow-inner" placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Company</label>
              <input type="text" value={editData.company} onChange={(e) => handleChange('company', e.target.value)} className="w-full px-4 py-3 border border-border-default rounded-xl bg-surface-secondary text-[14px] font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand outline-none transition-all shadow-inner" placeholder="Company name" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default bg-surface-secondary/50 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-border-default transition-colors text-[13px] font-bold">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-600 text-white text-[13px] font-bold transition-all shadow-md disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
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

  const displayUrl = previewUrl || readAvatarOverride() || readStoredUser()?.avatarUrl || user?.avatarUrl || user?.profilePicture || null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); setIsEditing(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedFile); formData.append("avatar", selectedFile);
      const out = await updateProfile(formData);
      const avatarUrl = out?.avatarUrl || out?.user?.avatarUrl || out?.data?.avatarUrl || out?.profilePicture || null;
      if (avatarUrl) {
        const current = JSON.parse(localStorage.getItem("ss.user") || "{}");
        localStorage.setItem("ss.user", JSON.stringify({ ...current, avatarUrl, profilePicture: avatarUrl }));
        window.dispatchEvent(new Event("storage"));
        toast({ title: "Photo updated", variant: "success" });
        setIsEditing(false); setSelectedFile(null); setPreviewUrl(null); onPhotoUpdate?.();
      }
    } catch (error) {
       toast({ title: "Update failed", variant: "error" });
    } finally { setUploading(false); }
  };

  return (
    <div className="relative flex-shrink-0">
      <div className="relative w-28 h-28 md:w-32 md:h-32 group">
        <div className="absolute inset-0 rounded-full p-1 bg-gradient-to-br from-brand-500 to-info-400">
          <div className="w-full h-full rounded-full bg-surface-primary" />
        </div>
        <div className="absolute inset-1.5 rounded-full overflow-hidden border-[3px] border-surface-primary bg-surface-secondary shadow-lg">
          <UserAvatar size={120} name={user?.name || user?.username || "User"} avatarUrl={displayUrl} className="w-full h-full" ringClassName="ring-0" />
          {isOwnProfile && (
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg shadow-md bg-gradient-to-r from-brand-600 to-brand-400 border border-white/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap">Rank {levelForXp(user?.xp)}</span>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="w-full max-w-sm p-8 card-surface rounded-2xl shadow-2xl text-center">
            <h3 className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight mb-6">Update Photo?</h3>
            <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-8 p-1 bg-gradient-to-br from-brand-500 to-info-400 shadow-lg">
              <img src={previewUrl} className="w-full h-full object-cover rounded-full border-[3px] border-surface-primary" alt="Preview" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setIsEditing(false); setSelectedFile(null); setPreviewUrl(null); }} className="flex-1 py-3 rounded-xl bg-surface-secondary text-slate-800 dark:text-slate-200 hover:bg-border-default transition-colors text-[13px] font-bold">Cancel</button>
              <button onClick={handleUpload} disabled={uploading} className="flex-1 py-3 rounded-xl text-white bg-brand hover:bg-brand-600 font-bold text-[13px] transition-all shadow-md">
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
   SKILL BAR
───────────────────────────────────────────────────────────────────────── */
const SkillBar = ({ value, max = 100 }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden shadow-inner">
      <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-info-500 to-success-400" style={{ width: `${percentage}%` }} />
    </div>
  );
};

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

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        setPublicUser(u);
      } else {
        const rawResponse = await getMe();
        let userData = rawResponse?.user || rawResponse?.data?.user || rawResponse?.data || rawResponse || {};
        const storedAvatar = readAvatarOverride() || readStoredUser()?.avatarUrl || null;
        setMe(storedAvatar ? { ...userData, avatarUrl: storedAvatar, profilePicture: storedAvatar } : userData);
        try {
          const analytics = await client.get("/users/profile-analytics");
          setProfileAnalytics(analytics.data);
        } catch (err) { setProfileAnalytics(null); }
      }
    } catch (e) { setError(true); } finally { setLoading(false); }
  }, [isPublicRoute, routeUsername]);

  useEffect(() => { load(); }, [load]);

  const user = isPublicRoute ? publicUser : me;
  const isOwnProfile = !isPublicRoute;
  const reliability = calculateReliability(user?.completedTasks, user?.totalTasks);
  const userId = user?._id || user?.id;
  const { skillProfile, evolution, suggestions, trends, loading: growthLoading } = useGrowthTrack(userId);
  const name = useMemo(() => resolveUserName(user), [user]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
          <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Syncing Identity...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-error-subtle flex items-center justify-center mb-6 border border-error-200 shadow-sm">
            <AlertTriangle className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-[20px] font-black text-slate-900 dark:text-white tracking-tight mb-2">Could not load profile</h2>
          <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200 mb-6 max-w-xs">We had trouble loading your profile data. Check your connection and try again.</p>
          <button onClick={load} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-secondary text-slate-900 dark:text-white text-[13px] font-bold transition-all shadow-sm border border-border-default hover:bg-border-default">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const gridStats = {
    moves: user?.totalShips || 0,
    streak: user?.currentStreak || 0,
    xp: user?.xp || 0,
    projects: user?.activeProjects || 0,
  };

  // ═══════════════════════════════════════════════════════════════════
  // MOCK DATA FOR TIMELINE (So you can see it working immediately)
  // ═══════════════════════════════════════════════════════════════════
  const mockTimelineActivities = [
    { id: 1, type: 'ship', title: 'Shipped "Landing Page Overhaul"', timestamp: new Date(Date.now() - 1000 * 60 * 45), description: 'Completed final design QA and pushed to production.', xpReward: 150 },
    { id: 2, type: 'streak', title: 'Hit a 14-day streak', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), xpReward: 200 },
    { id: 3, type: 'achievement', title: 'Unlocked "Night Owl"', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), description: 'Shipped 3 tasks after midnight.', xpReward: 100 },
    { id: 4, type: 'task', title: 'Completed "Database Indexing"', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72) }
  ];

  return (
    <div className="min-h-screen bg-surface-primary p-6 lg:p-10 max-w-[1400px] mx-auto pb-24">
      {isEditing && <ProfileEditModal user={user} onClose={() => setIsEditing(false)} onSave={load} />}

      {/* HEADER SECTION */}
      <section className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 dashboard-section">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />
        
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
            <h1 className="text-[32px] md:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {name.fullName || user?.email?.split('@')[0] || 'Unknown User'}
            </h1>
            
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-teal-800 bg-teal-100 border border-teal-200 uppercase tracking-widest shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> Core Verified
              </span>
              
              {skillProfile?.archetype?.current && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-subtle text-brand text-[10px] font-bold border border-brand-200 uppercase tracking-widest shadow-sm">
                  <Star className="w-3 h-3" /> {skillProfile.archetype.current}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
            {user?.jobTitle ? `${user.jobTitle} ${user?.company ? `at ${user.company}` : ''}` : `ID: ${user?.username || user?.handle || user?._id?.slice(-8)}`}
            {user?.location && <span className="ml-2">• {user.location}</span>}
          </p>
          
          {user?.bio && (
            <p className="mt-4 text-[15px] font-medium text-slate-800 dark:text-slate-200 max-w-2xl leading-relaxed">
              {user.bio}
            </p>
          )}
          
          {isOwnProfile && (
            <button onClick={handleEditProfile} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-900 dark:text-white bg-surface-secondary border border-border-default text-[13px] font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* IMPACT METRICS GRID */}
      <div className="dashboard-section" style={{ animationDelay: '0.1s' }}>
        <ProfileStatGrid stats={gridStats} />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dashboard-section" style={{ animationDelay: '0.2s' }}>
        
        {/* Left Column */}
        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-info-500" />
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Reliability Score</h3>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-[40px] font-black text-slate-900 dark:text-white tabular-nums tracking-tight leading-none">{reliability}%</span>
              <span className="text-[13px] font-bold text-info-700 mb-1.5 uppercase tracking-widest">
                {reliability >= 70 ? "Excellent" : reliability >= 40 ? "Solid" : "Building"}
              </span>
            </div>
            <SkillBar value={reliability} />
            <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 mt-4">Based on {user?.completedTasks || 0} of {user?.totalTasks || 0} tasks completed.</p>
          </div>

          {isOwnProfile && <ProfileStrength onEditClick={handleEditProfile} />}
          {isOwnProfile && <EvolutionMoments moments={evolution} loading={growthLoading} />}
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          {isOwnProfile && skillProfile?.skills && (
            <div className="card-surface p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand" />
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Skill Canvas</h3>
                </div>
              </div>
              <div className="flex justify-center my-4">
                <SkillRadarChart skills={skillProfile.skills} size={280} showLabels={true} showValues={true} showTrends={true} />
              </div>
              {skillProfile.growthAreas?.length > 0 && (
                <div className="mt-6 pt-5 border-t border-border-default">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Focus areas</p>
                  <div className="flex flex-wrap gap-2">
                    {skillProfile.growthAreas.map((area) => (
                      <span key={area} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-warning-subtle text-warning border border-warning-200 capitalize tracking-wide">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card-surface p-6">
            <div className="flex items-center gap-2 mb-8">
              <Brain className="w-4 h-4 text-brand" />
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Behavioral Analysis</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {profileAnalytics?.collaborationStyle && <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />}
              {profileAnalytics?.roleClassification && <RoleClassificationCard data={profileAnalytics.roleClassification} />}
            </div>
            <div className="mt-8 pt-6 border-t border-border-default">
              {user && <WorkPersonality userId={userId} />}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {isOwnProfile && <GrowthSuggestions suggestions={suggestions} loading={growthLoading} />}
          
          {isOwnProfile && trends && (
            <div className="card-surface p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand" />
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Velocity Trends</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest bg-surface-secondary px-2 py-1 rounded-md">12 WKS</span>
              </div>
              <div className="space-y-5">
                {["velocity", "quality", "collaboration"].map((metric) => {
                  const growth = trends.summary?.[`${metric}Growth`] || 0;
                  const latest = trends.data?.[trends.data.length - 1]?.[metric] || 0;
                  const isPositive = growth >= 0;
                  return (
                    <div key={metric} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border-default/50">
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white capitalize">{metric}</p>
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{latest}/100 current</p>
                      </div>
                      <span className={`text-[14px] font-black ${isPositive ? "text-success" : "text-error"}`}>
                        {isPositive ? "+" : ""}{growth}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <div className="mt-6 dashboard-section" style={{ animationDelay: '0.3s' }}>
          <TrendCharts trends={trends} loading={growthLoading} />
        </div>
      )}

      {/* RECENT ACTIVITY TIMELINE INTEGRATION */}
      <div className="mt-6 dashboard-section" style={{ animationDelay: '0.4s' }}>
        <RecentActivityTimeline activities={mockTimelineActivities} />
      </div>

      <div className="flex justify-center pt-12 pb-6">
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-secondary border border-border-default text-[13px] font-bold text-slate-800 dark:text-slate-200 hover:text-slate-900 hover:dark:text-white hover:bg-surface-primary hover:border-brand-200 hover:shadow-md transition-all duration-300 group">
          <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-brand" />
          Export Profile Data
        </button>
      </div>
    </div>
  );
}
