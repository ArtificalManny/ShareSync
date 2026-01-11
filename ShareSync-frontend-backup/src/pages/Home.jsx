// src/pages/Home.jsx - COMPLETE ECOSYSTEM INTEGRATED
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, Zap, Trophy, Clock, Shield, Flame, Target, Brain, Users, 
  ChevronRight, Sparkles, Play
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client";
import { getProjectsQuick } from "../api/projects";
import { toast } from "../components/ui/toast.jsx";

// ⭐ DESIGN SYSTEM COMPONENTS
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import YourWorld from "../components/home/YourWorld";
import RecommendedTasks from "../components/home/RecommendedTasks";

// ⭐ ECOSYSTEM COMPONENTS - ALL 7
import {
  EcosystemStatusBar,
  AdaptiveAIPlan,
  BurnoutAlert,
  ActivityFeed,
  ProjectsOverview,
  TeamStories,
  Achievements
} from "../components/ecosystem";

// ⭐ Modern components
import WeeklyNarrative from "../components/home/WeeklyNarrative";
import MomentumIndex from "../components/home/MomentumIndex";
import CriticalInsights from "../components/home/CriticalInsights";

/* ─────────────────────────────────────────────────────────────────────────
   MODERN COMPONENTS (Integrated with Design System)
───────────────────────────────────────────────────────────────────────── */

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-h1 text-white mb-2">{title}</h1>
      <p className="text-body text-neutral-400">{subtitle}</p>
    </div>
  );
}

