import React from 'react';
import { Award, TrendingUp } from 'lucide-react';

export default function RoleClassificationCard({ data }) {
  if (!data) return null;

  const { role, confidence, traits, stats } = data;

  const roleIcons = {
    'Finisher': '🎯',
    'Starter': '🚀',
    'Support': '🤝',
    'Balanced': '⚖️'
  };

  return (
    <div className="modern-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10">
          <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="heading-3">Your Role Classification</h3>
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-500/10 dark:to-fuchsia-500/10 border border-purple-200 dark:border-purple-500/20">
        <span className="text-4xl">{roleIcons[role] || '⭐'}</span>
        <div className="flex-1">
          <div className="font-bold text-lg text-purple-900 dark:text-purple-100">
            {role}
          </div>
          <div className="caption-text text-purple-600 dark:text-purple-400">
            {confidence}% confidence
          </div>
        </div>
      </div>

      {/* Traits */}
      {traits && traits.length > 0 && (
        <div className="space-y-2">
          <div className="caption-text">Key traits</div>
          <div className="space-y-1.5">
            {traits.map((trait, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-purple-500 mt-0.5">•</span>
                <span className="text-slate-700 dark:text-slate-300">{trait}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="divider-modern" />

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card-modern">
            <div className="stat-label">Started</div>
            <div className="stat-value text-xl">{stats.started || 0}</div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-label">Closed</div>
            <div className="stat-value text-xl">{stats.closed || 0}</div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-label">Comments</div>
            <div className="stat-value text-xl">{stats.comments || 0}</div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-label">Help given</div>
            <div className="stat-value text-xl">{stats.helpRequests || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
}
