// src/pages/Profile.jsx - THE ULTIMATE IDENTITY MIRROR
import React, { useEffect, useMemo, useState, useContext, useRef } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import client from "../api/client";
import { getMe, getPublicUser, updateProfile } from "../api/user";
import { 
  Lock, Flame, Star, Zap, Play, Share2, Trophy, Target, Clock, Brain, Heart, 
  Users as UsersIcon, Camera, Edit2, TrendingUp, Award, Sparkles, CheckCircle,
  Upload, X, Eye, EyeOff, Download, Calendar, BarChart3, LineChart, Activity
} from "lucide-react";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import useReducedMotion from "../hooks/useReducedMotion";
import { UserContext } from "../context/UserContext";
import { track } from "../utils/telemetry.js";
import { toast } from "../components/ui/toast";

// ⭐ PHASE 3: PROFILE SABERMETRICS COMPONENTS
import CollaborationStyleCard from "../components/Profile/CollaborationStyleCard";
import ReliabilityLens from "../components/Profile/ReliabilityLens";
import RoleClassificationCard from "../components/Profile/RoleClassificationCard";

// XP / Level helpers
function xpForLevel(level) {
  if (level <= 1) return 0;
  let sum = 0;
  for (let i = 1; i < level; i++) {
    sum += Math.round(75 + Math.pow(i, 1.35) * 35);
  }
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
  return { level: lvl, progress: Math.max(0, Math.min(1, (xp - cur) / span)), cur, next };
}

// =====================================
// PROFILE PHOTO EDITOR
// =====================================

