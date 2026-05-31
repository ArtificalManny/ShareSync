import React from 'react';

const MetricCard = ({ title, value, trend, unit, invertTrendColors = false }) => {
  // If invertTrendColors is true (like for Cycle Time), a negative trend is GOOD (green)
  const isPositiveTrend = invertTrendColors ? trend <= 0 : trend >= 0;
  
  // Clean up the trend display (e.g., +12% or -5%)
  const trendDisplay = trend > 0 ? `+${trend}%` : `${trend}%`;
  
  // Neon color classes
  const trendColorClass = isPositiveTrend ? 'text-emerald-400' : 'text-rose-400';
  const trendBgClass = isPositiveTrend ? 'bg-emerald-400/10' : 'bg-rose-400/10';

  return (
    <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 flex flex-col justify-between" style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}>
      <h3 className="text-slate-500 dark:text-zinc-400 text-sm font-medium tracking-wide mb-2">{title}</h3>
      
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-800 dark:text-zinc-100">{value}</span>
          {unit && <span className="text-slate-400 dark:text-zinc-500 text-sm font-medium">{unit}</span>}
        </div>
        
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${trendColorClass} ${trendBgClass}`}>
          {trend > 0 ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          ) : trend < 0 ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
          ) : (
            <span className="px-1">-</span>
          )}
          {trend !== 0 && <span>{Math.abs(trend)}%</span>}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
