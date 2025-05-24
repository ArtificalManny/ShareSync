import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Activity, ThumbsUp } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  const recentActivities = [
    { id: '1', user: 'Alice', action: 'completed a task in Project Alpha', time: '2 hours ago', projectId: '1' },
    { id: '2', user: 'Bob', action: 'posted an announcement in Project Beta', time: '5 hours ago', projectId: '2' },
    { id: '3', user: 'Charlie', action: 'shared Project Gamma', time: '1 day ago', projectId: '3' },
  ];

  return (
    <div className="home-container">
      <div className="relative z-10 max-w-4xl mx-auto p-8">
        <h1 className="holographic-text text-5xl mb-8">Welcome to ShareSync, {isAuthenticated ? user.firstName : 'Guest'}!</h1>
        <div className="activity-feed bg-dark-glass p-6 rounded-xl shadow-glow-cyan">
          <h2 className="text-2xl font-orbitron text-neon-cyan mb-6 flex items-center">
            <Activity className="mr-2" /> Recent Activity
          </h2>
          {recentActivities.length === 0 ? (
            <p className="text-secondary">No recent activity. Start collaborating on a project!</p>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="activity-item bg-dark-glass p-4 rounded-lg hover:bg-opacity-80 transition-all duration-300 border-l-4 border-neon-magenta"
                >
                  <p className="text-neon-white">
                    <span className="font-bold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-secondary text-sm">{activity.time}</p>
                  <div className="flex items-center mt-2">
                    <button className="flex items-center text-neon-cyan hover:text-neon-magenta transition-colors">
                      <ThumbsUp className="w-5 h-5 mr-1" /> Like
                    </button>
                    <Link
                      to={`/projects/${activity.projectId}`}
                      className="ml-4 text-neon-cyan hover:text-neon-magenta transition-colors"
                    >
                      View Project
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;