// src/pages/Profile.jsx - THE ULTIMATE IDENTITY MIRROR (METAlab EDITION)
import React, { useEffect, useMemo, useState, useContext, useRef } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import client from "../api/client";
import { getMe, getPublicUser, updateProfile } from "../api/user";
import { 
  Lock, Flame, Star, Zap, Play, Share2, Trophy, Target, Clock, Brain, Heart, 
  Users as UsersIcon, Camera, Edit2, TrendingUp, Award, Sparkles, CheckCircle,
  Upload, X, Eye, EyeOff, Download, Calendar, BarChart3, LineChart, Activity,
  ShieldCheck, LayoutGrid
} from "lucide-react";
import { UserContext } from "../context/UserContext";
import { track } from "../utils/telemetry.js";
import { toast } from "../components/ui/toast";

// ⭐ ANALYTICS COMPONENTS
import CollaborationStyleCard from "../components/Profile/CollaborationStyleCard";
import WorkPersonality from "../components/analytics/WorkPersonality";
import RoleClassificationCard from "../components/Profile/RoleClassificationCard";

/* ─────────────────────────────────────────────────────────────────────────
   UTILS & HELPERS (Preserved)
───────────────────────────────────────────────────────────────────────── */
const calculateReliability = (completed, total) => (!total || total === 0) ? 0 : Math.round((completed / total) * 100);

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
function progressToNext(xp = 0) {
  const lvl = levelForXp(xp);
  const cur = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  const span = Math.max(1, next - cur);
  return { level: lvl, progress: Math.max(0, Math.min(1, (xp - cur) / span)) };
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENTS: REFINED FOR METAlab
───────────────────────────────────────────────────────────────────────── */

const BentoStatCard = ({ title, icon: Icon, children, className = "" }) => (
  <div className={`bento-elevated p-8 ${className}`}>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <Icon className="w-5 h-5 text-violet-400" />
      </div>
      <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
    </div>
    {children}
  </div>
);

const ProfilePhotoEditor = ({ user, isOwnProfile, onPhotoUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { setPreviewUrl(e.target.result); setIsEditing(true); };
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
      toast({ title: "Identity Updated", variant: "success" });
      setIsEditing(false);
      if (onPhotoUpdate) onPhotoUpdate();
    } catch (error) { toast({ title: "Update Failed", variant: "error" }); }
    finally { setUploading(false); }
  };

  return (
    <div className="relative group flex flex-col items-center">
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-full border border-dashed border-violet-500/30 animate-[spin_10s_linear_infinite]" />
        <div className="relative w-full h-full rounded-full p-2">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-surface shadow-2xl bg-elevated">
            <img src={previewUrl || user?.profilePicture || '/default-profile.png'} alt="Identity" className="w-full h-full object-cover" />
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-violet-600 rounded-full shadow-xl hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-violet-600 rounded-full shadow-lg border-2 border-surface">
          <span className="text-white font-black text-xs">LVL {levelForXp(user?.xp)}</span>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      
      {isEditing && (
        <div className="fixed inset-0 bg-deep/90 backdrop-blur-md flex items-center justify-center z-[100] p-6">
           <div className="bento-elevated p-8 max-w-sm w-full text-center">
              <h3 className="text-xl font-black text-white mb-6">Confirm Identity Change</h3>
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-8 border-4 border-violet-500/20">
                <img src={previewUrl} className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold">Cancel</button>
                <button onClick={handleUpload} disabled={uploading} className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold">{uploading ? '...' : 'Save'}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default function Profile() {
  const { username: routeUsername } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [publicUser, setPublicUser] = useState(null);
  const [profileAnalytics, setProfileAnalytics] = useState(null);

  const isPublicRoute = useMemo(() => Boolean(routeUsername) && location.pathname.startsWith("/u/"), [routeUsername, location.pathname]);

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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [isPublicRoute, routeUsername]);

  const user = isPublicRoute ? publicUser : me;
  const isOwnProfile = !isPublicRoute;

  if (loading) return <div className="min-h-screen bg-deep flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Scanning Identity...</div>;

  return (
    <div className="min-h-screen bg-transparent p-8 lg:p-12 max-w-[1400px] mx-auto">
      
      {/* 👤 HERO AREA */}
      <section className="flex flex-col items-center mb-16">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />
        <div className="text-center mt-8">
          <h1 className="text-5xl font-black text-white tracking-metalab mb-2">
            {user?.firstName} {user?.lastName}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="text-slate-500 font-bold tracking-widest uppercase text-xs">@{user?.username}</span>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-emerald-500 font-bold tracking-widest uppercase text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified Operator
            </span>
          </div>
          {user?.bio && <p className="mt-6 text-slate-400 max-w-xl mx-auto leading-relaxed italic">"{user.bio}"</p>}
        </div>
      </section>

      {/* 🍱 THE IDENTITY BENTO */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Vital Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <BentoStatCard title="Core Impact" icon={TrendingUp}>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-3xl font-black text-white">{user?.totalShips || 0}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Total Ships</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-3xl font-black text-violet-500">{user?.currentStreak || 0}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Day Streak</div>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-violet-600/5 border border-violet-600/20">
               <p className="text-xs text-slate-300 leading-relaxed">
                 Moved the world forward across <span className="text-white font-bold">8 projects</span> this quarter.
               </p>
            </div>
          </BentoStatCard>

          <BentoStatCard title="Reliability" icon={Activity}>
             <div className="flex items-end gap-3 mb-4">
               <div className="text-5xl font-black text-white italic">{calculateReliability(user?.completedTasks, user?.totalTasks)}%</div>
               <div className="text-xs text-emerald-500 font-bold mb-2 tracking-tight">Optimal</div>
             </div>
             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" style={{ width: `${calculateReliability(user?.completedTasks, user?.totalTasks)}%` }} />
             </div>
          </BentoStatCard>
        </div>

        {/* Work DNA / Sabermetrics */}
        <div className="col-span-12 lg:col-span-8 bento-elevated p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4 text-fuchsia-400" /> Professional DNA
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {profileAnalytics?.collaborationStyle && <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />}
             {profileAnalytics?.roleClassification && <RoleClassificationCard data={profileAnalytics.roleClassification} />}
          </div>

          <div className="mt-12">
            {user && <WorkPersonality userId={user._id || user.id} />}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="col-span-12 flex justify-center py-12">
           <button className="flex items-center gap-3 px-8 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-slate-400 font-bold hover:bg-white/[0.06] hover:text-white transition-all group">
             <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
             Download Identity Card
           </button>
        </div>

      </div>
    </div>
  );
}
