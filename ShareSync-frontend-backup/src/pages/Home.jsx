// src/pages/Home.jsx
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Zap, Clock, TrendingUp, Flame, Rocket, X, Wifi, WifiOff } from "lucide-react";

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

/* ───────────────────────────────────────────────────────────────────────── */
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
        ${isHovered ? "transform -translate-y-0.5" : ""}
        ${isFireMode ? "border-energy-500/10" : ""}
      `}
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
      <div className="text-xs text-text-tertiary mt-1">{label}</div>

      {showTooltip && description && (
        <div
          className="
          absolute bottom-full mb-2 left-0 w-56
          p-3 bg-surface-2 border border-white/[0.08] rounded-lg
          shadow-xl z-50
          animate-in fade-in slide-in-from-bottom-2 duration-200
        "
        >
          <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({
  icon: Icon,
  iconColor = "text-brand",
  title,
  action,
  onAction,
  showMomentum = false,
  rightSlot = null, // ✅ NEW
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
        <Icon className={`w-4 h-4 ${isFireMode ? "text-energy-500" : iconColor}`} />
        <h2 className="text-sm font-medium text-text-secondary">{title}</h2>
        {showMomentum && isFireMode && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-energy-500/20 text-energy-500 animate-pulse">
            🔥
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {rightSlot}

        {action && (
          <button onClick={handleAction} className="text-xs text-text-tertiary hover:text-brand transition-colors">
            {action}
          </button>
        )}
      </div>
    </div>
  );
};

const MomentumStatusBanner = () => {
  const { glowLevel, glowState, message, isFireMode } = useMomentumContext();
  if (glowLevel < 3) return null;

  const config = {
    3: { bg: "bg-brand-500/10", border: "border-brand-500/20", icon: TrendingUp, color: "text-brand-400" },
    4: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: Rocket, color: "text-cyan-400" },
    5: { bg: "bg-energy-500/10", border: "border-energy-500/20", icon: Flame, color: "text-energy-500" },
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
          <div className="text-xs text-text-tertiary">{message}</div>
        </div>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${currentConfig.color}`}>L{glowLevel}</div>
    </div>
  );
};

