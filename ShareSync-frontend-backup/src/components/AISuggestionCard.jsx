// src/components/AISuggestionCard.jsx

import React, { useEffect, useState } from 'react'
import { getSmartTip } from '../utils/analyticsUtils.js'

export default function AISuggestionCard({ user }) {
  const [tip, setTip] = useState('Coming soon: smart tips based on your momentum.')

  useEffect(() => {
    if (user && typeof user === 'object') {
      const streak = user.streakDays || 0
      const xp = user.totalXP || 0
      const tasksThisWeek = user.tasksCompletedThisWeek || 0

      const smart = getSmartTip(streak, xp, tasksThisWeek)
      setTip(smart)
    }
  }, [user])

  return (
    <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 p-4 rounded-xl shadow-md mt-6">
      <h3 className="text-lg font-semibold">🔮 AI Suggestion</h3>
      <p className="text-sm mt-1">{tip}</p>
    </div>
  )
}
