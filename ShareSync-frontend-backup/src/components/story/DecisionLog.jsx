// src/components/story/DecisionLog.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: Decision Log Panel
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  GitBranch, Scissors, Code, Settings, ArrowUpDown,
  Clock, User, CheckCircle2, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { getRelativeTime, DECISION_TYPES } from '../../utils/timelineFilters';

const TYPE_ICONS = {
  descope: Scissors,
  technical: Code,
  process: Settings,
  priority: ArrowUpDown,
};

const STATUS_CONFIG = {
  approved: { color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 },
  implemented: { color: 'text-brand', bg: 'bg-brand/10', icon: CheckCircle2 },
  'in-progress': { color: 'text-warning', bg: 'bg-warning/10', icon: AlertCircle },
  pending: { color: 'text-text-tertiary', bg: 'bg-surface-2', icon: Clock },
};

function DecisionCard({ decision }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeConfig = DECISION_TYPES[decision.type] || DECISION_TYPES.descope;
  const TypeIcon = TYPE_ICONS[decision.type] || GitBranch;
  const statusConfig = STATUS_CONFIG[decision.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${typeConfig.color === 'text-warning' ? 'bg-warning/10' : 'bg-surface-2'}`}>
          <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            <span className={`
              flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
              ${statusConfig.bg} ${statusConfig.color}
            `}>
              <StatusIcon className="w-3 h-3" />
              {decision.status}
            </span>
          </div>
          
          <h4 className="font-medium text-text-primary">{decision.title}</h4>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary mb-3">{decision.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-text-tertiary mb-3">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {decision.author?.name}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {getRelativeTime(decision.timestamp)}
        </span>
      </div>

      {/* Expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          flex items-center gap-1 text-xs text-text-tertiary
          hover:text-text-secondary transition-colors
        "
      >
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {isExpanded ? 'Hide details' : 'Show details'}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3 animate-in slide-in-from-top-2">
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Reason</p>
            <p className="text-sm text-text-secondary">{decision.reason}</p>
          </div>
          
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Impact</p>
            <p className="text-sm text-text-secondary">{decision.impact}</p>
          </div>

          {decision.linkedTasks?.length > 0 && (
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
                Linked Tasks ({decision.linkedTasks.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {decision.linkedTasks.map(task => (
                  <span key={task} className="px-2 py-0.5 rounded bg-surface-2 text-xs text-text-tertiary">
                    {task}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DecisionLog({
  decisions = [],
  loading,
  onAddDecision,
  className = '',
}) {
  const [filter, setFilter] = useState('all');

  const filteredDecisions = filter === 'all' 
    ? decisions 
    : decisions.filter(d => d.type === filter);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 rounded-xl bg-surface-1 border border-white/[0.06] animate-pulse">
            <div className="h-5 w-32 bg-surface-2 rounded mb-3" />
            <div className="h-4 w-full bg-surface-2 rounded mb-2" />
            <div className="h-4 w-2/3 bg-surface-2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-text-primary">Decision Log</h3>
          <span className="px-2 py-0.5 rounded-full bg-surface-2 text-xs text-text-tertiary">
            {decisions.length}
          </span>
        </div>

        {onAddDecision && (
          <button
            onClick={onAddDecision}
            className="
              px-3 py-1.5 rounded-lg text-xs font-medium
              bg-warning/10 text-warning
              hover:bg-warning/20 transition-colors
            "
          >
            + Log Decision
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', ...Object.keys(DECISION_TYPES)].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`
              px-3 py-1.5 rounded-lg text-xs capitalize
              ${filter === type
                ? 'bg-warning/10 text-warning'
                : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
              }
              transition-colors
            `}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Decision List */}
      <div className="space-y-3">
        {filteredDecisions.length > 0 ? (
          filteredDecisions.map(decision => (
            <DecisionCard key={decision.id} decision={decision} />
          ))
        ) : (
          <div className="py-8 text-center">
            <GitBranch className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-tertiary">No decisions logged yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
