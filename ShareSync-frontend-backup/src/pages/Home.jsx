// src/pages/Home.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC HOME PAGE v4.2 - Ship Ceremony Audit
// UPGRADED: Added a global "haptic bump" (isShipping state) that momentarily 
// scales the entire dashboard down to 0.99 when a ship occurs.
// ═══════════════════════════════════════════════════════════════════════════════

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
import React, { useState, useCallback, useMemo, useEffect } from "react";

const StatCard = ({ label, value, color = "text-violet-600 dark:text-violet-400", description }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { glowLevel, isFireMode } = useMomentumContext();

  return (
    <div
      className={`
        relative p-5 rounded-xl
        bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        hover:border-violet-200 dark:hover:border-violet-500/30
        shadow-sm hover:shadow-lg
        transition-all duration-200 cursor-default
        momentum-responsive-card momentum-card
        ${isHovered ? "transform -translate-y-0.5" : ""}
        ${isFireMode ? "border-orange-200 dark:border-orange-500/30 hover:border-orange-300" : ""}
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
      <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{label}</div>

      {showTooltip && description && (
        <div
          className="
            absolute bottom-full mb-2 left-0 w-56
            p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-lg
            shadow-xl z-50
            animate-in fade-in slide-in-from-bottom-2 duration-200
          "
        >
          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({
  icon: Icon,
  iconColor = "text-violet-600 dark:text-violet-400",
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
        <Icon strokeWidth={1.5} className={`w-4 h-4 shrink-0 ${isFireMode ? "text-orange-500" : iconColor}`} />
        <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-300">{title}</h2>
        {showMomentum && isFireMode && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 animate-pulse">
            🔥
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {rightSlot}

        {action && (
          <button 
            onClick={handleAction} 
            className="text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors active:scale-95"
          >
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
    3: { bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20", icon: TrendingUp, color: "text-violet-700 dark:text-violet-400" },
    4: { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", icon: Rocket, color: "text-blue-700 dark:text-blue-400" },
    5: { bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20", icon: Flame, color: "text-orange-700 dark:text-orange-400" },
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
        <Icon strokeWidth={1.5} className={`w-5 h-5 shrink-0 ${currentConfig.color}`} />
        <div>
          <div className={`text-sm font-semibold ${currentConfig.color}`}>
            {glowState.charAt(0).toUpperCase() + glowState.slice(1)} Mode
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-zinc-400">{message}</div>
        </div>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${currentConfig.color}`}>L{glowLevel}</div>
    </div>
  );
};

