// src/components/presence/ProjectPresencePanel.jsx - Week 8 Day 1-2
import React from 'react';
import LiveActivityFeed from './LiveActivityFeed';
import UserPresenceCard from './UserPresenceCard';
import { Users } from 'lucide-react';

/**
 * ProjectPresencePanel - Combined presence view for projects
 * Shows who's online and what they're doing
 */
const ProjectPresencePanel = ({ projectId }) => {
  const onlineUsers = [
    { 
      id: 1, 
      name: 'Sarah', 
      avatar: '👩',
      status: 'online',
      currentActivity: 'Login page redesign'
    },
    { 
      id: 2, 
      name: 'Mike', 
      avatar: '👨',
      status: 'online',
      currentActivity: 'Code review'
    }
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      {/* Who's Online Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white">Who's Working</h3>
          <span className="ml-auto px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full">
            {onlineUsers.length} online
          </span>
        </div>

        <div className="space-y-2">
          {onlineUsers.map((user) => (
            <UserPresenceCard
              key={user.id}
              user={user}
              showActivity={true}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="pt-6 border-t border-slate-700/50">
        <LiveActivityFeed projectId={projectId} />
      </div>
    </div>
  );
};

export default ProjectPresencePanel;
