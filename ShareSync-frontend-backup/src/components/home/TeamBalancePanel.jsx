// src/components/home/TeamBalancePanel.jsx
import React, { useState } from "react";
import { Users, AlertTriangle, ArrowRightLeft, CheckCircle2, Loader2 } from "lucide-react";

const INITIAL_TEAM = [
  { id: 1, name: "Manny (You)", ships: 14, load: 71, status: "Critical" },
  { id: 2, name: "Sarah", ships: 3, load: 15, status: "Available" },
  { id: 3, name: "Mike", ships: 2, load: 10, status: "Available" },
  { id: 4, name: "Alex", ships: 1, load: 4, status: "Underutilized" },
];

const BALANCED_TEAM = [
  { id: 1, name: "Manny (You)", ships: 8, load: 35, status: "Optimal" },
  { id: 2, name: "Sarah", ships: 5, load: 25, status: "Optimal" },
  { id: 3, name: "Mike", ships: 4, load: 22, status: "Optimal" },
  { id: 4, name: "Alex", ships: 3, load: 18, status: "Optimal" },
];

export default function TeamBalancePanel({ onBalanceComplete }) {
  const [status, setStatus] = useState("imbalanced"); // 'imbalanced' | 'balancing' | 'balanced'
  const [team, setTeam] = useState(INITIAL_TEAM);

  const handleRebalance = () => {
    setStatus("balancing");
    
    // Simulate system calculating and moving task nodes
    setTimeout(() => {
      setTeam(BALANCED_TEAM);
      setStatus("balanced");
      
      // Signal back to Home.jsx that the system state has changed
      if (onBalanceComplete) {
        onBalanceComplete();
      }
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* 1. Diagnostic Header */}
      {status === "balanced" ? (
        <div className="p-4 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-xl animate-in zoom-in-95 duration-300 shadow-sm">
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-teal-900 dark:text-teal-100 uppercase tracking-tight">System Optimized</h4>
              <p className="text-xs text-teal-700 dark:text-teal-300 mt-1 leading-relaxed font-medium">
                6 tasks reassigned. Your projected burnout risk has dropped by 45%. Team velocity is now synchronized.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl transition-all shadow-sm">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">Workload Imbalance</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed font-medium">
                Your current output is <strong className="font-black">2.3×</strong> higher than the team average. This pace is unsustainable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Team Load Mapping */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex justify-between">
          Active Personnel
          {status === "balancing" && <span className="text-[var(--theme-accent-primary)] animate-pulse">Syncing Nodes...</span>}
        </h5>
        
        {team.map((member) => (
          <div key={member.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-colors duration-500 shadow-sm ${member.load > 50 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500' : 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-500'}`}>
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-zinc-100 tracking-tight">{member.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider transition-all">
                   {status === "balancing" ? "Recalculating..." : `${member.ships} Ships Completed`}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className={`text-sm font-black italic transition-colors duration-500 ${member.load > 50 ? 'text-amber-600 dark:text-amber-500' : 'text-teal-600 dark:text-teal-400'}`}>
                {member.load}%
              </div>
              <div className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Load</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Global Action Button */}
      {status !== "balanced" ? (
        <button 
          onClick={handleRebalance}
          disabled={status === "balancing"}
          className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm
            ${status === "balancing" 
              ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed border border-slate-200 dark:border-white/10" 
              : "bg-[var(--theme-accent-primary)] text-white hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 border border-transparent"}`}
        >
          {status === "balancing" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Rebalancing Network...
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4" />
              Auto-Rebalance Active Tasks
            </>
          )}
        </button>
      ) : (
        <button 
          className="w-full py-3.5 border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-black uppercase tracking-widest rounded-xl cursor-default flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Balance Restored
        </button>
      )}
    </div>
  );
}
