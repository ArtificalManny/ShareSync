import React from 'react'

export default function MomentumForecast({ streakDays = 0, tasksCompleted = 0, xp = 0 }) {
  const nextTierXP = 200  // Example logic — adjust per real tier system
  const xpLeft = Math.max(nextTierXP - xp, 0)
  const daysTo7Streak = Math.max(7 - streakDays, 0)

  const message =
    xpLeft === 0
      ? `🏅 You've reached the next tier! Great job!`
      : xpLeft <= 20
        ? `🔥 You're just ${xpLeft} XP from your next tier. Keep it up!`
        : daysTo7Streak <= 2
          ? `📆 You're just ${daysTo7Streak} day(s) from a 7-day streak!`
          : `🚀 Keep the momentum — ${tasksCompleted} tasks done already!`

  return (
    <div className="bg-gradient-to-r from-[#e0f7fa] to-[#fce4ec] dark:from-[#2a2d3a] dark:to-[#3b2c40] p-4 rounded-xl shadow-md animate-fade-in">
      <h3 className="text-md font-semibold mb-1 text-gray-800 dark:text-white">🔮 Momentum Forecast</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
    </div>
  )
}
