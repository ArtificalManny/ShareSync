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
// SURGICAL PASS:
// - Put "Your 3 Moves Today" first
// - Keep "Recommended for Today" second
// - Demote secondary status modules
// - Add stricter conditional rendering for low-signal sections
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from "react";
import { Zap, Clock, TrendingUp, Flame, Rocket, X, Wifi, WifiOff } from "lucide-react";
import "./Home.css";

import { useRenovation } from "../context/RenovationContext";
import TeamBalancePanel from "../components/home/TeamBalancePanel";
import ProjectTelemetryPanel from "../components/home/ProjectTelemetryPanel";
import MissionCard from "../components/home/MissionCard";
import MissionCardSkeleton from "../components/home/MissionCardSkeleton";
import IntelligencePanel from "../components/home/IntelligencePanel";
import { useWorkloadIntelligence } from "../hooks/useWorkloadIntelligence";
import WeekInMotion from "../components/home/WeekInMotion";
import MissionClock from "../components/home/MissionClock";

import { useAnalytics } from "../contexts/AnalyticsContext";
import { EntranceHighlight, useEntranceHighlight } from "../components/onboarding/AppEntrance";
import { useMomentumContext, useMomentumActivity } from "../contexts/MomentumContext";
import AllShipped from "../components/empty-states/AllShipped";

import TeamPulse from "../components/social/TeamPulse";
import LiveActivityFeed from "../components/social/LiveActivityFeed";
import StreakComparison from "../components/social/StreakComparison";
import MomentumContagion from "../components/social/MomentumContagion";
import { useShipSound, useXPSound, useAchievementUnlockSound } from "../sounds/AchievementSounds";
import { useUISounds } from "../hooks/useSounds";

import YourMovesToday from "../components/focus/YourMovesToday";
import { useFocusEngine } from "../contexts/FocusEngineContext";
import FirstMission from "../components/onboarding/FirstMission";
import { useOnboardingContext } from "../context/OnboardingContext";

import { useAuth } from "../context/AuthContext";
import { useHomeRealtime } from "../hooks/useHomeRealtime";
import { getProjectId } from "../utils/projectHelpers";
import useDocumentTitle from "../hooks/useDocumentTitle";

