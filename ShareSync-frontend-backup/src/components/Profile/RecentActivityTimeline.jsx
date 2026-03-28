// src/components/profile/RecentActivityTimeline.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2.7: Profile Page Polish - Recent Activity Timeline
// Shows the user's personal legacy of ships, streaks, and achievements.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Rocket, Flame, Trophy, Target, Star, Clock } from 'lucide-react';

// Activity styling configurations (Shared DNA with ActivityFeedItem)
const TIMELINE_CONFIGS = {
  ship: { icon: Rocket, color: 'text-brand', bg: 'bg-brand-subtle', border: 'border-brand-200' },
  streak: { icon: Flame, color: 'text-warning', bg: 'bg-warning-subtle', border: 'border-warning-200' },
  achievement: { icon: Trophy, color: 'text-warning', bg: 'bg-warning-subtle', border: 'border-warning-200' },
  milestone: { icon: Target, color: 'text-success', bg: 'bg-success-subtle', border: 'border-success-200' },
  task: { icon: Star, color: 'text-info-600', bg: 'bg-info-subtle', border: 'border-info-200' },
};

const formatTimeAgo = (timestamp) => {
  const diff = new Date() - new Date(timestamp);
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function RecentActivityTimeline({ activities = [], loading = false }) {
  if (loading) {
    return (
      <div className="card-surface p-6">
        <div className="h-5 w-32 bg-surface-tertiary rounded animate-pulse mb-8" />
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-surface-tertiary shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-3/4 bg-surface-tertiary rounded" />
                <div className="h-3 w-1/4 bg-surface-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="card-surface p-8 text-center border border-dashed border-border-default">
        <div className="w-14 h-14 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-text-tertiary" />
        </div>
        <h3 className="text-[16px] font-black text-text-primary tracking-tight mb-1">No Recent Activity</h3>
        <p className="text-[13px] font-medium text-text-secondary">Start shipping tasks to build your timeline.</p>
      </div>
    );
  }

  return (
    <div className="card-surface p-6 md:p-8">
      <div className="flex items-center gap-2 mb-8">
        <Clock className="w-5 h-5 text-brand" />
        <h3 className="text-[16px] font-black text-text-primary tracking-tight">Timeline</h3>
      </div>

      <div className="relative">
        {/* The Continuous Grid Line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border-default/70" />

        <div className="space-y-6 relative">
          {activities.map((activity, index) => {
            const config = TIMELINE_CONFIGS[activity.type] || TIMELINE_CONFIGS.task;
            const Icon = config.icon;

            return (
              <div key={activity.id || index} className="flex gap-4 md:gap-5 group">
                {/* Node */}
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-8 h-8 rounded-full ${config.bg} border border-surface-primary ring-1 ${config.border} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 z-10 relative bg-surface-primary`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-1">
                    <p className="text-[14px] text-text-primary leading-snug">
                      {activity.title || <span dangerouslySetInnerHTML={{ __html: activity.htmlMessage }} />}
                    </p>
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider shrink-0">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  
                  {activity.description && (
                    <p className="text-[13px] font-medium text-text-secondary mt-1 max-w-xl">
                      {activity.description}
                    </p>
                  )}
                  
                  {/* Optional Metadata/Rewards */}
                  {activity.xpReward > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-warning-subtle border border-warning-200 rounded-md">
                      <Flame className="w-3 h-3 text-warning" />
                      <span className="text-[10px] font-black text-warning tracking-wider">+{activity.xpReward} XP</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {activities.length >= 10 && (
        <button className="w-full mt-8 py-3 rounded-xl bg-surface-secondary text-[13px] font-bold text-text-secondary hover:text-text-primary hover:bg-border-default transition-all">
          Load older activity
        </button>
      )}
    </div>
  );
}
