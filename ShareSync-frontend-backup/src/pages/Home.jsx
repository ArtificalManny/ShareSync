// src/pages/Home.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE C: Momentum Engine + PHASE D: Empty States + PHASE E: Social Proof 
// + PHASE F: Sound + PHASE H: Three-Move Focus Engine
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
// - ⭐ PHASE F: Ship sounds with epic detection
// - ⭐ PHASE F: Task completion sounds
// - ⭐ PHASE F: XP gain sounds
// - ⭐ PHASE F: Achievement unlock sounds
// - ⭐ PHASE H: YourMovesToday - Cross-project focus moves
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Target,
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

// ⭐ PHASE F: Import sound hooks
import { useShipSound, useXPSound, useAchievementUnlockSound } from '../sounds/AchievementSounds';
import { useUISounds } from '../hooks/useSounds';

// ⭐ PHASE H: Import Focus Engine components
import YourMovesToday, { FocusBanner } from '../components/focus/YourMovesToday';
import { useFocusEngine } from '../contexts/FocusEngineContext';

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
   ⭐ PHASE F: Click sounds on actions
───────────────────────────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, iconColor = "text-brand", title, action, onAction, showMomentum = false }) => {
  const { isFireMode } = useMomentumContext();
  const { playClick } = useUISounds();
  
  const handleAction = useCallback(() => {
    playClick();
    if (onAction) onAction();
  }, [onAction, playClick]);
  
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
          onClick={handleAction}
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

  // ⭐ PHASE F: Sound hooks
  const { playShipSound } = useShipSound();
  const { playXP } = useXPSound();
  const { playAchievementUnlock } = useAchievementUnlockSound();
  const { playClick, playSuccess, playError } = useUISounds();

  // ⭐ PHASE H: Focus engine (optional - graceful fallback if provider not present)
  let focusEngine = { hasUrgentMoves: false };
  try {
    focusEngine = useFocusEngine();
  } catch (e) {
    // Context not available, use defaults
  }

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
  // ⭐ PHASE F: Play ship and XP sounds
  const handleShipped = useCallback((projectId) => {
    const shippedMission = missions.find(m => m.id === projectId);
    const isLastMission = missions.length === 1;
    
    setMissions(prev => prev.filter(m => m.id !== projectId));
    
    // Record the ship activity for momentum
    recordActivity('PROJECT_SHIP', { projectId, projectName: shippedMission?.title });
    
    // Calculate XP
    const baseXP = 50;
    const momentumBonus = glowLevel >= 3 ? 10 : 0;
    const totalXP = baseXP + momentumBonus;
    
    // Update shipped stats for AllShipped celebration
    setShippedStats(prev => ({
      tasksCompleted: prev.tasksCompleted + 1,
      xpEarned: prev.xpEarned + baseXP,
      bonusXP: prev.bonusXP + momentumBonus,
    }));
    
    // ⭐ PHASE F: Play ship sound
    const shipData = {
      taskCount: shippedMission?.tasks || 1,
      durationDays: 1,
      isProduction: isLastMission || isFireMode,
    };
    playShipSound(shipData);
    
    // ⭐ PHASE F: Play XP sound after a short delay
    setTimeout(() => {
      playXP(totalXP);
    }, 400);
    
    // ⭐ PHASE F: If this was the last mission, play achievement sound
    if (isLastMission) {
      setTimeout(() => {
        playAchievementUnlock();
      }, 1000);
    }
    
    // Dispatch event for team feed and focus engine refresh
    window.dispatchEvent(new CustomEvent('local-ship', {
      detail: {
        project: { name: shippedMission?.title, id: projectId },
        xp: totalXP,
        isEpic: isFireMode || isLastMission,
      }
    }));
  }, [missions, recordActivity, glowLevel, isFireMode, playShipSound, playXP, playAchievementUnlock]);

  // ⭐ PHASE D: Handle adding more tasks from AllShipped
  const handleAddMoreTasks = useCallback(() => {
    playClick();
    setMissions(MOCK_MISSIONS);
    setShippedStats({ tasksCompleted: 0, xpEarned: 0, bonusXP: 0 });
  }, [playClick]);

  // ⭐ PHASE E: Handle activity click from feed
  const handleActivityClick = useCallback((activity) => {
    playClick();
    console.log('Activity clicked:', activity);
  }, [playClick]);

  // ⭐ PHASE H: Handle focus move click
  const handleFocusMoveClick = useCallback((move) => {
    playClick();
    console.log('Focus move clicked:', move);
    // Could navigate to the project or open a detail panel
  }, [playClick]);

  // Panel handlers
  const handleOpenPanel = useCallback((content, mission = null) => {
    playClick();
    setSelectedMission(mission);
    setPanelContent(content);
    setIsPanelOpen(true);
  }, [playClick]);

  const handleClosePanel = useCallback(() => {
    playClick();
    setIsPanelOpen(false);
  }, [playClick]);

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
          {/* Status indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`
              w-2 h-2 rounded-full
              ${isFireMode ? 'bg-energy-500 animate-pulse' : 'bg-success'}
            `} />
            <span className="text-xs text-text-tertiary">
              {isFireMode ? 'Fire Mode Active 🔥' : 'Operational Status: Live'}
            </span>
            
            {/* ⭐ PHASE H: Urgent moves indicator */}
            {focusEngine.hasUrgentMoves && (
              <span className="ml-2 px-2 py-0.5 rounded bg-warning/10 text-warning text-[10px] font-medium">
                ⚠️ Urgent moves pending
              </span>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-4xl font-semibold text-text-primary">
            Mission <span className={`
              ${isFireMode ? 'text-energy-500' : 'text-text-tertiary'}
              transition-colors duration-500
            `}>Control</span>
          </h1>
        </div>
        
        {/* Rank + Momentum Level */}
        <div className="hidden md:flex items-center gap-6">
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

      {/* ⭐ PHASE E: Team Pulse Banner */}
      <TeamPulse 
        variant="banner"
        showAvatars={true}
        showSummary={true}
        showTicker={true}
        className="mb-6"
      />

      {/* ⭐ PHASE C: Momentum Status Banner */}
      <MomentumStatusBanner />

      {/* ═══════════════════════════════════════════════════════════════════
          ⭐ PHASE H: YOUR 3 MOVES TODAY - HERO POSITION
          This is the primary focus widget for the user
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <YourMovesToday
          variant="default"
          maxMoves={3}
          showHeader={true}
          showFooter={true}
          showRefresh={true}
          onMoveClick={handleFocusMoveClick}
          onViewAll={() => console.log('View all moves')}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* ─────────────────────────────────────────────────────────────────
            MISSIONS SECTION (8 columns)
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
                      onClick={() => handleOpenPanel("telemetry", mission)}
                      onShipped={handleShipped}
                      momentumLevel={glowLevel}
                      isFireMode={isFireMode}
                    />
                  </div>
                ))
              ) : (
                <AllShipped
                  tasksCompleted={shippedStats.tasksCompleted || MOCK_MISSIONS.length}
                  xpEarned={shippedStats.xpEarned || 150}
                  bonusXP={shippedStats.bonusXP || (glowLevel >= 3 ? 30 : 0)}
                  streak={7}
                  bestStreak={7}
                  onAddMore={handleAddMoreTasks}
                  onViewStats={() => handleOpenPanel("balance")}
                  showConfetti={shippedStats.tasksCompleted > 0}
                  confettiIntensity={isFireMode ? 'high' : 'medium'}
                  variant={shippedStats.tasksCompleted > 0 ? 'celebratory' : 'illustrated'}
                />
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            RIGHT SIDEBAR (4 columns)
        ───────────────────────────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Intelligence Panel */}
          <IntelligencePanel 
            isBalanced={isBalanced}
            onBalanceClick={() => handleOpenPanel("balance")}
            peakWindowStart={14}
            peakWindowEnd={16}
            productivity={65}
            coWorkingMultiplier={2.1}
            isCoWorking={true}
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
        onClick={handleClosePanel} 
      />
      
      {/* Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-[480px]
        bg-surface-0 border-l border-white/[0.06]
        z-[70] p-8
        transition-transform duration-300 ease-out
        ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-medium text-text-secondary">
            {panelContent === "balance" ? "Team Balance" : "Mission Telemetry"}
          </h3>
          <button 
            onClick={handleClosePanel} 
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>
        
        {panelContent === "balance" ? ( 
          <TeamBalancePanel onBalanceComplete={() => setIsBalanced(true)} /> 
        ) : ( 
          <ProjectTelemetryPanel project={selectedMission} /> 
        )}
      </div>
      
      {/* Entrance highlight animation */}
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
