// src/pages/Home.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine + PHASE D: Empty States + PHASE E: Social Proof
// ═══════════════════════════════════════════════════════════════════════════════
//
// NOW USING:
// - momentum-responsive-card class for cards that respond to momentum level
// - momentum-card class for cards with engine-specific styles
// - ⭐ PHASE C: Fire mode special treatment for sections
// - ⭐ PHASE C: Momentum indicator in header
// - ⭐ PHASE C: Ship button glows at high momentum
// - ⭐ PHASE D: AllShipped celebration when missions complete
// - ⭐ PHASE E: TeamPulse banner showing active teammates
// - ⭐ PHASE E: LiveActivityFeed sidebar showing real-time ships
// - ⭐ PHASE E: MiniLeaderboard widget
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from "react";
import { 
  Zap, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  ChevronRight,
  X,
  CheckCircle2,
  TrendingUp,
  Activity,
  Flame,
  Rocket,
  Plus,
} from "lucide-react";

// Note: Using correct casing for RenovationContext
import { useRenovation } from "../context/RenovationCOntext";
import TeamBalancePanel from "../components/home/TeamBalancePanel";
import ProjectTelemetryPanel from "../components/home/ProjectTelemetryPanel";
import MissionCard from "../components/home/MissionCard";
import MissionCardSkeleton from "../components/home/MissionCardSkeleton";
import IntelligencePanel from "../components/home/IntelligencePanel";

// ⭐ PHASE A: Import entrance highlight utilities
import { EntranceHighlight, useEntranceHighlight } from '../components/onboarding/AppEntrance';

// ⭐ PHASE C: Import momentum context and indicator
import { useMomentumContext, useMomentumActivity } from '../contexts/MomentumContext';

// ⭐ PHASE D: Import empty state components
import AllShipped from '../components/empty-states/AllShipped';

// ⭐ PHASE E: Import social proof components
import TeamPulse from '../components/social/TeamPulse';
import LiveActivityFeed from '../components/social/LiveActivityFeed';
import { MiniLeaderboard } from '../components/social/Leaderboard';
import StreakComparison from '../components/social/StreakComparison';

const MOCK_MISSIONS = [
  { id: 1, title: "Integrate Telemetry Engine", category: "Core Sync", eta: "2h", health: 92, velocity: 88 },
  { id: 2, title: "Refactor Auth Protocol", category: "Security", eta: "4h", health: 65, velocity: 74 },
  { id: 3, title: "Cloud Node Expansion", category: "Infrastructure", eta: "1h", health: 42, velocity: 51 },
];

