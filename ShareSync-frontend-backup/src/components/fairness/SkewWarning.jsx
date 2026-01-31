// src/components/fairness/SkewWarning.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE I: Skew Warning Component - Shows when workload is imbalanced
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { AlertTriangle, X, ChevronRight, RefreshCw, Users } from 'lucide-react';

const SEVERITY_STYLES = {
  critical: {
    container: 'bg-error-500/10 border-error-500/20',
    icon: 'text-error-500',
    text: 'text-error-500',
    badge: 'bg-error-500/20 text-error-500',
  },
  warning: {
    container: 'bg-warning/10 border-warning/20',
    icon: 'text-warning',
    text: 'text-warning',
    badge: 'bg-warning/20 text-warning',
  },
  info: {
    container: 'bg-brand/10 border-brand/20',
    icon: 'text-brand',
    text: 'text-brand',
    badge: 'bg-brand/20 text-brand',
  },
};

export default function SkewWarning({
  warning,
  onDismiss,
  onAction,
  variant = 'default', // 'default' | 'compact' | 'banner'
  dismissible = true,
  showSuggestion = true,
  className = '',
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!warning || isDismissed) return null;

  const styles = SEVERITY_STYLES[warning.severity] || SEVERITY_STYLES.info;
  const isCompact = variant === 'compact';
  const isBanner = variant === 'banner';

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isCompact) {
    return (
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        ${styles.container} border
        ${className}
      `}>
        <AlertTriangle className={`w-4 h-4 shrink-0 ${styles.icon}`} />
        <span className={`text-xs ${styles.text} truncate`}>
          {warning.message}
        </span>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3 text-text-tertiary" />
          </button>
        )}
      </div>
    );
  }

  if (isBanner) {
    return (
      <div className={`
        px-4 py-3 rounded-xl
        ${styles.container} border
        flex items-center justify-between
        ${className}
      `}>
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
          <div>
            <p className={`text-sm font-medium ${styles.text}`}>
              {warning.message}
            </p>
            {showSuggestion && warning.suggestion && (
              <p className="text-xs text-text-tertiary mt-0.5">
                {warning.suggestion}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAction && (
            <button
              onClick={onAction}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium
                ${styles.badge}
                hover:opacity-80 transition-opacity
                flex items-center gap-1
              `}
            >
              <RefreshCw className="w-3 h-3" />
              Rebalance
            </button>
          )}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`
      p-4 rounded-xl
      ${styles.container} border
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${styles.badge}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-sm font-medium ${styles.text}`}>
              Workload Imbalance
            </h4>
            <span className={`text-xs ${styles.badge} px-1.5 py-0.5 rounded mt-1 inline-block`}>
              {warning.severity === 'critical' ? 'Critical' : 'Warning'}
            </span>
          </div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        )}
      </div>

      {/* Message */}
      <p className="text-sm text-text-secondary mb-3">
        {warning.message}
      </p>

      {/* Member Info */}
      {warning.member && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2/50 mb-3">
          <div className="w-10 h-10 rounded-full bg-surface-3 overflow-hidden">
            {warning.member.avatar ? (
              <img src={warning.member.avatar} alt={warning.member.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-medium text-text-tertiary">
                {warning.member.name?.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{warning.member.name}</p>
            <p className="text-xs text-text-tertiary">
              {warning.member.percentage}% of total contribution
            </p>
          </div>
        </div>
      )}

      {/* Suggestion */}
      {showSuggestion && warning.suggestion && (
        <p className="text-xs text-text-tertiary mb-3">
          💡 {warning.suggestion}
        </p>
      )}

      {/* Action */}
      {onAction && (
        <button
          onClick={onAction}
          className="
            w-full py-2.5 rounded-lg
            bg-surface-2 text-text-secondary
            text-sm font-medium
            hover:bg-surface-3 hover:text-text-primary
            transition-colors
            flex items-center justify-center gap-2
          "
        >
          <Users className="w-4 h-4" />
          View Balance Details
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Inline warning badge
 */
export function SkewBadge({ severity = 'warning', percentage }) {
  const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.warning;
  
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      ${styles.badge} text-[10px] font-medium
    `}>
      <AlertTriangle className="w-3 h-3" />
      {percentage}% Skew
    </span>
  );
}
