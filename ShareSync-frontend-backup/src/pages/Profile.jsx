// src/pages/Profile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Quiet Confidence"
// ═══════════════════════════════════════════════════════════════════════════════
// RULES APPLIED:
// 1. Surface hierarchy: surface-0/1/2 tokens
// 2. Text hierarchy: text-primary/secondary/tertiary
// 3. Calmer typography - no font-black everywhere
// 4. No spinning rings or pulsing animations
// 5. KEEP semantic color differentiation for analytics sections
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import client from "../api/client";
import { getMe, getPublicUser, updateProfile } from "../api/user";
import { 
  Camera, TrendingUp, Brain, Activity, ShieldCheck, Download
} from "lucide-react";
import { toast } from "../components/ui/toast";

// Analytics Components
import CollaborationStyleCard from "../components/Profile/CollaborationStyleCard";
import WorkPersonality from "../components/analytics/WorkPersonality";
import RoleClassificationCard from "../components/Profile/RoleClassificationCard";

/* ─────────────────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────────────────── */
const calculateReliability = (completed, total) => 
  (!total || total === 0) ? 0 : Math.round((completed / total) * 100);

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

/* ─────────────────────────────────────────────────────────────────────────
   PROFILE PHOTO EDITOR
───────────────────────────────────────────────────────────────────────── */
const ProfilePhotoEditor = ({ user, isOwnProfile, onPhotoUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { 
      setPreviewUrl(e.target.result); 
      setIsEditing(true); 
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('profilePicture', blob, 'profile.jpg');
      await updateProfile(formData);
      toast({ title: "Photo updated", variant: "success" });
      setIsEditing(false);
      if (onPhotoUpdate) onPhotoUpdate();
    } catch (error) { 
      toast({ title: "Update failed", variant: "error" }); 
    } finally { 
      setUploading(false); 
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Avatar Container */}
      <div className="relative w-40 h-40 group">
        {/* Simple ring - no spinning */}
        <div className="absolute inset-0 rounded-full border border-brand/20" />
        
        {/* Photo */}
        <div className="absolute inset-2 rounded-full overflow-hidden border-4 border-surface-0 bg-surface-2">
          <img 
            src={previewUrl || user?.profilePicture || '/default-profile.png'} 
            alt="Profile" 
            className="w-full h-full object-cover" 
          />
          
          {/* Hover overlay */}
          {isOwnProfile && (
            <div className="
              absolute inset-0 bg-black/60 
              opacity-0 group-hover:opacity-100 
              transition-opacity flex items-center justify-center
            ">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 bg-brand rounded-full hover:bg-brand-600 transition-colors"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
        
        {/* Rank Badge */}
        <div className="
          absolute -bottom-2 left-1/2 -translate-x-1/2 
          px-3 py-1.5 bg-surface-1 rounded-lg border border-white/[0.08]
        ">
          <span className="text-xs font-medium text-text-primary">
            Rank {levelForXp(user?.xp)}
          </span>
        </div>
      </div>
      
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        onChange={handleFileSelect} 
        className="hidden" 
      />
      
      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="w-full max-w-sm p-6 bg-surface-1 border border-white/[0.08] rounded-2xl">
            <h3 className="text-xl font-semibold text-text-primary mb-6 text-center">
              Update Photo?
            </h3>
            <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-6 border-2 border-brand/30">
              <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(false)} 
                className="
                  flex-1 py-3 rounded-xl
                  bg-surface-2 text-text-secondary
                  hover:bg-surface-3 transition-colors
                "
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload} 
                disabled={uploading} 
                className="
                  flex-1 py-3 rounded-xl
                  bg-brand text-white
                  hover:bg-brand-600 transition-colors
                "
              >
                {uploading ? 'Uploading...' : 'Confirm'}
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
const StatCard = ({ value, label, color = "text-text-primary" }) => (
  <div className="p-5 rounded-xl bg-surface-2 border border-white/[0.04] hover:bg-surface-3 transition-colors">
    <div className={`text-3xl font-semibold ${color}`}>{value}</div>
    <div className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">{label}</div>
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

  const isPublicRoute = useMemo(
    () => Boolean(routeUsername) && location.pathname.startsWith("/u/"), 
    [routeUsername, location.pathname]
  );

  const load = async () => {
    setLoading(true);
    try {
      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        setPublicUser(u);
      } else {
        const data = await getMe();
        setMe(data);
        const analytics = await client.get("/users/profile-analytics");
        setProfileAnalytics(analytics.data);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, [isPublicRoute, routeUsername]);

  const user = isPublicRoute ? publicUser : me;
  const isOwnProfile = !isPublicRoute;
  const reliability = calculateReliability(user?.completedTasks, user?.totalTasks);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-sm text-text-tertiary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-12 max-w-[1300px] mx-auto">
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col items-center mb-16">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />
        
        <div className="text-center mt-8">
          {/* Name */}
          <h1 className="text-4xl font-semibold text-text-primary mb-3">
            {user?.firstName} <span className="text-text-tertiary">{user?.lastName}</span>
          </h1>
          
          {/* Username + Verified Badge */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-text-tertiary">
              ID: {user?.username}
            </span>
            <span className="
              flex items-center gap-1.5 px-2.5 py-1 rounded-full
              bg-success/10 text-success text-xs font-medium
            ">
              <ShieldCheck className="w-3.5 h-3.5" />
              Core Verified
            </span>
          </div>
          
          {/* Bio */}
          {user?.bio && (
            <p className="mt-6 text-text-secondary max-w-lg mx-auto leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* ─────────────────────────────────────────────────────────────────
            LEFT COLUMN: Impact Metrics + Trust
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Impact Metrics - Brand Purple accent */}
          <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-medium text-text-secondary">Impact Metrics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard 
                value={user?.totalShips || 0} 
                label="Deployments" 
                color="text-text-primary"
              />
              <StatCard 
                value={`${user?.currentStreak || 0}d`} 
                label="Momentum" 
                color="text-brand"
              />
            </div>
            
            <div className="p-4 rounded-lg bg-brand/5 border border-brand/10">
              <p className="text-sm text-text-secondary">
                Systems analysis indicates peak performance across{' '}
                <span className="text-text-primary font-medium">8 key nodes</span>{' '}
                this quarter.
              </p>
            </div>
          </div>

          {/* Operational Trust - Green accent */}
          <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-success" />
              <h3 className="text-sm font-medium text-text-secondary">Operational Trust</h3>
            </div>
            
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-semibold text-text-primary">
                {reliability}%
              </span>
              <span className="text-xs text-success font-medium mb-1">
                {reliability >= 70 ? 'Excellent' : reliability >= 40 ? 'Good' : 'Building'}
              </span>
            </div>
            
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div 
                className="h-full bg-success rounded-full transition-all duration-700" 
                style={{ width: `${reliability}%` }} 
              />
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            RIGHT COLUMN: Behavioral Analysis
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8">
          <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-8">
              <Brain className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-medium text-text-secondary">Behavioral Analysis</h3>
            </div>
            
            {/* Analytics Cards - These keep their semantic colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profileAnalytics?.collaborationStyle && (
                <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />
              )}
              {profileAnalytics?.roleClassification && (
                <RoleClassificationCard data={profileAnalytics.roleClassification} />
              )}
            </div>

            {/* Work Personality Section */}
            <div className="mt-10 pt-8 border-t border-white/[0.06]">
              {user && <WorkPersonality userId={user._id || user.id} />}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            FOOTER ACTION
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 flex justify-center pt-8">
          <button className="
            flex items-center gap-3 px-6 py-3 rounded-xl
            bg-surface-1 border border-white/[0.06]
            text-text-tertiary hover:text-text-primary
            hover:bg-surface-2 hover:border-white/[0.1]
            transition-all duration-200 group
          ">
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-sm">Export Profile Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
