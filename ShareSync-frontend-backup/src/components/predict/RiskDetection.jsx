// src/components/predict/RiskDetection.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICT ENGINE: Risk Detection
// Identifies and displays project risks
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  AlertTriangle, AlertCircle, Info, Clock, User,
  Lock, GitBranch, TrendingDown, ChevronRight,
  ChevronDown, X, Zap, Users, Calendar
} from 'lucide-react';
import { RISK_LEVELS, RISK_TYPES } from '../../hooks/usePredictEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// RISK CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const RISK_CONFIG = {
  [RISK_LEVELS.CRITICAL]: {
    color: 'text-error-500',
    bgColor: 'bg-error-500/10',
    borderColor: 'border-error-500/30',
    icon: AlertTriangle,
    label: 'Critical',
  },
  [RISK_LEVELS.HIGH]: {
    color: 'text-warning-500',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
    icon: AlertCircle,
    label: 'High',
  },
  [RISK_LEVELS.MEDIUM]: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: Info,
    label: 'Medium',
  },
  [RISK_LEVELS.LOW]: {
    color: 'text-text-tertiary',
    bgColor: 'bg-surface-2',
    borderColor: 'border-white/[0.06]',
    icon: Info,
    label: 'Low',
  },
};

const TYPE_ICONS = {
  [RISK_TYPES.BLOCKED_TASK]: Lock,
  [RISK_TYPES.OVERLOADED_MEMBER]: User,
  [RISK_TYPES.STALE_WORK]: Clock,
  [RISK_TYPES.DEADLINE_RISK]: Calendar,
  [RISK_TYPES.SCOPE_CREEP]: TrendingDown,
  [RISK_TYPES.DEPENDENCY_CHAIN]: GitBranch,
  [RISK_TYPES.ESTIMATION_DRIFT]: Clock,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE RISK CARD
// ═══════════════════════════════════════════════════════════════════════════════

function RiskCard({
  risk,
  isExpanded,
  onToggle,
  onAction,
}) {
  const levelConfig = RISK_CONFIG[risk.level];
  const TypeIcon = TYPE_ICONS[risk.type] || AlertCircle;
  const LevelIcon = levelConfig.icon;
  
  return (
    <div className={`
      rounded-xl border overflow-hidden transition-all duration-200
      ${levelConfig.bgColor} ${levelConfig.borderColor}
    `}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${levelConfig.bgColor}
        `}>
          <TypeIcon className={`w-5 h-5 ${levelConfig.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelConfig.bgColor} ${levelConfig.color}`}>
              {levelConfig.label}
            </span>
          </div>
          <div className="text-sm font-medium text-text-primary truncate">
            {risk.title}
          </div>
        </div>
        
        <ChevronDown className={`
          w-4 h-4 text-text-tertiary transition-transform
          ${isExpanded ? 'rotate-180' : ''}
        `} />
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06]">
          <p className="text-sm text-text-secondary mt-3 mb-3">
            {risk.description}
          </p>
          
          {risk.suggestion && (
            <div className="p-3 rounded-lg bg-surface-1/50 mb-3">
              <div className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                <Zap className="w-3 h-3" />
                <span>Suggestion</span>
              </div>
              <div className="text-sm text-text-primary">
                {risk.suggestion}
              </div>
            </div>
          )}
          
          {onAction && (
            <button
              onClick={() => onAction(risk)}
              className={`
                w-full py-2 rounded-lg text-sm font-medium
                ${levelConfig.bgColor} ${levelConfig.color}
                hover:opacity-80 transition-opacity
              `}
            >
              Take Action
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RISK SUMMARY BADGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RiskSummaryBadge - Compact risk indicator
 */
export function RiskSummaryBadge({
  criticalCount = 0,
  highCount = 0,
  onClick,
  className = '',
}) {
  const total = criticalCount + highCount;
  if (total === 0) return null;
  
  const hasCritical = criticalCount > 0;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        transition-colors
        ${hasCritical 
          ? 'bg-error-500/10 border border-error-500/30 text-error-400 hover:bg-error-500/20'
          : 'bg-warning-500/10 border border-warning-500/30 text-warning-400 hover:bg-warning-500/20'
        }
        ${className}
      `}
    >
      <AlertTriangle className="w-4 h-4" />
      <span className="text-sm font-medium">
        {criticalCount > 0 && `${criticalCount} critical`}
        {criticalCount > 0 && highCount > 0 && ', '}
        {highCount > 0 && `${highCount} high`}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RISK DETECTION PANEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RiskDetectionPanel - Full risk overview
 */
export function RiskDetectionPanel({
  risks = [],
  onRiskAction,
  onDismissRisk,
  className = '',
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, critical, high, medium
  
  const filteredRisks = filter === 'all' 
    ? risks 
    : risks.filter(r => r.level === filter);
  
  const riskCounts = {
    critical: risks.filter(r => r.level === RISK_LEVELS.CRITICAL).length,
    high: risks.filter(r => r.level === RISK_LEVELS.HIGH).length,
    medium: risks.filter(r => r.level === RISK_LEVELS.MEDIUM).length,
  };
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-surface-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Risk Detection
              </div>
              <div className="text-sm text-text-tertiary">
                {risks.length} risk{risks.length !== 1 ? 's' : ''} identified
              </div>
            </div>
          </div>
          
          {/* Risk counts */}
          <div className="flex items-center gap-2">
            {riskCounts.critical > 0 && (
              <span className="px-2 py-1 rounded-full bg-error-500/20 text-error-400 text-xs font-medium">
                {riskCounts.critical} critical
              </span>
            )}
            {riskCounts.high > 0 && (
              <span className="px-2 py-1 rounded-full bg-warning-500/20 text-warning-400 text-xs font-medium">
                {riskCounts.high} high
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Filter tabs */}
      <div className="px-4 py-2 border-b border-white/[0.06] flex gap-2">
        {['all', 'critical', 'high', 'medium'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1 rounded-lg text-xs font-medium transition-colors
              ${filter === f 
                ? 'bg-brand-500/10 text-brand-400' 
                : 'text-text-tertiary hover:text-text-secondary'
              }
            `}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && riskCounts[f] > 0 && ` (${riskCounts[f]})`}
          </button>
        ))}
      </div>
      
      {/* Risk list */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {filteredRisks.length > 0 ? (
          filteredRisks.map((risk, idx) => (
            <RiskCard
              key={`${risk.type}-${idx}`}
              risk={risk}
              isExpanded={expandedId === idx}
              onToggle={() => setExpandedId(expandedId === idx ? null : idx)}
              onAction={onRiskAction}
            />
          ))
        ) : (
          <div className="py-8 text-center">
            <AlertTriangle className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <div className="text-sm text-text-tertiary">
              {filter === 'all' 
                ? 'No risks detected. Great work!'
                : `No ${filter} risks`
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RISK ALERT TOAST
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RiskAlertToast - Pop-up risk notification
 */
export function RiskAlertToast({
  risk,
  onAction,
  onDismiss,
  className = '',
}) {
  const levelConfig = RISK_CONFIG[risk.level];
  const TypeIcon = TYPE_ICONS[risk.type] || AlertCircle;
  
  return (
    <div className={`
      fixed bottom-6 right-6 w-96 z-50
      rounded-xl overflow-hidden
      bg-surface-0 border ${levelConfig.borderColor}
      shadow-2xl
      animate-in slide-in-from-right duration-300
      ${className}
    `}>
      <div className={`px-4 py-3 ${levelConfig.bgColor} border-b border-white/[0.06]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className={`w-4 h-4 ${levelConfig.color}`} />
            <span className={`text-sm font-medium ${levelConfig.color}`}>
              {levelConfig.label} Risk
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-white/10 text-text-tertiary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-sm font-medium text-text-primary mb-2">
          {risk.title}
        </div>
        <p className="text-xs text-text-secondary mb-3">
          {risk.description}
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => onAction?.(risk)}
            className={`
              flex-1 py-2 rounded-lg text-sm font-medium
              ${levelConfig.color} ${levelConfig.bgColor}
              hover:opacity-80 transition-opacity
            `}
          >
            View Details
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary text-sm hover:bg-surface-3 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiskDetectionPanel;
