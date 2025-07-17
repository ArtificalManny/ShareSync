// src/components/LeaderboardCard.jsx
import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function LeaderboardCard() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    client.get('/users/leaderboard/streaks')
      .then(res => setLeaders(res.data))
      .catch(err => console.error('[Leaderboard] Failed to load:', err));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">🔥 Streak Leaderboard</h2>
      <ul className="space-y-3">
        {leaders.map((user, index) => (
          <li key={user._id} className="flex items-center space-x-4">
            <span className="text-lg font-bold w-6">{index + 1}</span>
            <img
              src={user.profilePicture || '/default-profile.png'}
              alt={user.firstName}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-gray-800 dark:text-gray-100">{user.firstName}</span>
            <span className="ml-auto text-indigo-500 font-semibold">{user.streakDays} days</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
