import React, { useState, useEffect } from 'react';
import { 
  Rocket, CheckCircle, FileText, DollarSign, Users, 
  MessageCircle, TrendingUp, Clock, RefreshCw, Sparkles
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const ActivityFeed = () => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([
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
    // TODO: Fetch real activity data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getActivityColor = (color) => {
    const colors = {
      purple: 'text-purple-400 bg-purple-500/20',
      emerald: 'text-emerald-400 bg-emerald-500/20',
      blue: 'text-blue-400 bg-blue-500/20',
      fuchsia: 'text-fuchsia-400 bg-fuchsia-500/20',
      orange: 'text-orange-400 bg-orange-500/20',
    };
    return colors[color] || colors.purple;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Activity Feed</h3>
            <p className="text-xs text-slate-400">Real-time team updates</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-3" style={{ maxHeight: isMobile ? '400px' : '600px', overflowY: 'auto' }}>
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="bg-slate-900/50 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white mb-1">
                    {activity.user && (
                      <span className="font-semibold text-purple-400">{activity.user} </span>
                    )}
                    <span className="text-slate-400">{activity.action} </span>
                    <span className="font-medium">{activity.content}</span>
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {activity.project && (
                      <>
                        <span>{activity.project}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      <button className="w-full mt-4 py-3 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 hover:border-purple-500/50 rounded-xl font-semibold text-sm text-slate-400 hover:text-purple-400 transition-all">
        Load More Activity
      </button>
    </div>
  );
};

export default ActivityFeed;
