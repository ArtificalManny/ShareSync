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

    /* AI PLAN CAPSULE */
    .ai-plan { 
      background: rgba(30, 30, 40, 0.75); 
      backdrop-filter: blur(24px) saturate(180%); 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
      border-radius: 1.5rem;
      overflow: hidden;
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
      transform: rotate(-90deg); 
    }
    .momentum-ring .bg { 
      stroke: rgba(255, 255, 255, 0.08); 
    }
    .momentum-ring .fill { 
      stroke: url(#gradient); 
      stroke-linecap: round; 
      transition: stroke-dasharray 1.5s ease; 
    }

    /* LIVE PULSE */
    .pulse { 
      animation: pulse 2s infinite; 
    }
    @keyframes pulse { 
      0%, 100% { opacity: 1; } 
      50% { opacity: 0.5; } 
    }

    /* LEADERBOARD */
    .leaderboard { 
      border-radius: 1.5rem; 
      background: rgba(30, 30, 40, 0.75); 
      backdrop-filter: blur(24px); 
      border: 1px solid rgba(255, 255, 255, 0.08);
      flex: 1;
    }
    .leaderboard .rank-you { 
      background: rgba(99, 102, 241, 0.15); 
      border-left: 4px solid #6366f1; 
      border-radius: 1rem;
    }
    .leaderboard .rank-1 { 
      color: #fbbf24; font-weight: 700; 
    }

    /* QUICK ACTIONS */
    .quick-actions { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 1rem; 
    }
    .quick-actions button { 
      height: 4rem; 
      font-size: 1.125rem; 
      font-weight: 600; 
      border-radius: 1rem; 
      transition: all 0.2s ease;
    }
    .quick-actions button:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    /* FLEX GROW TO FILL SPACE */
    .fill-space { 
      flex: 1; 
      display: flex; 
      flex-direction: column; 
      justify-content: flex-end;
    }
  `}</style>
);

/* ------------------ COMPONENTS ------------------ */
function AIPlanCapsule({ nextBestAction, onRegenerate, onStart }) {
  return (
    <div className="ai-plan card p-6 relative">
      <div className="glow" />
      <h2 className="text-xl font-bold mb-4">Today’s AI Plan</h2>
      
      <div className="space-y-3 mb-6">
        <div className="text-sm font-medium text-indigo-400">Next best action</div>
        <p className="text-lg font-semibold">{nextBestAction}</p>
        <p className="text-sm text-gray-400">
          Small wins compound. Grab the smallest outcome that moves a project.
        </p>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={onStart}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-pink-500 text-white py-3 rounded-xl font-semibold text-lg"
        >
          ▶ Start
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
        <text x="80" y="88" textAnchor="middle" className="text-4xl font-bold fill-white">
          {score}
        </text>
        <text x="80" y="105" textAnchor="middle" className="text-xs fill-white/70">
          {score >= 90 ? "Elite" : score >= 70 ? "Strong" : "Good"}
        </text>
      </svg>
    </div>
  );
}

function LivePulse({ activeUsers = [] }) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      {activeUsers.map((u) => (
        <div key={u.id} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${u.now ? 'bg-emerald-400 pulse' : 'bg-gray-500'}`} />
          <span className="text-sm font-medium">{u.name}</span>
          <span className="text-xs text-gray-400">{u.now ? 'now' : u.when}</span>
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
              <div className="text-xs text-gray-400">{u.xp} XP</div>
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

  const nextBestAction = stats?.throughputPerWeek?.value >= 5
    ? "Stack two 25-min sprints; finish with a 10-min review."
    : "Start a 25-min sprint on your top project.";

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
                <div className="text-2xl font-bold">{stats?.insights?.streakDays || 0}</div>
                <div className="text-xs text-gray-400">Day Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.xp || 0}</div>
                <div className="text-xs text-gray-400">XP Earned</div>
              </div>
              <div>
                <div className="text-2xl font-bold">#{stats?.leaderboardRank || 1}</div>
                <div className="text-xs text-gray-400">Leaderboard</div>
              </div>
            </div>
            <LivePulse activeUsers={activeUsers} />
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="quick-actions">
          <button 
            onClick={continueProject}
            className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white"
          >
            Continue Last Project
          </button>
          <button 
            onClick={startSprint}
            className="bg-white/10 text-white backdrop-blur border border-white/20"
          >
            Start 25:00 Sprint
          </button>
        </div>

        {/* LEADERBOARD + AI WHISPER — FILL REMAINING SPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fill-space">
          <StreakLeaderboard users={leaderboardData} myRank={3} />
          <AICoachWhisper />
        </div>
      </div>
    </>
  );
}