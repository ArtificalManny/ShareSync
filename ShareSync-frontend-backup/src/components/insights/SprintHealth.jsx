import React from 'react';

const SprintHealth = ({ completionRate }) => {
  // SVG Donut Math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 flex flex-col items-center justify-center">
      <h3 className="text-zinc-100 font-semibold mb-6 self-start">Sprint Health</h3>
      
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
            className="text-zinc-800"
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
          <span className="text-2xl font-bold text-zinc-100">{completionRate}%</span>
          <span className="text-xs text-zinc-500 font-medium tracking-wide">DONE</span>
        </div>
      </div>
      
      <p className="text-zinc-400 text-sm mt-6 text-center">
        On track to hit milestone targets.
      </p>
    </div>
  );
};

export default SprintHealth;
