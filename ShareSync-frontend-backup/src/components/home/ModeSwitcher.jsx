// src/components/home/ModeSwitcher.jsx
import React from 'react';
import { Hammer, BarChart2, MonitorPlay, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const modes = [
  { id: 'Build', icon: Hammer, label: 'Build', title: 'Standard mission control view' },
  { id: 'Review', icon: BarChart2, label: 'Review', title: 'Heavy on charts, velocity, and analytics' },
  { id: 'Present', icon: MonitorPlay, label: 'Present', title: 'High-level metrics for team standups' },
  { id: 'Zen', icon: Sparkles, label: 'Zen', title: 'Zero distractions. Just your moves.' },
];

export default function ModeSwitcher({ currentMode, onModeChange }) {
  return (
    <div className="flex items-center p-1 bg-white/50 dark:bg-[#1f1f23]/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        const Icon = mode.icon;
        
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            title={mode.title}
            className={`
              relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors outline-none
              ${isActive 
                ? 'text-violet-700 dark:text-violet-300' 
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5'
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="mode-pill-bg"
                className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-full shadow-sm"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{mode.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
