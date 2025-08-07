// src/components/WelcomeCard.jsx
import React from "react";
import { motion } from "framer-motion";
import "../styles/card.css"; // ✅ Import the reusable card styles
import { getStreakMilestone } from '../utils/streakMilestones';

export default function WelcomeCard({ streakDays = 0, tasksCompleted = 0 }) {
  const greeting = getGreeting();
  const formattedName = "Manny"; // TEMP: Replace with useAuth().user?.firstName in future

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card-base card-padding w-full rounded-3xl shadow-lg space-y-4"
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
        {greeting}, {formattedName}! 👋
      </h2>

      <div className="gradient-card rounded-2xl shadow-inner flex flex-col gap-2">
        <p className="text-sm sm:text-base font-medium text-purple-800 dark:text-purple-300">
          🔥 You’re on a <strong>{streakDays}-day streak</strong> — keep it going!
        </p>
        <p className="text-sm sm:text-base text-blue-800 dark:text-blue-300">
          ✅ Tasks completed this week: <strong>{tasksCompleted}</strong>
        </p>
        <p className="text-sm sm:text-base italic text-gray-600 dark:text-gray-400">
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


