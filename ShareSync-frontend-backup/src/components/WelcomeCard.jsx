// src/components/WelcomeCard.jsx
import React from "react";
import { motion } from "framer-motion";

export default function WelcomeCard({ streakDays = 0, tasksCompleted = 0 }) {
  const greeting = getGreeting();
  const formattedName = "Manny"; // TEMP: Replace with useAuth().user?.firstName in future

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-md px-6 py-5 transition-colors duration-300"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
        {greeting}, {formattedName}! 👋
      </h2>

      <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-xl px-5 py-4 flex flex-col gap-2 shadow-inner transition-colors duration-300">
        <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
          🔥 You’re on a <strong>{streakDays}-day streak</strong> — keep it going!
        </p>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          ✅ Tasks completed this week: <strong>{tasksCompleted}</strong>
        </p>
        <p className="text-sm italic text-gray-600 dark:text-gray-400">
          Stay consistent and finish strong 💪
        </p>
      </div>
    </motion.div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
