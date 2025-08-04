// src/components/MomentumRing.jsx
import React from "react";
import { motion } from "framer-motion";

export default function MomentumRing({ streakDays = 0, xp = 0, tier = "Newcomer", onClick }) {
  // Remove internal: const tier = getTier(streakDays);
// Use passed prop instead
const xpToNext = getXpToNextTier(tier);
const percent = Math.min((xp / xpToNext) * 100, 100);
const tierLabel = `${tier} Tier`;
const tip = getTierTip(tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative w-full max-w-xs mx-auto p-6 rounded-3xl shadow-xl border bg-white dark:bg-gray-900`}
      style={{
        background: "radial-gradient(circle at center, #f3e8ff, #e0f2fe)",
        backgroundBlendMode: "soft-light",
      }}
    >
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{xp} XP</h3>
        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
          🔥 <span className="font-bold">{tierLabel}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{percent.toFixed(0)}% to next level</p>
      </div>

      <div className="relative w-32 h-32 mx-auto">
        <svg className="absolute top-0 left-0 w-full h-full">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="url(#tierGradient)"
            strokeWidth="8"
            strokeDasharray="0,100"
            strokeLinecap="round"
            initial={{ strokeDasharray: "0,100" }}
            animate={{ strokeDasharray: `${percent},100` }}
            transition={{ duration: 1 }}
          />
          <defs>
            <linearGradient id="tierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold text-indigo-700 dark:text-indigo-200">
            {streakDays}d
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm italic text-center text-gray-600 dark:text-gray-400">
        {tip}
      </p>
    </motion.div>
  );
}

function getTier(days) {
  if (days >= 30) return "Veteran";
  if (days >= 20) return "Pro";
  if (days >= 10) return "Advanced";
  if (days >= 5) return "Intermediate";
  return "Newcomer";
}

function getXpToNextTier(tier) {
  switch (tier) {
    case "Veteran":
      return 1000;
    case "Pro":
      return 750;
    case "Advanced":
      return 500;
    case "Intermediate":
      return 250;
    default:
      return 100;
  }
}

function getTierTip(tier) {
  switch (tier) {
    case "Veteran":
      return "💼 You’ve built elite momentum. Inspire others!";
    case "Pro":
      return "🎯 You’re performing like a pro. Keep pushing forward.";
    case "Advanced":
      return "⚡ Advanced stage — sharpen your consistency.";
    case "Intermediate":
      return "🚀 You’re gaining traction. Stay on course.";
    default:
      return "🌱 Welcome aboard! Every click builds momentum.";
  }
}
