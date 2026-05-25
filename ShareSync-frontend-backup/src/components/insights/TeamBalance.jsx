import React from 'react';

const TeamBalanceHeader = ({ icon: Icon, title }) => (
  <div className="mb-4 flex items-center gap-2">
    {Icon && (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/80 bg-cyan-500/10 text-cyan-600 dark:border-cyan-400/20 dark:bg-cyan-500/15 dark:text-cyan-300">
        <Icon className="h-4 w-4" strokeWidth={2.15} />
      </div>
    )}

    <h3 className="text-slate-800 dark:text-zinc-100 font-semibold">
      {title}
    </h3>
  </div>
);

const TeamBalance = ({ teamData, icon: Icon }) => {
  if (!teamData || teamData.length === 0) {
    return (
      <div
        className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-6"
        style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
      >
        <TeamBalanceHeader icon={Icon} title="Team Balance" />
        <p className="text-slate-500 dark:text-zinc-500 text-sm">Not enough task data to calculate workload.</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-6"
      style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
    >
      <TeamBalanceHeader icon={Icon} title="Team Workload Balance" />

      <div className="space-y-5">
        {teamData.map((member) => {
          // Dynamic neon coloring based on workload strain
          let barColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
          let textColor = 'text-emerald-400';

          if (member.workloadPercentage > 110) {
            barColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
            textColor = 'text-rose-400';
          } else if (member.workloadPercentage > 85) {
            barColor = 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
            textColor = 'text-amber-400';
          }

          return (
            <div key={member.userId} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-zinc-200 font-medium">{member.name}</span>
                <span className={`font-bold ${textColor}`}>
                  {member.workloadPercentage}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                  style={{ width: `${Math.min(member.workloadPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 dark:text-zinc-500">{member.taskCount} active tasks</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamBalance;
