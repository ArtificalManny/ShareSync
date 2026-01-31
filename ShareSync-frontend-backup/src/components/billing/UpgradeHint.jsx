// src/components/billing/UpgradeHint.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE L: Contextual Inline Upgrade Hints
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Zap, Lock } from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';

/**
 * Inline upgrade hint - appears contextually when approaching limits
 */
export default function UpgradeHint({
  feature,
  message,
  variant = 'inline', // inline | banner | tooltip | locked
  onUpgrade,
  onDismiss,
  dismissible = true,
  className = '',
}) {
  const [dismissed, setDismissed] = useState(false);
  const { canSeeUpgradePrompts, isFree } = usePlan();

  // Don't show if dismissed, not free tier, or user can't see upgrade prompts
  if (dismissed || !isFree || !canSeeUpgradePrompts()) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (variant === 'locked') {
    return (
      <div className={`
        p-4 rounded-xl
        bg-surface-2/50 border border-white/[0.06]
        ${className}
      `}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand/10">
            <Lock className="w-4 h-4 text-brand" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">
              {feature} is a Plus feature
            </p>
            <p className="text-xs text-text-tertiary mt-0.5">
              {message || 'Upgrade to unlock this feature'}
            </p>
          </div>
          <button
            onClick={onUpgrade}
            className="
              px-3 py-1.5 rounded-lg text-xs font-medium
              bg-brand text-white
              hover:bg-brand-600 transition-colors
            "
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`
        relative p-4 rounded-xl
        bg-gradient-to-r from-brand/10 to-cyan-400/10
        border border-brand/20
        ${className}
      `}>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        )}

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand/20">
            <Sparkles className="w-6 h-6 text-brand" />
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              Upgrade to Plus
            </h4>
            <p className="text-xs text-text-secondary">
              {message || 'Get more power with unlimited features'}
            </p>
          </div>

          <button
            onClick={onUpgrade}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              bg-brand text-white text-sm font-medium
              hover:bg-brand-600 transition-colors
            "
          >
            <Zap className="w-4 h-4" />
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'tooltip') {
    return (
      <div className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
        bg-brand/10 text-brand text-xs
        ${className}
      `}>
        <Sparkles className="w-3 h-3" />
        <span>{message || 'Upgrade for more'}</span>
        <button
          onClick={onUpgrade}
          className="font-medium hover:underline"
        >
          →
        </button>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg
      bg-surface-2/50 border border-white/[0.06]
      ${className}
    `}>
      <Sparkles className="w-4 h-4 text-brand shrink-0" />
      
      <p className="flex-1 text-xs text-text-secondary">
        {message || `Want more ${feature}?`}
      </p>

      <button
        onClick={onUpgrade}
        className="
          flex items-center gap-1 text-xs font-medium text-brand
          hover:text-brand-400 transition-colors
        "
      >
        Upgrade
        <ArrowRight className="w-3 h-3" />
      </button>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-surface-3 transition-colors"
        >
          <X className="w-3 h-3 text-text-tertiary" />
        </button>
      )}
    </div>
  );
}

/**
 * Contextual hint that appears when a specific limit is approaching
 */
export function LimitWarningHint({ limitKey, threshold = 80, onUpgrade }) {
  const { usage, canSeeUpgradePrompts, isFree } = usePlan();

  if (!isFree || !canSeeUpgradePrompts() || !usage?.[limitKey]) {
    return null;
  }

  const { percentage, used, limit } = usage[limitKey];
  
  if (percentage < threshold) {
    return null;
  }

  const remaining = limit - used;
  const limitLabels = {
    storage: 'storage space',
    aiCredits: 'AI credits',
    projects: 'projects',
    shipsThisMonth: 'ships this month',
    historyDays: 'history days',
  };

  return (
    <UpgradeHint
      feature={limitLabels[limitKey] || limitKey}
      message={`Only ${remaining} ${limitLabels[limitKey]} remaining`}
      variant="inline"
      onUpgrade={onUpgrade}
    />
  );
}
