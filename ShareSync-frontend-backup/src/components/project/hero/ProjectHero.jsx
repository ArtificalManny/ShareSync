// src/components/project/hero/ProjectHero.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Project Hero Section
// ═══════════════════════════════════════════════════════════════════════════════
//
// The dominant 60% hero area showing:
// - Project title, mission, status
// - Momentum tachometer
// - Critical moves
// - Ship Update CTA
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Settings, Activity, Users } from 'lucide-react';
import MomentumTachometer from './MomentumTachometer';
import CriticalMovesCard from './CriticalMovesCard';
import ShipUpdateButton from './ShipUpdateButton';

const STATUS_CONFIG = {
  stable: {
    color: 'text-success',
    bg: 'bg-success/10',
    dot: 'bg-success',
    label: 'Stable',
  },
  at_risk: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    dot: 'bg-warning',
    label: 'At Risk',
  },
  critical: {
    color: 'text-error-500',
    bg: 'bg-error-500/10',
    dot: 'bg-error-500',
    label: 'Critical',
  },
};

export default function ProjectHero({
  project,
  metrics,
  criticalMoves,
  onShipUpdate,
  onViewActivity,
  onSettings,
  activeUsers = 0,
}) {
  const [isShipping, setIsShipping] = useState(false);

  const status = STATUS_CONFIG[project?.status] || STATUS_CONFIG.stable;
  const momentum = metrics?.momentum || { score: 0, trend: 0, state: 'dormant' };

  const handleShip = async (description) => {
    setIsShipping(true);
    try {
      await onShipUpdate?.(description);
    } finally {
      setIsShipping(false);
    }
  };

  return (
    <div className="mb-8">
      {/* ═══════════════════════════════════════════════════════════════════
          TOP ROW: Status + Title + Actions
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        
        {/* Left: Project Info */}
        <div className="flex-1">
          {/* Status Line */}
          <div className="flex items-center gap-4 mb-4">
            <span className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
              ${status.bg} ${status.color}
            `}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              Live Project
            </span>
            
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <Users className="w-3.5 h-3.5" />
              <span>{activeUsers} Active Now</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-semibold text-text-primary mb-3">
            {project?.name || 'Project'}
          </h1>

          {/* Mission */}
          <p className="text-text-secondary text-base lg:text-lg max-w-2xl leading-relaxed">
            {project?.mission || 'No mission defined'}
            {project?.horizon && (
              <span className="text-text-tertiary"> · Target: {project.horizon}</span>
            )}
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <ShipUpdateButton 
            onShip={handleShip}
            loading={isShipping}
            momentumLevel={momentum.level || 0}
          />
          
          <button 
            onClick={onViewActivity}
            className="
              h-11 px-4 rounded-xl
              bg-surface-1 border border-white/[0.06]
              text-text-secondary text-sm font-medium
              hover:bg-surface-2 hover:border-white/[0.1]
              transition-all duration-200
              flex items-center gap-2
            "
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Activity</span>
          </button>
          
          <button 
            onClick={onSettings}
            className="
              h-11 w-11 rounded-xl
              bg-surface-1 border border-white/[0.06]
              flex items-center justify-center
              hover:bg-surface-2 hover:border-white/[0.1]
              transition-colors
            "
          >
            <Settings className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO CONTENT: Tachometer + Critical Moves
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Momentum Tachometer */}
        <MomentumTachometer
          score={momentum.score}
          trend={parseInt(momentum.trend) || 0}
          state={momentum.state}
          level={momentum.level}
          heartbeat={metrics?.heartbeat}
        />

        {/* Critical Moves */}
        <CriticalMovesCard
          moves={criticalMoves}
          onMoveClick={(move) => console.log('Move clicked:', move)}
        />
      </div>
    </div>
  );
}
