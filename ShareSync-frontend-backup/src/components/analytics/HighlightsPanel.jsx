// /src/components/analytics/HighlightsPanel.jsx

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import client from '../../api/client'
import { RefreshCw } from 'lucide-react'
import { getRandomTip } from '../../utils/productivityTips.js'
import {
  getAIGoal,
  getDailyTarget,
  getMostProductiveDay
} from '../../utils/analyticsUtils.js'

export default function HighlightsPanel({ user, xp = 0, onSyncUser }) {
  const [tip, setTip] = useState('')
  const [dailyGoal, setDailyGoal] = useState('')
  const [aiGoal, setAiGoal] = useState('')
  const [mostProductiveDay, setMostProductiveDay] = useState('')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (user) {
      const streakDays = user.streakDays || 0
      const tasksCompleted = user.tasksCompleted || 0
      const completedByDate = user.completedTasksByDate || []
      const totalXP = user.totalXP || xp || 0

      try {
        setTip(getRandomTip(streakDays, totalXP))
        setAiGoal(getAIGoal(streakDays, totalXP))
        setDailyGoal(getDailyTarget(tasksCompleted))
        setMostProductiveDay(getMostProductiveDay(completedByDate))
      } catch (err) {
        console.error('[HighlightsPanel] Tip setup error:', err)
      }
    }
  }, [user, xp])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await client.get('/user/activity-summary')
      const updatedUser = {
        ...user,
        streakDays: res.data.streakDays,
        tasksCompleted: res.data.totalTasksCompleted,
        completedTasksByDate: res.data.completedTasksByDate,
        totalXP: res.data.totalXP
      }

      if (onSyncUser) onSyncUser(updatedUser)

      setTip(getRandomTip(updatedUser.streakDays, updatedUser.totalXP))
      setAiGoal(getAIGoal(updatedUser.streakDays, updatedUser.totalXP))
      setDailyGoal(getDailyTarget(updatedUser.tasksCompleted))
      setMostProductiveDay(getMostProductiveDay(updatedUser.completedTasksByDate))
    } catch (err) {
      console.error('[HighlightsPanel] Sync error:', err)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-lg px-5 py-4 transition-colors duration-300 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold text-pink-600 dark:text-pink-400">🧠 Highlights</h3>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      <ul className="text-sm text-gray-800 dark:text-gray-300 space-y-1">
        <li>
          🧠 <strong className="text-gray-700 dark:text-gray-200">AI Goal:</strong> {aiGoal}
        </li>
        <li>
          💡 <strong className="text-gray-700 dark:text-gray-200">Tip of the Day:</strong> {tip}
        </li>
        <li>
          📝 <strong className="text-gray-700 dark:text-gray-200">Daily Target:</strong> {dailyGoal}
        </li>
        <li>
          🏆 <strong className="text-gray-700 dark:text-gray-200">Most Productive Day:</strong> {mostProductiveDay}
        </li>
      </ul>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="rounded-xl border p-4 dark:border-gray-700">
          <p className="text-xs font-medium mb-1 text-purple-600 dark:text-purple-400">📈 XP Trend</p>
          <div className="w-full h-16">
            <motion.svg
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
              className="w-full h-full text-purple-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points="0,20 20,15 40,18 60,10 80,5 100,8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
            </motion.svg>
            <p className="text-[10px] mt-1 text-gray-500">Past 7 days</p>
          </div>
        </div>
        <div className="rounded-xl border p-4 dark:border-gray-700">
          <p className="text-xs font-medium mb-1 text-red-600 dark:text-red-400">🔥 Streak Progress</p>
          <div className="w-full h-16">
            <motion.svg
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
              className="w-full h-full text-red-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points="0,25 20,18 40,22 60,15 80,10 100,12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
            </motion.svg>
            <p className="text-[10px] mt-1 text-gray-500">Past 7 days</p>
          </div>
        </div>
      </div>
    </div>
  )
}