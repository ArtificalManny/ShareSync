// src/components/home/MissionCard.jsx
import React, { useState } from "react";
import { Target, Clock, Zap, ChevronRight, Activity, Loader2, CheckCircle2 } from "lucide-react";
import { useRenovation } from "../../context/RenovationContext";

export default function MissionCard({ project, onClick }) {
  // --- PRESERVED LOGIC ---
  const [status, setStatus] = useState('idle'); // 'idle' | 'deploying' | 'shipped'
  const { styles } = useRenovation();

  const handleDeploy = (e) => {
    e.stopPropagation();
    setStatus('deploying');
    
    // Simulate deployment sequence
    setTimeout(() => {
      setStatus('shipped');
    }, 2000);
  };

  const getHealthColor = (score) => {
    if (score > 80) return "text-emerald-400 border-emerald-500/10";
    if (score > 50) return "text-orange-400 border-orange-500/10";
    return "text-rose-400 border-rose-500/10";
  };
  // --- END LOGIC ---

  return (
    <div 
      onClick={() => onClick(project)}
      className={`group relative overflow-hidden p-6 rounded-3xl transition-all duration-300 cursor-pointer
        ${status === 'shipped' ? 'bg-white/[0.01] opacity-50' : 'bg-white/[0.02] hover:bg-white/[0.04]'}
        border border-white/5 hover:border-white/10 hover:translate-x-1`}
    >
      {/* Subtle background activity icon (MetaLab Depth) */}
      <div className="absolute -right-2 -bottom-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
        <Activity className="w-24 h-24 text-white" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="flex items-center gap-6">
          {/* Status Icon Hardware */}
          <div className={`w-14 h-14 rounded-2xl bg-[#0B0C0E] border flex items-center justify-center transition-all duration-500
            ${status === 'shipped' ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/5 group-hover:border-violet-500/50'}`}>
            {status === 'shipped' ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            ) : (
              <Target className="w-7 h-7 text-slate-600 group-hover:text-violet-400 transition-colors" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-base font-black text-white tracking-tighter uppercase">
                {project.title}
              </h4>
              <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border ${getHealthColor(project.health)}`}>
                {project.health}% Health
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5 text-violet-500" /> {project.eta}
              </span>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {project.category}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          {/* Velocity Metric */}
          <div className="hidden sm:block text-right">
            <div className="text-sm font-black text-white italic tracking-tighter">{project.velocity}%</div>
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Velocity</div>
          </div>

          {/* Action Button - MetaLab "Glow" style */}
          <button 
            onClick={handleDeploy}
            disabled={status !== 'idle'}
            className={`relative min-w-[140px] px-6 py-3 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest overflow-hidden
              ${status === 'idle' ? 'bg-violet-600 text-white hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 
                status === 'deploying' ? 'bg-slate-800 text-slate-500 cursor-wait' : 
                'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}
            `}
          >
            {status === 'idle' && (
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-3 h-3 fill-current" /> Rapid Deploy
              </span>
            )}
            {status === 'deploying' && (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Deploying
              </span>
            )}
            {status === 'shipped' && "Success"}
          </button>
          
          <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-white transition-all group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}
