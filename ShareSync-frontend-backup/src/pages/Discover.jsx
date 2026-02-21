// src/pages/Discover.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// WEEK 6 SOCIAL DISCOVERY
// v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// CHANGES IN v4.0:
// - Updated to light theme (white backgrounds, slate text)
// - All functionality preserved exactly
// - NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Users, Heart, Clock, Target, Coffee, Moon, Activity, Rocket, Sparkles, UserPlus
} from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';
import { toast } from '../components/ui/toast';
import { getDiscoverySections } from '../api/discovery';

// Real follow system
import FollowButton from '../components/follow/FollowButton';

// Polling hook
import usePolling from '../hooks/usePolling';

// Phase 2 Moderation Gate
const MODERATION_GATE_V1 = String(import.meta?.env?.VITE_MODERATION_GATE_V1 || "false") === "true";

function isModerationApproved(item) {
  if (!MODERATION_GATE_V1) return true;
  const s = String(item?.moderationStatus || "approved").toLowerCase();
  return s === "approved";
}

// =====================================
// JUNGLE VIEW COMPONENTS (✅ UPDATED: Light theme)
// =====================================

// 1. HOT STREAKS SECTION
const HotStreaksSection = ({ isMobile, items }) => {
  const navigate = useNavigate();

  const getMomentumColor = (momentum) => {
    switch (momentum) {
      case 'blazing': return 'from-orange-500 to-red-500';
      case 'high': return 'from-violet-500 to-fuchsia-500';
      case 'steady': return 'from-blue-500 to-cyan-500';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  const handleRequestJoin = (project) => {
    toast({ title: `Request sent to ${project.teamName}!`, variant: 'success' });
  };

  const handleStartCowork = (project) => {
    toast({ title: `Starting co-work session with ${project.teamName}`, variant: 'success' });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">🔥 Hot Streaks</h2>
          <p className="text-sm text-slate-500">Teams on 10+ day streaks crushing it</p>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
        {items.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 transition-all cursor-pointer group shadow-sm"
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <span className="text-4xl">{project.emoji}</span>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-violet-600 transition-colors">
                  {project.projectName}
                </h3>
                <p className="text-sm text-slate-500">{project.teamName}</p>
              </div>
            </div>

            {/* Streak Badge */}
            <div className={`bg-gradient-to-r ${getMomentumColor(project.momentum)} p-0.5 rounded-xl mb-4`}>
              <div className="bg-white rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-slate-800 text-lg">{project.streak} days</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users className="w-3 h-3" />
                  <span>{project.members}</span>
                </div>
              </div>
            </div>

            {/* Last Ship */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Rocket className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-semibold text-slate-600">Latest:</span>
              </div>
              <p className="text-sm text-slate-700">{project.lastShip}</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleRequestJoin(project); }}
                className="px-3 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg text-xs font-semibold text-violet-700 transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleStartCowork(project); }}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <Users className="w-4 h-4" />
                <span>Co-work</span>
              </button>

              {/* Real follow */}
              <div className="flex justify-center">
                <FollowButton
                  projectId={project.id}
                  projectName={project.projectName}
                  variant="emerald"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. QUIET BUT PROMISING SECTION
const QuietButPromisingSection = ({ isMobile, items }) => {
  const navigate = useNavigate();

  const handleOfferHelp = (project) => {
    toast({ title: `Offering help to ${project.ownerName}!`, variant: 'success' });
  };

  const handleSendEncouragement = (project) => {
    toast({ title: `Encouragement sent to ${project.projectName}!`, variant: 'success' });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">🌱 Quiet but Promising</h2>
          <p className="text-sm text-slate-500">Projects that need a push to finish strong</p>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
        {items.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 transition-all shadow-sm"
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">{project.emoji}</span>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg">{project.projectName}</h3>
                <p className="text-sm text-slate-500">by {project.ownerName}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Last activity</div>
                <div className="text-sm font-semibold text-amber-600">{project.lastActivity}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-slate-500">Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${project.completionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{project.completionRate}%</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-4 h-4 text-violet-500" />
                  <span className="text-xs text-slate-500">Ships</span>
                </div>
                <div className="text-lg font-bold text-slate-800">{project.totalShips}</div>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
              <p className="text-sm text-slate-700">💡 {project.reason}</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleOfferHelp(project)}
                className="px-3 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg text-xs font-semibold text-violet-700 transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>Help</span>
              </button>
              <button
                onClick={() => handleSendEncouragement(project)}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700 transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <Heart className="w-4 h-4" />
                <span>Cheer</span>
              </button>

              {/* Real follow */}
              <div className="flex justify-center">
                <FollowButton
                  projectId={project.id}
                  projectName={project.projectName}
                  variant="blue"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. PEOPLE WHO WORK LIKE YOU SECTION
const PeopleWorkLikeYouSection = ({ isMobile, items }) => {
  const navigate = useNavigate();

  const handleConnect = (person) => {
    toast({ title: `Connection request sent to ${person.name}!`, variant: 'success' });
  };

  const handleScheduleCowork = (person) => {
    toast({ title: `Co-work session scheduled with ${person.name}`, variant: 'success' });
  };

  const getWorkStyleIcon = (style) => {
    switch (style) {
      case 'Night Owl': return <Moon className="w-4 h-4 text-violet-500" />;
      case 'Early Bird': return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'Deep Focus': return <Target className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">✨ People Who Work Like You</h2>
          <p className="text-sm text-slate-500">Based on your patterns and preferences</p>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
        {items.map((person) => (
          <div
            key={person.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 transition-all shadow-sm"
          >
            {/* Profile */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-violet-200">
                {person.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{person.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getWorkStyleIcon(person.workStyle)}
                  <span className="text-xs text-slate-500">{person.workStyle}</span>
                </div>
              </div>
            </div>

            {/* Similarity Badge */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-600">Match Score</span>
                <span className="text-lg font-bold text-emerald-600">{person.similarity}%</span>
              </div>
              <p className="text-xs text-slate-500">{person.reason}</p>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-slate-600">Peak: {person.peakTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Rocket className="w-4 h-4 text-violet-500" />
                <span className="text-slate-600">{person.currentProject}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-slate-600">{person.streak} day streak</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleConnect(person)}
                className="px-3 py-2 bg-violet-500 hover:bg-violet-600 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 shadow-md shadow-violet-200"
              >
                Connect
              </button>
              <button
                onClick={() => handleScheduleCowork(person)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all active:scale-95"
              >
                Co-work
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =====================================
// MAIN DISCOVER PAGE (✅ UPDATED: Light theme)
// =====================================

export default function Discover() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);

  // Start EMPTY (NO mock defaults)
  const [hotStreaks, setHotStreaks] = useState([]);
  const [quietProjects, setQuietProjects] = useState([]);
  const [similarPeople, setSimilarPeople] = useState([]);

  // Keep track of in-flight request, abort on new poll/unmount
  const abortRef = useRef(null);
  const aliveRef = useRef(true);

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);

      // Abort any previous request
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      const sections = await getDiscoverySections({ signal: controller.signal });

      const hs0 = Array.isArray(sections?.hotStreaks) ? sections.hotStreaks : [];
      const qp0 = Array.isArray(sections?.quietPromising) ? sections.quietPromising : [];
      const pl0 = Array.isArray(sections?.peopleLikeYou) ? sections.peopleLikeYou : [];

      // Phase 2 Moderation filter (safe no-op unless enabled)
      const hs = hs0.filter(isModerationApproved);
      const qp = qp0.filter(isModerationApproved);
      const pl = pl0.filter(isModerationApproved);

      if (!aliveRef.current) return;

      setHotStreaks(hs);
      setQuietProjects(qp);
      setSimilarPeople(pl);
    } catch (e) {
      // If aborted, ignore silently
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;

      if (!aliveRef.current) return;

      // Keep empty on error (do NOT fall back to mocks)
      setHotStreaks([]);
      setQuietProjects([]);
      setSimilarPeople([]);
    } finally {
      if (!aliveRef.current) return;
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load with your existing "loading feel"
  useEffect(() => {
    aliveRef.current = true;

    const t = setTimeout(() => {
      load({ silent: false });
    }, 350);

    return () => {
      aliveRef.current = false;
      clearTimeout(t);
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
  }, [load]);

  // Poll in the background (silent)
  const pollMs = Number(import.meta?.env?.VITE_DISCOVER_POLL_MS) || 20000;

  usePolling(
    async () => {
      await load({ silent: true });
    },
    {
      intervalMs: pollMs,
      immediate: false,
      pauseWhenHidden: true,
      jitter: true,
      backoffOnError: true,
      backoffMaxMs: 120000,
    }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty =
    (!hotStreaks || hotStreaks.length === 0) &&
    (!quietProjects || quietProjects.length === 0) &&
    (!similarPeople || similarPeople.length === 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-6'} py-8`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Discover
              </h1>
              <p className="text-slate-500">Find your tribe in the jungle 🌴</p>
              {MODERATION_GATE_V1 && (
                <p className="mt-1 text-xs text-slate-400">
                  Moderation gate: showing approved listings only.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Empty state when backend returns nothing */}
        {isEmpty && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="text-xl font-bold text-slate-800 mb-2">No public projects yet</div>
            <p className="text-slate-600 text-sm">
              As teams set projects to <span className="text-violet-600 font-semibold">Public + Listed</span>, they'll appear here automatically.
            </p>
            <div className="mt-4 text-xs text-slate-400">
              (This page refreshes quietly in the background.)
            </div>
          </div>
        )}

        {/* Render sections only if they have items */}
        {hotStreaks?.length > 0 && <HotStreaksSection isMobile={isMobile} items={hotStreaks} />}
        {quietProjects?.length > 0 && <QuietButPromisingSection isMobile={isMobile} items={quietProjects} />}
        {similarPeople?.length > 0 && <PeopleWorkLikeYouSection isMobile={isMobile} items={similarPeople} />}
      </div>
    </div>
  );
}
