// src/components/billing/UsageCapacityBar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE L: Usage Capacity Bar Component
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { 
  HardDrive, Sparkles, History, Folder, Ship, Users, AlertTriangle 
} from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';

const USAGE_CONFIG = {
  storage: { icon: HardDrive, label: 'Storage', format: (v, u) => `${v} ${u || 'GB'}` },
  aiCredits: { icon: Sparkles, label: 'AI Credits', format: (v) => v.toLocaleString() },
  historyDays: { icon: History, label: 'History', format: (v) => `${v} days` },
  projects: { icon: Folder, label: 'Projects', format: (v) => v },
  shipsThisMonth: { icon: Ship, label: 'Ships', format: (v) => v },
  members: { icon: Users, label: 'Members', format: (v) => v },
};

function CapacityBar({ 
  type,
  used, 
  limit, 
  percentage, 
  unit,
  showLabel = true,
  size = 'default', // default | compact | large
  className = '' 
}) {
  const config = USAGE_CONFIG[type] || { icon: HardDrive, label: type, format: (v) => v };
  const Icon = config.icon;
  
  const isUnlimited = limit === -1;
  const isWarning = percentage >= 80 && percentage < 100;
  const isCritical = percentage >= 100;

  const getBarColor = () => {
    if (isCritical) return 'bg-error-500';
    if (isWarning) return 'bg-warning';
    return 'bg-brand';
  };

  const getTextColor = () => {
    if (isCritical) return 'text-error-500';
    if (isWarning) return 'text-warning';
    return 'text-text-secondary';
  };

  if (size === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon className="w-3.5 h-3.5 text-text-tertiary" />
        <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
            style={{ width: isUnlimited ? '10%' : `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-text-tertiary whitespace-nowrap">
          {isUnlimited ? '∞' : `${Math.round(percentage)}%`}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${getTextColor()}`} />
            <span className="text-sm text-text-secondary">{config.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {(isWarning || isCritical) && (
              <AlertTriangle className={`w-3.5 h-3.5 ${getTextColor()}`} />
            )}
            <span className={`text-sm font-medium ${getTextColor()}`}>
              {config.format(used, unit)} / {isUnlimited ? '∞' : config.format(limit, unit)}
            </span>
          </div>
        </div>
      )}

      <div className={`
        rounded-full overflow-hidden bg-surface-3
        ${size === 'large' ? 'h-3' : 'h-2'}
      `}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: isUnlimited ? '5%' : `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isCritical && (
        <p className="text-xs text-error-500 mt-1.5">
          Limit reached. Upgrade to continue.
        </p>
      )}
    </div>
  );
}

/**
 * Full usage panel showing all capacity bars
 */
export function UsagePanel({ className = '' }) {
  const { usage, loading, canSeeUpgradePrompts, isFree } = usePlan();

  if (loading) {
    return (
      <div className={`space-y-4 animate-pulse ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="h-4 w-20 bg-surface-2 rounded mb-2" />
            <div className="h-2 w-full bg-surface-2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!usage) return null;

  const usageItems = [
    { key: 'storage', data: usage.storage },
    { key: 'aiCredits', data: usage.aiCredits },
    { key: 'projects', data: usage.projects },
    { key: 'shipsThisMonth', data: usage.shipsThisMonth },
  ].filter(item => item.data);

  return (
    <div className={`space-y-4 ${className}`}>
      {usageItems.map(({ key, data }) => (
        <CapacityBar
          key={key}
          type={key}
          used={data.used}
          limit={data.limit}
          percentage={data.percentage}
          unit={data.unit}
        />
      ))}
    </div>
  );
}

export default CapacityBar;
