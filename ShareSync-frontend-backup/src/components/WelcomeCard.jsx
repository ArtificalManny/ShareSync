import React from 'react';

export default function WelcomeCard({ greeting, profilePic, suggestion, streakDays, lastLogin }) {
  return (
    <div className="rounded-3xl bg-white dark:bg-gray-900 shadow p-6 flex items-center space-x-6">
      <img
        src={profilePic}
        alt="Profile"
        className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500"
      />
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting}</h2>

        {typeof streakDays === 'number' && (
          <p className="text-lg text-orange-500">🔥 {streakDays}-day streak</p>
        )}

        {lastLogin && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last login: {new Date(lastLogin).toLocaleString()}
          </p>
        )}

        {streakDays >= 7 && (
          <p className="text-green-600 dark:text-green-400 font-semibold mt-2">
            🎯 You've unlocked a 7-day streak reward!
          </p>
        )}
        {streakDays >= 14 && (
          <p className="text-blue-600 dark:text-blue-400 font-semibold mt-2">
            🏅 14-day streak! You’re building serious momentum.
          </p>
        )}
        {streakDays >= 30 && (
          <p className="text-yellow-600 dark:text-yellow-400 font-semibold mt-2">
            🌟 30+ day streak! You’re in elite territory.
          </p>
        )}

        <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
      </div>
    </div>
  );
}
