// src/components/analytics/WeeklyReportModal.jsx
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WeeklyReportModal({ isOpen, onClose, data }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-xl shadow-xl w-[90%] sm:w-[400px]"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          <h2 className="text-lg font-bold mb-2 text-blue-600">📅 Weekly Report</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Here's a snapshot of your progress over the last 7 days:
          </p>
          <ul className="space-y-2 text-sm">
            <li>✅ Tasks Completed: <strong>{data.tasksCompleted}</strong></li>
            <li>📈 XP Gained: <strong>{data.xpEarned}</strong></li>
            <li>🔥 Streak Change: <strong>{data.streakChange >= 0 ? `+${data.streakChange}` : data.streakChange}</strong></li>
            <li>💬 AI Tip: <em>{data.tip}</em></li>
          </ul>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
