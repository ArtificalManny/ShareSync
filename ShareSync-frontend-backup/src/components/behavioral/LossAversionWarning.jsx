// src/components/behavioral/LossAversionWarning.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Behavioral: "Streak at Risk" Warning
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Flame, Clock, AlertTriangle, X, Zap, Shield } from 'lucide-react';

export default function LossAversionWarning({
  type = 'streak', // streak | momentum | deadline | contribution
  currentValue,
  threshold,
  timeRemaining, // in minutes
  onAction,
  onDismiss,
  className = '',
}) {
  const [dismissed, setDismissed] = useState(false);
  const [urgency, setUrgency] = useState('low');

  useEffect(() => {
    if (!timeRemaining) return;
    
    if (timeRemaining < 30) {
      setUrgency('critical');
    } else if (timeRemaining < 120) {
      setUrgency('high');
    } else {
      setUrgency('low');
    }
  }, [timeRemaining]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const formatTime = (mins) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining}m`;
  };

  const configs = {
    streak: {
      icon: Flame,
      title: 'Streak at Risk!',
      message: `Your ${currentValue}-day streak expires in ${formatTime(timeRemaining)}`,
      actionLabel: 'Protect Streak',
      color: 'warning',
    },
    momentum: {
      icon: Zap,
      title: 'Momentum Dropping',
      message: `You'll drop from Level ${currentValue} to ${currentValue - 1} without activity`,
      actionLabel: 'Boost Now',
      color: 'brand',
    },
    deadline: {
      icon: Clock,
      title: 'Deadline Approaching',
      message: `${currentValue} tasks due in ${formatTime(timeRemaining)}`,
      actionLabel: 'View Tasks',
      color: 'error',
    },
    contribution: {
      icon: Shield,
      title: 'Team Balance Warning',
      message: `Your contribution is ${currentValue}% below team average`,
      actionLabel: 'Find Tasks',
      color: 'cyan',
    },
  };

  const config = configs[type] || configs.streak;
  const Icon = config.icon;

  const urgencyStyles = {
    critical: 'animate-pulse border-error-500/40 bg-error-500/10',
    high: 'border-warning/30 bg-warning/5',
    low: 'border-white/[0.1] bg-surface-2/50',
  };

  const colorStyles = {
    warning: { icon: 'text-warning', button: 'bg-warning hover:bg-warning/90' },
    brand: { icon: 'text-brand', button: 'bg-brand hover:bg-brand-600' },
    error: { icon: 'text-error-500', button: 'bg-error-500 hover:bg-error-600' },
    cyan: { icon: 'text-cyan-400', button: 'bg-cyan-500 hover:bg-cyan-600' },
  };

  const colors = colorStyles[config.color] || colorStyles.warning;

  return (
    <div className={`
      relative p-4 rounded-xl border transition-all
      ${urgencyStyles[urgency]}
      ${className}
    `}>
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-text-tertiary" />
      </button>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          p-2 rounded-lg shrink-0
          ${urgency === 'critical' ? 'bg-error-500/20' : 'bg-surface-3'}
        `}>
          <Icon className={`w-5 h-5 ${urgency === 'critical' ? 'text-error-500' : colors.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-text-primary">
              {config.title}
            </h4>
            {urgency === 'critical' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-error-500/20 text-error-500">
                URGENT
              </span>
            )}
          </div>
          
          <p className="text-xs text-text-secondary mb-3">
            {config.message}
          </p>

          {/* Action */}
          <button
            onClick={onAction}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium text-white
              transition-colors
              ${colors.button}
            `}
          >
            {config.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline version for use in other components
 */
export function LossAversionBadge({ type, value, timeRemaining, onClick }) {
  const configs = {
    streak: { icon: Flame, color: 'text-warning', bg: 'bg-warning/10' },
    momentum: { icon: Zap, color: 'text-brand', bg: 'bg-brand/10' },
  };

  const config = configs[type] || configs.streak;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
        ${config.bg} ${config.color}
        text-xs font-medium
        hover:opacity-80 transition-opacity
        animate-pulse
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{value} at risk</span>
    </button>
  );
}
