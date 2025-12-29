// src/pages/Home.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, Zap, Trophy, Clock, Shield, Flame, Target, Brain, Users, 
  ChevronRight, CheckCircle2, TriangleAlert, Info 
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client";
import { getProjectsQuick } from "../api/projects";
import { track } from "../utils/telemetry";

// ⭐ PHASE 1: Import WeeklyNarrative component
import WeeklyNarrative from "../components/home/WeeklyNarrative";

const DEFAULT_PROFILE_PIC = "/default-profile.png";

/* ------------------ STYLES (FIXED: Removed min-height) ------------------ */
const PageStyles = () => (
  <style>{`
    .home-page {
      row-gap: 1.25rem;
      padding-bottom: 1rem;
      display: flex;
      flex-direction: column;
    }
    @media (min-width: 768px) { .home-page { row-gap: 1.5rem; } }
    
    .glass-card {
      background: rgba(30, 30, 40, 0.75);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
      border-radius: 1.5rem;
      overflow: hidden;
      color: #e2e8f0;
    }

    .readiness-card { padding: 1.5rem; position: relative; }
    .readiness-score {
      font-size: 3.5rem; font-weight: 800; line-height: 1;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .readiness-label { font-size: 1.125rem; font-weight: 600; margin-top: 0.5rem; }
    .readiness-bar { height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.1); overflow: hidden; margin: 1rem 0; }
    .readiness-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease, background 0.3s ease; }
    .readiness-high { background: linear-gradient(90deg, #10b981, #34d399); }
    .readiness-medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .readiness-low { background: linear-gradient(90deg, #ef4444, #f87171); }

    .best-hour-badge {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2));
      border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 2rem;
      font-size: 0.875rem; font-weight: 600; margin-top: 0.75rem;
    }

    .ai-plan { padding: 1.5rem; position: relative; }
    .ai-plan .glow {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.2), transparent 70%);
      pointer-events: none;
    }
    .ai-plan .btn-regen {
      background: linear-gradient(90deg, #6366f1, #ec4899); color: white;
      font-weight: 600; transition: all 0.3s ease; border-radius: 0.75rem;
      padding: 0.75rem 1.5rem; border: none; cursor: pointer;
    }
    .ai-plan .btn-regen:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4); }

    .quick-wins { display: flex; flex-direction: column; gap: 0.75rem; }
    .quick-win-item {
      padding: 1rem; background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 0.75rem;
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; transition: all 0.2s ease;
    }
    .quick-win-item:hover { background: rgba(99, 102, 241, 0.15); transform: translateX(4px); }
    .quick-win-time { color: #94a3b8; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; }

    .momentum-ring { width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; }
    .momentum-ring svg { transform: none; }
    .momentum-ring .bg { stroke: rgba(255, 255, 255, 0.08); }
    .momentum-ring .fill { stroke: url(#gradient); stroke-linecap: round; transition: stroke-dasharray 1.5s ease; }
    .momentum-ring .score { fill: #e2e8f0; font-size: 2.5rem; font-weight: 700; }
    .momentum-ring .label { fill: #94a3b8; font-size: 0.75rem; font-weight: 500; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center; }
    .stats-value { color: #e2e8f0 !important; font-weight: 700; font-size: 1.5rem; }
    .stats-label { color: #94a3b8 !important; font-size: 0.75rem; margin-top: 0.25rem; }
    .stat-comparison { font-size: 0.75rem; margin-top: 0.25rem; display: flex; align-items: center; justify-content: center; gap: 0.25rem; }
    .stat-up { color: #10b981; } .stat-down { color: #ef4444; }

    .team-momentum { padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; }
    .team-status { font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .team-fire { color: #f59e0b; } .team-cooling { color: #94a3b8; }

    .social-ticker {
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1));
      border: 1px solid rgba(99, 102, 241, 0.2); padding: 1rem; border-radius: 1rem;
      overflow: hidden; position: relative;
    }
    .ticker-content { display: flex; animation: scroll 20s linear infinite; gap: 2rem; }
    @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .ticker-item { white-space: nowrap; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }

    .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .quick-actions button {
      height: 4.5rem; font-size: 1.125rem; font-weight: 700; border-radius: 1.25rem;
      transition: all 0.2s ease; display: flex; align-items: center; justify-content: center;
      text-align: center; white-space: nowrap; border: none; cursor: pointer; gap: 0.5rem;
    }
    .quick-actions .btn-primary { background: linear-gradient(135deg, #6366f1, #ec4899); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
    .quick-actions .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4); }
    .quick-actions .btn-secondary { background: linear-gradient(135deg, #6b21a8, #9333ea); color: white; border: 1px solid rgba(255, 255, 255, 0.3); backdrop-filter: blur(12px); box-shadow: 0 4px 12px rgba(107, 33, 168, 0.3); }
    .quick-actions .btn-secondary:hover { background: linear-gradient(135deg, #7c3aed, #a855f7); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(107, 33, 168, 0.4); }
    .quick-actions .btn-accent { background: linear-gradient(135deg, #059669, #10b981); color: white; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .quick-actions .btn-accent:hover { background: linear-gradient(135deg, #047857, #059669); transform: translateY(-2px); }
  `}</style>
);

