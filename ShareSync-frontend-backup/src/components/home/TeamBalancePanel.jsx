// src/components/Home/TeamBalancePanel.jsx
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
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in zoom-in-95 duration-300">
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1" />
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">System Optimized</h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                6 tasks reassigned. Your projected burnout risk has dropped by 45%. Team velocity is now synchronized.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl transition-all">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">Workload Imbalance</h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Your current output is $2.3\times$ higher than the team average. This pace is unsustainable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Team Load Mapping */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex justify-between">
          Active Personnel
          {status === "balancing" && <span className="text-indigo-400 animate-pulse">Syncing Nodes...</span>}
        </h5>
        
        {team.map((member) => (
          <div key={member.id} className="group flex items-center justify-between p-3 rounded-lg bg-white/[0.01] border border-white/5 transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-500 ${member.load > 50 ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight">{member.name}</div>
                <div className="text-[9px] text-neutral-500 uppercase font-medium transition-all">
                   {status === "balancing" ? "Recalculating..." : `${member.ships} Ships Completed`}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className={`text-xs font-black italic transition-colors duration-500 ${member.load > 50 ? 'text-orange-500' : 'text-emerald-500'}`}>
                {member.load}%
              </div>
              <div className="text-[8px] font-bold text-neutral-600 uppercase">Load</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Global Action Button */}
      {status !== "balanced" ? (
        <button 
          onClick={handleRebalance}
          disabled={status === "balancing"}
          className={`w-full py-4 rounded-lg text-[11px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 
            ${status === "balancing" 
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
              : "bg-white text-black hover:bg-brand-500 hover:text-white active:scale-95"}`}
        >
          {status === "balancing" ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Rebalancing Network...
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-3 h-3" />
              Auto-Rebalance Active Tasks
            </>
          )}
        </button>
      ) : (
        <button 
          className="w-full py-4 border border-white/10 text-white text-[11px] font-black uppercase tracking-tighter rounded-lg cursor-default flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Balance Restored
        </button>
      )}
    </div>
  );
}
