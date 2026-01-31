// src/components/billing/PlanBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE L: Plan Badge Component
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Crown, Zap, Building2, Sparkles } from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';

const BADGE_CONFIG = {
  free: {
    icon: null,
    label: 'Free',
    color: 'text-text-tertiary',
    bg: 'bg-surface-2',
    border: 'border-white/[0.06]',
  },
  plus: {
    icon: Zap,
    label: 'Plus',
    color: 'text-brand',
    bg: 'bg-brand/10',
    border: 'border-brand/20',
  },
  team: {
    icon: Crown,
    label: 'Team',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
  },
  enterprise: {
    icon: Building2,
    label: 'Enterprise',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
};

export default function PlanBadge({ 
  variant = 'default', // default | compact | pill
  showUpgrade = true,
  onUpgradeClick,
  className = '' 
}) {
  const { planId, canSeeUpgradePrompts, isFree, loading } = usePlan();
  
  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 w-16 rounded bg-surface-2" />
      </div>
    );
  }

  const config = BADGE_CONFIG[planId] || BADGE_CONFIG.free;
  const Icon = config.icon;
  const canShowUpgrade = showUpgrade && isFree && canSeeUpgradePrompts();

  if (variant === 'compact') {
    return (
      <span className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium
        ${config.bg} ${config.color}
        ${className}
      `}>
        {Icon && <Icon className="w-3 h-3" />}
        {config.label}
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
          ${config.bg} ${config.color} border ${config.border}
        `}>
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {config.label}
        </span>
        
        {canShowUpgrade && (
          <button
            onClick={onUpgradeClick}
            className="
              inline-flex items-center gap-1 px-2 py-1 rounded-full
              text-[10px] font-medium text-brand
              hover:bg-brand/10 transition-colors
            "
          >
            <Sparkles className="w-3 h-3" />
            Upgrade
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl
      ${config.bg} border ${config.border}
      ${className}
    `}>
      <div className={`p-2 rounded-lg bg-white/5`}>
        {Icon ? <Icon className={`w-4 h-4 ${config.color}`} /> : (
          <div className="w-4 h-4 rounded-full bg-text-tertiary/20" />
        )}
      </div>
      
      <div className="flex-1">
        <div className={`text-sm font-medium ${config.color}`}>
          {config.label} Plan
        </div>
        {isFree && (
          <div className="text-[10px] text-text-tertiary">
            Limited features
          </div>
        )}
      </div>

      {canShowUpgrade && (
        <button
          onClick={onUpgradeClick}
          className="
            px-3 py-1.5 rounded-lg text-xs font-medium
            bg-brand text-white
            hover:bg-brand-600 transition-colors
          "
        >
          Upgrade
        </button>
      )}
    </div>
  );
}
