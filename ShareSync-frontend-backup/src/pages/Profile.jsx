// src/pages/Profile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: Enhanced Profile with Growth Track Components
// + Patch: robust displayName + near-realtime refresh without backend changes
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
  Sparkles,
} from "lucide-react";
import { toast } from "../components/ui/toast";

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

/**
 * Robust name resolver:
 * - Prefer firstName/lastName
 * - Fall back to common alternatives
 * - Final fallback: username (so UI never looks blank)
 */
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
    reader.onload = (ev) => {
      setPreviewUrl(ev.target.result);
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
      formData.append("profilePicture", blob, "profile.jpg");
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
      <div className="relative w-40 h-40 group">
        <div className="absolute inset-0 rounded-full border border-brand/20" />
        <div className="absolute inset-2 rounded-full overflow-hidden border-4 border-surface-0 bg-surface-2">
          <img
            src={previewUrl || user?.profilePicture || "/default-profile.png"}
            alt="Profile"
            className="w-full h-full object-cover"
          />
          {isOwnProfile && (
            <div
              className="
              absolute inset-0 bg-black/60
              opacity-0 group-hover:opacity-100
              transition-opacity flex items-center justify-center
            "
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-brand rounded-full hover:bg-brand-600 transition-colors"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
        <div
          className="
          absolute -bottom-2 left-1/2 -translate-x-1/2
          px-3 py-1.5 bg-surface-1 rounded-lg border border-white/[0.08]
        "
        >
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
                className="flex-1 py-3 rounded-xl bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl bg-brand text-white hover:bg-brand-600 transition-colors"
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        setPublicUser(u);
      } else {
        const data = await getMe();
        setMe(data);

        // Keep analytics load separate to avoid breaking profile render if analytics fails
        try {
          const analytics = await client.get("/users/profile-analytics");
          setProfileAnalytics(analytics.data);
        } catch (err) {
          // Non-fatal
          console.warn("[Profile] analytics load failed", err?.message || err);
          setProfileAnalytics(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [isPublicRoute, routeUsername]);

  useEffect(() => {
    load();
  }, [load]);

  // “Realtime-ish” refresh without backend changes:
  // - refresh on tab focus / visibility
  // - refresh when localStorage changes (common for profile edits)
  // - optional poll (15s) for active tab only
  useEffect(() => {
    if (isPublicRoute) return;

    let poll = null;

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") load();
    };

    const onFocus = () => load();
    const onVisibility = () => refreshIfVisible();

    const onStorage = (e) => {
      // If your app writes user info/tokens to storage on update, this catches it.
      const key = e?.key || "";
      if (
        key.includes("user") ||
        key.includes("profile") ||
        key.includes("token") ||
        key.includes("auth")
      ) {
        load();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);

    // Poll only while visible
    poll = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 15000);

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

  // Growth Track Data (Phase K)
  const { skillProfile, evolution, suggestions, trends, loading: growthLoading } =
    useGrowthTrack(userId);

  const name = useMemo(() => resolveUserName(user), [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-sm text-text-tertiary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-12 max-w-[1400px] mx-auto">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col items-center mb-16">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />

        <div className="text-center mt-8">
          {/* ✅ This is the “between Rank and ID” name display (always non-empty now) */}
          <h1 className="text-4xl font-semibold text-text-primary mb-3">
            {name.fullName}
          </h1>

          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-text-tertiary">
              ID: {user?.username || user?.handle || "unknown"}
            </span>

            <span
              className="
              flex items-center gap-1.5 px-2.5 py-1 rounded-full
              bg-success/10 text-success text-xs font-medium
            "
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Core Verified
            </span>

            {/* Current Archetype Badge */}
            {skillProfile?.archetype?.current && (
              <span
                className="
                flex items-center gap-1.5 px-2.5 py-1 rounded-full
                bg-brand/10 text-brand text-xs font-medium
              "
              >
                <Star className="w-3.5 h-3.5" />
                {skillProfile.archetype.current}
              </span>
            )}
          </div>

          {user?.bio && (
            <p className="mt-6 text-text-secondary max-w-lg mx-auto leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">
        {/* ─────────────────────────────────────────────────────────────────
            LEFT COLUMN: Impact + Trust + Evolution
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Impact Metrics */}
          <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-medium text-text-secondary">Impact Metrics</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard value={user?.totalShips || 0} label="Deployments" color="text-text-primary" />
              <StatCard value={`${user?.currentStreak || 0}d`} label="Momentum" color="text-brand" />
            </div>

            {/* Overall Growth Indicator */}
            {skillProfile?.overallGrowth && (
              <div className="p-4 rounded-lg bg-success/5 border border-success/10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    +{skillProfile.overallGrowth}% growth this quarter
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Operational Trust */}
          <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-success" />
              <h3 className="text-sm font-medium text-text-secondary">Operational Trust</h3>
            </div>

            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-semibold text-text-primary">{reliability}%</span>
              <span className="text-xs text-success font-medium mb-1">
                {reliability >= 70 ? "Excellent" : reliability >= 40 ? "Good" : "Building"}
              </span>
            </div>

            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-700"
                style={{ width: `${reliability}%` }}
              />
            </div>
          </div>

          {/* Evolution Moments (Phase K) */}
          {isOwnProfile && <EvolutionMoments moments={evolution} loading={growthLoading} />}
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            CENTER COLUMN: Skills Radar + Analytics
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Skills Radar Chart (Phase K) */}
          {isOwnProfile && skillProfile?.skills && (
            <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-medium text-text-secondary">Skill Profile</h3>
                </div>
                {skillProfile.strengths?.length > 0 && (
                  <div className="flex gap-1">
                    {skillProfile.strengths.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[10px] bg-brand/10 text-brand capitalize"
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

              {/* Growth Areas */}
              {skillProfile.growthAreas?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-text-tertiary mb-2">Focus areas for growth:</p>
                  <div className="flex flex-wrap gap-2">
                    {skillProfile.growthAreas.map((area) => (
                      <span
                        key={area}
                        className="px-2 py-1 rounded-lg text-xs bg-warning/10 text-warning capitalize"
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
          <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-8">
              <Brain className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-medium text-text-secondary">Behavioral Analysis</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {profileAnalytics?.collaborationStyle && (
                <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />
              )}
              {profileAnalytics?.roleClassification && (
                <RoleClassificationCard data={profileAnalytics.roleClassification} />
              )}
            </div>

            <div className="mt-10 pt-8 border-t border-white/[0.06]">
              {user && <WorkPersonality userId={user._id || user.id} />}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            RIGHT COLUMN: Growth Suggestions + Trends
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Growth Suggestions (Phase K) */}
          {isOwnProfile && <GrowthSuggestions suggestions={suggestions} loading={growthLoading} />}

          {/* Historical Trends (Phase K) - Compact Version */}
          {isOwnProfile && trends && (
            <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-medium text-text-secondary">Trends</h3>
                <span className="text-xs text-text-tertiary">12 weeks</span>
              </div>

              <div className="space-y-4">
                {["velocity", "quality", "collaboration"].map((metric) => {
                  const growth = trends.summary?.[`${metric}Growth`] || 0;
                  const latest = trends.data?.[trends.data.length - 1]?.[metric] || 0;
                  const isPositive = growth >= 0;

                  return (
                    <div key={metric} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-primary capitalize">{metric}</p>
                        <p className="text-xs text-text-tertiary">{latest}/100</p>
                      </div>
                      <span
                        className={`
                        text-sm font-medium
                        ${isPositive ? "text-success" : "text-error-500"}
                      `}
                      >
                        {isPositive ? "+" : ""}
                        {growth}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            FULL WIDTH: Detailed Trend Charts
        ───────────────────────────────────────────────────────────────── */}
        {isOwnProfile && (
          <div className="col-span-12">
            <TrendCharts trends={trends} loading={growthLoading} />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            FOOTER ACTION
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 flex justify-center pt-8">
          <button
            className="
            flex items-center gap-3 px-6 py-3 rounded-xl
            bg-surface-1 border border-white/[0.06]
            text-text-tertiary hover:text-text-primary
            hover:bg-surface-2 hover:border-white/[0.1]
            transition-all duration-200 group
          "
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-sm">Export Profile Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
