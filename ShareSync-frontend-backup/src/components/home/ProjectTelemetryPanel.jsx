// src/components/home/ProjectTelemetryPanel.jsx
import React from "react";
import { Shield, Users, Terminal, Zap } from "lucide-react";

const SQUAD_STATUS = [
  { name: "Sarah", role: "DevOps", status: "Active", task: "Optimizing Auth.js" },
  { name: "Mike", role: "Backend", status: "Idle", task: "Awaiting PR Review" }
];

const MISSION_LOG = [
  { time: "10m ago", user: "Manny", action: "Deployed Node v2.4", type: "success" },
  { time: "45m ago", user: "System", action: "Latency Spike Detected", type: "warning" },
  { time: "2h ago", user: "Sarah", action: "Merged Pull Request #142", type: "neutral" },
];

export default function ProjectTelemetryPanel({ project }) {
  if (!project) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* 1. Project Health Status */}
      <div className={`p-5 rounded-xl border flex items-center justify-between shadow-sm transition-colors ${
        project.health > 80 
          ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20' 
          : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <Shield className={`w-6 h-6 ${project.health > 80 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-500'}`} />
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tight">Node Integrity</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold tracking-wide mt-0.5">
              Status: <span className={project.health > 80 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-500'}>
                {project.health > 80 ? 'Optimal' : 'Needs Review'}
              </span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black italic ${project.health > 80 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-500'}`}>
            {project.health}%
          </div>
        </div>
      </div>

      {/* 2. Squad Pulse */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> Squad Pulse
        </h5>
        <div className="grid grid-cols-1 gap-3">
          {SQUAD_STATUS.map((member, i) => (
            <div key={i} className="p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-zinc-100 tracking-tight">{member.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold mt-0.5 tracking-wider">{member.task}</div>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-slate-100 dark:border-white/5 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-teal-500 animate-pulse' : 'bg-slate-300 dark:bg-zinc-600'}`} />
                <span className="text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-widest">{member.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Mission Log (Audit Trail) */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" /> Mission Log
        </h5>
        <div className="space-y-4 pt-2">
          {MISSION_LOG.map((log, i) => (
            <div key={i} className="flex gap-4 relative pb-4 border-l border-slate-200 dark:border-white/10 ml-2 pl-6 last:border-transparent last:pb-0">
              <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#111113] ${
                log.type === 'success' ? 'bg-teal-500' : log.type === 'warning' ? 'bg-amber-500' : 'bg-slate-400 dark:bg-zinc-600'
              }`} />
              <div className="flex-1 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10 mt-[-8px]">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 tracking-tight">{log.action}</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold tracking-wider">{log.time}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Operator: <span className="font-bold text-slate-700 dark:text-zinc-300">{log.user}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Tactical Action */}
      <button className="w-full py-3.5 bg-gradient-to-r from-[var(--theme-accent-primary)] to-fuchsia-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
        <Zap className="w-4 h-4 fill-white/20" />
        Force Sync Node
      </button>
    </div>
  );
}
