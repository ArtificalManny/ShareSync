// src/components/profile/MomentumGraph.jsx
import React from 'react';
import { Activity } from 'lucide-react';

export default function MomentumGraph({ streak = 0 }) {
  // Create a 30-day block grid for visual representation
  const days = Array.from({ length: 30 }, (_, i) => {
    // If the index is within the last 'streak' days, it's active
    const isActive = (30 - i) <= streak;
    // Add random intensity for visual flair on active days
    const intensity = isActive ? Math.floor(Math.random() * 3) + 1 : 0;
    return { id: i, isActive, intensity };
  });

  const getIntensityClass = (intensity) => {
    if (intensity === 3) return 'bg-violet-500 dark:bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]';
    if (intensity === 2) return 'bg-violet-400 dark:bg-violet-400';
    if (intensity === 1) return 'bg-violet-300 dark:bg-violet-600';
    return 'bg-slate-100 dark:bg-zinc-800';
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm">
      <div className="flex justify-between items-center mb-6">
         <div className="flex items-center gap-2">
           <Activity className="w-4 h-4 text-violet-500" />
           <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Momentum Log</h3>
         </div>
         <div className="text-xs font-medium text-slate-500 dark:text-zinc-400">
           <span className="text-violet-600 dark:text-violet-400 font-bold">{streak} Day</span> streak
         </div>
      </div>
      
      {/* 30 Day Grid Wrapping layout */}
      <div className="flex flex-wrap gap-1.5 justify-end">
         {days.map(day => (
           <div 
             key={day.id}
             className={`w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-[4px] transition-colors duration-300 ${getIntensityClass(day.intensity)}`}
             title={day.isActive ? "Activity recorded" : "No activity"}
           />
         ))}
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-5 text-[10px] text-slate-500 dark:text-zinc-500 font-medium">
         <span>Less</span>
         <div className="flex gap-1">
           <div className="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-zinc-800" />
           <div className="w-3 h-3 rounded-[3px] bg-violet-300 dark:bg-violet-600" />
           <div className="w-3 h-3 rounded-[3px] bg-violet-400 dark:bg-violet-400" />
           <div className="w-3 h-3 rounded-[3px] bg-violet-500 dark:bg-violet-500" />
         </div>
         <span>More</span>
      </div>
    </div>
  );
}
