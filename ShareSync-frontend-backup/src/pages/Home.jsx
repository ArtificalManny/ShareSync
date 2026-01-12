// src/pages/Home.jsx - FULL INTEGRATED ELITE REFACTOR
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Flame, Zap, Trophy, Shield, Play, ChevronRight, Target, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client";
import { getProjectsQuick } from "../api/projects";
import { toast } from "../components/ui/toast.jsx";

import Card, { CardBody } from "../components/common/Card";
import Button from "../components/common/Button";
import YourWorld from "../components/home/YourWorld";
import RecommendedTasks from "../components/home/RecommendedTasks";
import PageHeader from "../components/layout/PageHeader";

import {
  EcosystemStatusBar,
  BurnoutAlert,
  ActivityFeed,
  ProjectsOverview,
  TeamStories,
  Achievements
} from "../components/ecosystem";

import MomentumIndex from "../components/home/MomentumIndex";
import CriticalInsights from "../components/home/CriticalInsights";

/* ─────────────────────────────────────────────────────────────────────────
   REFINED COMPONENTS
───────────────────────────────────────────────────────────────────────── */

/**
 * ReadinessScoreCard - Refactored for Horizontal "Console" look
 * Fixes the "Giant Button" issue and improves data density.
 */
function ReadinessScoreCard({ score, label, insight, bestHour, onStart }) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-success-400';
    if (score >= 60) return 'text-brand-400';
    if (score >= 40) return 'text-warning-400';
    return 'text-danger-400';
  };

  return (
    <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5 bg-slate-900/20">
      <div className="flex items-center gap-6">
        <div className="flex items-baseline gap-1">
          <span className={`text-5xl font-black tracking-tighter ${getScoreColor()}`}>
            {score}
          </span>
          <span className="text-sm font-bold text-neutral-600">%</span>
        </div>
        
        {/* Visual Divider for Desktop */}
        <div className="hidden md:block h-10 w-[1px] bg-white/10" />
        
        <div className="space-y-0.5">
          <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
            Readiness Index
          </div>
          <div className="text-white font-bold text-base leading-tight">
            {label}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium max-w-[220px] line-clamp-1">
            {insight}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto">
        {bestHour && (
          <div className="hidden lg:flex flex-col items-end mr-2">
            <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Peak Window</div>
            <div className="text-[11px] font-bold text-brand-400">{bestHour}</div>
          </div>
        )}
        <Button 
          variant="primary" 
          size="sm" 
          className="w-full sm:w-[160px] h-10 text-[11px] font-black uppercase tracking-widest shadow-glow-brand" 
          onClick={onStart}
        >
          Launch Mission
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN HOME PAGE
───────────────────────────────────────────────────────────────────────── */

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [readinessScore, setReadinessScore] = useState(75);

  useEffect(() => {
    client.get("/users/me/stats").then(res => setStats(res.data || {}));
    getProjectsQuick().then(projects => {});
  }, []);

  const startSprint = () => {
    window.dispatchEvent(new CustomEvent("start-tenx-sprint"));
    toast.success("Focus Mode Active");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header Anchor */}
      <PageHeader 
        title="Mission Control" 
        subtitle="System Status: Optimal" 
        actions={<Button variant="tertiary" size="sm" icon={<Sparkles size={14}/>} className="text-[10px] font-bold uppercase tracking-widest">AI Plan</Button>}
      />
      
      {/* SECTION 1: IDENTITY & STATUS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          {/* Note: We will handle the "YourWorld" typography fix in its own component next */}
          <YourWorld />
        </div>
        <div className="space-y-4">
          <EcosystemStatusBar />
          <CriticalInsights />
          <BurnoutAlert />
        </div>
      </section>
      
      {/* SECTION 2: THE "ACTION ENGINE" (Unified Left Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* THE UNIFIED "GLASS" ENGINE WRAPPER */}
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden flex flex-col">
          <div className="p-6 pb-2">
             <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">
               Operational Priorities
             </h3>
             <RecommendedTasks />
          </div>
          
          {/* Readiness Index is now fused to the bottom of the engine */}
          <ReadinessScoreCard
            score={readinessScore}
            label="Peak Focus"
            insight="You're in the zone — ship it now."
            bestHour="2-4 PM"
            onStart={startSprint}
          />
        </div>
        
        {/* RIGHT FEED (Feedback Loop) */}
        <div className="space-y-4">
          <ActivityFeed />
          <MomentumIndex />
        </div>
      </div>

      {/* FOOTER ECOSYSTEM (Projects & Social) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-white/5">
        <ProjectsOverview />
        <TeamStories />
        <Achievements />
      </div>

      {/* GLOBAL ACTION DOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button onClick={() => navigate('/projects')} variant="secondary" className="h-14 font-bold tracking-tight bg-white/5 border-white/5 hover:bg-white/10">
          Resume Last Mission
        </Button>
        <Button onClick={startSprint} variant="primary" className="h-14 font-bold tracking-tight shadow-glow-brand">
          Start 25:00 Sprint
        </Button>
        <Button variant="success" className="h-14 font-bold tracking-tight shadow-glow-success/10">
          Ship Quick Win
        </Button>
      </div>
    </div>
  );
}
