import UserAvatar from '../ui/UserAvatar';
// src/components/presence/LiveActivityFeed.jsx - Week 8 Day 1-2
import React, { useState, useEffect } from 'react';
import { Activity, Circle } from 'lucide-react';
import OnlineIndicator from './OnlineIndicator';

/**
 * LiveActivityFeed - Shows real-time activity in project
 * Shows who's working, what they're doing, and when
 */
const LiveActivityFeed = ({ projectId }) => {
  const [activities, setActivities] = useState([
    {
      id: 1,
      user: 'Sarah',
      avatar: '👩',
      action: 'Started working',
      target: 'Login page redesign',
      timestamp: 'Just now',
      type: 'started',
      isOnline: true
    },
    {
      id: 2,
      user: 'Mike',
      avatar: '👨',
      action: 'Completed',
      target: 'Fix navigation bug',
      timestamp: '2m ago',
      type: 'completed',
      isOnline: true
    },
    {
      id: 3,
      user: 'Alex',
      avatar: '🧑',
      action: 'Commenting on',
      target: 'Dashboard mockups',
      timestamp: '5m ago',
      type: 'commenting',
      isOnline: false
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In real app, this would be Socket.IO updates
      // For now, just update timestamps
    }, 30000);

    return () => clearInterval(interval);
  }, [projectId]);

  const getActivityColor = (type) => {
    switch(type) {
      case 'started': return 'text-blue-400';
      case 'completed': return 'text-emerald-400';
      case 'commenting': return 'text-purple-400';
      case 'uploaded': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-400" />
        <h4 className="font-semibold text-white">Live Activity</h4>
        <div className="flex items-center gap-1 ml-auto text-xs text-emerald-400">
          <Circle className="w-2 h-2 fill-current" />
          <span>Live</span>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No recent activity
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-xl hover:bg-slate-900/50 transition-all"
            >
              {/* Avatar with online indicator */}
              <div className="relative flex-shrink-0">
                <UserAvatar
                  user={activity.userData || activity.userObject || activity.userId || activity.actor || activity}
                  name={
                    activity.user?.name ||
                    activity.user ||
                    activity.actorName ||
                    activity.username ||
                    'User'
                  }
                  avatarUrl={
                    activity.avatarUrl ||
                    activity.profilePicture ||
                    activity.profileImage ||
                    activity.userAvatar ||
                    activity.actorAvatar ||
                    activity.avatar
                  }
                  size={32}
                  ringClassName="ring-0"
                  className="bg-purple-500/20"
                />
                {activity.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineIndicator size="xs" isOnline={true} />
                  </div>
                )}
              </div>

              {/* Activity details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  <span className="font-semibold text-purple-300">{activity.user}</span>
                  {' '}
                  <span className={`${getActivityColor(activity.type)}`}>{activity.action}</span>
                  {' '}
                  <span className="text-slate-300">{activity.target}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveActivityFeed;
