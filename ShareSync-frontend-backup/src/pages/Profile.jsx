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

// NEW: MetaLab UI Components
import { useRenovation } from "../context/RenovationContext";
import Card from "../components/ui/Card";

// ⭐ ANALYTICS COMPONENTS (Preserved)
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

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENTS: REFINED FOR METAlab
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
      <div className="relative w-56 h-56">
        {/* Spatial Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border border-dashed border-violet-500/10 animate-[spin_15s_linear_infinite_reverse]" />
        
        <div className="relative w-full h-full rounded-full p-3">
          <div className="w-full h-full rounded-full overflow-hidden border-[6px] border-[#0B0C0E] shadow-2xl bg-[#16181D]">
            <img 
              src={previewUrl || user?.profilePicture || '/default-profile.png'} 
              alt="Identity" 
              className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500" 
            />
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-md">
                <button onClick={() => fileInputRef.current?.click()} className="p-5 bg-violet-600 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95">
                  <Camera className="w-7 h-7 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* MetaLab Level Badge */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-5 py-2 bg-[#0F1115] rounded-2xl shadow-2xl border border-white/10">
          <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase italic">
            Rank {levelForXp(user?.xp)}
          </span>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      
      {isEditing && (
        <div className="fixed inset-0 bg-[#0B0C0E]/95 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
           <Card className="p-10 max-w-sm w-full text-center" glowColor="rgba(139,92,246,0.2)">
              <h3 className="text-2xl font-black text-white mb-8 tracking-tighter">Sync New Identity?</h3>
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-10 border-4 border-violet-500/30">
                <img src={previewUrl} className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-500 font-bold hover:text-white transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
                <button onClick={handleUpload} disabled={uploading} className="flex-1 py-4 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-all active:scale-95 uppercase text-[10px] tracking-widest">{uploading ? '...' : 'Confirm'}</button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
};

export default function Profile() {
  const { username: routeUsername } = useParams();
  const location = useLocation();
  const { styles } = useRenovation();
  
  // --- PRESERVED LOGIC ---
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
  // --- END LOGIC ---

  const user = isPublicRoute ? publicUser : me;
  const isOwnProfile = !isPublicRoute;

  if (loading) return <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center text-slate-700 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Synchronizing...</div>;

  return (
    <div className="min-h-screen bg-transparent p-8 lg:p-20 max-w-[1500px] mx-auto">
      
      {/* 👤 HERO AREA: Spatial Typography */}
      <section className="flex flex-col items-center mb-24">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />
        <div className="text-center mt-12">
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
            {user?.firstName} <span className="text-slate-500">{user?.lastName}</span>
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="text-slate-500 font-bold tracking-[0.3em] uppercase text-[10px]">ID: {user?.username}</span>
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            <span className="text-emerald-500 font-bold tracking-[0.2em] uppercase text-[9px] flex items-center gap-1.5 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
              <ShieldCheck className="w-3.5 h-3.5" /> Core Verified
            </span>
          </div>
          {user?.bio && (
            <p className="mt-8 text-slate-500 max-w-xl mx-auto leading-relaxed italic text-sm font-medium">
              "{user.bio}"
            </p>
          )}
        </div>
      </section>

      {/* 🍱 THE IDENTITY BENTO: 10-column spacing applied */}
      <div className="grid grid-cols-12 gap-10">
        
        {/* Left Column: Vitals */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          <Card className="p-10" glowColor="rgba(139, 92, 246, 0.1)">
            <div className="flex items-center gap-3 mb-10">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              <h3 className={styles.label || "text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]"}>Impact Metrics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.03] group hover:bg-white/[0.04] transition-all">
                <div className="text-4xl font-black text-white tracking-tighter">{user?.totalShips || 0}</div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-2">Deployments</div>
              </div>
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.03] group hover:bg-white/[0.04] transition-all">
                <div className="text-4xl font-black text-violet-500 tracking-tighter">{user?.currentStreak || 0}d</div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-2">Momentum</div>
              </div>
            </div>
            
            <div className="mt-8 p-6 rounded-2xl bg-violet-600/[0.03] border border-violet-600/10">
               <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                 Systems analysis indicates peak performance across <span className="text-white font-black italic">8 key nodes</span> this quarter.
               </p>
            </div>
          </Card>

          <Card className="p-10" glowColor="rgba(16, 185, 129, 0.1)">
             <div className="flex items-center gap-3 mb-10">
               <Activity className="w-5 h-5 text-emerald-400" />
               <h3 className={styles.label || "text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]"}>Operational Trust</h3>
             </div>
             
             <div className="flex items-end gap-3 mb-6 px-2">
               <div className="text-6xl font-black text-white italic tracking-tighter">
                {calculateReliability(user?.completedTasks, user?.totalTasks)}%
               </div>
               <div className="text-[10px] text-emerald-500 font-bold mb-3 tracking-widest uppercase">Nominal</div>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-1000 ease-out" 
                  style={{ width: `${calculateReliability(user?.completedTasks, user?.totalTasks)}%` }} 
                />
             </div>
          </Card>
        </div>

        {/* Right Column: Work DNA */}
        <Card className="col-span-12 lg:col-span-8 p-10">
          <div className="flex items-center justify-between mb-12">
            <h2 className={styles.label || "text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"}>
              <Brain className="w-5 h-5 text-fuchsia-400" /> Behavioral Analysis
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {profileAnalytics?.collaborationStyle && <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />}
             {profileAnalytics?.roleClassification && <RoleClassificationCard data={profileAnalytics.roleClassification} />}
          </div>

          <div className="mt-16 border-t border-white/5 pt-16">
            {user && <WorkPersonality userId={user._id || user.id} />}
          </div>
        </Card>

        {/* Minimalist Footer Action */}
        <div className="col-span-12 flex justify-center py-20">
           <button className="flex items-center gap-4 px-10 py-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-slate-500 font-bold hover:bg-white/[0.06] hover:text-white hover:border-white/10 transition-all duration-300 group">
             <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
             <span className="text-[10px] uppercase tracking-[0.3em]">Export Identity Ledger</span>
           </button>
        </div>

      </div>
    </div>
  );
}
