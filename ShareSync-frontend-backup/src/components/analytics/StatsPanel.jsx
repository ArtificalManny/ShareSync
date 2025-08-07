// src/components/analytics/StatsPanel.jsx
import React from 'react'
import '../../styles/card.css' // ✅ Correct relative path

const StatBox = ({ label, value }) => (
  <div className="card-base card-padding text-center flex flex-col items-center justify-center w-full">
    <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
      {value}
    </div>
    <div className="card-subheading">{label}</div>
  </div>
)

export default function StatsPanel({
  taskCompletionRate = 0,
  daysActive = 0,
  longestStreak = 0,
  mostActiveDay = '—'
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <StatBox label="Task Completion Rate" value={`${taskCompletionRate}%`} />
      <StatBox label="Days Active This Month" value={daysActive} />
      <StatBox label="Longest Streak" value={`${longestStreak} 🔥`} />
      <StatBox label="Most Active Day" value={mostActiveDay} />
    </div>
  )
}