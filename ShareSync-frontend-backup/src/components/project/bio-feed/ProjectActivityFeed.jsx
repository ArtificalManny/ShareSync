// src/components/project/bio-feed/ProjectActivityFeed.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Project Activity Feed with Momentum Values
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Activity, Rocket, CheckCircle2, Target, Bug, MessageSquare, Zap } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// Native relative time formatter (no date-fns dependency)
// ═══════════════════════════════════════════════════════════════════════════════
function formatDistanceToNow(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  return `${diffMonths}mo`;
}

const ACTION_CONFIG = {
  shipped: {
    icon: Rocket,
    color: 'text-brand',
    bg: 'bg-brand/10',
    verb: 'shipped',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10',
    verb: 'completed',
  },
  'created objective': {
    icon: Target,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    verb: 'created objective',
  },
  'resolved blocker': {
    icon: Bug,
    color: 'text-warning',
    bg: 'bg-warning/10',
    verb: 'resolved blocker',
  },
  commented: {
    icon: MessageSquare,
    color: 'text-text-secondary',
    bg: 'bg-surface-2',
    verb: 'commented on',
  },
};

function ActivityItem({ item, onClick }) {
  const config = ACTION_CONFIG[item.action] || {
    icon: Activity,
    color: 'text-text-secondary',
    bg: 'bg-surface-2',
    verb: item.action,
  };
  
  const Icon = config.icon;
  const timeAgo = item.createdAt 
    ? formatDistanceToNow(new Date(item.createdAt))
    : '';

  return (
    <button
      onClick={() => onClick?.(item)}
      className="
        w-full flex items-start gap-3 p-3 -mx-3
        rounded-lg
        hover:bg-surface-2/50
        transition-colors text-left
        group
      "
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-surface-2 overflow-hidden shrink-0">
        {item.actor?.avatar ? (
          <img src={item.actor.avatar} alt={item.actor.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-medium text-text-tertiary">
            {item.actor?.name?.charAt(0) || '?'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-text-primary">
            {item.actor?.name || 'Someone'}
          </span>
          <span className="text-sm text-text-tertiary">
            {config.verb}
          </span>
          <span className="text-sm text-text-secondary font-medium truncate">
            {item.target}
          </span>
        </div>
        
        {/* Meta Row */}
        <div className="flex items-center gap-3 mt-1">
          {item.momentum > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-brand">
              <Zap className="w-3 h-3" />
              +{item.momentum}
            </span>
          )}
          
          <span className="text-xs text-text-tertiary">
            {timeAgo}
          </span>
        </div>
      </div>

      {/* Action Icon */}
      <div className={`shrink-0 p-1.5 rounded-lg ${config.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      </div>
    </button>
  );
}

export default function ProjectActivityFeed({ activity = [], onActivityClick, maxItems = 8 }) {
  const displayActivity = activity.slice(0, maxItems);

  return (
    <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-text-tertiary" />
        <h3 className="text-sm font-medium text-text-secondary">Project Activity</h3>
      </div>

      {/* Activity List */}
      {displayActivity.length > 0 ? (
        <div className="space-y-1">
          {displayActivity.map((item) => (
            <ActivityItem
              key={item.id}
              item={item}
              onClick={onActivityClick}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Activity className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-tertiary">No recent activity</p>
        </div>
      )}

      {/* View More */}
      {activity.length > maxItems && (
        <button className="
          w-full mt-3 py-2 rounded-lg
          text-xs text-text-tertiary
          hover:text-text-secondary hover:bg-surface-2
          transition-colors
        ">
          View all activity
        </button>
      )}
    </div>
  );
}
