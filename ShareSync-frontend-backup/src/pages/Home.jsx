// src/pages/Home.jsx - MODERNIZED WITH CRITICAL INSIGHTS
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, Zap, Trophy, Clock, Shield, Flame, Target, Brain, Users, 
  ChevronRight, Sparkles, Play
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client";
import { getProjectsQuick } from "../api/projects";
import { toast } from "../components/ui/toast.jsx"; // ⭐ NEW: Import toast

// ⭐ Modern components
import WeeklyNarrative from "../components/home/WeeklyNarrative";
import MomentumIndex from "../components/home/MomentumIndex";
import CriticalInsights from "../components/home/CriticalInsights"; // ⭐ NEW: Import CriticalInsights

/* ─────────────────────────────────────────────────────────────────────────
   MODERN COMPONENTS
───────────────────────────────────────────────────────────────────────── */

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="heading-1 mb-2">{title}</h1>
      <p className="caption-text">{subtitle}</p>
    </div>
  );
}

function SocialProofTicker({ events }) {
  return (
    <div className="modern-card p-4 overflow-hidden relative">
      <div className="flex gap-6 animate-[scroll_20s_linear_infinite]">
        {[...events, ...events].map((event, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-300">{event}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessScoreCard({ score, label, insight, bestHour, onStart }) {
  const getScoreColor = () => {
    if (score >= 80) return { bg: 'from-emerald-500 to-emerald-400', text: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 60) return { bg: 'from-primary-500 to-primary-400', text: 'text-primary-600 dark:text-primary-400' };
    if (score >= 40) return { bg: 'from-amber-500 to-amber-400', text: 'text-amber-600 dark:text-amber-400' };
    return { bg: 'from-red-500 to-red-400', text: 'text-red-600 dark:text-red-400' };
  };

  const colors = getScoreColor();

  return (
    <div className="modern-card-elevated p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-6xl font-bold bg-gradient-to-br ${colors.bg} bg-clip-text text-transparent`}>
            {score}
          </div>
          <div className="heading-3 mt-2">{label}</div>
          {bestHour && (
            <div className="badge-info mt-3">
              <Brain className="w-3 h-3" />
              <span>Peak: {bestHour}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="caption-text mb-1">Daily Readiness</div>
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{insight}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${colors.bg} transition-all duration-1000`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <button onClick={onStart} className="btn-primary-modern w-full">
        <Play className="w-4 h-4" />
        Launch Your Day
      </button>
    </div>
  );
}

function AIPlanCard({ nextBestAction, quickWins, onRegenerate, onStart }) {
  return (
    <div className="modern-card p-6 space-y-5 bg-gradient-to-br from-primary-50/50 to-fuchsia-50/50 dark:from-primary-500/5 dark:to-fuchsia-500/5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h2 className="heading-3">Today's AI Plan</h2>
      </div>

      {/* Next action */}
      <div className="space-y-2">
        <div className="caption-text">Next best action</div>
        <p className="body-text font-semibold">{nextBestAction}</p>
      </div>

      {/* Quick wins */}
      {quickWins?.length > 0 && (
        <div className="space-y-3">
          <div className="caption-text">Quick wins (under 15 min)</div>
          <div className="space-y-2">
            {quickWins.map((win, i) => (
              <div 
                key={i}
                className="modern-card p-3 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {win.task}
                  </span>
                  <div className="flex items-center gap-1 caption-text">
                    <Clock className="w-3 h-3" />
                    <span>{win.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={onStart} className="btn-primary-modern flex-1">
          Start Now
        </button>
        <button onClick={onRegenerate} className="btn-secondary-modern">
          <Sparkles className="w-4 h-4" />
          Regenerate
        </button>
      </div>
    </div>
  );
}

function StatsGrid({ stats }) {
  const statItems = [
    { 
      label: 'Day Streak', 
      value: stats?.streak || 0, 
      icon: Flame,
      color: 'text-orange-500'
    },
    { 
      label: 'XP Earned', 
      value: stats?.xp || 0, 
      icon: Zap,
      color: 'text-amber-500'
    },
    { 
      label: 'Leaderboard', 
      value: `#${stats?.rank || 1}`, 
      icon: Trophy,
      color: 'text-yellow-500'
    },
    { 
      label: 'Freezes Left', 
      value: stats?.freezes || 1, 
      icon: Shield,
      color: 'text-emerald-500'
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, idx) => (
        <div key={idx} className="stat-card-modern">
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function TeamMomentumCard({ status, activeCount, totalCount }) {
  const isFire = status === 'fire';
  
  return (
    <div className={`modern-card p-6 ${isFire ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isFire ? (
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-500/20">
              <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
              <Users className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
          )}
          <div>
            <div className="heading-3">
              {isFire ? 'Team is on fire!' : 'Team cooling off'}
            </div>
            <div className="caption-text mt-1">Collective momentum</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {activeCount}/{totalCount}
          </div>
          <div className="caption-text">active now</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN HOME PAGE
───────────────────────────────────────────────────────────────────────── */

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

  // Calculate readiness score
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
        } catch (err) { 
          console.warn("Battery API unavailable"); 
        }
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

  const nextBestAction = useMemo(() => {
    const throughput = stats?.throughputPerWeek?.value || 0;
    const base = throughput >= 5
      ? "Stack two 25-min sprints; finish with a 10-min review."
      : "Start a 25-min sprint on your top project.";
    if (readinessScore < 40) return "Take a 5-min walk or stretch. Reset your mind.";
    if (readinessScore < 60) return "Do a 10-min review on your top project.";
    return base;
  }, [stats, readinessScore]);

  // Fetch data
  useEffect(() => {
    Promise.all([
      getProjectsQuick().catch(() => []),
      client.get("/users/me/stats", { params: { range: 30 } }).catch(() => ({})),
    ]).then(([quick, statsRes]) => {
      setQuickProjects(quick);
      setStats(statsRes.data || {});
    });
  }, []);

  // Actions (⭐ UPDATED: Using toast instead of alert)
  const continueProject = () => {
    const last = quickProjects[0];
    if (last?._id) navigate(`/projects/${last._id}`);
  };

  const startSprint = () => {
    window.dispatchEvent(new CustomEvent("start-tenx-sprint"));
  };

  const regeneratePlan = () => {
    toast.success("AI Plan regenerated", {
      description: "Focus on top 3 quick wins → Start 25-min sprint",
      duration: 3000
    });
  };

  const ship60Seconds = () => {
    toast.info("Quick Ship", {
      description: "What did you just complete?",
      duration: 3000
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <PageHeader 
        title="Home" 
        subtitle="Your AI-powered mission control" 
      />
      
      {/* ⭐ NEW: Critical Insights - The "30-second wow" */}
      <CriticalInsights />
      
      {/* Social proof ticker */}
      <SocialProofTicker events={socialEvents} />
      
      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <WeeklyNarrative />
          <ReadinessScoreCard
            score={readinessScore}
            label={readinessLabel}
            insight={readinessInsight}
            bestHour={bestHour}
            onStart={startSprint}
          />
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          <MomentumIndex />
          <AIPlanCard
            nextBestAction={nextBestAction}
            quickWins={quickWins}
            onRegenerate={regeneratePlan}
            onStart={startSprint}
          />
        </div>
      </div>
      
      {/* Stats grid */}
      <StatsGrid stats={stats} />
      
      {/* Team momentum */}
      <TeamMomentumCard 
        status="fire" 
        activeCount={3} 
        totalCount={5} 
      />
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={continueProject} className="btn-primary-modern h-14">
          <Target className="w-5 h-5" />
          Continue Last
        </button>
        <button onClick={startSprint} className="btn-secondary-modern h-14">
          <Zap className="w-5 h-5" />
          Start 25:00 Sprint
        </button>
        <button onClick={ship60Seconds} className="btn-primary-modern h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400">
          <ChevronRight className="w-5 h-5" />
          Ship in 60s
        </button>
      </div>
    </div>
  );
}
