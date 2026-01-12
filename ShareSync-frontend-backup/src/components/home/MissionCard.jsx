// src/components/home/MissionCard.jsx
import React from "react";
import { Target, Clock, Zap, ChevronRight, Activity } from "lucide-react";

export default function MissionCard({ project, onClick }) {
  // Determine color based on health score (0-100)
  const getHealthColor = (score) => {
    if (score > 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score > 50) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div 
      onClick={() => onClick(project)}
      className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 p-5 rounded-2xl transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Subtle Background Activity Pulse */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        <Activity className="w-12 h-12 text-brand-500" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Icon Terminal */}
          <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center group-hover:border-brand-500/50 transition-colors">
            <Target className="w-6 h-6 text-neutral-500 group-hover:text-brand-500 transition-colors" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-black text-white uppercase tracking-tight">{project.title}</h4>
              <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border ${getHealthColor(project.health)}`}>
                Health: {project.health}%
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-500 uppercase">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-brand-500" /> {project.eta} Est</span>
              <span className="text-white/10">•</span>
              <span className="tracking-widest">{project.category}</span>
            </div>
          </div>
        </div>

        {/* Tactical Stats & Rapid Deploy */}
        <div className="flex items-center gap-8 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
          <div className="text-right">
            <div className="text-xs font-black text-white italic">{project.velocity}%</div>
            <div className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">On-Time Velocity</div>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              alert(`Rapid Deploy: ${project.title} sequence initiated.`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400 transition-all active:scale-95 shadow-lg shadow-brand-500/20"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Rapid Deploy</span>
          </button>
          
          <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-white transition-all group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}
