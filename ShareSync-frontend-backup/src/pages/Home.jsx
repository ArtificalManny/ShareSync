// src/pages/Home.jsx - MISSION CONTROL (METAlab BENTO EDITION)
import React, { useState } from "react";
import { 
  Zap, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  ChevronRight,
  Info,
  X,
  CheckCircle2,
  TrendingUp,
  Activity
} from "lucide-react";
import TeamBalancePanel from "../components/home/TeamBalancePanel";
import ProjectTelemetryPanel from "../components/home/ProjectTelemetryPanel";
import LivePulse from "../components/home/LivePulse";
import MissionCard from "../components/home/MissionCard";

const MOCK_MISSIONS = [
  { id: 1, title: "Integrate Telemetry Engine", category: "Core Sync", eta: "2h", health: 92, velocity: 88 },
  { id: 2, title: "Refactor Auth Protocol", category: "Security", eta: "4h", health: 65, velocity: 74 },
  { id: 3, title: "Cloud Node Expansion", category: "Infrastructure", eta: "1h", health: 42, velocity: 51 },
];

const VelocityStat = ({ label, value, color, detail }) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div 
      className="relative group p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all cursor-help"
      onMouseEnter={() => setShowDetail(true)}
      onMouseLeave={() => setShowDetail(false)}
    >
      <div className={`text-2xl font-black tracking-tight ${color}`}>{value}</div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
        {label}
      </div>

      {showDetail && (
        <div className="absolute bottom-full mb-4 left-0 w-56 p-4 bg-[#1C1E24] border border-white/10 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{detail}</p>
          <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color.replace('text', 'bg')}`} style={{ width: '75%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState("balance");
  const [selectedMission, setSelectedMission] = useState(null);
  const [isBalanced, setIsBalanced] = useState(false);

  return (
    <div className="min-h-screen bg-transparent p-8 lg:p-12 max-w-[1600px] mx-auto">
      {/* 🚀 HEADER: Clean & Spatial */}
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Operational Status: Live</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-metalab">
            Mission Control
          </h1>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Global Rank</p>
          <p className="text-xl font-black text-white italic">Top 2%</p>
        </div>
      </header>

      {/* 🍱 BENTO GRID SYSTEM */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* LARGE BENTO: Recommended Missions */}
        <div className="col-span-12 lg:col-span-8 bento-elevated p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-500" /> Recommended For Today
            </h2>
            <button className="text-[11px] font-bold text-violet-400 hover:text-white transition-colors">View All Missions</button>
          </div>
          
          <div className="grid gap-4">
            {MOCK_MISSIONS.map((mission) => (
              <MissionCard key={mission.id} project={mission} onClick={() => { setSelectedMission(mission); setPanelContent("telemetry"); setIsPanelOpen(true); }} />
            ))}
          </div>
        </div>

        {/* MEDIUM BENTO: System Intelligence */}
        <div className="col-span-12 lg:col-span-4 bento-elevated p-8">
          <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Intelligence
          </h2>
          
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all cursor-pointer" onClick={() => { setPanelContent("balance"); setIsPanelOpen(true); }}>
               <div className="flex justify-between items-start mb-4">
                 <div className={`p-2 rounded-xl ${isBalanced ? 'bg-emerald-500/10' : 'bg-orange-500/10'}`}>
                    {isBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-orange-500" />}
                 </div>
                 <ChevronRight className="w-4 h-4 text-slate-600" />
               </div>
               <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">
                 {isBalanced ? "Load Balanced" : "High Workload"}
               </h3>
               <p className="text-xs text-slate-500 leading-relaxed">
                 {isBalanced ? "Optimized across all nodes." : "You are doing 71% of ships. Rebalance suggested."}
               </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex justify-between text-[11px] mb-3">
                <span className="text-slate-500 font-bold uppercase tracking-widest">Peak Window</span>
                <span className="text-emerald-400 font-black">2PM — 4PM</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500/40 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* SMALL BENTO: Velocity Stats */}
        <div className="col-span-12 bento-elevated p-8">
          <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Velocity Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <VelocityStat label="Ships" value="14" color="text-violet-500" detail="Total validated deployments in the last 7 days." />
            <VelocityStat label="Streak" value="7D" color="text-orange-500" detail="Active days since last mission failure or skip." />
            <VelocityStat label="Focus" value="88%" color="text-emerald-500" detail="Deep work percentage vs. distraction-based tasks." />
            <VelocityStat label="Efficiency" value="+12%" color="text-indigo-400" detail="Performance increase compared to previous cycle." />
          </div>
        </div>
      </div>

      {/* 🌫️ SLIDE-OUT: Refined Overlay */}
      <div className={`fixed inset-0 bg-[#0B0C0E]/80 backdrop-blur-md z-[60] transition-opacity duration-500 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsPanelOpen(false)} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-[480px] bg-[#141519] border-l border-white/10 z-[70] transition-transform duration-500 ease-out p-12 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-12">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">{panelContent === "balance" ? "Team Balance" : "Mission Telemetry"}</h3>
          <button onClick={() => setIsPanelOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-all">
            <X className="w-5 h-5 text-slate-500 hover:text-white" />
          </button>
        </div>
        {panelContent === "balance" ? ( <TeamBalancePanel onBalanceComplete={() => setIsBalanced(true)} /> ) : ( <ProjectTelemetryPanel project={selectedMission} /> )}
      </div>
    </div>
  );
}
