// src/components/LeaderboardCard.jsx
import React from 'react'
import { User } from 'lucide-react'
import { cn } from '../utils/classnames'

const tierStyles = {
  Newcomer: 'text-gray-400',
  Intermediate: 'text-blue-500',
  Advanced: 'text-green-500',
  Pro: 'text-yellow-500',
  Veteran: 'text-purple-500'
}

const borderStyles = {
  Newcomer: 'border-gray-300',
  Intermediate: 'border-blue-400',
  Advanced: 'border-green-400',
  Pro: 'border-yellow-400',
  Veteran: 'border-purple-400'
}

const glowStyles = {
  Newcomer: 'shadow-[0_0_8px_#cbd5e0]',
  Intermediate: 'shadow-[0_0_8px_#3b82f6]',
  Advanced: 'shadow-[0_0_8px_#10b981]',
  Pro: 'shadow-[0_0_8px_#eab308]',
  Veteran: 'shadow-[0_0_8px_#8b5cf6]'
}

const rankIcons = {
  1: '🥇',
  2: '🥈',
  3: '🥉'
}

export default function LeaderboardCard({ currentUserId }) {
  const leaderboard = [
    { id: '1', name: 'Alice', tier: 'Veteran', streak: 31, avatar: '' },
    { id: '2', name: 'Bob', tier: 'Advanced', streak: 24, avatar: '' },
    { id: '3', name: 'Charlie', tier: 'Intermediate', streak: 17, avatar: '' },
    { id: '4', name: 'Manny', tier: 'Newcomer', streak: 5, avatar: '' }
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6 sm:p-8 space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        🏆 Streak Leaderboard
      </h2>
      <div className="space-y-4">
        {leaderboard.map((user, index) => {
          const isCurrentUser = user.id === currentUserId

          return (
            <div
              key={user.id}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-300',
                isCurrentUser
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400'
                  : 'bg-gray-50 dark:bg-gray-800/40',
                borderStyles[user.tier] || 'border-gray-200',
                isCurrentUser && glowStyles[user.tier]
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold border-2',
                    borderStyles[user.tier] || 'border-gray-300',
                    'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
                  )}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100">
                    {rankIcons[index + 1] || `${index + 1}.`} {user.name}
                  </div>
                  <div
                    className={cn(
                      'text-xs sm:text-sm font-semibold',
                      tierStyles[user.tier] || 'text-gray-400'
                    )}
                  >
                    {user.tier}
                  </div>
                </div>
              </div>

              <div className="text-sm sm:text-base font-semibold text-indigo-600 dark:text-indigo-300">
                🔥 {user.streak}d
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
