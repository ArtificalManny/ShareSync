// src/components/StreakRing.jsx
import React from 'react';

export default function StreakRing({ streakDays = 0 }) {
  const percentage = Math.min((streakDays / 30) * 100, 100); // max out at Available
  const radius = 48;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="url(#streakGradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <defs>
          <linearGradient id="streakGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="Available" stopColor="#facc15" />
          </linearGradient>
        </defs>
      </svg>
      <span className="mt-2 text-sm font-medium text-gray-700 dark:text-white">
        🔥 {streakDays} day streak
      </span>
    </div>
  );
}