/* ------------------ COMPONENTS ------------------ */
function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
        {title}
      </h1>
      <p className="text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

function ReadinessScoreCard({ score, label, insight, bestHour, onStart }) {
  const scoreClass = score >= 70 ? 'readiness-high' : score >= 40 ? 'readiness-medium' : 'readiness-low';
  return (
    <div className="readiness-card glass-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="readiness-score">{score}</div>
          <div className="readiness-label">{label}</div>
          {bestHour && (
            <div className="best-hour-badge">
              <Brain className="w-4 h-4" />
              Your best hour: {bestHour}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70 mb-1">Daily Readiness</div>
          <div className="text-sm font-medium">{insight}</div>
        </div>
      </div>
      <div className="readiness-bar mt-4">
        <div className={`readiness-fill ${scoreClass}`} style={{ width: `${score}%` }} />
      </div>
      <button onClick={onStart} className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg">
        Launch Your Day
      </button>
    </div>
  );
}

function SocialProofTicker({ events }) {
  return (
    <div className="social-ticker">
      <div className="ticker-content">
        {[...events, ...events].map((event, i) => (
          <div key={i} className="ticker-item">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{event}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIPlanCapsule({ nextBestAction, quickWins, onRegenerate, onStart }) {
  return (
    <div className="ai-plan glass-card">
      <div className="glow" />
      <h2 className="text-xl font-bold mb-4">Today's AI Plan</h2>
      <div className="space-y-3 mb-6">
        <div className="text-sm font-medium text-indigo-300">Next best action</div>
        <p className="text-lg font-semibold">{nextBestAction}</p>
        {quickWins?.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-fuchsia-300 mb-2">Quick wins (under 15 min)</div>
            <div className="quick-wins">
              {quickWins.map((win, i) => (
                <div key={i} className="quick-win-item">
                  <span className="text-sm">{win.task}</span>
                  <span className="quick-win-time">
                    <Clock className="w-3 h-3" />
                    {win.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onStart} className="flex-1 bg-gradient-to-r from-indigo-500 to-pink-500 text-white py-3 rounded-xl font-semibold text-lg">
          Start
        </button>
        <button onClick={onRegenerate} className="btn-regen">
          Regenerate Plan
        </button>
      </div>
    </div>
  );
}

function MomentumRing({ score = 75 }) {
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
        <circle className="fill" cx="80" cy="80" r={radius} strokeWidth="12" fill="none" strokeDasharray={`${dash} ${circumference}`} />
        <text x="80" y="72" textAnchor="middle" className="score">{score}</text>
        <text x="80" y="92" textAnchor="middle" className="label">{label}</text>
      </svg>
    </div>
  );
}

function StatsGrid({ stats, yesterdayComparison }) {
  return (
    <div className="stats-grid">
      <div>
        <div className="stats-value">{stats.streak || 0}</div>
        <div className="stats-label">Day Streak</div>
      </div>
      <div>
        <div className="stats-value">{stats.xp || 0}</div>
        <div className="stats-label">XP Earned</div>
      </div>
      <div>
        <div className="stats-value">#{stats.rank || 1}</div>
        <div className="stats-label">Leaderboard</div>
      </div>
      <div>
        <div className="stats-value">{stats.freezes || 1}</div>
        <div className="stats-label">
          <Shield className="w-3 h-3 inline mr-1" />
          Freezes Left
        </div>
      </div>
    </div>
  );
}

function TeamMomentumMeter({ status, activeCount, totalCount }) {
  const isFire = status === 'fire';
  return (
    <div className="team-momentum glass-card">
      <div className="team-status">
        {isFire ? (
          <>
            <Flame className="w-6 h-6 team-fire" />
            <span className="team-fire">Team is on fire!</span>
          </>
        ) : (
          <>
            <Users className="w-6 h-6 team-cooling" />
            <span className="team-cooling">Team cooling off</span>
          </>
        )}
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{activeCount}/{totalCount}</div>
        <div className="text-xs text-slate-400">active now</div>
      </div>
    </div>
  );
}

/* ------------------ MAIN PAGE ------------------ */
export default function Home() {
  const { user } = useAuth() || {};
  const navigate = useNavigate();

  const [quickProjects, setQuickProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [readinessScore, setReadinessScore] = useState(75);
  const [readinessLabel, setReadinessLabel] = useState("Strong");
  const [readinessInsight, setReadinessInsight] = useState("Solid energy. Tackle your top task.");
  const [bestHour, setBestHour] = useState("2-4pm");

  const socialEvents = [
    "Alex hit 100-day streak",
    "Jordan just shipped v3.0",
    "Sam became Level 12",
    "Taylor protected their 50d streak"
  ];

  const quickWins = [
    { task: "Review pull request #234", time: "8 min" },
    { task: "Update sprint board", time: "5 min" },
    { task: "Reply to Alex's question", time: "3 min" }
  ];

  // Daily Readiness Score
  useEffect(() => {
    let mounted = true;
    const calculateReadiness = async () => {
      let batteryLevel = 100;
      let isCharging = true;

      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          batteryLevel = Math.round(battery.level * 100);
          isCharging = battery.charging;
        } catch (err) { console.warn("Battery API failed:", err); }
      }

      const now = new Date();
      const hour = now.getHours();
      const isPeak = (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16);
      const isLate = hour >= 22 || hour <= 5;
      const predictedBestHour = hour < 14 ? "2-4pm" : "9-11am tomorrow";
      if (mounted) setBestHour(predictedBestHour);

      const streak = stats?.insights?.streakDays || 0;
      const momentumBonus = streak > 7 ? 25 : streak > 3 ? 15 : streak > 0 ? 8 : 0;

      let score = batteryLevel;
      if (isCharging) score = Math.min(100, score + 20);
      if (isPeak) score = Math.min(100, score + 18);
      if (isLate) score = Math.max(0, score - 25);
      score = Math.min(100, score + momentumBonus);

      let label = "Low Energy";
      let insight = "Take a break. Recharge.";
      if (score >= 80) { label = "Peak Focus"; insight = "You're in the zone — ship it now."; }
      else if (score >= 60) { label = "Strong"; insight = "Solid energy. Tackle your top task."; }
      else if (score >= 40) { label = "Moderate"; insight = "Light work only. Review or plan."; }

      if (mounted) {
        setReadinessScore(Math.round(score));
        setReadinessLabel(label);
        setReadinessInsight(insight);
      }
    };

    calculateReadiness();
    const interval = setInterval(calculateReadiness, 5 * 60 * 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, [stats]);

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
      client.get("/api/users/me/stats", { params: { range: 30 } }).catch(() => ({})),
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
    alert("AI Plan regenerated: Focus on top 3 quick wins → Start 25-min sprint");
  };

  const ship60Seconds = () => {
    alert("Quick Ship: What did you just complete? (opens modal)");
  };

  return (
    <>
      <PageStyles />
      <div className="max-w-7xl mx-auto px-4 py-6 home-page">
        <PageHeader title="Home" subtitle="Your AI-powered mission control" />
        
        <SocialProofTicker events={socialEvents} />
        
        {/* ⭐ PHASE 1: Weekly Narrative */}
        <WeeklyNarrative />
        
        <ReadinessScoreCard
          score={readinessScore}
          label={readinessLabel}
          insight={readinessInsight}
          bestHour={bestHour}
          onStart={startSprint}
        />
        
        <AIPlanCapsule
          nextBestAction={nextBestAction}
          quickWins={quickWins}
          onRegenerate={regeneratePlan}
          onStart={startSprint}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="flex justify-center">
            <MomentumRing score={readinessScore} />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <StatsGrid stats={stats} yesterdayComparison={{ streak: 1, xp: 15 }} />
          </div>
        </div>
        
        <TeamMomentumMeter status="fire" activeCount={3} totalCount={5} />
        
        <div className="quick-actions">
          <button onClick={continueProject} className="btn-primary">
            <Target className="w-5 h-5" />
            Continue Last
          </button>
          <button onClick={startSprint} className="btn-secondary">
            <Zap className="w-5 h-5" />
            Start 25:00 Sprint
          </button>
          <button onClick={ship60Seconds} className="btn-accent">
            <ChevronRight className="w-5 h-5" />
            Ship in 60s
          </button>
        </div>
      </div>
    </>
  );
}
