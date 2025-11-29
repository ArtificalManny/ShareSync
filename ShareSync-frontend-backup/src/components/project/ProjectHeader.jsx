// src/components/project/ProjectHeader.jsx
import React, { useEffect, useState } from "react";
import { Activity, Flame, Brain, Cloud, CloudRain, Sun, Zap, Plus } from 'lucide-react';
import "./project-header.css";
import Button from "../ui/Button";

// DNA Pulse Component
function DNAPulse({ velocity = 50, size = 60 }) {
  const pulseSpeed = Math.max(0.5, Math.min(3, velocity / 30));
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer pulse rings */}
      <div 
        className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"
        style={{ animationDuration: `${2 / pulseSpeed}s` }}
      />
      <div 
        className="absolute inset-0 rounded-full bg-fuchsia-500/20 animate-ping"
        style={{ animationDuration: `${2.5 / pulseSpeed}s`, animationDelay: '0.3s' }}
      />
      
      {/* DNA Helix */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width={size} height={size} viewBox="0 0 60 60" className="animate-spin-slow">
          <defs>
            <linearGradient id="dna-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <path
            d="M20 15 Q30 20 40 15 M20 30 Q30 25 40 30 M20 45 Q30 40 40 45"
            stroke="url(#dna-gradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="20" cy="15" r="3" fill="#8B5CF6" />
          <circle cx="40" cy="15" r="3" fill="#EC4899" />
          <circle cx="20" cy="30" r="3" fill="#EC4899" />
          <circle cx="40" cy="30" r="3" fill="#8B5CF6" />
          <circle cx="20" cy="45" r="3" fill="#8B5CF6" />
          <circle cx="40" cy="45" r="3" fill="#EC4899" />
        </svg>
      </div>
      
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Activity className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))' }} />
      </div>
      
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow ${4 / pulseSpeed}s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Momentum Score Component
function MomentumScore({ score = 0, streak = 0, velocity = 0 }) {
  const getScoreColor = (s) => {
    if (s >= 800) return 'from-emerald-400 to-teal-400';
    if (s >= 600) return 'from-purple-400 to-fuchsia-400';
    if (s >= 400) return 'from-blue-400 to-indigo-400';
    if (s >= 200) return 'from-amber-400 to-orange-400';
    return 'from-slate-400 to-slate-500';
  };

  const getScoreLabel = (s) => {
    if (s >= 800) return 'Legendary';
    if (s >= 600) return 'Crushing It';
    if (s >= 400) return 'Building';
    if (s >= 200) return 'Starting';
    return 'Just Started';
  };

  return (
    <div className="relative">
      <div className="text-center">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Momentum Score™</div>
        <div className={`text-6xl font-bold bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
          {score}
        </div>
        <div className="text-sm text-slate-300 mt-1">{getScoreLabel(score)}</div>
        
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            {streak > 50 && <Flame className="w-4 h-4 text-orange-500 animate-pulse" />}
            <span className="text-xs text-slate-400">{streak}d streak</span>
          </div>
          <div className="text-xs text-slate-400">·</div>
          <div className="text-xs text-slate-400">{velocity} tasks/wk</div>
        </div>
      </div>
      
      {/* Radial progress ring */}
      <svg className="absolute -inset-4" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="rgba(139, 92, 246, 0.1)"
          strokeWidth="2"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="url(#momentum-gradient)"
          strokeWidth="2"
          strokeDasharray={`${(score / 1000) * 339} 339`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="momentum-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Emotional Weather Component
function EmotionalWeather({ mood = 'neutral' }) {
  const getMoodData = (m) => {
    switch(m) {
      case 'celebrating':
        return { icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Celebrating' };
      case 'focused':
        return { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Focused' };
      case 'stressed':
        return { icon: CloudRain, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Stressed' };
      case 'chill':
        return { icon: Cloud, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Chill' };
      default:
        return { icon: Brain, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Neutral' };
    }
  };

  const moodData = getMoodData(mood);
  const Icon = moodData.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${moodData.bg} border border-white/10`}>
      <Icon className={`w-5 h-5 ${moodData.color}`} />
      <span className="text-sm text-white">{moodData.label}</span>
    </div>
  );
}

