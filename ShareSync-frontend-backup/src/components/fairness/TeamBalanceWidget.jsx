// src/components/fairness/TeamBalanceWidget.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: Compact Team Balance Widget for Dashboards
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { PieChart, Users, AlertTriangle, ChevronRight, Crown } from 'lucide-react';
import { useProjectContributions, useBalanceAlert } from '../../hooks/useFairness';
import SkewWarning, { SkewBadge } from './SkewWarning';

function ContributionBar({ contributions }) {
  const colors = ['bg-brand', 'bg-cyan-400', 'bg-success', 'bg-warning', 'bg-error-500'];
  
  return (
    <div className="h-2 rounded-full bg-surface-3 overflow-hidden flex">
      {contributions.slice(0, 5).map((c, i) => (
        <div
          key={c.userId}
          className={`${colors[i % colors.length]} transition-all duration-500`}
          style={{ width: `${c.percentage}%` }}
        />
      ))}
    </div>
  );
}

export default function TeamBalanceWidget({
  projectId,
  contributions: propContributions,
  onViewDetails,
  variant = 'default', // 'default' | 'compact' | 'mini'
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Use prop contributions or fetch
  const hookData = useProjectContributions(projectId, { autoRefresh: !propContributions });
  const contributions = propContributions || hookData.contributions;
  const { skewAnalysis, entropyScore, loading } = hookData;

  const balanceAlert = useBalanceAlert(contributions);
  const balancePercent = Math.round((propContributions ? 0.7 : entropyScore) * 100);
  const topContributors = contributions.slice(0, 4);

  if (variant === 'mini') {
    return (
      <button
        onClick={onViewDetails}
        className={`
          p-3 rounded-xl text-left
          bg-surface-1 border border-white/[0.06]
          hover:bg-surface-2 hover:border-white/[0.1]
          transition-all duration-200
          ${className}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="text-xs text-text-tertiary">Balance</span>
          </div>
          {balanceAlert.show && (
            <SkewBadge severity={balanceAlert.type} percentage={balanceAlert.percentage} />
          )}
        </div>
        
        <ContributionBar contributions={contributions} />
        
        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm font-semibold ${
            balancePercent >= 70 ? 'text-success' :
            balancePercent >= 50 ? 'text-warning' : 'text-error-500'
          }`}>
            {balancePercent}%
          </span>
          <span className="text-[10px] text-text-tertiary">
            {contributions.length} members
          </span>
        </div>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={onViewDetails}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          p-4 rounded-xl text-left w-full
          bg-surface-1 border border-white/[0.06]
          hover:bg-surface-2 hover:border-white/[0.1]
          transition-all duration-200
          ${balanceAlert.show ? 'border-l-2 border-l-warning' : ''}
          ${className}
        `}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${balanceAlert.show ? 'bg-warning/10' : 'bg-brand/10'}`}>
              {balanceAlert.show ? (
                <AlertTriangle className="w-4 h-4 text-warning" />
              ) : (
                <PieChart className="w-4 h-4 text-brand" />
              )}
            </div>
            <span className="text-sm font-medium text-text-secondary">Team Balance</span>
          </div>
          
          <span className={`text-lg font-bold ${
            balancePercent >= 70 ? 'text-success' :
            balancePercent >= 50 ? 'text-warning' : 'text-error-500'
          }`}>
            {balancePercent}%
          </span>
        </div>

        <ContributionBar contributions={contributions} />

        {balanceAlert.show && (
          <p className="text-xs text-warning mt-2 truncate">
            ⚠️ {balanceAlert.message}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex -space-x-2">
            {topContributors.map((c, i) => (
              <div
                key={c.userId}
                className="w-6 h-6 rounded-full border-2 border-surface-1 bg-surface-2 overflow-hidden"
              >
                {c.avatar ? (
                  <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-text-tertiary">
                    {c.name?.charAt(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <span className="flex items-center gap-1 text-xs text-text-tertiary">
            View
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </button>
    );
  }

  // Default variant
  return (
    <div
      onClick={onViewDetails}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        p-5 rounded-xl cursor-pointer
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${balanceAlert.show ? 'border-l-2 border-l-warning' : ''}
        ${isHovered ? 'transform -translate-y-0.5' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${balanceAlert.show ? 'bg-warning/10' : 'bg-success/10'}`}>
            <PieChart className={`w-4 h-4 ${balanceAlert.show ? 'text-warning' : 'text-success'}`} />
          </div>
          <h3 className="text-sm font-medium text-text-secondary">Team Balance</h3>
        </div>
        
        <span className={`
          px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider
          ${balanceAlert.show ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}
        `}>
          {balanceAlert.show ? 'Skewed' : 'Balanced'}
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
                ${c.percentage >= 40 ? 'ring-2 ring-warning ring-offset-1 ring-offset-surface-1' : ''}
              `}
            >
              {c.avatar ? (
                <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-text-tertiary">
                  {c.name?.charAt(0)}
                </div>
              )}
              
              {c.percentage >= 40 && (
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

      {/* Distribution Bar */}
      <ContributionBar contributions={contributions} />

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
        {topContributors.slice(0, 2).map((c) => (
          <div key={c.userId} className="flex items-center justify-between text-xs">
            <span className="text-text-tertiary truncate">{c.name}</span>
            <span className={`font-medium ${
              c.percentage >= 40 ? 'text-warning' : 'text-text-secondary'
            }`}>
              {c.percentage}%
            </span>
          </div>
        ))}
      </div>

      {/* Warning */}
      {balanceAlert.show && (
        <div className="mt-3 p-2 rounded-lg bg-warning/5 border border-warning/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
            <span className="text-[11px] text-warning leading-tight">
              {balanceAlert.message}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.06]">
        <span className="text-xs text-text-tertiary">
          Balance: {balancePercent}%
        </span>
        
        <span className="flex items-center gap-1 text-xs text-text-tertiary">
          View details
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
