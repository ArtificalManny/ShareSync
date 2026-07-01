import React from 'react';

const ICON_TONE_CLASSES = {
  violet:
    'border-violet-200/80 bg-violet-500/10 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/15 dark:text-violet-300',
  blue:
    'border-blue-200/80 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-300',
  emerald:
    'border-emerald-200/80 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-300',
  cyan:
    'border-cyan-200/80 bg-cyan-500/10 text-cyan-600 dark:border-cyan-400/20 dark:bg-cyan-500/15 dark:text-cyan-300',
  amber:
    'border-amber-200/80 bg-amber-500/10 text-amber-600 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-300',
};

const MetricCard = ({
  title,
  icon: Icon,
  iconTone = 'violet',
  value,
  trend,
  unit,
  invertTrendColors = false,
}) => {
  const numericTrend = Number(trend);
  const hasTrend = trend !== null && trend !== undefined && Number.isFinite(numericTrend);

  // If invertTrendColors is true, a negative trend is GOOD.
  const isPositiveTrend = invertTrendColors ? numericTrend <= 0 : numericTrend >= 0;

  const trendColorClass = isPositiveTrend ? 'text-emerald-400' : 'text-rose-400';
  const trendBgClass = isPositiveTrend ? 'bg-emerald-400/10' : 'bg-rose-400/10';
  const iconToneClass = ICON_TONE_CLASSES[iconTone] || ICON_TONE_CLASSES.violet;

  return (
    <div
      className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 flex flex-col justify-between"
      style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
    >
      <div className="mb-3 flex items-center gap-2">
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${iconToneClass}`}>
            <Icon className="h-4 w-4" strokeWidth={2.15} />
          </div>
        )}

        <h3 className="text-slate-500 dark:text-zinc-400 text-sm font-semibold tracking-wide">
          {title}
        </h3>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-800 dark:text-zinc-100">{value}</span>
          {unit && <span className="text-slate-400 dark:text-zinc-500 text-sm font-medium">{unit}</span>}
        </div>

        {hasTrend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${trendColorClass} ${trendBgClass}`}>
            {numericTrend > 0 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            ) : numericTrend < 0 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            ) : (
              <span className="px-1">-</span>
            )}
            {numericTrend !== 0 && <span>{Math.abs(numericTrend)}%</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