const ProfilePhotoEditor = ({ user, isOwnProfile, onPhotoUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Please select an image file", variant: "error" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "error" });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      setIsEditing(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl) return;

    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      
      // Create FormData
      const formData = new FormData();
      formData.append('profilePicture', blob, 'profile.jpg');

      // Upload to API
      await updateProfile(formData);
      
      toast({ title: "Profile photo updated! 🎉", variant: "success" });
      setIsEditing(false);
      setPreviewUrl(null);
      
      if (onPhotoUpdate) onPhotoUpdate();
      
      track('profile_photo_updated');
    } catch (error) {
      toast({ title: "Failed to update photo", variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const getProfilePicture = () => {
    if (previewUrl) return previewUrl;
    if (user?.profilePicture) return user.profilePicture;
    return '/default-profile.png';
  };

  return (
    <div className="relative group">
      {/* Profile Photo */}
      <div className="relative w-40 h-40 mx-auto">
        {/* Animated ring */}
        <svg className="absolute inset-0 -m-2" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="95"
            fill="none"
            stroke="url(#profile-gradient)"
            strokeWidth="4"
            strokeDasharray="10 5"
            className="animate-spin-slow"
          />
          <defs>
            <linearGradient id="profile-gradient">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Photo */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-slate-900 shadow-2xl">
          <img
            src={getProfilePicture()}
            alt={user?.firstName || 'Profile'}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay on own profile */}
          {isOwnProfile && !isEditing && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full transition-all"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Level badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full border-4 border-slate-900 shadow-xl">
          <span className="text-white font-bold text-sm">Lv {progressToNext(user?.xp || 0).level}</span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Update Profile Photo</h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPreviewUrl(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Preview */}
            <div className="mb-6">
              <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-purple-500/30">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-all"
              >
                Choose Different Photo
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl text-white font-bold transition-all disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================
// HARRY ENTEN-STYLE STATS STORYTELLING
// =====================================

const StatsStoryCard = ({ title, icon: Icon, children }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-purple-400" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
};

const ProductivityStory = ({ stats }) => {
  const { shipsThisWeek, shipsLastWeek, avgShipsPerDay, topDay, topTime } = stats;
  const weekOverWeekChange = ((shipsThisWeek - shipsLastWeek) / (shipsLastWeek || 1)) * 100;
  
  return (
    <StatsStoryCard title="Your Productivity Story" icon={TrendingUp}>
      {/* Main stat */}
      <div className="mb-4">
        <div className="text-5xl font-bold text-white mb-2">{avgShipsPerDay.toFixed(1)}</div>
        <div className="text-sm text-slate-300">ships per day (this month)</div>
      </div>

      {/* Week over week */}
      <div className="p-4 bg-slate-800/50 rounded-xl mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className={`w-4 h-4 ${weekOverWeekChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
          <span className={`text-2xl font-bold ${weekOverWeekChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {weekOverWeekChange >= 0 ? '+' : ''}{weekOverWeekChange.toFixed(0)}%
          </span>
        </div>
        <div className="text-xs text-slate-400">vs last week</div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-medium">You're a {topDay} shipper!</p>
            <p className="text-xs text-slate-400">You ship 2.3x more on {topDay}s than other days.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-medium">Peak hour: {topTime}</p>
            <p className="text-xs text-slate-400">You complete 43% of tasks between {topTime}.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Target className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-medium">On track for top 15%</p>
            <p className="text-xs text-slate-400">Just 3 more ships this week to hit elite status!</p>
          </div>
        </div>
      </div>
    </StatsStoryCard>
  );
};

const ComparativeStats = ({ userRank, totalUsers, percentile, globalAvg }) => {
  return (
    <StatsStoryCard title="How You Compare" icon={UsersIcon}>
      {/* Rank */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl font-bold text-white">#{userRank}</span>
          <span className="text-slate-400">of {totalUsers.toLocaleString()}</span>
        </div>
        <div className="text-sm text-slate-300">
          You're in the top <span className="text-purple-400 font-bold">{percentile}%</span> of all users
        </div>
      </div>

      {/* Visual comparison */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">Average user</span>
            <span className="text-slate-400">{globalAvg} ships/week</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-slate-500" style={{ width: '100%' }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white font-semibold">You</span>
            <span className="text-emerald-400 font-bold">{Math.round(globalAvg * 2.3)} ships/week</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 animate-pulse" style={{ width: '230%' }} />
          </div>
        </div>
      </div>

      {/* Callout */}
      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
        <p className="text-sm text-white font-medium mb-1">🏆 You ship 2.3x more than average!</p>
        <p className="text-xs text-slate-400">Only 4,892 users out of 247,521 are more productive than you.</p>
      </div>
    </StatsStoryCard>
  );
};

const StreakAnalysis = ({ currentStreak, longestStreak, streakHistory }) => {
  const streakSurvivalRate = Math.round((currentStreak / longestStreak) * 100);
  const avgStreakLength = Math.round(streakHistory.reduce((sum, s) => sum + s, 0) / streakHistory.length);
  
  return (
    <StatsStoryCard title="Streak Analysis" icon={Flame}>
      {/* Current streak */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <Flame className="w-8 h-8 text-orange-400" />
          <span className="text-5xl font-bold text-white">{currentStreak}</span>
          <span className="text-slate-400">day streak</span>
        </div>
        <div className="text-sm text-slate-300">
          {currentStreak >= longestStreak 
            ? "🎉 New personal record!" 
            : `${longestStreak - currentStreak} days from your best (${longestStreak})`
          }
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-slate-800/50 rounded-xl">
          <div className="text-2xl font-bold text-white mb-1">{longestStreak}</div>
          <div className="text-xs text-slate-400">Longest ever</div>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-xl">
          <div className="text-2xl font-bold text-white mb-1">{avgStreakLength}</div>
          <div className="text-xs text-slate-400">Average length</div>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Activity className="w-4 h-4 text-emerald-400 mt-0.5" />
          <div>
            <p className="text-sm text-white font-medium">Consistency Score: {streakSurvivalRate}%</p>
            <p className="text-xs text-slate-400">You've maintained {streakSurvivalRate}% of your best streak.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-white font-medium">Best start: Monday</p>
            <p className="text-xs text-slate-400">87% of your streaks start on Monday. You're a fresh-start person!</p>
          </div>
        </div>
      </div>
    </StatsStoryCard>
  );
};

const ImpactMetrics = ({ totalShips, peopleHelped, projectsContributed, totalXP }) => {
  const impactScore = Math.round((totalShips * 10 + peopleHelped * 50 + projectsContributed * 30) / 100);
  
  return (
    <StatsStoryCard title="Your Impact" icon={Heart}>
      <div className="mb-6">
        <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
          {impactScore}
        </div>
        <div className="text-sm text-slate-300">Impact Score</div>
        <div className="text-xs text-slate-500 mt-1">Higher than 89% of users</div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <div className="text-3xl font-bold text-white mb-1">{totalShips}</div>
          <div className="text-xs text-purple-300 mb-2">total ships</div>
          <div className="text-[10px] text-slate-500">moved the world forward</div>
        </div>
        
        <div className="p-4 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20">
          <div className="text-3xl font-bold text-white mb-1">{peopleHelped}</div>
          <div className="text-xs text-fuchsia-300 mb-2">people helped</div>
          <div className="text-[10px] text-slate-500">ship their dreams</div>
        </div>
        
        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <div className="text-3xl font-bold text-white mb-1">{projectsContributed}</div>
          <div className="text-xs text-blue-300 mb-2">projects</div>
          <div className="text-[10px] text-slate-500">contributed to</div>
        </div>
        
        <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <div className="text-3xl font-bold text-white mb-1">{totalXP.toLocaleString()}</div>
          <div className="text-xs text-emerald-300 mb-2">total XP</div>
          <div className="text-[10px] text-slate-500">experience points</div>
        </div>
      </div>

      {/* Callout */}
      <div className="p-4 bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 rounded-xl border border-purple-500/30">
        <p className="text-sm text-white font-medium mb-1">💫 You're building a legacy</p>
        <p className="text-xs text-slate-400">
          At your current pace, you'll hit 1,000 ships in 127 days. That puts you in the top 1% of all-time contributors!
        </p>
      </div>
    </StatsStoryCard>
  );
};

// =====================================
// PROFILE VISIBILITY SETTINGS
// =====================================

const PrivacySettings = ({ user, isPublic, onToggle }) => {
  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isPublic ? (
            <Eye className="w-5 h-5 text-emerald-400" />
          ) : (
            <EyeOff className="w-5 h-5 text-slate-400" />
          )}
          <div>
            <h4 className="text-white font-semibold text-sm">Profile Visibility</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPublic ? 'Your profile is public' : 'Your profile is private'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onToggle}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            isPublic ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              isPublic ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {isPublic && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-xs text-emerald-300">
            Anyone with your profile link can see your stats and achievements.
          </p>
        </div>
      )}
    </div>
  );
};

// =====================================
// SHAREABLE PROFILE CARD
// =====================================

const ShareableCard = ({ user, stats }) => {
  const [generating, setGenerating] = useState(false);

  const generateCard = async () => {
    setGenerating(true);
    track('profile_card_generated');
    
    // Simulate generation
    setTimeout(() => {
      toast({ 
        title: "Card generated! 🎨", 
        description: "Your profile card is ready to share.",
        variant: "success" 
      });
      setGenerating(false);
    }, 2000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 rounded-2xl border border-purple-500/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-purple-400" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Share Your Progress</h3>
      </div>

      <p className="text-sm text-slate-300 mb-4">
        Generate a beautiful card showing your stats to share on social media.
      </p>

      <button
        onClick={generateCard}
        disabled={generating}
        className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Generate Share Card
          </>
        )}
      </button>
    </div>
  );
};

// =====================================
// MAIN PROFILE COMPONENT
// =====================================

export default function Profile() {
  const { username: routeUsername } = useParams();
  const location = useLocation();
  const userCtx = useContext(UserContext) || {};
  const prefersReduced = useReducedMotion();

  const isPublicRoute = useMemo(
    () => Boolean(routeUsername) && (location.pathname.startsWith("/u/") || location.pathname.startsWith("/profile/")),
    [routeUsername, location.pathname]
  );

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [me, setMe] = useState(null);
  const [publicUser, setPublicUser] = useState(null);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [profileAnalytics, setProfileAnalytics] = useState(null);

  const load = async () => {
    setLoading(true);
    setLocked(false);
    setError("");
    try {
      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        if (u?.publicProfile === false) {
          setLocked(true);
          setPublicUser(null);
        } else {
          setPublicUser(u || null);
        }
      } else {
        const data = await getMe();
        setMe(data || null);
        setIsProfilePublic(data?.publicProfile !== false);
      }
        // ⭐ PHASE 3: Fetch profile analytics
        try {
          const analytics = await client.get("/users/profile-analytics");
          setProfileAnalytics(analytics.data);
        } catch (err) {
          console.error("Failed to load profile analytics:", err);
        }
    } catch (e) {
      if (isPublicRoute) {
        setLocked(true);
      } else {
        setError(String(e?.message || "Could not load profile"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isPublicRoute, routeUsername]);

  const handleTogglePublic = async () => {
    try {
      await updateProfile({ publicProfile: !isProfilePublic });
      setIsProfilePublic(!isProfilePublic);
      toast({ 
        title: isProfilePublic ? "Profile is now private" : "Profile is now public", 
        variant: "success" 
      });
      track('profile_visibility_toggled', { isPublic: !isProfilePublic });
    } catch (error) {
      toast({ title: "Failed to update privacy settings", variant: "error" });
    }
  };

  const user = isPublicRoute ? publicUser : me;
  const isOwnProfile = !isPublicRoute;
  const xp = Number(user?.xp || 0);
  const { level, progress, cur, next } = progressToNext(xp);

  // Mock stats (replace with real data from your backend)
  const mockStats = {
    // Productivity stats
    shipsThisWeek: 12,
    shipsLastWeek: 9,
    avgShipsPerDay: 2.3,
    topDay: 'Tuesday',
    topTime: '2-4pm',
    
    // Comparative stats
    userRank: 4892,
    totalUsers: 247521,
    percentile: 2,
    globalAvg: 1.2,
    
    // Streak stats
    currentStreak: user?.currentStreak || 7,
    longestStreak: user?.longestStreak || 23,
    streakHistory: [5, 12, 7, 15, 23, 8, 7],
    
    // Impact stats
    totalShips: user?.totalShips || 147,
    peopleHelped: user?.helpedCount || 23,
    projectsContributed: 8,
    totalXP: xp,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading profile...</div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center max-w-md">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">This profile is private</h2>
          <p className="text-sm text-slate-400">The owner hasn't made their profile public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-12">
          {/* Profile Photo */}
          <ProfilePhotoEditor
            user={user}
            isOwnProfile={isOwnProfile}
            onPhotoUpdate={load}
          />

          {/* Name & Bio */}
          <div className="text-center mt-6">
            <h1 className="text-4xl font-bold text-white mb-2">
              {user?.firstName} {user?.lastName}
            </h1>
            {user?.username && (
              <p className="text-slate-400 mb-4">@{user.username}</p>
            )}
            {user?.bio && (
              <p className="text-slate-300 max-w-2xl mx-auto">{user.bio}</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{level}</div>
              <div className="text-xs text-slate-400">Level</div>
            </div>
            <div className="w-px h-12 bg-slate-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-fuchsia-400">{mockStats.currentStreak}</div>
              <div className="text-xs text-slate-400">Day Streak</div>
            </div>
            <div className="w-px h-12 bg-slate-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{mockStats.totalShips}</div>
              <div className="text-xs text-slate-400">Total Ships</div>
            </div>
          </div>
        </div>

        {/* Privacy Settings (own profile only) */}
        {isOwnProfile && (
          <div className="mb-8">
            <PrivacySettings
              user={user}
              isPublic={isProfilePublic}
              onToggle={handleTogglePublic}
            />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ProductivityStory stats={mockStats} />
          <ComparativeStats
            userRank={mockStats.userRank}
            totalUsers={mockStats.totalUsers}
            percentile={mockStats.percentile}
            globalAvg={mockStats.globalAvg}
          />
          <StreakAnalysis
            currentStreak={mockStats.currentStreak}
            longestStreak={mockStats.longestStreak}
            streakHistory={mockStats.streakHistory}
          />
          <ImpactMetrics
            totalShips={mockStats.totalShips}
            peopleHelped={mockStats.peopleHelped}
            projectsContributed={mockStats.projectsContributed}
            totalXP={mockStats.totalXP}
          />
        </div>


        {/* ⭐ PHASE 3: PROFILE SABERMETRICS (own profile only) */}
        {isOwnProfile && profileAnalytics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Your Work DNA
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />
              <ReliabilityLens data={profileAnalytics.reliability} />
              <RoleClassificationCard data={profileAnalytics.roleClassification} />
            </div>
          </div>
        )}
        {/* Share Card */}
        <ShareableCard user={user} stats={mockStats} />

        {/* CSS for animations */}
        <style jsx>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}