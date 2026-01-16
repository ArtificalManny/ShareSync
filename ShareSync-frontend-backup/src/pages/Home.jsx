// src/pages/Home.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Quiet Confidence"
// ═══════════════════════════════════════════════════════════════════════════════
// RULES APPLIED:
// 1. Surface hierarchy: surface-0/1/2 tokens
// 2. Text hierarchy: text-primary/secondary/tertiary
// 3. Calmer typography - no screaming font-black everywhere
// 4. No pulsing/glowing status indicators at rest
// 5. Cards use consistent surface tokens
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  ChevronRight,
  X,
  CheckCircle2,
  TrendingUp,
  Activity
} from "lucide-react";

import { useRenovation } from "../context/RenovationContext";
import TeamBalancePanel from "../components/home/TeamBalancePanel";
import ProjectTelemetryPanel from "../components/home/ProjectTelemetryPanel";
import MissionCard from "../components/home/MissionCard";
import MissionCardSkeleton from "../components/home/MissionCardSkeleton";

const MOCK_MISSIONS = [
  { id: 1, title: "Integrate Telemetry Engine", category: "Core Sync", eta: "2h", health: 92, velocity: 88 },
  { id: 2, title: "Refactor Auth Protocol", category: "Security", eta: "4h", health: 65, velocity: 74 },
  { id: 3, title: "Cloud Node Expansion", category: "Infrastructure", eta: "1h", health: 42, velocity: 51 },
];

/* ─────────────────────────────────────────────────────────────────────────
   STAT CARD - Clean metric display
───────────────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, color = "text-brand", description }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="
        relative p-5 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200 cursor-default
      "
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`text-2xl font-semibold ${color}`}>
        {value}
      </div>
      <div className="text-xs text-text-tertiary mt-1">
        {label}
      </div>

      {/* Tooltip */}
      {showTooltip && description && (
        <div className="
          absolute bottom-full mb-2 left-0 w-56
          p-3 bg-surface-2 border border-white/[0.08] rounded-lg
          shadow-xl z-50
          animate-in fade-in slide-in-from-bottom-2 duration-200
        ">
          <p className="text-xs text-text-secondary leading-relaxed">
            {description}
          </p>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   INSIGHT CARD - Clickable insight panel
───────────────────────────────────────────────────────────────────────── */
const InsightCard = ({ icon: Icon, iconColor, title, description, onClick, variant = "default" }) => {
  const variants = {
    default: "bg-surface-2",
    success: "bg-success/10",
    warning: "bg-warning/10",
  };

  return (
    <div 
      className="
        p-5 rounded-xl cursor-pointer group
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
      " 
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-lg ${variants[variant]}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="text-base font-medium text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-text-secondary">
        {description}
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, iconColor = "text-brand", title, action }) => (
  <div className="flex justify-between items-center mb-6">
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <h2 className="text-sm font-medium text-text-secondary">
        {title}
      </h2>
    </div>
    {action && (
      <button className="text-xs text-text-tertiary hover:text-brand transition-colors">
        {action}
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   MAIN HOME PAGE
───────────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState("balance");
  const [selectedMission, setSelectedMission] = useState(null);
  const [isBalanced, setIsBalanced] = useState(false);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    const loadMissions = async () => {
      setMissionsLoading(true);
      // TODO: Replace with real API call
      setTimeout(() => {
        setMissions(MOCK_MISSIONS);
        setMissionsLoading(false);
      }, 1500);
    };
    loadMissions();
  }, []);

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto">
      
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          {/* Status indicator - subtle, not pulsing */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-text-tertiary">
              Operational Status: Live
            </span>
          </div>
          
          {/* Title - calmer, professional */}
          <h1 className="text-4xl font-semibold text-text-primary">
            Mission <span className="text-text-tertiary">Control</span>
          </h1>
        </div>
        
        {/* Rank - right aligned */}
        <div className="hidden md:block text-right">
          <p className="text-xs text-text-tertiary mb-1">Global Rank</p>
          <p className="text-xl font-semibold text-text-primary">Top 2%</p>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* ─────────────────────────────────────────────────────────────────
            MISSIONS SECTION (8 columns)
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8">
          <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
            <SectionHeader 
              icon={Zap} 
              title="Recommended for Today" 
              action="View All"
            />
            
            <div className="space-y-3">
              {missionsLoading ? (
                <MissionCardSkeleton count={3} />
              ) : (
                missions.map((mission) => (
                  <MissionCard 
                    key={mission.id} 
                    project={mission} 
                    onClick={() => { 
                      setSelectedMission(mission); 
                      setPanelContent("telemetry"); 
                      setIsPanelOpen(true); 
                    }} 
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            INTELLIGENCE SECTION (4 columns)
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4">
          <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
            <SectionHeader 
              icon={Activity} 
              iconColor="text-success"
              title="Intelligence" 
            />
            
            <div className="space-y-4">
              {/* Workload Balance Card */}
              <InsightCard
                icon={isBalanced ? CheckCircle2 : AlertCircle}
                iconColor={isBalanced ? "text-success" : "text-warning"}
                variant={isBalanced ? "success" : "warning"}
                title={isBalanced ? "Load Balanced" : "High Workload"}
                description={isBalanced 
                  ? "Optimized across all nodes." 
                  : "You're doing 71% of ships. Rebalance suggested."
                }
                onClick={() => { 
                  setPanelContent("balance"); 
                  setIsPanelOpen(true); 
                }}
              />

              {/* Peak Window */}
              <div className="p-4 rounded-xl bg-surface-2">
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-text-tertiary">Peak Window</span>
                  <span className="text-success font-medium">2PM — 4PM</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full" 
                    style={{ width: '65%' }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            VELOCITY METRICS (full width)
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12">
          <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
            <SectionHeader 
              icon={TrendingUp} 
              iconColor="text-brand"
              title="Velocity Metrics" 
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="Ships" 
                value="14" 
                color="text-brand" 
                description="Total validated deployments in the last 7 days."
              />
              <StatCard 
                label="Streak" 
                value="7D" 
                color="text-warning" 
                description="Active days since last mission failure or skip."
              />
              <StatCard 
                label="Focus" 
                value="88%" 
                color="text-success" 
                description="Deep work percentage vs. distraction-based tasks."
              />
              <StatCard 
                label="Efficiency" 
                value="+12%" 
                color="text-brand" 
                description="Performance increase compared to previous cycle."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SLIDE-OUT PANEL
      ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Backdrop */}
      <div 
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]
          transition-opacity duration-300
          ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `} 
        onClick={() => setIsPanelOpen(false)} 
      />
      
      {/* Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-[480px]
        bg-surface-0 border-l border-white/[0.06]
        z-[70] p-8
        transition-transform duration-300 ease-out
        ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Panel Header */}
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-medium text-text-secondary">
            {panelContent === "balance" ? "Team Balance" : "Mission Telemetry"}
          </h3>
          <button 
            onClick={() => setIsPanelOpen(false)} 
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>
        
        {/* Panel Content */}
        {panelContent === "balance" ? ( 
          <TeamBalancePanel onBalanceComplete={() => setIsBalanced(true)} /> 
        ) : ( 
          <ProjectTelemetryPanel project={selectedMission} /> 
        )}
      </div>
    </div>
  );
}
