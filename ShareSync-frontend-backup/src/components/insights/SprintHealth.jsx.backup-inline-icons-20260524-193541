import React from 'react';

const SprintHealth = ({ completionRate }) => {
  // SVG Donut Math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 flex flex-col items-center justify-center" style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}>
      <h3 className="text-slate-800 dark:text-zinc-100 font-semibold mb-6 self-start">Sprint Health</h3>
      
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Background Track */}
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200 dark:text-zinc-800"
          />
          {/* Neon Progress Arc */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-amber-400 transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800 dark:text-zinc-100">{completionRate}%</span>
          <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium tracking-wide">DONE</span>
        </div>
      </div>
      
      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-6 text-center">
        On track to hit milestone targets.
      </p>
    </div>
  );
};

export default SprintHealth;
