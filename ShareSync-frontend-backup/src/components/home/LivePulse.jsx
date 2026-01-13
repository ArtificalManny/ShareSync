import React from "react";
import { Activity, Zap } from "lucide-react";

const ACTIVE_USERS = [
  { id: 2, name: "Sarah", task: "Refactoring Auth.js", project: "OpenShare", color: "bg-purple-500" },
  { id: 3, name: "Mike", task: "Testing API Nodes", project: "AI Engine", color: "bg-blue-500" }
];

export default function LivePulse() {
  return (
    <section className="animate-in fade-in duration-700">
      <h2 className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
        Live Pulse
        <span className="flex items-center gap-1.5 text-[9px] text-emerald-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          2 Nodes Active
        </span>
      </h2>

      <div className="space-y-3">
        {ACTIVE_USERS.map((user) => (
          <div key={user.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center gap-3">
              <div className={`w-1 h-6 rounded-full ${user.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[11px] font-bold text-white uppercase tracking-tight">{user.name}</span>
                  <span className="text-[9px] font-black text-neutral-600 uppercase tracking-tighter">{user.project}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-neutral-500" />
                  <span className="text-[10px] text-neutral-400 font-medium truncate max-w-[150px]">
                    {user.task}
                  </span>
                </div>
              </div>
              <Zap className="w-3 h-3 text-neutral-700 group-hover:text-yellow-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
