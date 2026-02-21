// src/pages/Home.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC HOME PAGE v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
// 
// THEME: "The Light Gallery" - Mission Control
// 
// COLOR MAP:
// - Page Background: #F8FAFC → #EEF2FF gradient (via CSS)
// - Section Cards: #FFFFFF with violet-tinted shadows
// - Headings: #1E293B (slate-800)
// - Body Text: #475569 (slate-600)
// - Muted Text: #94A3B8 (slate-400)
// - Card Border: #E2E8F0 (slate-200)
// - Card Shadow: violet-tinted (rgba(139, 92, 246, 0.06))
// - Progress Bars: Ocean Gradient (blue → cyan → teal)
// - Accent Bar: Aurora Gradient
//
// NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Zap, Clock, TrendingUp, Flame, Rocket, X, Wifi, WifiOff } from "lucide-react";
import "./Home.css";

import { useRenovation } from "../context/RenovationCOntext";
import TeamBalancePanel from "../components/home/TeamBalancePanel";
import ProjectTelemetryPanel from "../components/home/ProjectTelemetryPanel";
import MissionCard from "../components/home/MissionCard";
import MissionCardSkeleton from "../components/home/MissionCardSkeleton";
import IntelligencePanel from "../components/home/IntelligencePanel";

import { EntranceHighlight, useEntranceHighlight } from "../components/onboarding/AppEntrance";
import { useMomentumContext, useMomentumActivity } from "../contexts/MomentumContext";
import AllShipped from "../components/empty-states/AllShipped";

import TeamPulse from "../components/social/TeamPulse";
import LiveActivityFeed from "../components/social/LiveActivityFeed";
import StreakComparison from "../components/social/StreakComparison";

import { useShipSound, useXPSound, useAchievementUnlockSound } from "../sounds/AchievementSounds";
import { useUISounds } from "../hooks/useSounds";

import YourMovesToday from "../components/focus/YourMovesToday";
import { useFocusEngine } from "../contexts/FocusEngineContext";

import { useHomeRealtime } from "../hooks/useHomeRealtime";
import { getProjectId } from "../utils/projectHelpers";