export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState("balance");
  const [selectedMission, setSelectedMission] = useState(null);
  const [isBalanced, setIsBalanced] = useState(false);

  const [showEntranceHighlight, setShowEntranceHighlight] = useState(false);
  
  // NEW: State for global haptic bump on ship
  const [isGlobalShipping, setIsGlobalShipping] = useState(false);

  const { glowLevel, isFireMode, recordActivity } = useMomentumContext();
  const { recordTaskCompletion } = useMomentumActivity();

  const { playShipSound } = useShipSound();
  const { playXP } = useXPSound();
  const { playAchievementUnlock } = useAchievementUnlockSound();
  const { playClick } = useUISounds();

  let focusEngine = { hasUrgentMoves: false };
  try { focusEngine = useFocusEngine(); } catch (e) {}

  const {
    loadingMissions,
    missions,
    activities,
    summary,
    teamPulse,
    streakComparison,
    shippedStats,
    refreshAll,
    isConnected,
  } = useHomeRealtime();

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

      // Trigger the global haptic bump
      setIsGlobalShipping(true);
      setTimeout(() => setIsGlobalShipping(false), 300); // 300ms physical depression

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

  const sectionCardClasses = useMemo(() => {
    const base = "p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200/60 dark:border-white/10 momentum-responsive-card momentum-card";
    const shadow = "shadow-[0_4px_24px_rgba(139,92,246,0.06)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)]";
    if (isFireMode) return `${base} ${shadow} border-orange-200 dark:border-orange-500/30`;
    if (glowLevel >= 4) return `${base} ${shadow} border-violet-200 dark:border-violet-500/30`;
    return `${base} ${shadow}`;
  }, [glowLevel, isFireMode]);

  const LivePill = useMemo(() => {
    const live = Boolean(isConnected);

    return (
      <div
        className={`
          flex items-center gap-1.5
          px-2.5 py-1 rounded-full
          border text-[10px] font-bold tracking-wider
          ${live 
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
            : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400"
          }
        `}
        title={live ? "Connected to live updates" : "Offline (showing last known data)"}
      >
        {live ? <Wifi strokeWidth={2} className="w-3 h-3 shrink-0" /> : <WifiOff strokeWidth={2} className="w-3 h-3 shrink-0" />}
        <span>{live ? "LIVE" : "OFFLINE"}</span>
      </div>
    );
  }, [isConnected]);

  return (
    <div 
      className={`
        home-page min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto
        transition-transform duration-300 ease-out
        ${isGlobalShipping ? "scale-[0.99]" : "scale-100"}
      `}
      data-momentum={glowLevel}
    >
      <header className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${isFireMode ? "bg-orange-500 animate-pulse" : "bg-emerald-500"}`} />
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {isFireMode ? "Fire Mode Active 🔥" : "Operational Status: Live"}
            </span>

            {focusEngine.hasUrgentMoves && (
              <span className="ml-2 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-500/20">
                ⚠️ Urgent moves pending
              </span>
            )}
          </div>

          <h1 className="text-4xl font-semibold text-slate-800 dark:text-zinc-100 tracking-tight">
            Mission{" "}
            <span className={`${isFireMode ? "text-orange-500" : "text-slate-400 dark:text-zinc-500"} transition-colors duration-500`}>
              Control
            </span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1">Momentum</p>
            <div
              className={`
                text-xl font-semibold
                ${isFireMode ? "text-orange-500" : glowLevel >= 3 ? "text-violet-600 dark:text-violet-400" : "text-slate-800 dark:text-zinc-200"}
              `}
            >
              Level {glowLevel}
              {isFireMode && " 🔥"}
            </div>
          </div>

          <div className="w-px h-10 bg-slate-200 dark:bg-white/10" />

          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1">Global Rank</p>
            <p className="text-xl font-semibold text-slate-800 dark:text-zinc-200">Top 2%</p>
          </div>
        </div>
      </header>

      <TeamPulse
        variant="banner"
        showAvatars={true}
        showSummary={true}
        showTicker={true}
        className="mb-6 shadow-[0_4px_24px_rgba(139,92,246,0.06)]"
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
        <div className="col-span-12 xl:col-span-8">
          <div
            className={`
              ${sectionCardClasses}
              transition-all duration-300
              ${showEntranceHighlight ? "ring-2 ring-violet-300 dark:ring-violet-500/50 animate-pulse-once" : ""}
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
                      ${showEntranceHighlight && index === 0 ? "ring-2 ring-violet-200 dark:ring-violet-500/30 rounded-xl" : ""}
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
              <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-[13px] font-medium text-slate-500 flex items-center gap-2">
                <WifiOff strokeWidth={1.5} className="w-4 h-4 shrink-0" />
                Showing last known data — updates will resume automatically when you're back online.
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <IntelligencePanel onBalanceClick={() => handleOpenPanel("balance")} />

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

        <div className="col-span-12">
          <div className={sectionCardClasses} data-momentum={glowLevel}>
            <SectionHeader 
              icon={TrendingUp} 
              iconColor="text-violet-600 dark:text-violet-400" 
              title="Velocity Metrics" 
              rightSlot={LivePill} 
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Ships"
                value={summary.ships}
                color={isFireMode ? "text-orange-500" : "text-violet-600 dark:text-violet-400"}
                description="Total validated deployments in the last 7 days."
              />
              <StatCard
                label="Streak"
                value={`${summary.streakDays}D`}
                color="text-amber-600 dark:text-amber-500"
                description="Current consecutive shipping streak."
              />
              <StatCard
                label="Focus"
                value={`${summary.focus}%`}
                color="text-emerald-600 dark:text-emerald-400"
                description="Deep work time vs context switching."
              />
              <StatCard
                label="Efficiency"
                value={`${summary.efficiency >= 0 ? "+" : ""}${summary.efficiency}%`}
                color={isFireMode ? "text-orange-500" : "text-violet-600 dark:text-violet-400"}
                description="Change vs previous 7-day period."
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`
          fixed inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm z-[60]
          transition-opacity duration-300
          ${isPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={handleClosePanel}
      />

      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-[480px]
          bg-white dark:bg-[#111113] border-l border-slate-200 dark:border-white/10
          z-[70] p-8
          shadow-[0_24px_60px_-15px_rgba(0,0,0,0.15)]
          transition-transform duration-300 ease-out
          ${isPanelOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-300">
            {panelContent === "balance" ? "Team Balance" : "Mission Telemetry"}
          </h3>
          <button 
            onClick={handleClosePanel} 
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors active:scale-95"
          >
            <X strokeWidth={1.5} className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
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