// Streak Fire Badge
function StreakFireBadge({ streak = 0 }) {
  if (streak < 50) return null;
  
  const getFireIntensity = (s) => {
    if (s >= 100) return { color: 'text-orange-600', size: 'w-8 h-8', label: '100d+ 🔥🔥🔥' };
    if (s >= 75) return { color: 'text-orange-500', size: 'w-7 h-7', label: '75d+ 🔥🔥' };
    return { color: 'text-orange-400', size: 'w-6 h-6', label: '50d+ 🔥' };
  };

  const fire = getFireIntensity(streak);

  return (
    <div className="absolute -top-3 -right-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-full px-3 py-1 shadow-lg shadow-orange-500/50 animate-bounce">
      <Flame className={`${fire.color} ${fire.size}`} />
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-orange-500">
        {fire.label}
      </div>
    </div>
  );
}

export default function ProjectHeader({
  name = "Untitled Project",
  status = "In Progress",
  isPublic = false,
  metrics = { ontime: 0, throughput: 0, streak: 0 },
  onAddTask,
  onStartFocus,
  onDownloadICS,
  icon = "U",
  // NEW: Enhanced features
  stats,
  shippedAt,
  membersCount = 0
}) {
  const [spinOnce, setSpinOnce] = useState(true);
  
  useEffect(() => {
    const t = setTimeout(() => setSpinOnce(false), 1600);
    return () => clearTimeout(t);
  }, []);

  // Calculate momentum score (0-1000)
  const calculateMomentum = () => {
    const streakPoints = Math.min(300, (metrics?.streak || 0) * 3);
    const velocityPoints = Math.min(300, (metrics?.throughput || 0) * 20);
    const onTimePoints = Math.min(200, (metrics?.ontime || 0) * 2);
    const activityPoints = Math.min(200, (stats?.activeDays?.value || 0) * 7);
    return Math.round(streakPoints + velocityPoints + onTimePoints + activityPoints);
  };

  // Determine mood from recent activity
  const determineMood = () => {
    if (shippedAt && Date.now() - new Date(shippedAt).getTime() < 86400000) {
      return 'celebrating';
    }
    const velocity = metrics?.throughput || 0;
    if (velocity > 15) return 'focused';
    if (velocity < 3) return 'stressed';
    return 'chill';
  };

  const momentumScore = calculateMomentum();
  const mood = determineMood();
  const velocity = metrics?.throughput || 0;
  const streak = metrics?.streak || 0;

  const statusClass =
    status === "In Progress" ? "good" : status === "Paused" ? "warn" : "muted";

  return (
    <section className="project-header panel-neon specular" role="region" aria-label="Project header">
      <div className="ph-inner">
        {/* Left cluster with DNA Pulse */}
        <div className="ph-left">
          <div className="relative">
            <DNAPulse velocity={velocity} size={72} />
            <StreakFireBadge streak={streak} />
          </div>

          <div className="ph-title">
            <h1 className="ph-name">{name}</h1>
            <div className="ph-sub">
              <span className={`chip chip-${statusClass}`} aria-label={`Status: ${status}`}>
                {status}
              </span>
              <span className={`chip chip-${isPublic ? "info" : "muted"}`}>
                {isPublic ? "Public" : "Private"}
              </span>
              <EmotionalWeather mood={mood} />
            </div>

            {/* Micro KPIs */}
            <ul className="ph-kpis" aria-label="Project mini KPIs">
              <li>
                <span className="kpi-label">On-time</span>
                <span className="kpi-val">{metrics?.ontime ?? 0}%</span>
              </li>
              <li>
                <span className="kpi-label">Throughput</span>
                <span className="kpi-val">{metrics?.throughput ?? 0}/wk</span>
              </li>
              <li>
                <span className="kpi-label">Streak</span>
                <span className="kpi-val">{streak}d {streak > 50 && '🔥'}</span>
              </li>
              <li>
                <span className="kpi-label">Team</span>
                <span className="kpi-val">{membersCount}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Momentum Score + Actions */}
        <div className="ph-right flex gap-6 items-center">
          <div className="hidden lg:block">
            <MomentumScore 
              score={momentumScore} 
              streak={streak}
              velocity={velocity}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button variant="primary" size="md" onClick={onAddTask}>
              <Plus className="w-4 h-4" /> Add task
            </Button>
            <Button variant="outline" size="md" onClick={onStartFocus}>
              <Zap className="w-4 h-4" /> Start 25:00
            </Button>
            {onDownloadICS && (
              <Button variant="ghost" size="md" onClick={onDownloadICS}>
                Download .ics
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}