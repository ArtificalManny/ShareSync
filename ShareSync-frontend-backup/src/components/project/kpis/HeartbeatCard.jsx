// src/components/project/kpis/HeartbeatCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Heartbeat KPI Card
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows pace of shipping:
// - Ships per week
// - Trend vs last week
// - Mini sparkline
// - Health state indicator
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

const STATE_CONFIG = {
  healthy: {
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
    label: 'Healthy',
  },
  slowing: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    label: 'Slowing',
  },
  flatlining: {
    color: 'text-error-500',
    bg: 'bg-error-500/10',
    border: 'border-error-500/20',
    label: 'Flatlining',
  },
};

function MiniSparkline({ data = [], color = 'brand' }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 40" className="w-full h-8" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={`rgb(var(--${color}))`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      />
    </svg>
  );
}

export default function HeartbeatCard({ data, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    shipsPerWeek = 0,
    trend = 0,
    state = 'healthy',
    streak = 0,
    weeklyHistory = [],
  } = data || {};

  const config = STATE_CONFIG[state] || STATE_CONFIG.healthy;
  const trendNum = parseInt(trend) || 0;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative p-5 rounded-xl text-left
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${isHovered ? 'transform -translate-y-0.5' : ''}
      `}
    >
      {/* State indicator line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${config.bg}`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Activity className={`w-4 h-4 ${config.color}`} />
          </div>
          <h3 className="text-sm font-medium text-text-secondary">Heartbeat</h3>
        </div>
        
        <span className={`
          px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider
          ${config.bg} ${config.color}
        `}>
          {config.label}
        </span>
      </div>

      {/* Main Metric */}
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-3xl font-semibold text-text-primary">
          {shipsPerWeek}
        </span>
        <span className="text-sm text-text-tertiary">ships/week</span>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 mb-4">
        {trendNum > 0 ? (
          <>
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">+{trendNum}</span>
          </>
        ) : trendNum < 0 ? (
          <>
            <TrendingDown className="w-4 h-4 text-error-500" />
            <span className="text-sm font-medium text-error-500">{trendNum}</span>
          </>
        ) : (
          <>
            <Minus className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-medium text-text-tertiary">0</span>
          </>
        )}
        <span className="text-xs text-text-tertiary">vs last week</span>
      </div>

      {/* Sparkline */}
      {weeklyHistory.length > 0 && (
        <div className="mb-3">
          <MiniSparkline 
            data={weeklyHistory} 
            color={state === 'healthy' ? 'success' : state === 'slowing' ? 'warning' : 'error-500'}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        {streak > 0 ? (
          <span className="text-xs text-text-tertiary">
            🔥 {streak} day streak
          </span>
        ) : (
          <span className="text-xs text-text-tertiary">
            Start shipping to build streak
          </span>
        )}
        
        <span className="flex items-center gap-1 text-xs text-text-tertiary group-hover:text-text-secondary">
          Details
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}
