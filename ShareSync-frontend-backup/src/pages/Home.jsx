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

// FIXED IMPORT PATH AND CASING
import { useRenovation } from "../context/RenovationContext";
import Card from "../components/ui/Card";

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
  const { styles } = useRenovation(); // Accessing MetaLab typography

  return (
    <div 
      className="relative group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all cursor-help"
      onMouseEnter={() => setShowDetail(true)}
      onMouseLeave={() => setShowDetail(false)}
    >
      <div className={`text-3xl font-black tracking-tighter ${color}`}>{value}</div>
      <div className={`${styles.label || 'text-[10px] font-bold text-slate-500 uppercase tracking-widest'} mt-2`}>
        {label}
      </div>

      {showDetail && (
        <div className="absolute bottom-full mb-4 left-0 w-64 p-5 bg-[#0F1115] border border-white/10 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
          <p className="text-[12px] text-slate-300 leading-relaxed font-medium">{detail}</p>
          <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color.replace('text', 'bg')}`} style={{ width: '75%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  // BACKEND/STATE LOGIC PRESERVED
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState("balance");
  const [selectedMission, setSelectedMission] = useState(null);
  const [isBalanced, setIsBalanced] = useState(false);
  
  const { styles } = useRenovation();

  return (
    <div className="min-h-screen bg-transparent p-8 lg:p-16 max-w-[1700px] mx-auto">
      {/* 🚀 HEADER: MetaLab Hierarchy */}
      <header className="mb-16 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
            <span className={styles.label || "text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]"}>
              Operational Status: Live
            </span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter">
            Mission <span className="text-slate-500">Control</span>
          </h1>
        </div>
        <div className="hidden md:block text-right">
          <p className={styles.label || "text-[11px] font-bold text-slate-500 uppercase tracking-widest"}>Global Rank</p>
          <p className="text-2xl font-black text-white italic tracking-tighter">Top 2%</p>
        </div>
      </header>

      {/* 🍱 BENTO GRID SYSTEM: 10-column spacing */}
      <div className="grid grid-cols-12 gap-10">
        
        {/* LARGE BENTO: Recommended Missions */}
        <Card className="col-span-12 lg:col-span-8 p-10" glowColor="rgba(139, 92, 246, 0.15)">
          <div className="flex justify-between items-center mb-10">
            <h2 className={styles.label || "text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"}>
              <Zap className="w-4 h-4 text-violet-500" /> Recommended For Today
            </h2>
            <button className="text-[11px] font-bold text-violet-400 hover:text-white transition-colors uppercase tracking-widest">
              View All
            </button>
          </div>
          
          <div className="grid gap-5">
            {MOCK_MISSIONS.map((mission) => (
              <MissionCard 
                key={mission.id} 
                project={mission} 
                onClick={() => { 
                  setSelectedMission(mission); 
                  setPanelContent("telemetry"); 
                  setIsPanelOpen(true); 
                }} 
              />
            ))}
          </div>
        </Card>

        {/* MEDIUM BENTO: System Intelligence */}
        <Card className="col-span-12 lg:col-span-4 p-10" glowColor="rgba(16, 185, 129, 0.1)">
          <h2 className={styles.label || "text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"}>
            <Activity className="w-4 h-4 text-emerald-500" /> Intelligence
          </h2>
          
          <div className="space-y-8">
            <div 
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all cursor-pointer group" 
              onClick={() => { setPanelContent("balance"); setIsPanelOpen(true); }}
            >
               <div className="flex justify-between items-start mb-6">
                 <div className={`p-3 rounded-2xl ${isBalanced ? 'bg-emerald-500/10' : 'bg-orange-500/10'}`}>
                    {isBalanced ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <AlertCircle className="w-6 h-6 text-orange-500" />}
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" />
               </div>
               <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                 {isBalanced ? "Load Balanced" : "High Workload"}
               </h3>
               <p className="text-sm text-slate-500 leading-relaxed font-medium">
                 {isBalanced ? "Optimized across all nodes." : "You are doing 71% of ships. Rebalance suggested."}
               </p>
            </div>

            <div className="px-2">
              <div className="flex justify-between text-[11px] mb-4">
                <span className="text-slate-500 font-bold uppercase tracking-widest">Peak Window</span>
                <span className="text-emerald-400 font-black">2PM — 4PM</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500/60 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* SMALL BENTO: Velocity Stats */}
        <Card className="col-span-12 p-10">
          <h2 className={styles.label || "text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"}>
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Velocity Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <VelocityStat label="Ships" value="14" color="text-violet-500" detail="Total validated deployments in the last 7 days." />
            <VelocityStat label="Streak" value="7D" color="text-orange-500" detail="Active days since last mission failure or skip." />
            <VelocityStat label="Focus" value="88%" color="text-emerald-500" detail="Deep work percentage vs. distraction-based tasks." />
            <VelocityStat label="Efficiency" value="+12%" color="text-indigo-400" detail="Performance increase compared to previous cycle." />
          </div>
        </Card>
      </div>

      {/* 🌫️ SLIDE-OUT: PRESERVED LOGIC */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-xl z-[60] transition-opacity duration-700 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsPanelOpen(false)} 
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-[500px] bg-[#0F1115] border-l border-white/5 z-[70] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) p-16 ${isPanelOpen ? 'translate-x-0 shadow-[-50px_0_100px_rgba(0,0,0,0.5)]' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-16">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
            {panelContent === "balance" ? "Team Balance" : "Mission Telemetry"}
          </h3>
          <button onClick={() => setIsPanelOpen(false)} className="p-4 hover:bg-white/5 rounded-full transition-all group">
            <X className="w-6 h-6 text-slate-600 group-hover:text-white" />
          </button>
        </div>
        {panelContent === "balance" ? ( 
          <TeamBalancePanel onBalanceComplete={() => setIsBalanced(true)} /> 
        ) : ( 
          <ProjectTelemetryPanel project={selectedMission} /> 
        )}
      </div>
    </div>
  );
}
