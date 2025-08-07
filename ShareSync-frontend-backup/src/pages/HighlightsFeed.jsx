// /src/pages/HighlightsFeed.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllActivities } from '../api/activity'; // 👈 You must have this already
import { formatDistanceToNow } from 'date-fns';
import { Sparkles } from 'lucide-react';
import '../index.css';

const HighlightsFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await getAllActivities(); // 👈 Already working endpoint
        setActivities(response || []);
      } catch (err) {
        console.error('Failed to load activity feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  if (loading) return <div className="text-center p-8">Loading highlights...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-orbitron text-center mb-6 text-indigo-vivid">📣 Global Highlights Feed</h1>
      {activities.length === 0 ? (
        <p className="text-center text-gray-500">No recent activity yet.</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="glassmorphic p-4 rounded-lg border shadow hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <img
                  src={activity.user?.profilePicture || 'https://via.placeholder.com/40'}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border"
                />
                <div>
                  <Link
                    to={`/profile/${activity.user?.username}`}
                    className="font-bold text-indigo-vivid hover:underline"
                  >
                    {activity.user?.firstName || activity.user?.username || 'Unknown User'}
                  </Link>{' '}
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                  <div className="text-sm text-gray-700 mt-1">
                    {activity.message || 'did something cool!'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HighlightsFeed;
