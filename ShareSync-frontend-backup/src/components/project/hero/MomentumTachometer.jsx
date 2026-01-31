// src/components/project/hero/MomentumTachometer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Momentum Tachometer - Arc Gauge Visualization
// ═══════════════════════════════════════════════════════════════════════════════
//
// A dramatic arc gauge showing project momentum score.
// - Animates smoothly between values
// - Color changes based on state
// - Shows trend indicator
// - Hover reveals detailed tooltip
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, Flame, Activity } from 'lucide-react';

const STATE_CONFIG = {
  dormant: {
    color: 'text-text-tertiary',
    gradient: ['#475569', '#64748B'],
    glow: 'none',
    icon: Minus,
    label: 'Dormant',
  },
  warming: {
    color: 'text-brand-400',
    gradient: ['#7C3AED', '#8B5CF6'],
    glow: '0 0 20px rgba(124, 58, 237, 0.2)',
    icon: Activity,
    label: 'Warming Up',
  },
  active: {
    color: 'text-brand',
    gradient: ['#7C3AED', '#A78BFA'],
    glow: '0 0 30px rgba(124, 58, 237, 0.3)',
    icon: Zap,
    label: 'Active',
  },
  flowing: {
    color: 'text-brand',
    gradient: ['#7C3AED', '#06B6D4'],
    glow: '0 0 40px rgba(124, 58, 237, 0.4)',
    icon: Zap,
    label: 'In Flow',
  },
  surging: {
    color: 'text-cyan-400',
    gradient: ['#06B6D4', '#22D3EE'],
    glow: '0 0 50px rgba(6, 182, 212, 0.4)',
    icon: Zap,
    label: 'Surging',
  },
  blazing: {
    color: 'text-energy-500',
    gradient: ['#F43F5E', '#FB923C'],
    glow: '0 0 60px rgba(244, 63, 94, 0.5)',
    icon: Flame,
    label: 'Fire Mode',
  },
};

export default function MomentumTachometer({
  score = 0,
  trend = 0,
  state = 'dormant',
  level = 0,
  heartbeat,
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  const config = STATE_CONFIG[state] || STATE_CONFIG.dormant;
  const Icon = config.icon;

  // Animate score changes
  useEffect(() => {
    const duration = 800;
    const start = animatedScore;
    const diff = score - start;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedScore(Math.round(start + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Calculate arc path
  const arcPath = useMemo(() => {
    const percentage = Math.min(100, Math.max(0, animatedScore));
    const startAngle = -140;
    const endAngle = 140;
    const range = endAngle - startAngle;
    const currentAngle = startAngle + (range * percentage / 100);

    const radius = 80;
    const cx = 100;
    const cy = 100;

    const startRad = (startAngle * Math.PI) / 180;
    const currentRad = (currentAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(currentRad);
    const y2 = cy + radius * Math.sin(currentRad);

    const largeArc = currentAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }, [animatedScore]);

  // Background arc path (full range)
  const bgArcPath = useMemo(() => {
    const startAngle = -140;
    const endAngle = 140;

    const radius = 80;
    const cx = 100;
    const cy = 100;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    return `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2}`;
  }, []);

  return (
    <div 
      className="
        relative p-6 rounded-2xl
        bg-surface-1 border border-white/[0.06]
        hover:border-white/[0.1]
        transition-all duration-300
      "
      style={{ boxShadow: config.glow }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <h3 className="text-sm font-medium text-text-secondary">Project Momentum</h3>
        </div>
        <span className={`
          px-2 py-1 rounded-md text-xs font-medium
          ${state === 'blazing' ? 'bg-energy-500/20 text-energy-500 animate-pulse' : 'bg-surface-2 text-text-tertiary'}
        `}>
          L{level}
        </span>
      </div>

      {/* Tachometer SVG */}
      <div className="relative flex justify-center">
        <svg viewBox="0 0 200 140" className="w-full max-w-[280px]">
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="momentumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={config.gradient[0]} />
              <stop offset="100%" stopColor={config.gradient[1]} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Arc */}
          <path
            d={bgArcPath}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Animated Progress Arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#momentumGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            filter={state !== 'dormant' ? 'url(#glow)' : undefined}
            className="transition-all duration-300"
          />

          {/* Center Text */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className="fill-text-primary text-4xl font-semibold"
            style={{ fontSize: '48px' }}
          >
            {animatedScore}
          </text>
          <text
            x="100"
            y="120"
            textAnchor="middle"
            className={`fill-current ${config.color} text-sm font-medium`}
            style={{ fontSize: '12px' }}
          >
            {config.label}
          </text>
        </svg>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : trend < 0 ? (
            <TrendingDown className="w-4 h-4 text-error-500" />
          ) : (
            <Minus className="w-4 h-4 text-text-tertiary" />
          )}
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-success' : trend < 0 ? 'text-error-500' : 'text-text-tertiary'
          }`}>
            {trend > 0 ? '+' : ''}{trend} vs last week
          </span>
        </div>

        {heartbeat && (
          <>
            <div className="w-px h-4 bg-white/[0.06]" />
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <span className="font-medium text-text-secondary">{heartbeat.shipsPerWeek}</span>
              ships/week
            </div>
          </>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-4 py-3 rounded-xl
          bg-surface-2 border border-white/[0.08]
          shadow-xl z-50 whitespace-nowrap
          animate-in fade-in slide-in-from-bottom-2 duration-200
        ">
          <p className="text-xs text-text-tertiary mb-1">Momentum Score</p>
          <p className="text-sm text-text-primary">
            {animatedScore}/100 • {heartbeat?.shipsPerWeek || 0} ships this week
          </p>
          {heartbeat?.streak > 0 && (
            <p className="text-xs text-success mt-1">
              🔥 {heartbeat.streak} day shipping streak
            </p>
          )}
        </div>
      )}
    </div>
  );
}
