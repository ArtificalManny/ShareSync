// src/components/StreakChartModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function StreakChartModal({ isOpen, onClose, weeklyData, monthlyData }) {
  const weeklyChart = weeklyData.map((v, i) => ({ name: `Day ${i + 1}`, value: v }));
  const monthlyChart = monthlyData.map((v, i) => ({ name: `Wk ${i + 1}`, value: v }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-full max-w-md p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">📊 Streak Insights</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-sm">✖</button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Weekly Activity</p>
                <ResponsiveContainer width="Available" height={150}>
                  <BarChart data={weeklyChart}>
                    <XAxis dataKey="name" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monthly Overview</p>
                <ResponsiveContainer width="Available" height={150}>
                  <BarChart data={monthlyChart}>
                    <XAxis dataKey="name" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
