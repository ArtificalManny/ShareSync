// src/components/retro/CollaborationInsight.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - Collaboration Insights
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Users, TrendingUp, Clock, Zap, Award } from 'lucide-react';

/**
 * CollaborationInsight - Co-working effectiveness display
 */
export default function CollaborationInsight({ collaborations = [], stats }) {
  if (collaborations.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-brand" />
          <h3 className="font-semibold text-text-primary">Collaboration</h3>
        </div>
        
        <div className="text-center py-6">
          <Users className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No co-work sessions this week</p>
          <p className="text-xs text-text-tertiary mt-1">
            Try collaborating with teammates to boost productivity!
          </p>
        </div>
      </div>
    );
  }

  // Calculate collaboration stats
  const totalSessions = collaborations.length;
  const totalTasksInCollabs = collaborations.reduce((sum, c) => sum + (c.tasksCompleted || 0), 0);
  const avgTasksPerSession = totalSessions > 0 ? (totalTasksInCollabs / totalSessions).toFixed(1) : 0;
  
  // Find top collaborator
  const collaboratorCounts = {};
  collaborations.forEach(c => {
    const name = c.partnerName || 'Unknown';
    collaboratorCounts[name] = (collaboratorCounts[name] || 0) + 1;
  });
  const topCollaborator = Object.entries(collaboratorCounts)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Users className="w-4 h-4 text-brand" />
          Collaboration
        </h3>
        <span className="text-xs text-text-tertiary">{totalSessions} sessions</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-lg bg-surface-2">
          <Clock className="w-4 h-4 text-info mx-auto mb-1" />
          <div className="text-lg font-bold text-text-primary">{totalSessions}</div>
          <div className="text-[10px] text-text-tertiary">Co-works</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-surface-2">
          <Zap className="w-4 h-4 text-brand mx-auto mb-1" />
          <div className="text-lg font-bold text-text-primary">{totalTasksInCollabs}</div>
          <div className="text-[10px] text-text-tertiary">Tasks</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-surface-2">
          <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
          <div className="text-lg font-bold text-text-primary">{avgTasksPerSession}</div>
          <div className="text-[10px] text-text-tertiary">Avg/Session</div>
        </div>
      </div>

      {/* Top collaborator */}
      {topCollaborator && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-brand/10 to-accent-500/10 border border-brand/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="text-xs text-brand font-medium">Top Partner</div>
              <div className="font-semibold text-text-primary">{topCollaborator[0]}</div>
              <div className="text-xs text-text-tertiary">
                {topCollaborator[1]} session{topCollaborator[1] > 1 ? 's' : ''} together
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent collaborations */}
      {collaborations.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-text-tertiary mb-2">Recent Sessions</div>
          <div className="space-y-2">
            {collaborations.slice(0, 3).map((collab, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-xs">
                    {collab.partnerName?.charAt(0) || '?'}
                  </div>
                  <span className="text-sm text-text-secondary">
                    with {collab.partnerName || 'Unknown'}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary">
                  {collab.tasksCompleted || 0} tasks
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CollaborationBoost - Shows productivity boost from collaboration
 */
export function CollaborationBoost({ soloAvg, collabAvg }) {
  if (!soloAvg || !collabAvg) return null;
  
  const boostPercent = soloAvg > 0 
    ? Math.round(((collabAvg - soloAvg) / soloAvg) * 100) 
    : 0;

  if (boostPercent <= 0) return null;

  return (
    <div className="
      p-4 rounded-xl
      bg-gradient-to-r from-success/10 to-brand/10
      border border-success/20
    ">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-success" />
        </div>
        <div>
          <div className="text-sm font-medium text-text-primary">
            Collaboration Boost
          </div>
          <div className="text-2xl font-bold text-success">
            +{boostPercent}%
          </div>
          <div className="text-xs text-text-tertiary">
            more productive when co-working
          </div>
        </div>
      </div>
    </div>
  );
}
