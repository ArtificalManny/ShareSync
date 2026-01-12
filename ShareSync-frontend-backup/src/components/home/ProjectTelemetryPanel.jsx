// src/components/home/ProjectTelemetryPanel.jsx
import React from "react";
import { Activity, Shield, Users, Terminal, Zap, AlertCircle } from "lucide-react";

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
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        project.health > 80 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <Shield className={`w-5 h-5 ${project.health > 80 ? 'text-emerald-500' : 'text-orange-500'}`} />
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-tight">Node Integrity</h4>
            <p className="text-[10px] text-neutral-400 font-medium">Status: {project.health > 80 ? 'Optimal' : 'Needs Review'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-black italic ${project.health > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>
            {project.health}%
          </div>
        </div>
      </div>

      {/* 2. Squad Pulse */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
          <Users className="w-3 h-3" /> Squad Pulse
        </h5>
        <div className="grid grid-cols-1 gap-2">
          {SQUAD_STATUS.map((member, i) => (
            <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white tracking-tight">{member.name}</div>
                <div className="text-[9px] text-neutral-500 uppercase font-medium">{member.task}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
                <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-tighter">{member.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Mission Log (Audit Trail) */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
          <Terminal className="w-3 h-3" /> Mission Log
        </h5>
        <div className="space-y-3">
          {MISSION_LOG.map((log, i) => (
            <div key={i} className="flex gap-3 relative pb-3 border-l border-white/5 ml-1.5 pl-4 last:pb-0">
              <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full border-2 border-[#0A0A0A] ${
                log.type === 'success' ? 'bg-emerald-500' : log.type === 'warning' ? 'bg-orange-500' : 'bg-neutral-600'
              }`} />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="text-[11px] font-bold text-white tracking-tight">{log.action}</span>
                  <span className="text-[9px] text-neutral-600 font-bold">{log.time}</span>
                </div>
                <div className="text-[10px] text-neutral-500 font-medium">Operator: {log.user}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Tactical Action */}
      <button className="w-full py-4 bg-brand-500 text-white rounded-lg text-[11px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 hover:bg-brand-400 active:scale-95 transition-all">
        <Zap className="w-3 h-3 fill-current" />
        Force Sync Node
      </button>
    </div>
  );
}
