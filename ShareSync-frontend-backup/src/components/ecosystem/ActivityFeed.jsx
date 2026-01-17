// src/components/ecosystem/ActivityFeed.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ═══════════════════════════════════════════════════════════════════════════════
// FIXED: Hardcoded slate/purple colors → Design tokens
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Rocket, CheckCircle, FileText, DollarSign, Users, 
  MessageCircle, TrendingUp, Clock, RefreshCw, Sparkles
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';
import TrustBadge from '../trust/TrustBadge';

/* ─────────────────────────────────────────────────────────────────────────
   COLOR CONFIG - Tailwind-safe explicit classes
───────────────────────────────────────────────────────────────────────── */
const activityColors = {
  purple: 'text-brand bg-brand/10',
  emerald: 'text-success bg-success/10',
  blue: 'text-info bg-info/10',
  fuchsia: 'text-brand bg-brand/10',
  orange: 'text-warning bg-warning/10',
};

const ActivityFeed = () => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [activities] = useState([
    {
      id: 1,
      type: 'ship',
      user: 'Sarah',
      action: 'shipped',
      content: 'Fixed login bug',
      project: 'Mobile App',
      timestamp: '2m ago',
      icon: Rocket,
      color: 'purple'
    },
    {
      id: 2,
      type: 'milestone',
      user: null,
      action: 'hit',
      content: '50% complete',
      project: 'Mobile App',
      timestamp: '15m ago',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      id: 3,
      type: 'tasks',
      user: 'Mike',
      action: 'completed',
      content: '5 tasks today',
      project: 'Web Redesign',
      timestamp: '1h ago',
      icon: CheckCircle,
      color: 'blue'
    },
    {
      id: 4,
      type: 'announcement',
      user: 'Alex',
      action: 'posted announcement in',
      content: 'Weekly sync moved to Friday',
      project: 'Web Redesign',
      timestamp: '2h ago',
      icon: MessageCircle,
      color: 'fuchsia'
    },
    {
      id: 5,
      type: 'payment',
      user: 'You',
      action: 'received payment',
      content: '$1,500 from Client X',
      project: 'Freelance',
      timestamp: '3h ago',
      icon: DollarSign,
      color: 'emerald'
    },
    {
      id: 6,
      type: 'streak',
      user: 'You',
      action: 'achieved',
      content: '7-day streak! Keep going',
      project: null,
      timestamp: '1d ago',
      icon: Sparkles,
      color: 'orange'
    }
  ]);

  const handleRefresh = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary text-sm">Activity Feed</h3>
            <TrustBadge type="private" size="xs" inline />
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 hover:bg-surface-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-text-tertiary ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-2" style={{ maxHeight: isMobile ? '400px' : '600px', overflowY: 'auto' }}>
        {activities.map((activity) => {
          const Icon = activity.icon;
          const colorClass = activityColors[activity.color] || activityColors.purple;
          
          return (
            <div
              key={activity.id}
              className="group flex items-start gap-3 p-3 rounded-lg bg-surface-0 border border-white/[0.04] hover:bg-surface-2 hover:border-white/[0.08] transition-all cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">
                  {activity.user && (
                    <span className="font-medium text-brand">{activity.user} </span>
                  )}
                  <span className="text-text-tertiary">{activity.action} </span>
                  <span className="font-medium">{activity.content}</span>
                </p>
                
                <div className="flex items-center gap-1.5 mt-1 text-xs text-text-tertiary">
                  {activity.project && (
                    <>
                      <span>{activity.project}</span>
                      <span className="opacity-50">·</span>
                    </>
                  )}
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      <button className="w-full mt-3 py-2.5 bg-surface-0 hover:bg-surface-2 border border-white/[0.06] hover:border-white/[0.1] rounded-lg text-xs font-medium text-text-tertiary hover:text-text-secondary transition-all">
        Load More Activity
      </button>
    </div>
  );
};

export default ActivityFeed;
