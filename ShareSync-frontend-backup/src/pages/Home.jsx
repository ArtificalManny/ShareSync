// src/pages/Home.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { getProjectsQuick } from "../api/projects";
import { AuthContext } from "../AuthContext";
import { track } from "../utils/telemetry";
import PageHeader from "../components/layout/PageHeader.jsx";
import AICoachWhisper from "../components/momentum/AICoachWhisper";

const DEFAULT_PROFILE_PIC = "/default-profile.png";

/* ------------------ STYLES ------------------ */
const PageStyles = () => (
  <style>{`
    .home-page { 
      row-gap: 1.25rem; 
      padding-bottom: 1rem;
      min-height: calc(100vh - 4rem);
      display: flex;
      flex-direction: column;
    }
    @media (min-width: 768px) { .home-page { row-gap: 1.5rem; } }

    /* READINESS SCORE CARD */
    .readiness-card {
      background: rgba(30, 30, 40, 0.75);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
      border-radius: 1.5rem;
      overflow: hidden;
      color: #e2e8f0;
      padding: 1.5rem;
    }
    .readiness-score {
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .readiness-label {
      font-size: 1.125rem;
      font-weight: 600;
      margin-top: 0.5rem;
    }
    .readiness-bar {
      height: 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      overflow: hidden;
      margin: 1rem 0;
    }
    .readiness-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s ease, background 0.3s ease;
    }
    .readiness-high { background: linear-gradient(90deg, #10b981, #34d399); }
    .readiness-medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .readiness-low { background: linear-gradient(90deg, #ef4444, #f87171); }

    /* AI PLAN CAPSULE */
    .ai-plan { 
      background: rgba(30, 30, 40, 0.75); 
      backdrop-filter: blur(24px) saturate(180%); 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
      border-radius: 1.5rem;
      overflow: hidden;
      color: #e2e8f0;
    }
    .ai-plan .glow { 
      position: absolute; inset: 0; 
      background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.2), transparent 70%); 
      pointer-events: none; 
    }
    .ai-plan .btn-regen { 
      background: linear-gradient(90deg, #6366f1, #ec4899); 
      color: white; 
      font-weight: 600; 
      transition: all 0.3s ease; 
      border-radius: 0.75rem;
    }
    .ai-plan .btn-regen:hover { 
      transform: translateY(-1px); 
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4); 
    }

    /* MOMENTUM RING */
    .momentum-ring { 
      width: 160px; height: 160px; 
      display: flex; align-items: center; justify-content: center; 
    }
    .momentum-ring svg { 
      transform: none;
    }
    .momentum-ring .bg { 
      stroke: rgba(255, 255, 255, 0.08); 
    }
    .momentum-ring .fill { 
      stroke: url(#gradient); 
      stroke-linecap: round; 
      transition: stroke-dasharray 1.5s ease; 
    }
    .momentum-ring .score { 
      fill: #e2e8f0; 
      font-size: 2.5rem; 
      font-weight: 700;
    }
    .momentum-ring .label { 
      fill: #94a3b8; 
      font-size: 0.75rem; 
      font-weight: 500;
    }

    /* LIVE PULSE */
    .pulse { 
      animation: pulse 2s infinite; 
    }
    @keyframes pulse { 
      0%, 100% { opacity: 1; } 
      50% { opacity: 0.5; } 
    }

    /* STATS */
    .stats-value { 
      color: #e2e8f0 !important; 
      font-weight: 700;
    }
    .stats-label { 
      color: #94a3b8 !important; 
      font-size: 0.75rem;
    }

    /* QUICK ACTIONS — ROYAL PURPLE SPRINT BUTTON */
    .quick-actions { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 1.5rem; 
    }
    .quick-actions button { 
      height: 4.5rem; 
      font-size: 1.125rem; 
      font-weight: 700;
      border-radius: 1.25rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .quick-actions .btn-primary {
      background: linear-gradient(135deg, #6366f1, #ec4899);
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .quick-actions .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }
    .quick-actions .btn-secondary {
      background: linear-gradient(135deg, #6b21a8, #9333ea); /* ← ROYAL PURPLE */
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(12px);
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(107, 33, 168, 0.3);
    }
    .quick-actions .btn-secondary:hover {
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(107, 33, 168, 0.4);
    }

    /* LEADERBOARD */
    .leaderboard { 
      border-radius: 1.5rem; 
      background: rgba(30, 30, 40, 0.75); 
      backdrop-filter: blur(24px); 
      border: 1px solid rgba(255, 255, 255, 0.08);
      flex: 1;
      color: #e2e8f0;
    }
    .leaderboard .rank-you { 
      background: rgba(99, 102, 241, 0.15); 
      border-left: 4px solid #6366f1; 
      border-radius: 1rem;
    }
    .leaderboard .rank-1 { 
      color: #fbbf24; font-weight: 700; 
    }
    .leaderboard .xp { 
      color: #94a3b8;
    }
  `}</style>
);

