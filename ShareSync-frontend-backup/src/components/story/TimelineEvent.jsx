// src/components/story/TimelineEvent.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: Single Timeline Event Card
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Rocket, AlertTriangle, GitBranch, Flag, Clock, Zap,
  CheckCircle2, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { getRelativeTime, IMPACT_LEVELS } from '../../utils/timelineFilters';

const TYPE_CONFIG = {
  ship: { 
    icon: Rocket, 
    color: 'text-brand', 
    bg: 'bg-brand/10',
    line: 'bg-brand',
  },
  blocker: { 
    icon: AlertTriangle, 
    color: 'text-error-500', 
    bg: 'bg-error-500/10',
    line: 'bg-error-500',
  },
  decision: { 
    icon: GitBranch, 
    color: 'text-warning', 
    bg: 'bg-warning/10',
    line: 'bg-warning',
  },
  milestone: { 
    icon: Flag, 
    color: 'text-success', 
    bg: 'bg-success/10',
    line: 'bg-success',
  },
};

export default function TimelineEvent({
  event,
  isLast = false,
  showDetails = false,
  onClick,
}) {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.ship;
  const Icon = config.icon;
  const impactStyle = IMPACT_LEVELS[event.impact] || IMPACT_LEVELS.low;

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`
          w-10 h-10 rounded-xl ${config.bg}
          flex items-center justify-center shrink-0
        `}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 mt-2 ${config.line} opacity-20`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div
          onClick={() => onClick?.(event)}
          className={`
            p-4 rounded-xl cursor-pointer
            bg-surface-1 border border-white/[0.06]
            hover:bg-surface-2 hover:border-white/[0.1]
            transition-all duration-200
          `}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-text-primary">{event.title}</h4>
              {event.actor && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-5 h-5 rounded-full bg-surface-2 overflow-hidden">
                    {event.actor.avatar ? (
                      <img src={event.actor.avatar} alt={event.actor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-text-tertiary">
                        {event.actor.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-text-tertiary">{event.actor.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Impact Badge */}
              <span className={`
                px-2 py-0.5 rounded text-[10px] font-medium
                ${impactStyle.bg} ${impactStyle.color}
              `}>
                {event.impact}
              </span>

              {/* Time */}
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="w-3 h-3" />
                {getRelativeTime(event.timestamp)}
              </span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-text-secondary mb-3">
              {event.description}
            </p>
          )}

          {/* Metadata */}
          {event.metadata && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {event.metadata.xp && (
                <span className="flex items-center gap-1 text-brand">
                  <Zap className="w-3 h-3" />
                  +{event.metadata.xp} XP
                </span>
              )}
              {event.metadata.tasks && (
                <span className="text-text-tertiary">
                  {event.metadata.tasks} tasks
                </span>
              )}
              {event.metadata.resolved && (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-3 h-3" />
                  Resolved
                </span>
              )}
              {event.metadata.severity && (
                <span className={`
                  px-1.5 py-0.5 rounded
                  ${event.metadata.severity === 'critical' ? 'bg-error-500/10 text-error-500' : 'bg-warning/10 text-warning'}
                `}>
                  {event.metadata.severity}
                </span>
              )}
            </div>
          )}

          {/* Expand Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="
              mt-3 flex items-center gap-1 text-xs text-text-tertiary
              hover:text-text-secondary transition-colors
            "
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {isExpanded ? 'Less details' : 'More details'}
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-white/[0.06] animate-in slide-in-from-top-2">
              <div className="text-xs text-text-tertiary space-y-2">
                <p>Event ID: {event.id}</p>
                <p>Timestamp: {new Date(event.timestamp).toLocaleString()}</p>
                {event.metadata && (
                  <pre className="p-2 rounded bg-surface-2 overflow-x-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
