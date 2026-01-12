// src/components/Home/TeamBalancePanel.jsx
import React from "react";
import { Users, AlertTriangle, ArrowRightLeft, UserMinus } from "lucide-react";

const TEAM_MOCK = [
  { id: 1, name: "Manny (You)", ships: 14, load: 71, status: "Critical" },
  { id: 2, name: "Sarah", ships: 3, load: 15, status: "Available" },
  { id: 3, name: "Mike", ships: 2, load: 10, status: "Available" },
  { id: 4, name: "Alex", ships: 1, load: 4, status: "Underutilized" },
];

export default function TeamBalancePanel() {
  return (
    <div className="space-y-8">
      {/* 1. Diagnostic Header */}
      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-orange-500 mt-1" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Workload Imbalance</h4>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Your current output is $2.3\times$ higher than the team average. This pace is unsustainable for a 7-day streak.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Team Load Mapping */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Active Personnel</h5>
        {TEAM_MOCK.map((member) => (
          <div key={member.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${member.load > 50 ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{member.name}</div>
                <div className="text-[9px] text-neutral-500 uppercase font-medium">{member.ships} Ships Completed</div>
              </div>
            </div>

            <div className="text-right">
              <div className={`text-xs font-black italic ${member.load > 50 ? 'text-orange-500' : 'text-emerald-500'}`}>
                {member.load}%
              </div>
              <div className="text-[8px] font-bold text-neutral-600 uppercase">Current Load</div>
            </div>

            {/* Quick Action: Reassign Task */}
            {member.id !== 1 && (
              <button className="hidden group-hover:flex ml-4 p-2 bg-indigo-500/20 text-indigo-400 rounded-md hover:bg-indigo-500 hover:text-white transition-all">
                <ArrowRightLeft className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 3. Global Action */}
      <button className="w-full py-3 bg-white text-black text-[11px] font-black uppercase tracking-tighter rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
        Auto-Rebalance Active Tasks
      </button>
    </div>
  );
}
