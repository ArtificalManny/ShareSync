// src/components/home/HomeGreeting.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5.2: Time-Aware Greeting & Daily Summary
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function HomeGreeting({ name = "Manny", stats = { moves: 0, xp: 0, streak: 0 } }) {
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Display name fallback just in case user object is empty
  const displayName = name && name.trim().length > 0 ? name : "Manny";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-2"
    >
      <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight mb-3">
        {greeting}, {displayName}
      </h1>
      
      {/* Daily Summary Stat Bar */}
      <div className="inline-flex flex-wrap items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm text-sm text-slate-600 dark:text-zinc-300 font-medium">
        <span className="text-slate-400 dark:text-zinc-500 font-normal">Today:</span>
        <span className="text-violet-600 dark:text-violet-400 font-bold ml-1">{stats.moves} moves shipped</span>
        <span className="text-slate-300 dark:text-zinc-600 mx-1">•</span>
        <span className="text-emerald-500 font-bold">+{stats.xp} XP</span>
        <span className="text-slate-300 dark:text-zinc-600 mx-1">•</span>
        <span className="text-amber-500 font-bold">{stats.streak}d streak</span>
      </div>
    </motion.div>
  );
}