function SocialProofTicker({ events }) {
  return (
    <Card variant="flat" className="p-4 overflow-hidden relative">
      <div className="flex gap-6 animate-[scroll_20s_linear_infinite]">
        {[...events, ...events].map((event, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-neutral-300">{event}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReadinessScoreCard({ score, label, insight, bestHour, onStart }) {
  const getScoreColor = () => {
    if (score >= 80) return { bg: 'bg-success-500', text: 'text-success-400', shadow: 'shadow-glow-success' };
    if (score >= 60) return { bg: 'bg-brand-500', text: 'text-brand-400', shadow: 'shadow-glow-brand' };
    if (score >= 40) return { bg: 'bg-warning-500', text: 'text-warning-400', shadow: 'shadow-glow-warning' };
    return { bg: 'bg-danger-500', text: 'text-danger-400', shadow: 'shadow-glow-danger' };
  };

  const colors = getScoreColor();

  return (
    <Card variant="elevated" className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-display font-bold ${colors.text}`}>
            {score}
          </div>
          <div className="text-h3 text-white mt-2">{label}</div>
          {bestHour && (
            <div className="inline-flex items-center gap-2 px-2 py-1 bg-info-500/10 border border-info-500/20 rounded mt-3 text-info-400 text-xs font-medium">
              <Brain className="w-3 h-3" />
              <span>Peak: {bestHour}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-label text-neutral-500 mb-1">Daily Readiness</div>
          <div className="text-body-sm font-medium text-neutral-300">{insight}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
          <div 
            className={`h-full ${colors.bg} ${colors.shadow} transition-all duration-1000`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <Button variant="primary" className="w-full" onClick={onStart} icon={<Play size={16} />}>
        Launch Your Day
      </Button>
    </Card>
  );
}

function AIPlanCard({ nextBestAction, quickWins, onRegenerate, onStart }) {
  return (
    <Card variant="elevated" className="p-6 space-y-5 border-brand-500/20 bg-brand-900/5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-400" />
        <h2 className="text-h4 text-white">Today's AI Plan</h2>
      </div>

      <div className="space-y-2">
        <div className="text-label text-neutral-500">Next best action</div>
        <p className="text-body font-semibold text-white">{nextBestAction}</p>
      </div>

      {quickWins?.length > 0 && (
        <div className="space-y-3">
          <div className="text-label text-neutral-500">Quick wins (under 15 min)</div>
          <div className="space-y-2">
            {quickWins.map((win, i) => (
              <div 
                key={i}
                className="p-3 bg-white/5 border border-white/5 rounded-lg hover:border-brand-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-300 group-hover:text-brand-400 transition-colors">
                    {win.task}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{win.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="primary" className="flex-1" onClick={onStart}>
          Start Now
        </Button>
        <Button variant="secondary" onClick={onRegenerate} icon={<Sparkles size={16}/>}>
          Regenerate
        </Button>
      </div>
    </Card>
  );
}

function StatsGrid({ stats }) {
  const statItems = [
    { label: 'Day Streak', value: stats?.streak || 0, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'XP Earned', value: stats?.xp || 0, icon: Zap, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Leaderboard', value: `#${stats?.rank || 1}`, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Freezes Left', value: stats?.freezes || 1, icon: Shield, color: 'text-success-400', bg: 'bg-success-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, idx) => (
        <Card key={idx} variant="flat" className="p-4">
          <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div className="text-h3 text-white leading-none">{stat.value}</div>
          <div className="text-label text-neutral-500 mt-2">{stat.label}</div>
        </Card>
      ))}
    </div>
  );
}

function TeamMomentumCard({ status, activeCount, totalCount }) {
  const isFire = status === 'fire';
  
  return (
    <Card variant="elevated" status={isFire ? "warning" : "default"} className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isFire ? 'bg-warning-500/20' : 'bg-neutral-800'}`}>
            {isFire ? (
              <Flame className="w-6 h-6 text-warning-500" />
            ) : (
              <Users className="w-6 h-6 text-neutral-400" />
            )}
          </div>
          <div>
            <div className="text-h4 text-white">
              {isFire ? 'Team is on fire!' : 'Team cooling off'}
            </div>
            <div className="text-caption text-neutral-500 mt-1">Collective momentum</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-display text-white">
            {activeCount}/{totalCount}
          </div>
          <div className="text-caption text-neutral-500">active now</div>
        </div>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN HOME PAGE - COMPLETE ECOSYSTEM
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

  // Actions
  const continueProject = () => {
    const last = quickProjects[0];
    if (last?._id) navigate(`/projects/${last._id}`);
  };

  const startSprint = () => {
    window.dispatchEvent(new CustomEvent("start-tenx-sprint"));
    toast.success("Focus Mode Active", { description: "Timer started for 25:00" });
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <PageHeader 
        title="Mission Control" 
        subtitle="Command your focus and identity" 
      />
      
      {/* Identity & Status */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <YourWorld />
        </div>
        <div className="space-y-6">
          <EcosystemStatusBar />
          <BurnoutAlert onDismiss={() => console.log('Burnout alert dismissed')} />
          <CriticalInsights />
        </div>
      </section>
      
      {/* Social Proof & AI Planning */}
      <div className="space-y-6">
        <SocialProofTicker events={socialEvents} />
        <AdaptiveAIPlan />
      </div>
      
      {/* ⭐ MAIN DASHBOARD GRID - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Action Oriented */}
        <div className="lg:col-span-2 space-y-8">
          <RecommendedTasks />
          <ReadinessScoreCard
            score={readinessScore}
            label={readinessLabel}
            insight={readinessInsight}
            bestHour={bestHour}
            onStart={startSprint}
          />
        </div>
        
        {/* Right column - Feedback Oriented */}
        <div className="space-y-8">
          <ActivityFeed />
          <AIPlanCard
            nextBestAction={nextBestAction}
            quickWins={quickWins}
            onRegenerate={regeneratePlan}
            onStart={startSprint}
          />
          <MomentumIndex />
        </div>
      </div>

      <WeeklyNarrative />

      {/* ⭐ ECOSYSTEM SHOWCASE GRID - Projects, Stories, Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProjectsOverview />
        <TeamStories />
        <Achievements />
      </div>
      
      {/* Metrics & Social Presence */}
      <div className="space-y-6">
        <StatsGrid stats={stats} />
        <TeamMomentumCard 
          status="fire" 
          activeCount={3} 
          totalCount={5} 
        />
      </div>
      
      {/* Quick Global Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-10">
        <Button onClick={continueProject} variant="primary" size="lg" className="h-16" icon={<Target size={20} />}>
          Continue Last Project
        </Button>
        <Button onClick={startSprint} variant="secondary" size="lg" className="h-16" icon={<Zap size={20} />}>
          Start 25:00 Sprint
        </Button>
        <Button onClick={ship60Seconds} variant="success" size="lg" className="h-16" icon={<ChevronRight size={20} />}>
          Ship in 60s
        </Button>
      </div>
    </div>
  );
}