/* ───────────────────────────────────────────────────────────────────────── */
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

  // ✅ REALTIME HOME DATA (safe + polling + instant local events)
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
    isConnected, // ✅ NEW (from hook)
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

  // When shipped: keep your momentum + sounds + broadcasts, but let missions be “real”
  const handleShipped = useCallback(
    (projectId) => {
      const shippedMission = missions.find((m) => m.id === projectId || m._id === projectId);
      const isLastMission = missions.length <= 1;

      // Momentum record
      recordActivity("PROJECT_SHIP", { projectId, projectName: shippedMission?.title });

      // XP (same behavior)
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

      // Broadcast for feed (you already use this)
      window.dispatchEvent(
        new CustomEvent("local-ship", {
          detail: {
            project: { name: shippedMission?.title, id: projectId },
            xp: totalXP,
            isEpic: isFireMode || isLastMission,
          },
        })
      );

      // Also: refresh data shortly after ship (pull in any backend updates)
      setTimeout(() => refreshAll?.(), 800);
    },
    [missions, recordActivity, glowLevel, isFireMode, playShipSound, playXP, playAchievementUnlock, refreshAll]
  );

  const handleActivityClick = useCallback(
    (activity) => {
      playClick();
      console.log("Activity clicked:", activity);
    },
    [playClick]
  );

  const handleFocusMoveClick = useCallback(
    (move) => {
      playClick();
      console.log("Focus move clicked:", move);
    },
    [playClick]
  );

  // Momentum styling
  const sectionCardClasses = useMemo(() => {
    const base = "p-6 rounded-xl bg-surface-1 border border-white/[0.06] momentum-responsive-card momentum-card";
    if (isFireMode) return `${base} border-energy-500/10`;
    if (glowLevel >= 4) return `${base} border-brand-500/10`;
    return base;
  }, [glowLevel, isFireMode]);

  // ✅ reusable “Live/Offline” pill (Home-level signal)
  const LivePill = useMemo(() => {
    const live = Boolean(isConnected);

    return (
      <div
        className={`
          flex items-center gap-1.5
          px-2 py-1 rounded-full
          border text-[10px] font-medium
          ${live ? "bg-success/10 border-success/20 text-success" : "bg-surface-2 border-white/[0.08] text-text-tertiary"}
        `}
        title={live ? "Connected to live updates" : "Offline (showing last known data)"}
      >
        {live ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{live ? "LIVE" : "OFFLINE"}</span>
      </div>
    );
  }, [isConnected]);

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto" data-momentum={glowLevel}>
      <header className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${isFireMode ? "bg-energy-500 animate-pulse" : "bg-success"}`} />
            <span className="text-xs text-text-tertiary">{isFireMode ? "Fire Mode Active 🔥" : "Operational Status: Live"}</span>

            {focusEngine.hasUrgentMoves && (
              <span className="ml-2 px-2 py-0.5 rounded bg-warning/10 text-warning text-[10px] font-medium">
                ⚠️ Urgent moves pending
              </span>
            )}
          </div>

          <h1 className="text-4xl font-semibold text-text-primary">
            Mission{" "}
            <span className={`${isFireMode ? "text-energy-500" : "text-text-tertiary"} transition-colors duration-500`}>
              Control
            </span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-text-tertiary mb-1">Momentum</p>
            <div
              className={`
              text-xl font-semibold
              ${isFireMode ? "text-energy-500" : glowLevel >= 3 ? "text-brand-400" : "text-text-primary"}
            `}
            >
              Level {glowLevel}
              {isFireMode && " 🔥"}
            </div>
          </div>

          <div className="w-px h-10 bg-white/[0.06]" />

          <div className="text-right">
            <p className="text-xs text-text-tertiary mb-1">Global Rank</p>
            <p className="text-xl font-semibold text-text-primary">Top 2%</p>
          </div>
        </div>
      </header>

      {/* ✅ TeamPulse now powered by real activity-derived pulse */}
      <TeamPulse
        variant="banner"
        showAvatars={true}
        showSummary={true}
        showTicker={true}
        className="mb-6"
        // Safe: if TeamPulse ignores props, no harm. If it supports them later, it becomes real.
        pulseData={{
          activeCount: teamPulse.activeCount,
          shippingNow: teamPulse.shippingNow,
          inFocus: teamPulse.inFocus,
          actors: teamPulse.actors,
        }}
      />

      <MomentumStatusBanner />

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

      <div className="grid grid-cols-12 gap-6">
        {/* Missions */}
        <div className="col-span-12 xl:col-span-8">
          <div
            className={`
              ${sectionCardClasses}
              transition-all duration-300
              ${showEntranceHighlight ? "ring-2 ring-brand-500/40 animate-pulse-once" : ""}
            `}
            data-momentum={glowLevel}
          >
            <SectionHeader
              icon={Zap}
              title="Recommended for Today"
              action="Refresh"
              onAction={() => refreshAll?.()}
              showMomentum
              rightSlot={LivePill} // ✅ NEW
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
                      ${showEntranceHighlight && index === 0 ? "ring-2 ring-brand-500/30 rounded-xl" : ""}
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

            {/* Optional: subtle offline hint under the mission section */}
            {!isConnected && (
              <div className="mt-4 text-[11px] text-text-tertiary flex items-center gap-2">
                <WifiOff className="w-3.5 h-3.5" />
                Showing last known data — updates will resume automatically when you’re back online.
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
            // If your LiveActivityFeed supports injection later, it becomes real immediately.
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

        {/* Velocity Metrics */}
        <div className="col-span-12">
          <div className={sectionCardClasses} data-momentum={glowLevel}>
            <SectionHeader icon={TrendingUp} iconColor="text-brand" title="Velocity Metrics" rightSlot={LivePill} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Ships"
                value={summary.ships}
                color={isFireMode ? "text-energy-500" : "text-brand"}
                description="Total validated deployments in the last 7 days (derived from real activity)."
              />
              <StatCard
                label="Streak"
                value={`${summary.streakDays}D`}
                color="text-warning"
                description="Current streak (from backend summary if available; otherwise derived from activity)."
              />
              <StatCard
                label="Focus"
                value={`${summary.focus}%`}
                color="text-success"
                description="Focus estimate (backend if available; otherwise derived from activity types)."
              />
              <StatCard
                label="Efficiency"
                value={`${summary.efficiency >= 0 ? "+" : ""}${summary.efficiency}%`}
                color={isFireMode ? "text-energy-500" : "text-brand"}
                description="Change vs previous period (derived until backend becomes authoritative)."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out panel */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]
          transition-opacity duration-300
          ${isPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={handleClosePanel}
      />

      <div
        className={`
        fixed top-0 right-0 h-full w-full max-w-[480px]
        bg-surface-0 border-l border-white/[0.06]
        z-[70] p-8
        transition-transform duration-300 ease-out
        ${isPanelOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-medium text-text-secondary">
            {panelContent === "balance" ? "Team Balance" : "Mission Telemetry"}
          </h3>
          <button onClick={handleClosePanel} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {panelContent === "balance" ? (
          <TeamBalancePanel onBalanceComplete={() => setIsBalanced(true)} />
        ) : (
          <ProjectTelemetryPanel project={selectedMission} />
        )}
      </div>

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