/* ------------------ COMPONENTS ------------------ */
function ReadinessScoreCard({ score, label, insight, onStart }) {
  const scoreClass = score >= 70 ? 'readiness-high' : score >= 40 ? 'readiness-medium' : 'readiness-low';

  return (
    <div className="readiness-card card">
      <div className="flex items-start justify-between">
        <div>
          <div className="readiness-score">{score}</div>
          <div className="readiness-label">{label}</div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70 mb-1">Daily Readiness</div>
          <div className="text-sm font-medium">{insight}</div>
        </div>
      </div>

      <div className="readiness-bar mt-4">
        <div 
          className={`readiness-fill ${scoreClass}`} 
          style={{ width: `${score}%` }}
        />
      </div>

      <button 
        onClick={onStart}
        className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg"
      >
        Launch Your Day
      </button>
    </div>
  );
}

function AIPlanCapsule({ nextBestAction, onRegenerate, onStart }) {
  return (
    <div className="ai-plan card p-6 relative">
      <div className="glow" />
      <h2 className="text-xl font-bold mb-4">Today’s AI Plan</h2>
      
      <div className="space-y-3 mb-6">
        <div className="text-sm font-medium text-indigo-300">Next best action</div>
        <p className="text-lg font-semibold">{nextBestAction}</p>
        <p className="text-sm opacity-90">
          Small wins compound. Grab the smallest outcome that moves a project.
        </p>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={onStart}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-pink-500 text-white py-3 rounded-xl font-semibold text-lg"
        >
          Start
        </button>
        <button 
          onClick={onRegenerate}
          className="btn btn--outline btn-regen px-6 py-3 rounded-xl"
        >
          Regenerate Plan
        </button>
      </div>
    </div>
  );
}

function MomentumRing({ score = 78 }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  const label = score >= 90 ? "Elite" : score >= 70 ? "Strong" : "Good";

  return (
    <div className="momentum-ring">
      <svg width="160" height="160">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle className="bg" cx="80" cy="80" r={radius} strokeWidth="12" fill="none" />
        <circle 
          className="fill" 
          cx="80" cy="80" r={radius} 
          strokeWidth="12" fill="none"
          strokeDasharray={`${dash} ${circumference}`}
        />
        <text x="80" y="72" textAnchor="middle" className="score">
          {score}
        </text>
        <text x="80" y="92" textAnchor="middle" className="label">
          {label}
        </text>
      </svg>
    </div>
  );
}

