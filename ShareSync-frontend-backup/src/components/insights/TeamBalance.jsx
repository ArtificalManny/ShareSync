import React from 'react';

const TeamBalance = ({ teamData }) => {
  if (!teamData || teamData.length === 0) {
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h3 className="text-zinc-100 font-semibold mb-4">Team Balance</h3>
        <p className="text-zinc-500 text-sm">Not enough task data to calculate workload.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
      <h3 className="text-zinc-100 font-semibold mb-6">Team Workload Balance</h3>
      
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
                <span className="text-zinc-200 font-medium">{member.name}</span>
                <span className={`font-bold ${textColor}`}>
                  {member.workloadPercentage}%
                </span>
              </div>
              
              {/* Progress Bar Track */}
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                  style={{ width: `${Math.min(member.workloadPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">{member.taskCount} active tasks</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamBalance;