/* ─────────────────────────────────────────────────────────────────────────
   STAT CARD - Clean metric display with micro-interactions
   ⭐ PHASE C: Now uses momentum-card class for engine response
───────────────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, color = "text-brand", description }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { glowLevel, isFireMode } = useMomentumContext();

  return (
    <div 
      className={`
        relative p-5 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200 cursor-default
        momentum-responsive-card momentum-card
        ${isHovered ? 'transform -translate-y-0.5' : ''}
        ${isFireMode ? 'border-energy-500/10' : ''}
      `}
      data-momentum={glowLevel}
      onMouseEnter={() => { setShowTooltip(true); setIsHovered(true); }}
      onMouseLeave={() => { setShowTooltip(false); setIsHovered(false); }}
    >
      <div className={`
        text-2xl font-semibold transition-all duration-200
        ${color}
        ${isHovered ? 'scale-105' : 'scale-100'}
      `}>
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
   SECTION HEADER
   ⭐ PHASE C: Can include momentum badge
───────────────────────────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, iconColor = "text-brand", title, action, onAction, showMomentum = false }) => {
  const { isFireMode } = useMomentumContext();
  
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${isFireMode ? 'text-energy-500' : iconColor}`} />
        <h2 className="text-sm font-medium text-text-secondary">
          {title}
        </h2>
        {showMomentum && isFireMode && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-energy-500/20 text-energy-500 animate-pulse">
            🔥
          </span>
        )}
      </div>
      {action && (
        <button 
          onClick={onAction}
          className="text-xs text-text-tertiary hover:text-brand transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   ⭐ PHASE C: MOMENTUM STATUS BANNER - Shows when in high momentum
───────────────────────────────────────────────────────────────────────── */
const MomentumStatusBanner = () => {
  const { glowLevel, glowState, message, isFireMode } = useMomentumContext();
  
  // Only show at level 3+
  if (glowLevel < 3) return null;
  
  const config = {
    3: { bg: 'bg-brand-500/10', border: 'border-brand-500/20', icon: TrendingUp, color: 'text-brand-400' },
    4: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Rocket, color: 'text-cyan-400' },
    5: { bg: 'bg-energy-500/10', border: 'border-energy-500/20', icon: Flame, color: 'text-energy-500' },
  };
  
  const currentConfig = config[glowLevel] || config[3];
  const Icon = currentConfig.icon;
  
  return (
    <div className={`
      mb-6 px-4 py-3 rounded-xl
      ${currentConfig.bg} border ${currentConfig.border}
      flex items-center justify-between
      ${isFireMode ? 'animate-pulse' : ''}
    `}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${currentConfig.color}`} />
        <div>
          <div className={`text-sm font-medium ${currentConfig.color}`}>
            {glowState.charAt(0).toUpperCase() + glowState.slice(1)} Mode
          </div>
          <div className="text-xs text-text-tertiary">
            {message}
          </div>
        </div>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${currentConfig.color}`}>
        L{glowLevel}
      </div>
    </div>
  );
};

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
  
  // ⭐ PHASE D: Track shipped stats for AllShipped component
  const [shippedStats, setShippedStats] = useState({
    tasksCompleted: 0,
    xpEarned: 0,
    bonusXP: 0,
  });
  
  // ⭐ PHASE A: Track if we should show the entrance highlight
  const [showEntranceHighlight, setShowEntranceHighlight] = useState(false);
  
  // ⭐ PHASE C: Get momentum state
  const { glowLevel, isFireMode, recordActivity, score } = useMomentumContext();
  const { recordTaskCompletion } = useMomentumActivity();

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

  // ⭐ PHASE A: Listen for entrance highlight event
  useEntranceHighlight?.((detail) => {
    setShowEntranceHighlight(true);
    setTimeout(() => setShowEntranceHighlight(false), 600);
  });

  // ⭐ PHASE C: Handle ship completion with momentum boost
  // ⭐ PHASE D: Track shipped stats for celebration
  // ⭐ PHASE E: Record activity for team feed
  const handleShipped = (projectId) => {
    const shippedMission = missions.find(m => m.id === projectId);
    setMissions(prev => prev.filter(m => m.id !== projectId));
    
    // Record the ship activity for momentum
    recordActivity('PROJECT_SHIP', { projectId, projectName: shippedMission?.title });
    
    // Update shipped stats for AllShipped celebration
    setShippedStats(prev => ({
      tasksCompleted: prev.tasksCompleted + 1,
      xpEarned: prev.xpEarned + 50, // Base XP per ship
      bonusXP: glowLevel >= 3 ? prev.bonusXP + 10 : prev.bonusXP, // Momentum bonus
    }));
  };

  // ⭐ PHASE D: Handle adding more tasks from AllShipped
  const handleAddMoreTasks = () => {
    // Reset to show mock missions again (in real app, would open task creation)
    setMissions(MOCK_MISSIONS);
    setShippedStats({ tasksCompleted: 0, xpEarned: 0, bonusXP: 0 });
  };

  // ⭐ PHASE E: Handle activity click from feed
  const handleActivityClick = (activity) => {
    console.log('Activity clicked:', activity);
    // Could open a detail panel or navigate to the related item
  };

  // ⭐ PHASE C: Dynamic section styles based on momentum
  const sectionCardClasses = useMemo(() => {
    const base = "p-6 rounded-xl bg-surface-1 border border-white/[0.06] momentum-responsive-card momentum-card";
    
    if (isFireMode) {
      return `${base} border-energy-500/10`;
    }
    if (glowLevel >= 4) {
      return `${base} border-brand-500/10`;
    }
    return base;
  }, [glowLevel, isFireMode]);

  return (
    <div 
      className="min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto"
      data-momentum={glowLevel}
    >
      
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          {/* Status indicator - subtle, not pulsing */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`
              w-2 h-2 rounded-full
              ${isFireMode ? 'bg-energy-500 animate-pulse' : 'bg-success'}
            `} />
            <span className="text-xs text-text-tertiary">
              {isFireMode ? 'Fire Mode Active 🔥' : 'Operational Status: Live'}
            </span>
          </div>
          
          {/* Title - calmer, professional */}
          <h1 className="text-4xl font-semibold text-text-primary">
            Mission <span className={`
              ${isFireMode ? 'text-energy-500' : 'text-text-tertiary'}
              transition-colors duration-500
            `}>Control</span>
          </h1>
        </div>
        
        {/* Rank + Momentum Level - right aligned */}
        <div className="hidden md:flex items-center gap-6">
          {/* ⭐ PHASE C: Momentum level indicator */}
          <div className="text-right">
            <p className="text-xs text-text-tertiary mb-1">Momentum</p>
            <div className={`
              text-xl font-semibold
              ${isFireMode ? 'text-energy-500' : glowLevel >= 3 ? 'text-brand-400' : 'text-text-primary'}
            `}>
              Level {glowLevel}
              {isFireMode && ' 🔥'}
            </div>
          </div>
          
          <div className="w-px h-10 bg-white/[0.06]" />
          
          <div className="text-right">
            <p className="text-xs text-text-tertiary mb-1">Global Rank</p>
            <p className="text-xl font-semibold text-text-primary">Top 2%</p>
          </div>
        </div>
      </header>

      {/* ⭐ PHASE E: Team Pulse Banner - Shows active teammates */}
      <TeamPulse 
        variant="banner"
        showAvatars={true}
        showSummary={true}
        showTicker={true}
        className="mb-6"
      />

      {/* ⭐ PHASE C: Momentum Status Banner (shows at level 3+) */}
      <MomentumStatusBanner />

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* ─────────────────────────────────────────────────────────────────
            MISSIONS SECTION (8 columns on large, 12 on medium)
            ⭐ PHASE A: This section gets highlighted during entrance
            ⭐ PHASE C: Responds to momentum level
            ⭐ PHASE D: Shows AllShipped celebration when empty
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-8">
          <div 
            className={`
              ${sectionCardClasses}
              transition-all duration-300
              ${showEntranceHighlight ? 'ring-2 ring-brand-500/40 animate-pulse-once' : ''}
            `}
            data-momentum={glowLevel}
          >
            <SectionHeader 
              icon={Zap} 
              title="Recommended for Today" 
              action={missions.length === 0 ? "Add Tasks" : "View All"}
              onAction={missions.length === 0 ? handleAddMoreTasks : undefined}
              showMomentum
            />
            
            <div className="space-y-3">
              {missionsLoading ? (
                <MissionCardSkeleton count={3} />
              ) : missions.length > 0 ? (
                missions.map((mission, index) => (
                  <div
                    key={mission.id}
                    className={`
                      transition-all duration-300
                      ${showEntranceHighlight && index === 0 ? 'ring-2 ring-brand-500/30 rounded-xl' : ''}
                    `}
                    style={{
                      animationDelay: showEntranceHighlight ? `${index * 100}ms` : '0ms',
                    }}
                  >
                    <MissionCard 
                      project={mission} 
                      onClick={() => { 
                        setSelectedMission(mission); 
                        setPanelContent("telemetry"); 
                        setIsPanelOpen(true); 
                      }}
                      onShipped={handleShipped}
                      // ⭐ PHASE C: Pass momentum level for card styling
                      momentumLevel={glowLevel}
                      isFireMode={isFireMode}
                    />
                  </div>
                ))
              ) : (
                /* ⭐ PHASE D: AllShipped celebration component */
                <AllShipped
                  tasksCompleted={shippedStats.tasksCompleted || MOCK_MISSIONS.length}
                  xpEarned={shippedStats.xpEarned || 150}
                  bonusXP={shippedStats.bonusXP || (glowLevel >= 3 ? 30 : 0)}
                  streak={7} // TODO: Get from user context
                  bestStreak={7}
                  onAddMore={handleAddMoreTasks}
                  onViewStats={() => {
                    setPanelContent("balance");
                    setIsPanelOpen(true);
                  }}
                  showConfetti={shippedStats.tasksCompleted > 0}
                  confettiIntensity={isFireMode ? 'high' : 'medium'}
                  variant={shippedStats.tasksCompleted > 0 ? 'celebratory' : 'illustrated'}
                />
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            RIGHT SIDEBAR (4 columns) - Intelligence + Social Proof
            ⭐ PHASE E: Now includes LiveActivityFeed and MiniLeaderboard
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Intelligence Panel */}
          <IntelligencePanel 
            isBalanced={isBalanced}
            onBalanceClick={() => { 
              setPanelContent("balance"); 
              setIsPanelOpen(true); 
            }}
            peakWindowStart={14}
            peakWindowEnd={16}
            productivity={65}
            coWorkingMultiplier={2.1}
            isCoWorking={true}
            // ⭐ PHASE C: Pass momentum context
            momentumLevel={glowLevel}
            isFireMode={isFireMode}
          />
          
          {/* ⭐ PHASE E: Live Activity Feed */}
          <LiveActivityFeed
            variant="sidebar"
            maxItems={10}
            showFilters={false}
            showSummary={false}
            onActivityClick={handleActivityClick}
          />
          
          {/* ⭐ PHASE E: Streak Comparison Widget */}
          <StreakComparison
            variant="compact"
            showChart={false}
            showLeader={true}
            showRank={true}
          />
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            VELOCITY METRICS (full width)
            ⭐ PHASE C: Momentum-responsive cards
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12">
          <div 
            className={sectionCardClasses}
            data-momentum={glowLevel}
          >
            <SectionHeader 
              icon={TrendingUp} 
              iconColor="text-brand"
              title="Velocity Metrics" 
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="Ships" 
                value={14 + shippedStats.tasksCompleted} 
                color={isFireMode ? "text-energy-500" : "text-brand"} 
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
                color={isFireMode ? "text-energy-500" : "text-brand"} 
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
      
      {/* ⭐ PHASE A: Inline animation for entrance highlight */}
      <style>{`
        @keyframes pulse-once {
          0% { box-shadow: 0 0 0 0 rgb(124 58 237 / 0.4); }
          50% { box-shadow: 0 0 0 8px rgb(124 58 237 / 0); }
          100% { box-shadow: 0 0 0 0 rgb(124 58 237 / 0); }
        }
        
        .animate-pulse-once {
          animation: pulse-once 600ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