/* ───────────────────────────────────────────────────────────────────────────
   STAT CARD - Light theme with violet-tinted shadows
─────────────────────────────────────────────────────────────────────────── */
const StatCard = ({
  label,
  value,
  color = "text-violet-600 dark:text-violet-400",
  description,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { glowLevel, isFireMode } = useMomentumContext();

  return (
    <div
      className={`
        card-surface
        relative p-4 md:p-5 rounded-xl
        bg-white/95 dark:bg-[#121216]/95 border border-slate-200/80 dark:border-white/[0.08]
        hover:border-violet-200 dark:hover:border-violet-500/30
        shadow-sm hover:shadow-lg
        transition-all duration-200 cursor-default
        momentum-responsive-card momentum-card
        ${isHovered ? "transform -translate-y-0.5" : ""}
        ${isFireMode ? "border-orange-200 dark:border-orange-500/30 hover:border-orange-300" : ""}
      `}
      style={{
        boxShadow: isHovered
          ? "0 8px 32px rgba(139, 92, 246, 0.12)"
          : "0 4px 24px rgba(139, 92, 246, 0.06)",
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
          text-xl md:text-2xl font-semibold transition-all duration-200
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
            p-3 bg-white/95 dark:bg-[#121216] border border-slate-200/80 dark:border-white/[0.08] rounded-lg
            shadow-xl z-50
            animate-in fade-in slide-in-from-bottom-2 duration-200
          "
        >
          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
            {description}
          </p>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────────────────────────────────────────
   SUGGESTED MISSIONS GLYPH - discovery/radar visual
─────────────────────────────────────────────────────────────────────────── */
const SuggestedMissionsGlyph = ({ active = false }) => {
  return (
    <div
      className={`
        group relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden
        rounded-2xl shadow-[0_14px_36px_rgba(20,184,166,0.18)]
        ring-1 ring-white/80 dark:ring-white/10
        ${
          active
            ? "bg-[conic-gradient(from_135deg,#f97316,#ec4899,#8b5cf6,#14b8a6,#f97316)]"
            : "bg-[conic-gradient(from_135deg,#14b8a6,#38bdf8,#8b5cf6,#14b8a6)]"
        }
      `}
      aria-hidden="true"
    >
      <div className="absolute inset-[2px] rounded-[0.9rem] bg-white/95 dark:bg-[#08111f]/95" />
      <div
        className={`
          absolute inset-0 opacity-70 blur-xl
          ${active ? "bg-orange-300/35" : "bg-cyan-300/35"}
        `}
      />

      <svg
        viewBox="0 0 48 48"
        className="relative z-10 h-6 w-6 transition-transform duration-300 group-hover:scale-110"
        fill="none"
      >
        <circle
          cx="24"
          cy="24"
          r="13"
          stroke={active ? "#f97316" : "#14b8a6"}
          strokeWidth="2.2"
          strokeDasharray="3 4"
          opacity="0.78"
        />

        <circle
          cx="24"
          cy="24"
          r="6.5"
          fill={active ? "#f97316" : "#8b5cf6"}
          fillOpacity="0.12"
          stroke={active ? "#ec4899" : "#8b5cf6"}
          strokeWidth="2"
        />

        <path
          d="M24 9V14M24 34V39M9 24H14M34 24H39"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />

        <path
          d="M24 24L34 16"
          stroke={active ? "#ec4899" : "#38bdf8"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <circle
          cx="34"
          cy="16"
          r="4.2"
          fill={active ? "#ec4899" : "#14b8a6"}
        />

        <path
          d="M32.1 16.1L33.4 17.3L36.2 14.2"
          stroke="white"
          strokeWidth="1.55"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="24" cy="24" r="2.4" fill="#8b5cf6" />
      </svg>

      <span className="absolute right-1.5 top-1.5 z-20 h-2 w-2 rounded-full bg-white shadow-sm">
        <span
          className={`
            block h-full w-full rounded-full
            ${active ? "bg-orange-400" : "bg-emerald-400"}
          `}
        />
      </span>
    </div>
  );
};

/* ───────────────────────────────────────────────────────────────────────────
   SECTION HEADER - Light theme
─────────────────────────────────────────────────────────────────────────── */
const SectionHeader = ({
  icon: Icon,
  iconNode = null,
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
        {iconNode ? (
          iconNode
        ) : Icon ? (
          <Icon className={`w-4 h-4 ${isFireMode ? "text-orange-500" : iconColor}`} />
        ) : null}
        <h2 className="text-sm font-medium text-slate-600 dark:text-zinc-300">{title}</h2>
        {showMomentum && isFireMode && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 animate-pulse">
            🔥
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {rightSlot}

        {action && (
          <button
            onClick={handleAction}
            className="text-xs text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
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

  const config = {
    3: {
      bg: "bg-violet-50 dark:bg-violet-500/10",
      border: "border-violet-200 dark:border-violet-500/20",
      icon: TrendingUp,
      color: "text-violet-700 dark:text-violet-400",
    },
    4: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-200 dark:border-blue-500/20",
      icon: Rocket,
      color: "text-blue-700 dark:text-blue-400",
    },
    5: {
      bg: "bg-orange-50 dark:bg-orange-500/10",
      border: "border-orange-200 dark:border-orange-500/20",
      icon: Flame,
      color: "text-orange-700 dark:text-orange-400",
    },
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
          <div className="text-xs text-slate-500 dark:text-zinc-400">{message}</div>
        </div>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${currentConfig.color}`}>L{glowLevel}</div>
    </div>
  );
};

/* ───────────────────────────────────────────────────────────────────────────
   MAIN HOME PAGE
─────────────────────────────────────────────────────────────────────────── */
function getHomeProjectId(project) {
  const raw =
    // Priority-task missions often have id/_id as the TASK id.
    // Always prefer the parent project id first.
    project?.projectId?._id ||
    project?.projectId?.id ||
    project?.project?._id ||
    project?.project?.id ||
    project?.recommendedTask?.projectId?._id ||
    project?.recommendedTask?.projectId?.id ||
    project?.recommendedTask?.projectId ||
    project?.task?.projectId?._id ||
    project?.task?.projectId?.id ||
    project?.task?.projectId ||
    project?.raw?.projectId?._id ||
    project?.raw?.projectId?.id ||
    project?.raw?.projectId ||
    project?.metadata?.projectId ||
    project?.payload?.projectId ||
    project?.sourceProjectId ||
    project?.parentProjectId ||
    project?.projectId ||
    project?._id ||
    project?.id;

  if (!raw) return "";

  if (typeof raw === "object") {
    return String(raw._id || raw.id || raw.toString?.() || "");
  }

  return String(raw);
}

export default function Home() {
  useDocumentTitle("Home");

  const { user: authUser } = useAuth();
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

  let onboardingCtx = { isCompleted: true, shouldShowOnboarding: false };
  try {
    onboardingCtx = useOnboardingContext?.() || onboardingCtx;
  } catch (e) {}

  const showFirstMission =
    onboardingCtx.shouldShowOnboarding && !onboardingCtx.isCompleted;

  let focusEngine = { hasUrgentMoves: false };
  try {
    focusEngine = useFocusEngine() || { hasUrgentMoves: false };
  } catch (e) {}

  const { dashboardStats, loading: analyticsLoading } = useAnalytics() || {};
  const workloadIntel = useWorkloadIntelligence({ refreshMs: 120000 });

  const {
    loadingMissions,
    missions = [],
    activities = [],
    summary = { ships: 0, streakDays: 0, focus: 0, efficiency: 0 },
    teamPulse = { activeCount: 0, shippingNow: 0, inFocus: 0, actors: [] },
    streakComparison = { userStreakDays: 0, teamAvgDays: 0, rankText: "--" },
    intelligence = {
      peakWindowStart: null,
      peakWindowEnd: null,
      productivity: 0,
      coWorkingMultiplier: 1,
      isCoWorking: false,
    },
    shippedStats = { tasksCompleted: 0, xpEarned: 0, bonusXP: 0 },
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

  const handleFocusMoveClick = useCallback(
    (move) => {
      playClick();
      console.log("Focus move clicked:", move);
    },
    [playClick]
  );

  const handleActivityClick = useCallback(
    (activity) => {
      playClick();
      console.log("Activity clicked:", activity);
    },
    [playClick]
  );

  const handleShipped = useCallback(
    (projectId) => {
      const shippedMission = missions.find((m) => getHomeProjectId(m) === projectId);

      if (!shippedMission) {
        console.warn("[Home] Could not find shipped mission:", projectId);
        return;
      }

      const isLastMission = missions.length <= 1;

      recordActivity("PROJECT_SHIP", {
        projectId,
        projectName: shippedMission?.title,
      });

      const baseXP = 50;
      const momentumBonus = glowLevel >= 3 ? 10 : 0;
      const totalXP = baseXP + momentumBonus;

      const shipData = {
        taskCount: shippedMission?.raw?.metrics?.openTasks?.value || 1,
        durationDays: 1,
        isProduction: isLastMission || isFireMode,
      };

      playShipSound(shipData);

      import("../utils/fireCelebration")
        .then(({ fireCelebration }) => {
          fireCelebration("shipCeremony", {
            xp: totalXP,
            taskTitle: shippedMission?.title,
            projectName: shippedMission?.title,
            teamName: "Team",
          });
        })
        .catch(() => {});

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
    [
      missions,
      recordActivity,
      glowLevel,
      isFireMode,
      playShipSound,
      playXP,
      playAchievementUnlock,
      refreshAll,
    ]
  );

  const sectionCardClasses = useMemo(() => {
    const base =
      "home-section-surface p-6 rounded-xl bg-white/95 dark:bg-[#121216]/95 border border-slate-200/80 dark:border-white/[0.08] momentum-responsive-card momentum-card";
    const shadow =
      "shadow-[0_4px_24px_rgba(139,92,246,0.06)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)] dark:shadow-[0_18px_55px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_22px_65px_rgba(0,0,0,0.34)]";

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
          px-2 py-1 rounded-full
          border text-[10px] font-medium
          ${
            live
              ? "bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-400"
              : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400"
          }
        `}
        title={live ? "Connected to live updates" : "Offline (showing last known data)"}
      >
        {live ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{live ? "LIVE" : "OFFLINE"}</span>
      </div>
    );
  }, [isConnected]);

  const hasSuggestedTask = Boolean(missions?.[0]?.title);
  const hasTeamActivity = Array.isArray(activities) && activities.length > 0;
  const hasUsefulIntelligence = Boolean(
    intelligence?.peakWindowStart ||
      intelligence?.peakWindowEnd ||
      Number(intelligence?.productivity || 0) > 0 ||
      Number(intelligence?.coWorkingMultiplier || 0) > 1 ||
      intelligence?.isCoWorking
  );
  const hasCompetitiveStreakSignal = Boolean(
    Number(streakComparison?.userStreakDays || 0) > 0 ||
      Number(streakComparison?.teamAvgDays || 0) > 0 ||
      (streakComparison?.rankText && streakComparison.rankText !== "--")
  );
  const hasMeaningfulVelocity = Boolean(
    Number(summary?.ships || 0) > 0 ||
      Number(summary?.streakDays || 0) > 0 ||
      Number(summary?.focus || 0) > 0 ||
      Number(summary?.efficiency || 0) !== 0
  );
  const hasRightRail =
    hasUsefulIntelligence || hasTeamActivity || hasCompetitiveStreakSignal;

  return (
    <div
      className="home-page home-dark-polish-v2 home-dark-surface min-h-screen w-full max-w-full px-4 py-5 md:p-6 lg:p-10 md:max-w-[1600px] md:mx-auto text-slate-900 dark:text-zinc-100 transition-colors duration-300"
      data-momentum={glowLevel}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:justify-between items-start md:items-end gap-2 md:gap-0">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-2 h-2 rounded-full ${
                isFireMode ? "bg-orange-500 animate-pulse" : "bg-teal-500"
              }`}
            />
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {isFireMode ? "Fire Mode Active 🔥" : "Operational Status: Live"}
            </span>

            {focusEngine.hasUrgentMoves && (
              <span className="ml-2 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium border border-amber-200 dark:border-amber-500/20">
                ⚠️ Urgent moves pending
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-slate-800 dark:text-zinc-100">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return "Good morning";
              if (hour < 18) return "Good afternoon";
              return "Good evening";
            })()},{" "}
            <span
              className={`${
                isFireMode
                  ? "text-orange-500"
                  : "text-violet-600 dark:text-zinc-300"
              } transition-colors duration-500`}
            >
              {authUser?.firstName || "Builder"}
            </span>
          </h1>
          <MissionClock />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          PRIMARY ACTION ZONE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="home-focus-shell mb-8">
        <YourMovesToday
          variant="default"
          maxMoves={3}
          showHeader={true}
          showFooter={true}
          showRefresh={true}
          onMoveClick={handleFocusMoveClick}
          onViewAll={() => console.log("View all daily focus moves")}
        />
      </div>

      {showFirstMission && (
        <div className="mb-8">
          <FirstMission
            onMissionCreated={(task) => {
              console.log("[Home] First mission created:", task);
              refreshAll?.();
            }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Missions */}
        <div className={hasRightRail ? "col-span-12 xl:col-span-8" : "col-span-12"}>
          <div
            className={`
              ${sectionCardClasses}
              transition-all duration-300
              ${
                showEntranceHighlight
                  ? "ring-2 ring-violet-300 dark:ring-violet-500/50 animate-pulse-once"
                  : ""
              }
            `}
            data-momentum={glowLevel}
          >
            <SectionHeader
              iconNode={<SuggestedMissionsGlyph active={isFireMode || glowLevel >= 3} />}
              title="Suggested Projects & Missions"
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
                      ${
                        showEntranceHighlight && index === 0
                          ? "ring-2 ring-violet-200 dark:ring-violet-500/30 rounded-xl"
                          : ""
                      }
                    `}
                    style={{
                      animationDelay: showEntranceHighlight ? `${index * 100}ms` : "0ms",
                    }}
                  >
                    <MissionCard
                      project={mission}
                      onClick={() => {
                          const projectId =
                            getHomeProjectId(mission) ||
                            mission?.projectId ||
                            mission?._id ||
                            mission?.id;

                          if (projectId) {
                            window.location.href = `/projects/${projectId}`;
                          }
                        }}
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
                  variant={
                    shippedStats.tasksCompleted > 0 ? "celebratory" : "illustrated"
                  }
                />
              )}
            </div>

            {!isConnected && (
              <div className="mt-4 text-[11px] text-slate-500 dark:text-zinc-500 flex items-center gap-2">
                <WifiOff className="w-3.5 h-3.5" />
                Showing last known data — updates will resume automatically when
                you're back online.
              </div>
            )}
          </div>


          <WeekInMotion className="mt-6" onShipNow={() => refreshAll?.()} />
        </div>

        {/* Right sidebar */}
        {hasRightRail && (
          <div className="home-right-rail col-span-12 xl:col-span-4 space-y-6">
            {hasUsefulIntelligence && (
              <div className="home-intelligence-panel" data-momentum={glowLevel}>
                <IntelligencePanel
                  workload={workloadIntel.data}
                  workloadLoading={workloadIntel.loading}
                  workloadError={workloadIntel.error}
                  isBalanced={workloadIntel.data?.isBalanced ?? false}
                  onBalanceClick={() => handleOpenPanel("balance")}
                  peakWindowStart={intelligence.peakWindowStart}
                  peakWindowEnd={intelligence.peakWindowEnd}
                  productivity={intelligence.productivity}
                  coWorkingMultiplier={intelligence.coWorkingMultiplier}
                  isCoWorking={intelligence.isCoWorking}
                />
              </div>
            )}

            {hasTeamActivity && (
              <LiveActivityFeed
                variant="sidebar"
                maxItems={10}
                showFilters={false}
                showSummary={false}
                onActivityClick={handleActivityClick}
                injectedItems={activities}
              />
            )}

            {hasCompetitiveStreakSignal && (
              <StreakComparison
                variant="compact"
                showChart={false}
                showLeader={true}
                showRank={true}
                userStreakDays={
                  Number(
                    summary?.streakDays ??
                      summary?.currentStreak ??
                      streakComparison?.userStreakDays ??
                      0
                  ) || 0
                }
                teamAvgDays={
                  Number(
                    streakComparison?.teamAvgDays ??
                      summary?.teamAvgDays ??
                      summary?.teamAverageStreak ??
                      0
                  ) || 0
                }
                rankText={streakComparison?.rankText || "Top 3"}
              />
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECONDARY SUPPORT ZONE
        ═══════════════════════════════════════════════════════════════════ */}
{glowLevel >= 3 && (
          <div className="col-span-12">
            <MomentumStatusBanner />
          </div>
        )}

        {hasTeamActivity && (
          <div className="col-span-12">
            <MomentumContagion
              activities={activities}
              maxVisible={3}
              showCTA={true}
              onPickMove={() => console.log("Pick move from contagion")}
              variant="compact"
            />
          </div>
        )}

        {hasMeaningfulVelocity && (
          <div className="col-span-12">
            <div className={`home-velocity-metrics-panel ${sectionCardClasses}`} data-momentum={glowLevel}>
              <SectionHeader
                icon={TrendingUp}
                iconColor="text-violet-600 dark:text-violet-400"
                title="Velocity Metrics"
                rightSlot={LivePill}
              />

              <div className="home-velocity-stat-grid home-stat-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                  label="Ships"
                  value={summary?.ships || 0}
                  color={
                    isFireMode
                      ? "text-orange-500"
                      : "text-violet-600 dark:text-violet-400"
                  }
                  description="Total validated ships across your account."
                />
                <StatCard
                  label="Streak"
                  value={`${summary?.streakDays || 0}D`}
                  color="text-amber-600 dark:text-amber-500"
                  description="Current streak of active days."
                />
                {/* Focus and Efficiency hidden 2026-04-30: dependent on
                    activities pipeline that's currently 404'ing in
                    useHomeRealtime. Restore when backend activity endpoint
                    is wired up. See dev journal entry of 2026-04-30. */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SLIDE-OUT PANEL - Light theme
      ═══════════════════════════════════════════════════════════════════ */}
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
          bg-white/95 dark:bg-[#111113] border-l border-slate-200/80 dark:border-white/[0.08]
          z-[70] p-8
          shadow-2xl shadow-slate-900/10 dark:shadow-black/50
          transition-transform duration-300 ease-out
          ${isPanelOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">
            {panelContent === "balance" ? "Team Balance" : "Mission Telemetry"}
          </h3>
          <button
            onClick={handleClosePanel}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
          </button>
        </div>

        {panelContent === "balance" ? (
          <TeamBalancePanel
            workload={workloadIntel.data}
            loading={workloadIntel.loading}
            error={workloadIntel.error}
            onRefresh={workloadIntel.refresh}
          />
        ) : (
          <ProjectTelemetryPanel project={selectedMission} />
        )}
      </div>

      <style>{`
        /* HOME DARK SURFACE LOCAL OVERRIDES */
        html.dark .home-page.home-dark-surface,
        html[data-theme="dark"] .home-page.home-dark-surface,
        .dark .home-page.home-dark-surface,
        [data-theme="dark"] .home-page.home-dark-surface {
          background:
            radial-gradient(circle at top left, rgba(139, 92, 246, 0.12), transparent 34%),
            radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.08), transparent 30%),
            linear-gradient(180deg, #09090B 0%, #0F0F14 42%, #09090B Available) !important;
          color: #F8FAFC;
          box-shadow: 0 0 0 100vmax #09090B;
          clip-path: inset(0 -100vmax);
        }

        html.dark .home-page.home-dark-surface .home-section-surface,
        html[data-theme="dark"] .home-page.home-dark-surface .home-section-surface,
        .dark .home-page.home-dark-surface .home-section-surface,
        [data-theme="dark"] .home-page.home-dark-surface .home-section-surface {
          background: rgba(18, 18, 22, 0.95) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow:
            0 18px 55px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.035) !important;
        }

        html.dark .home-page.home-dark-surface .home-pulse-shell,
        html[data-theme="dark"] .home-page.home-dark-surface .home-pulse-shell,
        .dark .home-page.home-dark-surface .home-pulse-shell,
        [data-theme="dark"] .home-page.home-dark-surface .home-pulse-shell {
          background: rgba(17, 17, 22, 0.72) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #E5E7EB !important;
          box-shadow: 0 12px 38px rgba(0, 0, 0, 0.18) !important;
        }

        /* HOME DARK MODE POLISH BRIDGE */
        html.dark .home-page.home-dark-polish-v2,
        html[data-theme="dark"] .home-page.home-dark-polish-v2,
        .dark .home-page.home-dark-polish-v2,
        [data-theme="dark"] .home-page.home-dark-polish-v2 {
          background:
            radial-gradient(circle at 15% 8%, rgba(124, 58, 237, 0.16), transparent 30%),
            radial-gradient(circle at 88% 72%, rgba(34, 211, 238, 0.075), transparent 30%),
            linear-gradient(180deg, #07090F 0%, #090B12 48%, #07090F Available) !important;
          color: #F5F7FB !important;
          box-shadow: 0 0 0 100vmax #07090F;
          clip-path: inset(0 -100vmax);
        }

        html.dark .home-page.home-dark-polish-v2 .home-section-surface,
        html.dark .home-page.home-dark-polish-v2 .momentum-card,
        html.dark .home-page.home-dark-polish-v2 .card-surface,
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-section-surface,
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .momentum-card,
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .card-surface,
        .dark .home-page.home-dark-polish-v2 .home-section-surface,
        .dark .home-page.home-dark-polish-v2 .momentum-card,
        .dark .home-page.home-dark-polish-v2 .card-surface,
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-section-surface,
        [data-theme="dark"] .home-page.home-dark-polish-v2 .momentum-card,
        [data-theme="dark"] .home-page.home-dark-polish-v2 .card-surface {
          background:
            linear-gradient(180deg, rgba(17, 19, 26, 0.96), rgba(13, 15, 21, 0.96)) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #F5F7FB !important;
          box-shadow:
            0 18px 55px rgba(0, 0, 0, 0.30),
            inset 0 1px 0 rgba(255, 255, 255, 0.035) !important;
        }

        html.dark .home-page.home-dark-polish-v2 .home-pulse-shell,
        html.dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-white"],
        html.dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-slate-50"],
        html.dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-violet-50"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell,
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-white"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-slate-50"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-violet-50"],
        .dark .home-page.home-dark-polish-v2 .home-pulse-shell,
        .dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-white"],
        .dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-slate-50"],
        .dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-violet-50"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell,
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-slate-50"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-violet-50"] {
          background: rgba(23, 26, 34, 0.94) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #E5E7EB !important;
          box-shadow: 0 12px 38px rgba(0, 0, 0, 0.20) !important;
        }

        html.dark .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-white"],
        html.dark .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-white"],
        html.dark .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-white"],
        html.dark .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-slate-50"],
        html.dark .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-slate-50"],
        html.dark .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-slate-50"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-white"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-white"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-white"],
        .dark .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-white"],
        .dark .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-white"],
        .dark .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-white"] {
          background: rgba(23, 26, 34, 0.94) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #F5F7FB !important;
        }

        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-800"],
        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-900"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-800"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-900"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-800"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-900"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-800"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-900"] {
          color: #F5F7FB !important;
        }

        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-500"],
        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-600"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-500"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-600"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-500"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-600"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-500"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-600"] {
          color: #A7B0C0 !important;
        }

        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-400"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-400"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-400"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-400"] {
          color: #7F889A !important;
        }

        @keyframes pulse-once {
          0% { box-shadow: 0 0 0 0 rgb(139 92 246 / 0.3); }
          50% { box-shadow: 0 0 0 8px rgb(139 92 246 / 0); }
          Available { box-shadow: 0 0 0 0 rgb(139 92 246 / 0); }
        }
        .animate-pulse-once {
          animation: pulse-once 600ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
