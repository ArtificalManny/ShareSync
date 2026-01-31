// src/components/project/kpis/TeamBalanceCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Team Balance KPI Card
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows fairness & involvement:
// - Contribution distribution
// - Balance score
// - Skew warnings
// - Heavy lifter indicators
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Users, PieChart, AlertTriangle, ArrowRight, Crown } from 'lucide-react';

const STATE_CONFIG = {
  balanced: {
    color: 'text-success',
    bg: 'bg-success/10',
    label: 'Balanced',
  },
  skewed: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    label: 'Skewed',
  },
};

function ContributionBar({ contributions = [] }) {
  const colors = ['bg-brand', 'bg-cyan-400', 'bg-success', 'bg-warning', 'bg-error-500'];
  
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-surface-3">
      {contributions.slice(0, 5).map((c, i) => (
        <div
          key={c.userId}
          className={`${colors[i % colors.length]} transition-all duration-300`}
          style={{ width: `${c.percentage}%` }}
        />
      ))}
    </div>
  );
}

export default function TeamBalanceCard({ data, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    entropyScore = 1,
    state = 'balanced',
    contributions = [],
    heavyLifters = [],
    warning = null,
  } = data || {};

  const config = STATE_CONFIG[state] || STATE_CONFIG.balanced;
  const topContributors = contributions.slice(0, 4);
  const isSkewed = state === 'skewed';

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
      {isSkewed && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-warning/50" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <PieChart className={`w-4 h-4 ${config.color}`} />
          </div>
          <h3 className="text-sm font-medium text-text-secondary">Team Balance</h3>
        </div>
        
        <span className={`
          px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider
          ${config.bg} ${config.color}
        `}>
          {config.label}
        </span>
      </div>

      {/* Avatar Row */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-2">
          {topContributors.map((c, i) => (
            <div
              key={c.userId}
              className={`
                relative w-9 h-9 rounded-full border-2 border-surface-1
                bg-surface-2 overflow-hidden
                ${heavyLifters.includes(c.userId) ? 'ring-2 ring-warning ring-offset-1 ring-offset-surface-1' : ''}
              `}
            >
              {c.avatar ? (
                <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-text-tertiary">
                  {c.name?.charAt(0)}
                </div>
              )}
              
              {/* Heavy lifter crown */}
              {heavyLifters.includes(c.userId) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-surface-0" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {contributions.length > 4 && (
          <span className="text-xs text-text-tertiary ml-1">
            +{contributions.length - 4} more
          </span>
        )}
      </div>

      {/* Contribution Bar */}
      <div className="mb-3">
        <ContributionBar contributions={contributions} />
      </div>

      {/* Contribution Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
        {topContributors.slice(0, 2).map((c) => (
          <div key={c.userId} className="flex items-center justify-between text-xs">
            <span className="text-text-tertiary truncate">{c.name}</span>
            <span className={`font-medium ${
              c.percentage > 40 ? 'text-warning' : 'text-text-secondary'
            }`}>
              {c.percentage}%
            </span>
          </div>
        ))}
      </div>

      {/* Warning */}
      {warning && (
        <div className="mb-3 p-2 rounded-lg bg-warning/5 border border-warning/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
            <span className="text-[11px] text-warning leading-tight">
              {warning}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <span className="text-xs text-text-tertiary">
          Balance: {Math.round(entropyScore * 100)}%
        </span>
        
        <span className="flex items-center gap-1 text-xs text-text-tertiary">
          View all
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}