/* ───────────────────────────────────────────────────────────────────────────
   STAT CARD - Light theme with violet-tinted shadows
─────────────────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, color = "text-violet-600", description }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { glowLevel, isFireMode } = useMomentumContext();

  return (
    <div
      className={`
        relative p-5 rounded-xl
        bg-white border border-slate-200
        hover:border-violet-200
        shadow-sm hover:shadow-lg
        transition-all duration-200 cursor-default
        momentum-responsive-card momentum-card
        ${isHovered ? "transform -translate-y-0.5" : ""}
        ${isFireMode ? "border-orange-200 hover:border-orange-300" : ""}
      `}
      style={{
        boxShadow: isHovered 
          ? '0 8px 32px rgba(139, 92, 246, 0.12)' 
          : '0 4px 24px rgba(139, 92, 246, 0.06)'
      }}
      data-momentum={glowLevel}
      onMouseEnter={() => {
        setShowTooltip(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setIsHovered(false);
      }}
    >
      <div
        className={`
          text-2xl font-semibold transition-all duration-200
          ${color}
          ${isHovered ? "scale-105" : "scale-100"}
        `}
      >
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>

      {showTooltip && description && (
        <div
          className="
            absolute bottom-full mb-2 left-0 w-56
            p-3 bg-white border border-slate-200 rounded-lg
            shadow-xl z-50
            animate-in fade-in slide-in-from-bottom-2 duration-200
          "
        >
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────────────────────────────────────────
   SECTION HEADER - Light theme
─────────────────────────────────────────────────────────────────────────── */
const SectionHeader = ({
  icon: Icon,
  iconColor = "text-violet-600",
  title,
  action,
  onAction,
  showMomentum = false,
  rightSlot = null,
}) => {
  const { isFireMode } = useMomentumContext();
  const { playClick } = useUISounds();

  const handleAction = useCallback(() => {
    playClick();
    if (onAction) onAction();
  }, [onAction, playClick]);

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${isFireMode ? "text-orange-500" : iconColor}`} />
        <h2 className="text-sm font-medium text-slate-600">{title}</h2>
        {showMomentum && isFireMode && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-600 animate-pulse">
            🔥
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {rightSlot}

        {action && (
          <button 
            onClick={handleAction} 
            className="text-xs text-slate-500 hover:text-violet-600 transition-colors"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
};

/* ───────────────────────────────────────────────────────────────────────────
   MOMENTUM STATUS BANNER - Light theme badges
─────────────────────────────────────────────────────────────────────────── */
const MomentumStatusBanner = () => {
  const { glowLevel, glowState, message, isFireMode } = useMomentumContext();
  if (glowLevel < 3) return null;

  // Light theme badge colors per Part 4 color map
  const config = {
    3: { bg: "bg-violet-50", border: "border-violet-200", icon: TrendingUp, color: "text-violet-700" },
    4: { bg: "bg-blue-50", border: "border-blue-200", icon: Rocket, color: "text-blue-700" },
    5: { bg: "bg-orange-50", border: "border-orange-200", icon: Flame, color: "text-orange-700" },
  };

  const currentConfig = config[glowLevel] || config[3];
  const Icon = currentConfig.icon;

  return (
    <div
      className={`
        mb-6 px-4 py-3 rounded-xl
        ${currentConfig.bg} border ${currentConfig.border}
        flex items-center justify-between
        ${isFireMode ? "animate-pulse" : ""}
      `}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${currentConfig.color}`} />
        <div>
          <div className={`text-sm font-medium ${currentConfig.color}`}>
            {glowState.charAt(0).toUpperCase() + glowState.slice(1)} Mode
          </div>
          <div className="text-xs text-slate-500">{message}</div>
        </div>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${currentConfig.color}`}>L{glowLevel}</div>
    </div>
  );
};

/* ───────────────────────────────────────────────────────────────────────────
   MAIN HOME PAGE
─────────────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState("balance");
  const [selectedMission, setSelectedMission] = useState(null);
  const [isBalanced, setIsBalanced] = useState(false);

  const [showEntranceHighlight, setShowEntranceHighlight] = useState(false);

  const { glowLevel, isFireMode, recordActivity } = useMomentumContext();
  const { recordTaskCompletion } = useMomentumActivity();

  const { playShipSound } = useShipSound();
  const { playXP } = useXPSound();
  const { playAchievementUnlock } = useAchievementUnlockSound();
  const { playClick } = useUISounds();

  // Focus engine (safe)
  let focusEngine = { hasUrgentMoves: false };
  try {
    focusEngine = useFocusEngine();
  } catch (e) {}

  // REALTIME HOME DATA (safe + polling + instant local events)
  const {
    loadingMissions,
    missions,
    activities,
    summary,
    teamPulse,
    streakComparison,
    intelligence,
    shippedStats,
    refreshAll,
    isConnected,
  } = useHomeRealtime();

  // Entrance highlight
  useEntranceHighlight?.(() => {
    setShowEntranceHighlight(true);
    setTimeout(() => setShowEntranceHighlight(false), 600);
  });

  const handleOpenPanel = useCallback(
    (content, mission = null) => {
      playClick();
      setSelectedMission(mission);
      setPanelContent(content);
      setIsPanelOpen(true);
    },
    [playClick]
  );

  const handleClosePanel = useCallback(() => {
    playClick();
    setIsPanelOpen(false);
  }, [playClick]);

  const handleFocusMoveClick = useCallback((move) => {
    playClick();
    console.log("Focus move clicked:", move);
  }, [playClick]);

  const handleActivityClick = useCallback((activity) => {
    playClick();
    console.log("Activity clicked:", activity);
  }, [playClick]);

  const handleShipped = useCallback(
    (projectId) => {
      const shippedMission = missions.find((m) => getProjectId(m) === projectId);
      
      if (!shippedMission) {
        console.warn('[Home] Could not find shipped mission:', projectId);
        return;
      }
      
      const isLastMission = missions.length <= 1;

      recordActivity("PROJECT_SHIP", { projectId, projectName: shippedMission?.title });

      const baseXP = 50;
      const momentumBonus = glowLevel >= 3 ? 10 : 0;
      const totalXP = baseXP + momentumBonus;

      const shipData = {
        taskCount: shippedMission?.raw?.metrics?.openTasks?.value || 1,
        durationDays: 1,
        isProduction: isLastMission || isFireMode,
      };

      playShipSound(shipData);

      setTimeout(() => playXP(totalXP), 400);

      if (isLastMission) {
        setTimeout(() => playAchievementUnlock(), 1000);
      }

      window.dispatchEvent(
        new CustomEvent("local-ship", {
          detail: {
            project: { name: shippedMission?.title, id: projectId },
            xp: totalXP,
            isEpic: isFireMode || isLastMission,
          },
        })
      );

      setTimeout(() => refreshAll?.(), 800);
    },
    [missions, recordActivity, glowLevel, isFireMode, playShipSound, playXP, playAchievementUnlock, refreshAll]
  );

  // Section card classes with violet-tinted shadows
  const sectionCardClasses = useMemo(() => {
    const base = "p-6 rounded-xl bg-white border border-slate-200 momentum-responsive-card momentum-card";
    const shadow = "shadow-[0_4px_24px_rgba(139,92,246,0.06)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)]";
    if (isFireMode) return `${base} ${shadow} border-orange-200`;
    if (glowLevel >= 4) return `${base} ${shadow} border-violet-200`;
    return `${base} ${shadow}`;
  }, [glowLevel, isFireMode]);

  // Live/Offline pill - Light theme
  const LivePill = useMemo(() => {
    const live = Boolean(isConnected);

    return (
      <div
        className={`
          flex items-center gap-1.5
          px-2 py-1 rounded-full
          border text-[10px] font-medium
          ${live 
            ? "bg-teal-50 border-teal-200 text-teal-700" 
            : "bg-slate-100 border-slate-200 text-slate-500"
          }
        `}
        title={live ? "Connected to live updates" : "Offline (showing last known data)"}
      >
        {live ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{live ? "LIVE" : "OFFLINE"}</span>
      </div>
    );
  }, [isConnected]);

  return (
    <div 
      className="home-page min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto" 
      data-momentum={glowLevel}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${isFireMode ? "bg-orange-500 animate-pulse" : "bg-teal-500"}`} />
            <span className="text-xs text-slate-500">
              {isFireMode ? "Fire Mode Active 🔥" : "Operational Status: Live"}
            </span>

            {focusEngine.hasUrgentMoves && (
              <span className="ml-2 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200">
                ⚠️ Urgent moves pending
              </span>
            )}
          </div>

          <h1 className="text-4xl font-semibold text-slate-800">
            Mission{" "}
            <span className={`${isFireMode ? "text-orange-500" : "text-slate-400"} transition-colors duration-500`}>
              Control
            </span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Momentum</p>
            <div
              className={`
                text-xl font-semibold
                ${isFireMode ? "text-orange-500" : glowLevel >= 3 ? "text-violet-600" : "text-slate-800"}
              `}
            >
              Level {glowLevel}
              {isFireMode && " 🔥"}
            </div>
          </div>

          <div className="w-px h-10 bg-slate-200" />

          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Global Rank</p>
            <p className="text-xl font-semibold text-slate-800">Top 2%</p>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          TEAM PULSE BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <TeamPulse
        variant="banner"
        showAvatars={true}
        showSummary={true}
        showTicker={true}
        className="mb-6"
        pulseData={{
          activeCount: teamPulse.activeCount,
          shippingNow: teamPulse.shippingNow,
          inFocus: teamPulse.inFocus,
          actors: teamPulse.actors,
        }}
      />

      <MomentumStatusBanner />

      {/* ═══════════════════════════════════════════════════════════════════
          YOUR MOVES TODAY
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <YourMovesToday
          variant="default"
          maxMoves={3}
          showHeader={true}
          showFooter={true}
          showRefresh={true}
          onMoveClick={handleFocusMoveClick}
          onViewAll={() => console.log("View all moves")}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">
        {/* Missions */}
        <div className="col-span-12 xl:col-span-8">
          <div
            className={`
              ${sectionCardClasses}
              transition-all duration-300
              ${showEntranceHighlight ? "ring-2 ring-violet-300 animate-pulse-once" : ""}
            `}
            data-momentum={glowLevel}
          >
            <SectionHeader
              icon={Zap}
              title="Recommended for Today"
              action="Refresh"
              onAction={() => refreshAll?.()}
              showMomentum
              rightSlot={LivePill}
            />

            <div className="space-y-3">
              {loadingMissions ? (
                <MissionCardSkeleton count={3} />
              ) : missions.length > 0 ? (
                missions.map((mission, index) => (
                  <div
                    key={mission.id}
                    className={`
                      transition-all duration-300
                      ${showEntranceHighlight && index === 0 ? "ring-2 ring-violet-200 rounded-xl" : ""}
                    `}
                    style={{ animationDelay: showEntranceHighlight ? `${index * 100}ms` : "0ms" }}
                  >
                    <MissionCard
                      project={mission}
                      onClick={() => handleOpenPanel("telemetry", mission)}
                      onShipped={handleShipped}
                    />
                  </div>
                ))
              ) : (
                <AllShipped
                  tasksCompleted={shippedStats.tasksCompleted}
                  xpEarned={shippedStats.xpEarned}
                  bonusXP={shippedStats.bonusXP}
                  streak={summary.streakDays}
                  bestStreak={summary.streakDays}
                  onAddMore={() => refreshAll?.()}
                  onViewStats={() => handleOpenPanel("balance")}
                  showConfetti={shippedStats.tasksCompleted > 0}
                  confettiIntensity={isFireMode ? "high" : "medium"}
                  variant={shippedStats.tasksCompleted > 0 ? "celebratory" : "illustrated"}
                />
              )}
            </div>

            {!isConnected && (
              <div className="mt-4 text-[11px] text-slate-500 flex items-center gap-2">
                <WifiOff className="w-3.5 h-3.5" />
                Showing last known data — updates will resume automatically when you're back online.
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <IntelligencePanel
            isBalanced={false}
            onBalanceClick={() => handleOpenPanel("balance")}
            peakWindowStart={intelligence.peakWindowStart}
            peakWindowEnd={intelligence.peakWindowEnd}
            productivity={intelligence.productivity}
            coWorkingMultiplier={intelligence.coWorkingMultiplier}
            isCoWorking={intelligence.isCoWorking}
            momentumLevel={glowLevel}
            isFireMode={isFireMode}
          />

          <LiveActivityFeed
            variant="sidebar"
            maxItems={10}
            showFilters={false}
            showSummary={false}
            onActivityClick={handleActivityClick}
            injectedItems={activities}
          />

          <StreakComparison
            variant="compact"
            showChart={false}
            showLeader={true}
            showRank={true}
            userStreakDays={streakComparison.userStreakDays}
            teamAvgDays={streakComparison.teamAvgDays}
            rankText={streakComparison.rankText}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            VELOCITY METRICS
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-12">
          <div className={sectionCardClasses} data-momentum={glowLevel}>
            <SectionHeader 
              icon={TrendingUp} 
              iconColor="text-violet-600" 
              title="Velocity Metrics" 
              rightSlot={LivePill} 
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Ships"
                value={summary.ships}
                color={isFireMode ? "text-orange-500" : "text-violet-600"}
                description="Total validated deployments in the last 7 days (derived from real activity)."
              />
              <StatCard
                label="Streak"
                value={`${summary.streakDays}D`}
                color="text-amber-600"
                description="Current streak (from backend summary if available; otherwise derived from activity)."
              />
              <StatCard
                label="Focus"
                value={`${summary.focus}%`}
                color="text-teal-600"
                description="Focus estimate (backend if available; otherwise derived from activity types)."
              />
              <StatCard
                label="Efficiency"
                value={`${summary.efficiency >= 0 ? "+" : ""}${summary.efficiency}%`}
                color={isFireMode ? "text-orange-500" : "text-violet-600"}
                description="Change vs previous period (derived until backend becomes authoritative)."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SLIDE-OUT PANEL - Light theme
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className={`
          fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]
          transition-opacity duration-300
          ${isPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={handleClosePanel}
      />

      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-[480px]
          bg-white border-l border-slate-200
          z-[70] p-8
          shadow-2xl shadow-slate-900/10
          transition-transform duration-300 ease-out
          ${isPanelOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-medium text-slate-600">
            {panelContent === "balance" ? "Team Balance" : "Mission Telemetry"}
          </h3>
          <button 
            onClick={handleClosePanel} 
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {panelContent === "balance" ? (
          <TeamBalancePanel onBalanceComplete={() => setIsBalanced(true)} />
        ) : (
          <ProjectTelemetryPanel project={selectedMission} />
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse-once {
          0% { box-shadow: 0 0 0 0 rgb(139 92 246 / 0.3); }
          50% { box-shadow: 0 0 0 8px rgb(139 92 246 / 0); }
          100% { box-shadow: 0 0 0 0 rgb(139 92 246 / 0); }
        }
        .animate-pulse-once {
          animation: pulse-once 600ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
