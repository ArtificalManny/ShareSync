// /src/pages/Profile.jsx - THE IDENTITY MIRROR
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import client from "../api/client";
import { getMe, getPublicUser } from "../api/user";
import { Lock, Flame, Star, Zap, Play, Share2, Trophy, Target, Clock, Brain, Heart, Users as UsersIcon } from "lucide-react";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import useReducedMotion from "../hooks/useReducedMotion";
import { UserContext } from "../context/UserContext";
import { track } from "../utils/telemetry.js";

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

// LAYER 1: MOMENTUM RING
function MomentumRing({ todayProgress = 0, weekProgress = 0, monthProgress = 0 }) {
  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Three concentric rings */}
      <svg className="absolute inset-0" viewBox="0 0 200 200">
        {/* Month ring (outer) */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="rgba(139, 92, 246, 0.1)"
          strokeWidth="8"
        />
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="url(#gradient-month)"
          strokeWidth="8"
          strokeDasharray={`${monthProgress * 565} 565`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          className="transition-all duration-1000"
        />

        {/* Week ring (middle) */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="rgba(236, 72, 153, 0.1)"
          strokeWidth="10"
        />
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="url(#gradient-week)"
          strokeWidth="10"
          strokeDasharray={`${weekProgress * 440} 440`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          className="transition-all duration-1000"
        />

        {/* Today ring (inner) */}
        <circle
          cx="100"
          cy="100"
          r="50"
          fill="none"
          stroke="rgba(251, 146, 60, 0.1)"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r="50"
          fill="none"
          stroke="url(#gradient-today)"
          strokeWidth="12"
          strokeDasharray={`${todayProgress * 314} 314`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          className="transition-all duration-1000"
        />

        <defs>
          <linearGradient id="gradient-month">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
          <linearGradient id="gradient-week">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
          <linearGradient id="gradient-today">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Zap className="w-12 h-12 text-yellow-400 animate-pulse" />
        <div className="text-4xl font-bold text-white mt-2">{Math.round(todayProgress * 100)}%</div>
        <div className="text-xs text-slate-400">Today's Momentum</div>
      </div>

      {/* Labels */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 text-xs text-purple-400">
        Month: {Math.round(monthProgress * 100)}%
      </div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 text-xs text-fuchsia-400">
        Week: {Math.round(weekProgress * 100)}%
      </div>
    </div>
  );
}

// LAYER 2: LEVEL + XP BAR
function LevelXpCard({ xp = 0, level = 1, progress = 0, cur = 0, next = 100 }) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-slate-400 mb-1">Your Level</div>
          <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Lv {level}
          </div>
          <div className="text-xs text-slate-500 mt-1">Creator Tier</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{xp} XP</div>
          <div className="text-xs text-slate-400">{next - xp} to next</div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="relative">
        <div className="h-4 rounded-full bg-slate-700/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-400 text-center">
          {xp - cur} / {next - cur} XP
        </div>
      </div>
    </div>
  );
}

// LAYER 3: STREAK FLAME
function StreakFlameCard({ currentStreak = 0, longestStreak = 0 }) {
  const getFlameColor = (s) => {
    if (s >= 100) return { from: '#1E1B4B', to: '#312E81', emoji: '🌌', label: 'Obsidian' };
    if (s >= 75) return { from: '#581C87', to: '#7C3AED', emoji: '🔮', label: 'Purple' };
    if (s >= 50) return { from: '#1E40AF', to: '#3B82F6', emoji: '💙', label: 'Blue' };
    if (s >= 30) return { from: '#EA580C', to: '#F97316', emoji: '🔥', label: 'Fire' };
    return { from: '#94A3B8', to: '#CBD5E1', emoji: '⚪', label: 'White' };
  };

  const flame = getFlameColor(currentStreak);

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Streak</h3>
      </div>

      <div className="text-center">
        <div className="text-7xl mb-3">{flame.emoji}</div>
        <div
          className="text-6xl font-bold mb-2"
          style={{ 
            background: `linear-gradient(135deg, ${flame.from}, ${flame.to})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {currentStreak}
        </div>
        <div className="text-sm text-slate-300">{flame.label} Flame</div>
        <div className="mt-4 text-xs text-slate-500">
          Best: {longestStreak} days 🏆
        </div>
      </div>
    </div>
  );
}

// LAYER 4: MOMENTUM TIMELINE
function MomentumTimeline({ ships = [] }) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Play className="w-5 h-5 text-fuchsia-500" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Last 30 Days</h3>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {ships.length === 0 ? (
          <div className="text-sm text-slate-400 text-center w-full py-8">
            No ships yet. Start shipping to build your timeline!
          </div>
        ) : (
          ships.map((ship, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
              title={ship.title}
            >
              {ship.emoji || '🚀'}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-slate-400 text-center">
        {ships.length} ships this month
      </div>
    </div>
  );
}

// LAYER 5: SKILL CONSTELLATION
function SkillConstellation({ skills = [] }) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-500" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Skills Galaxy</h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {skills.length === 0 ? (
          <div className="text-sm text-slate-400 text-center w-full py-8">
            Complete tasks to unlock skill stars
          </div>
        ) : (
          skills.map((skill, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border border-purple-500/30 flex items-center gap-2"
            >
              <Star className={`w-4 h-4 ${skill.level >= 3 ? 'text-yellow-400' : skill.level >= 2 ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="text-sm text-white">{skill.name}</span>
              <span className="text-xs text-slate-400">Lv{skill.level}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// LAYER 6: FOCUS DNA
function FocusDNA({ data = {} }) {
  const total = Object.values(data).reduce((sum, v) => sum + v, 0) || 1;
  const segments = [
    { label: 'Deep Work', value: data.deepWork || 0, color: '#8B5CF6' },
    { label: 'Shallow', value: data.shallow || 0, color: '#94A3B8' },
    { label: 'Meetings', value: data.meetings || 0, color: '#EF4444' },
    { label: 'Learning', value: data.learning || 0, color: '#10B981' },
    { label: 'Creating', value: data.creating || 0, color: '#F59E0B' },
    { label: 'Recovery', value: data.recovery || 0, color: '#06B6D4' },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-500" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Focus DNA</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {segments.map((seg, i) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{seg.label}</span>
                <span className="text-white font-bold">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full transition-all duration-1000"
                  style={{ width: `${pct}%`, backgroundColor: seg.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// LAYER 7: LEGACY COUNTER
function LegacyCounter({ shipsCount = 0, helpedCount = 0 }) {
  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 rounded-2xl border border-purple-500/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-fuchsia-500" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Your Legacy</h3>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">{shipsCount.toLocaleString()}</div>
          <div className="text-xs text-slate-300">outcomes shipped</div>
          <div className="text-[10px] text-slate-500 mt-1">moved the world forward</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-fuchsia-400 mb-2">{helpedCount.toLocaleString()}</div>
          <div className="text-xs text-slate-300">people helped</div>
          <div className="text-[10px] text-slate-500 mt-1">ship their dreams</div>
        </div>
      </div>
    </div>
  );
}

// BONUS: SHIP REPLAY BUTTON
function ShipReplayButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-purple-500/50 flex items-center justify-center gap-3"
    >
      <Play className="w-6 h-6" />
      Generate Ship Replay
      <Share2 className="w-5 h-5" />
    </button>
  );
}

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

  const handleShipReplay = () => {
    track("ship_replay_clicked");
    alert("Ship Replay video generation coming soon! This will create a 10-second montage of your last 30 days.");
  };

  const user = isPublicRoute ? publicUser : me;
  const xp = Number(user?.xp || 0);
  const { level, progress, cur, next } = progressToNext(xp);

  // Mock data (replace with real data from your backend)
  const mockShips = Array.from({ length: 12 }, (_, i) => ({
    title: `Ship ${i + 1}`,
    emoji: ['🚀', '🎨', '📝', '💻', '🎯'][i % 5]
  }));

  const mockSkills = [
    { name: 'Writing', level: 3 },
    { name: 'Design', level: 2 },
    { name: 'Code', level: 2 },
    { name: 'Leadership', level: 1 },
  ];

  const mockFocusDNA = {
    deepWork: 35,
    shallow: 20,
    meetings: 15,
    learning: 15,
    creating: 10,
    recovery: 5
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading your identity...</div>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent mb-3">
            Your Identity Mirror
          </h1>
          <p className="text-slate-400 text-lg">Who you are becoming, visualized</p>
        </div>

        {/* LAYER 1: Momentum Ring */}
        <div className="flex justify-center">
          <MomentumRing
            todayProgress={0.75}
            weekProgress={0.60}
            monthProgress={0.45}
          />
        </div>

        {/* LAYER 2 & 3: Level + Streak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LevelXpCard xp={xp} level={level} progress={progress} cur={cur} next={next} />
          <StreakFlameCard currentStreak={user?.currentStreak || 0} longestStreak={user?.longestStreak || 0} />
        </div>

        {/* LAYER 4: Timeline */}
        <MomentumTimeline ships={mockShips} />

        {/* LAYER 5 & 6: Skills + Focus DNA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkillConstellation skills={mockSkills} />
          <FocusDNA data={mockFocusDNA} />
        </div>

        {/* LAYER 7: Legacy */}
        <LegacyCounter shipsCount={user?.totalShips || 0} helpedCount={user?.helpedCount || 0} />

        {/* BONUS: Ship Replay */}
        <ShipReplayButton onClick={handleShipReplay} />

      </div>
    </div>
  );
}