function LivePulse({ activeUsers = [] }) {
  return (
    <div className="flex flex-wrap gap-4 items-center live-pulse">
      {activeUsers.map((u) => (
        <div key={u.id} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${u.now ? 'bg-emerald-400 pulse' : 'bg-gray-500'}`} />
          <span className="name text-sm">{u.name}</span>
          <span className="time text-xs">{u.now ? 'now' : u.when}</span>
        </div>
      ))}
    </div>
  );
}

function StreakLeaderboard({ users = [], myRank = 3 }) {
  return (
    <div className="leaderboard card p-5 fill-space">
      <h3 className="text-sm font-semibold mb-4">Top 10 This Week</h3>
      <ol className="space-y-3">
        {users.map((u, i) => (
          <li 
            key={u.id} 
            className={`flex items-center justify-between p-3 rounded-xl ${i + 1 === myRank ? 'rank-you' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-7 text-right font-bold ${i === 0 ? 'rank-1' : 'text-gray-400'}`}>
                {i + 1}.
              </span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm text-white font-bold">
                {u.name[0]}
              </div>
              <span className="font-medium">{u.name}</span>
            </div>
            <div className="text-right">
              <div className="font-bold">{u.streak}d streak</div>
              <div className="xp text-xs">{u.xp} XP</div>
            </div>
          </li>
        ))}
      </ol>
      {myRank > 3 && (
        <div className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-gray-400">
          You're #{myRank} — keep shipping!
        </div>
      )}
    </div>
  );
}

/* ------------------ MAIN PAGE ------------------ */
export default function Home() {
  const { user: authUser } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const [quickProjects, setQuickProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [readinessScore, setReadinessScore] = useState(87);
  const [readinessLabel, setReadinessLabel] = useState("High Focus");
  const [readinessInsight, setReadinessInsight] = useState("Perfect time to ship.");

  const activeUsers = [
    { id: "1", name: "Alex", now: true },
    { id: "2", name: "Jordan", now: false, when: "3h ago" },
    { id: "me", name: "You", now: true },
  ];

  const leaderboardData = [
    { id: "1", name: "Alex", streak: 12, xp: 2450 },
    { id: "2", name: "Jordan", streak: 10, xp: 2200 },
    { id: "me", name: "You", streak: 7, xp: 1800 },
  ];

  // === DAILY READINESS SCORE ===
  useEffect(() => {
    let mounted = true;

    const calculateReadiness = async () => {
      let batteryLevel = 100;
      let isCharging = true;

      // 1. Battery API
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          batteryLevel = Math.round(battery.level * 100);
          isCharging = battery.charging;
        } catch (err) {
          console.warn("Battery API failed:", err);
        }
      }

      // 2. Time of day
      const now = new Date();
      const hour = now.getHours();
      const isPeak = (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16);
      const isLate = hour >= 22 || hour <= 5;

      // 3. Streak momentum
      const streak = stats?.insights?.streakDays || 0;
      const momentumBonus = streak > 7 ? 25 : streak > 3 ? 15 : streak > 0 ? 8 : 0;

      // 4. Calculate base score
      let score = batteryLevel;
      if (isCharging) score = Math.min(100, score + 20);
      if (isPeak) score = Math.min(100, score + 18);
      if (isLate) score = Math.max(0, score - 25);
      score = Math.min(100, score + momentumBonus);

      // 5. Generate label & insight
      let label = "Low Energy";
      let insight = "Take a break. Recharge.";
      if (score >= 80) {
        label = "Peak Focus";
        insight = "You're in the zone — ship it now.";
      } else if (score >= 60) {
        label = "Strong";
        insight = "Solid energy. Tackle your top task.";
      } else if (score >= 40) {
        label = "Moderate";
        insight = "Light work only. Review or plan.";
      }

      if (mounted) {
        setReadinessScore(Math.round(score));
        setReadinessLabel(label);
        setReadinessInsight(insight);
      }
    };

    calculateReadiness();
    const interval = setInterval(calculateReadiness, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [stats]);

  // === AI PLAN LOGIC ===
  const nextBestAction = useMemo(() => {
    const throughput = stats?.throughputPerWeek?.value || 0;
    const base = throughput >= 5
      ? "Stack two 25-min sprints; finish with a 10-min review."
      : "Start a 25-min sprint on your top project.";

    if (readinessScore < 40) return "Take a 5-min walk or stretch. Reset your mind.";
    if (readinessScore < 60) return "Do a 10-min review on your top project.";
    return base;
  }, [stats, readinessScore]);

  useEffect(() => {
    Promise.all([
      getProjectsQuick().catch(() => []),
      client.get("/users/me/stats", { params: { range: 30 } }).catch(() => ({})),
    ])
      .then(([quick, statsRes]) => {
        setQuickProjects(quick);
        setStats(statsRes.data || {});
      });
  }, []);

  const continueProject = () => {
    const last = quickProjects[0];
    if (last?._id) navigate(`/projects/${last._id}`);
  };

  const startSprint = () => {
    window.dispatchEvent(new CustomEvent("start-tenx-sprint"));
  };

  const regeneratePlan = () => {
    alert("AI Plan: Focus on “Launch Alpha” → 3 tasks → 25-min sprint");
  };

  return (
    <>
      <PageStyles />
      <div className="max-w-7xl mx-auto px-4 py-6 home-page">
        <PageHeader title="Home" subtitle="Your AI-powered mission control" />

        {/* DAILY READINESS SCORE */}
        <ReadinessScoreCard 
          score={readinessScore}
          label={readinessLabel}
          insight={readinessInsight}
          onStart={startSprint}
        />

        {/* AI PLAN */}
        <AIPlanCapsule 
          nextBestAction={nextBestAction}
          onRegenerate={regeneratePlan}
          onStart={startSprint}
        />

        {/* MOMENTUM + STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="flex justify-center">
            <MomentumRing score={78} />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="stats-value text-2xl">{stats?.insights?.streakDays || 0}</div>
                <div className="stats-label">Day Streak</div>
              </div>
              <div>
                <div className="stats-value text-2xl">{stats?.xp || 0}</div>
                <div className="stats-label">XP Earned</div>
              </div>
              <div>
                <div className="stats-value text-2xl">#{stats?.leaderboardRank || 1}</div>
                <div className="stats-label">Leaderboard</div>
              </div>
            </div>
            <LivePulse activeUsers={activeUsers} />
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="quick-actions">
          <button 
            onClick={continueProject}
            className="btn-primary"
          >
            Continue Last Project
          </button>
          <button 
            onClick={startSprint}
            className="btn-secondary"
          >
            Start 25:00 Sprint
          </button>
        </div>

        {/* LEADERBOARD + AI WHISPER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fill-space">
          <StreakLeaderboard users={leaderboardData} myRank={3} />
          <AICoachWhisper />
        </div>
      </div>
    </>
  );
}