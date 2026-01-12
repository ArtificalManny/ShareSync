// src/pages/Home.jsx - MISSION CONTROL REFACTOR
import React, { useState } from "react";
import { 
  Zap, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  ChevronRight,
  Info,
  X,
  CheckCircle2
} from "lucide-react";
import TeamBalancePanel from "../components/home/TeamBalancePanel";
import ProjectTelemetryPanel from "../components/home/ProjectTelemetryPanel";
import LivePulse from "../components/home/LivePulse";
import MissionCard from "../components/home/MissionCard";

/* ─────────────────────────────────────────────────────────────────────────
   DATA LAYER: MOCK MISSIONS
───────────────────────────────────────────────────────────────────────── */
const MOCK_MISSIONS = [
  { id: 1, title: "Integrate Telemetry Engine", category: "Core Sync", eta: "2h", health: 92, velocity: 88 },
  { id: 2, title: "Refactor Auth Protocol", category: "Security", eta: "4h", health: 65, velocity: 74 },
  { id: 3, title: "Cloud Node Expansion", category: "Infrastructure", eta: "1h", health: 42, velocity: 51 },
];

/* ─────────────────────────────────────────────────────────────────────────
   INTELLIGENCE LAYER: VELOCITY STAT
───────────────────────────────────────────────────────────────────────── */
const VelocityStat = ({ label, value, color, detail }) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div 
      className="relative group cursor-help"
      onMouseEnter={() => setShowDetail(true)}
      onMouseLeave={() => setShowDetail(false)}
    >
      <div className={`text-2xl font-black italic ${color}`}>{value}</div>
      <div className="text-[9px] font-bold text-neutral-500 uppercase flex items-center gap-1">
        {label} <Info className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {showDetail && (
        <div className="absolute bottom-full mb-4 left-0 w-48 p-3 bg-neutral-900 border border-white/10 rounded-lg shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">{detail}</p>
          <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color.replace('text', 'bg')}`} style={{ width: '70%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: SLIM ALERT BANNER
───────────────────────────────────────────────────────────────────────── */
const SlimProjectAlert = ({ count = 3 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`mb-6 transition-all duration-300 overflow-hidden border ${isExpanded ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/[0.02] border-white/5'} rounded-xl px-4 py-3`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">
            {count} Quiet Projects Need Attention
          </span>
        </div>
        <button className="text-neutral-500 hover:text-white transition-colors">
          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
          <p className="text-xs text-neutral-400">These missions haven't seen activity in 48 hours. Reactivate now to maintain momentum.</p>
          <button className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1 hover:text-indigo-300">
            View Project Deck <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   ACTION PANEL: SLIDE-OUT OVERLAY
───────────────────────────────────────────────────────────────────────── */
const ActionPanel = ({ isOpen, onClose, title, children }) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in" onClick={onClose} />
      )}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-[#0A0A0A] border-l border-white/10 z-[70] transition-transform duration-500 ease-out p-8 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
};

export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState("balance"); // 'balance' | 'telemetry'
  const [selectedMission, setSelectedMission] = useState(null);
  const [isBalanced, setIsBalanced] = useState(false);

  const openBalancePanel = () => {
    setSelectedMission(null);
    setPanelContent("balance");
    setIsPanelOpen(true);
  };

  const openTelemetryPanel = (project) => {
    setSelectedMission(project);
    setPanelContent("telemetry");
    setIsPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-transparent p-6 lg:p-10">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-[2px] bg-brand-500" />
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em]">System Live</span>
        </div>
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
          Mission Control
        </h1>
      </header>

      <SlimProjectAlert />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Primary Column: Mission Board */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3 text-brand-500" /> 
              Recommended for Today
            </h2>
            
            <div className="space-y-4">
              {MOCK_MISSIONS.map((mission) => (
                <MissionCard 
                  key={mission.id} 
                  project={mission} 
                  onClick={openTelemetryPanel} 
                />
              ))}
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-gradient-to-br from-brand-500/10 to-transparent border border-brand-500/20">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-4">Current Velocity</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <VelocityStat label="Ships" value="14" color="text-brand-500" detail="Total validated deployments in the last 7 days." />
              <VelocityStat label="Streak" value="7D" color="text-orange-500" detail="Active days since last mission failure or skip." />
              <VelocityStat label="Focus" value="88%" color="text-emerald-500" detail="Deep work percentage vs. distraction-based tasks." />
              <VelocityStat label="Rank" value="Top 2%" color="text-indigo-400" detail="Global standing among 247k+ active operators." />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section>
             <h2 className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">System Alerts</h2>
             
             {isBalanced ? (
               <div 
                 onClick={openBalancePanel}
                 className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl cursor-pointer hover:bg-emerald-500/10 transition-all group animate-in zoom-in-95"
               >
                 <div className="flex items-start gap-3">
                   <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                   <div>
                     <p className="text-xs font-bold text-white uppercase tracking-tight">Load Balanced</p>
                     <p className="text-[10px] text-neutral-400 leading-relaxed">
                       Tasks redistributed across active nodes. Performance optimized.
                     </p>
                   </div>
                 </div>
               </div>
             ) : (
               <div 
                 onClick={openBalancePanel}
                 className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl cursor-pointer hover:border-orange-500/40 hover:bg-orange-500/10 transition-all group"
               >
                 <div className="flex items-start gap-3">
                   <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                   <div>
                     <div className="flex items-center justify-between mb-1">
                       <p className="text-xs font-bold text-white uppercase tracking-tight">High Workload Detected</p>
                       <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-white transition-transform group-hover:translate-x-1" />
                     </div>
                     <p className="text-[10px] text-neutral-400 leading-relaxed">
                       You are doing 71% of ships. Click to rebalance.
                     </p>
                   </div>
                 </div>
               </div>
             )}
          </section>

          <section>
             <h2 className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Peak Windows</h2>
             <div className="space-y-2 mb-8">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400 font-medium italic">Your Prime Time</span>
                  <span className="text-emerald-500 font-black uppercase tracking-tighter">2:00 PM — 4:00 PM</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/50" style={{ width: '65%' }} />
                </div>
             </div>
             <LivePulse />
          </section>
        </div>
      </div>

      {/* The Dynamic Action Panel */}
      <ActionPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        title={panelContent === "balance" ? "Diagnostic: Team Balance" : selectedMission?.title || "Mission Telemetry"}
      >
        {panelContent === "balance" ? (
          <TeamBalancePanel onBalanceComplete={() => setIsBalanced(true)} />
        ) : (
          <ProjectTelemetryPanel project={selectedMission} />
        )}
      </ActionPanel>
    </div>
  );
}
