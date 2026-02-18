// src/pages/ProjectHome.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HOME: Mission Control with Premium View Navigation
// Integrates existing hooks/context with new Pulse/Stack/Flow/etc. views
// ⭐ FIX: Added validation for project ID to prevent /projects/undefined issue
// ⭐ FIX: RoadmapView now receives projectId for API integration
// ⭐ ADD: Force-refresh view content on realtime task updates (pulseRefreshKey)
// ⭐ ADD: PulseWidget uses liveTasks + updates instantly on taskUpdated
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/toast";

// Icons
import {
  Gauge,
  Layers,
  GitBranch,
  Map,
  Calendar,
  BarChart3,
  MessageCircle,
  Archive,
  Plus,
  MoreHorizontal,
  Star,
  Share2,
  Settings,
  Rocket,
  Activity,
  Users,
  Clock,
  Zap,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flame,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// Hooks
import { useProjectOverview } from "../hooks/useProjectOverview";
import { useIsMobile } from "../hooks/useMobile";
import usePresence from "../hooks/usePresence";

// Context
import { useCursorContext } from "../context/CursorContext";
import { useCursorFlash } from "../hooks/useCursor";

// Global
import GlobalPulseBar, { useGlobalPulse } from "../components/ui/GlobalPulseBar";

// Utilities
import QuickActionsManager from "../components/quick-actions/QuickActionsManager";
import KeyboardShortcuts from "../components/quick-actions/KeyboardShortcuts";

// Suggestions
import * as SuggestionsPanelModule from "../components/suggestions/SuggestionsPanel";

// Realtime
import { useSocketContext } from "../context/SocketContext";
import { applyTaskUpdated } from "../utils/taskRealtime";

// Pulse
import PulseWidget from "../components/pulse/PulseWidget";

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW COMPONENTS - Import all the new views
// ═══════════════════════════════════════════════════════════════════════════════
import StackPanel from "../features/stack/StackPanel";
import FlowBoard from "../features/flow/FlowBoard";
import RoadmapView from "../components/views/RoadmapView";
import RhythmView from "../components/views/RhythmView";
import InsightsView from "../components/views/InsightsView";
import ThreadsView from "../components/views/ThreadsView";
import VaultView from "../components/views/VaultView";

const SuggestionsPanel =
  SuggestionsPanelModule.default || SuggestionsPanelModule.SuggestionsPanel;

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW CONFIGURATION - Premium ShareSync-branded names
// ═══════════════════════════════════════════════════════════════════════════════

const PROJECT_VIEWS = [
  { id: "pulse", label: "Pulse", icon: Gauge, description: "Project heartbeat" },
  { id: "stack", label: "Stack", icon: Layers, description: "Your work queue" },
  { id: "flow", label: "Flow", icon: GitBranch, description: "Workflow lanes" },
  { id: "roadmap", label: "Roadmap", icon: Map, description: "Timeline view" },
  { id: "rhythm", label: "Rhythm", icon: Calendar, description: "Schedule & tempo" },
  { id: "insights", label: "Insights", icon: BarChart3, description: "AI analytics" },
  { id: "suggestions", label: "Suggestions", icon: Sparkles, description: "AI next moves" },
  { id: "threads", label: "Threads", icon: MessageCircle, badge: 3, description: "Conversations" },
  { id: "vault", label: "Vault", icon: Archive, description: "Files & assets" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingState() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin mx-auto mb-4" />
        <p className="text-text-tertiary text-sm">Loading project...</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR STATE
// ═══════════════════════════════════════════════════════════════════════════════

function ErrorState({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-error-500/10 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-error-400" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Failed to load project</h2>
        <p className="text-text-tertiary mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-400 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HEADER (Simplified, clean)
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectHeader({ project, metrics, activeUsers, onShipUpdate, onSettings }) {
  const [isStarred, setIsStarred] = useState(false);
  const momentum = metrics?.momentum || 0;

  const getMomentumState = () => {
    if (momentum >= 80) return { label: "On Fire", color: "text-warning-400" };
    if (momentum >= 60) return { label: "Flowing", color: "text-success-400" };
    if (momentum >= 30) return { label: "Building", color: "text-brand-400" };
    return { label: "Warming Up", color: "text-text-tertiary" };
  };

  const state = getMomentumState();

  return (
    <header className="px-10 py-6 border-b border-white/[0.06] bg-surface-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-tertiary mb-5">
        <span className="hover:text-text-secondary cursor-pointer transition-colors">Projects</span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-text-secondary">{project?.name || "Project"}</span>
      </nav>

      {/* Main header */}
      <div className="flex items-start justify-between gap-8">
        {/* Left: Project identity */}
        <div className="flex items-start gap-5 flex-1 min-w-0">
          {/* Project icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
            style={{
              backgroundColor: (project?.color || "#7C3AED") + "15",
              boxShadow: `0 8px 32px ${project?.color || "#7C3AED"}20`,
            }}
          >
            {project?.icon || "📁"}
          </div>

          {/* Project info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-text-primary truncate">
                {project?.name || "Untitled Project"}
              </h1>
              <button
                onClick={() => setIsStarred(!isStarred)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    isStarred
                      ? "fill-warning-400 text-warning-400"
                      : "text-text-tertiary hover:text-warning-400"
                  }`}
                />
              </button>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-5">
              {/* Live indicator */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success-400"></span>
                </span>
                <span className="text-sm text-success-400 font-medium">Live</span>
              </div>

              {/* Active members */}
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Users className="w-4 h-4" />
                <span>{activeUsers || 0} online</span>
              </div>

              {/* Momentum */}
              <div className={`flex items-center gap-2 text-sm font-medium ${state.color}`}>
                <Zap className="w-4 h-4" />
                <span>{momentum}</span>
                <span className="text-text-tertiary font-normal">· {state.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => onShipUpdate?.("Shipped an update")}
            className="
              flex items-center gap-2.5 px-5 py-2.5 rounded-xl
              bg-gradient-to-r from-brand-500 to-purple-600
              text-white font-medium text-sm
              hover:from-brand-400 hover:to-purple-500
              transition-all duration-200
              shadow-lg shadow-brand-500/25
              hover:shadow-xl hover:shadow-brand-500/30
              hover:-translate-y-0.5 active:translate-y-0
            "
          >
            <Rocket className="w-4 h-4" />
            <span>Ship Update</span>
          </button>

          <button
            className="
            flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-surface-1 border border-white/[0.08]
            text-text-secondary text-sm
            hover:bg-surface-2 hover:border-white/[0.12]
            transition-all duration-200
          "
          >
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </button>

          <div className="w-px h-6 bg-white/[0.08]" />

          <button className="p-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-all">
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={onSettings}
            className="p-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

function ViewNavigation({ activeView, onViewChange, views = PROJECT_VIEWS }) {
  const [showMore, setShowMore] = useState(false);

  const visibleViews = views.slice(0, 6);
  const moreViews = views.slice(6);

  return (
    <nav className="px-10 border-b border-white/[0.06] bg-surface-0/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-1 -mb-px">
        {visibleViews.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;

          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                relative flex items-center gap-2.5 px-5 py-4
                text-sm font-medium transition-all duration-200
                ${isActive ? "text-brand-400" : "text-text-tertiary hover:text-text-secondary"}
              `}
              title={view.description}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-brand-400" : ""}`} />
              <span>{view.label}</span>

              {view.badge && (
                <span className="px-1.5 py-0.5 rounded-md bg-brand-500/15 text-brand-400 text-xs font-medium">
                  {view.badge}
                </span>
              )}

              {isActive && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-500 rounded-full" />}
            </button>
          );
        })}

        {moreViews.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1.5 px-4 py-4 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMore && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)} />
                <div className="absolute top-full right-0 mt-2 w-52 bg-surface-1 border border-white/[0.08] rounded-xl shadow-xl z-20 overflow-hidden">
                  {moreViews.map((view) => {
                    const Icon = view.icon;
                    return (
                      <button
                        key={view.id}
                        onClick={() => {
                          onViewChange(view.id);
                          setShowMore(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-white/[0.04] transition-colors"
                      >
                        <Icon className="w-4 h-4 text-text-tertiary" />
                        <span>{view.label}</span>
                        {view.badge && (
                          <span className="ml-auto px-1.5 py-0.5 rounded-md bg-brand-500/15 text-brand-400 text-xs">
                            {view.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <button className="flex items-center gap-1.5 px-3 py-4 text-sm text-text-tertiary hover:text-brand-400 transition-colors ml-1">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PULSE VIEW - Main Overview Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

function PulseView({
  project,
  metrics,
  criticalMoves,
  objectives,
  sprint,
  activity,
  onObjectiveClick,
  onSprintAction,
  tasks = [],
}) {
  return (
    <div className="p-10 max-w-[1600px] mx-auto">
      {/* Row 0: Pulse mini widget */}
      <div className="mb-8">
        <PulseWidget tasks={tasks} />
      </div>

      {/* Row 1: Momentum + Priority Stack */}
      <div className="grid grid-cols-12 gap-8 mb-8">
        <div className="col-span-4">
          <MomentumCard
            momentum={metrics?.momentum || 0}
            weeklyShips={metrics?.weeklyShips || 0}
            trend={metrics?.momentumTrend}
          />
        </div>
        <div className="col-span-8">
          <PriorityStack moves={criticalMoves} />
        </div>
      </div>

      {/* Row 2: Sprint + Foresight + Activity */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        <SprintCard sprint={sprint} onAction={onSprintAction} />
        <ForesightCard metrics={metrics} />
        <LiveActivityCard activities={activity} />
      </div>

      {/* Row 3: Team Capacity + Active Goals */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-5">
          <TeamCapacityCard metrics={metrics} />
        </div>
        <div className="col-span-7">
          <ActiveGoalsCard objectives={objectives} onObjectiveClick={onObjectiveClick} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOMENTUM CARD
// ═══════════════════════════════════════════════════════════════════════════════

function MomentumCard({ momentum = 0, weeklyShips = 0, trend = 0 }) {
  const getState = () => {
    if (momentum >= 80) return { label: "On Fire", color: "text-warning-400", ring: "#F59E0B", bg: "from-warning-500/10 to-orange-500/10" };
    if (momentum >= 60) return { label: "Flowing", color: "text-success-400", ring: "#10B981", bg: "from-success-500/10 to-emerald-500/10" };
    if (momentum >= 30) return { label: "Building", color: "text-brand-400", ring: "#7C3AED", bg: "from-brand-500/10 to-purple-500/10" };
    return { label: "Warming Up", color: "text-text-tertiary", ring: "#6B7280", bg: "from-surface-2 to-surface-3" };
  };

  const state = getState();
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (Math.min(momentum, 100) / 100) * circumference;

  return (
    <div className={`h-full p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-br ${state.bg}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-text-secondary tracking-wide uppercase">Momentum</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${state.color} bg-current/10`}>{state.label}</span>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={state.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${state.color}`}>{Math.round(momentum)}</span>
            <span className="text-xs text-text-tertiary mt-1">/ 100</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div>
          <div className="text-xl font-semibold text-text-primary">{weeklyShips}</div>
          <div className="text-xs text-text-tertiary">ships this week</div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
          <TrendingUp className={`w-4 h-4 ${trend >= 0 ? "text-success-400" : "text-error-400"}`} />
          <span>
            {trend >= 0 ? "+" : ""}
            {trend}% vs last week
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY STACK
// ═══════════════════════════════════════════════════════════════════════════════

function PriorityStack({ moves = [] }) {
  const displayMoves =
    moves.length > 0 ? moves.slice(0, 3) : [{ id: 1, title: "No critical moves right now", description: "All caught up! 🎉", xp: 0 }];

  const hasMoves = moves.length > 0;

  return (
    <div className="h-full p-6 rounded-2xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-text-secondary tracking-wide uppercase">Priority Stack</h3>
          <p className="text-xs text-text-tertiary mt-1">Your highest-impact moves today</p>
        </div>
        {hasMoves && (
          <button className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors">View all →</button>
        )}
      </div>

      <div className="space-y-3">
        {displayMoves.map((move, idx) => (
          <div
            key={move.id}
            className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer
              ${hasMoves ? "bg-surface-2/50 border border-transparent hover:border-brand-500/20 hover:bg-surface-2" : "bg-surface-2/30"}`}
          >
            {hasMoves && (
              <div
                className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                ${idx === 0 ? "bg-brand-500/20 text-brand-400" : "bg-surface-3 text-text-tertiary"}
              `}
              >
                {idx + 1}
              </div>
            )}

            {move.icon && <span className="text-xl">{move.icon}</span>}

            <div className="flex-1 min-w-0">
              <div
                className={`font-medium truncate ${
                  hasMoves ? "text-text-primary group-hover:text-brand-400" : "text-text-secondary"
                } transition-colors`}
              >
                {move.title}
              </div>
              {move.description && <div className="text-xs text-text-tertiary mt-0.5">{move.description}</div>}
            </div>

            {move.xp > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-sm font-semibold">+{move.xp}</span>
              </div>
            )}

            {hasMoves && (
              <button className="opacity-0 group-hover:opacity-100 p-2.5 rounded-lg bg-brand-500 text-white transition-all hover:bg-brand-400">
                <Play className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {hasMoves && displayMoves.length >= 3 && (
        <div className="mt-5 pt-5 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-warning-400" />
            <span className="text-sm text-text-tertiary">Complete all 3 for bonus</span>
          </div>
          <div className="flex items-center gap-1.5 text-warning-400 font-semibold">
            <Zap className="w-4 h-4" />
            <span>+500 momentum</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function SprintCard({ sprint, onAction }) {
  const hasSprint = sprint && sprint.name;

  const s = sprint || {
    name: "No Active Sprint",
    progress: 0,
    daysLeft: 0,
    tasksComplete: 0,
    tasksTotal: 0,
  };

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (Math.min(s.progress || 0, 100) / 100) * circumference;

  return (
    <div className="p-6 rounded-2xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-5">
        <Flame className="w-5 h-5 text-warning-400" />
        <h3 className="text-sm font-medium text-text-secondary tracking-wide uppercase">Current Sprint</h3>
      </div>

      <div className="text-lg font-semibold text-text-primary mb-5 truncate">{s.name}</div>

      {hasSprint ? (
        <>
          <div className="flex items-center gap-6 mb-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-brand-400">{Math.round(s.progress || 0)}%</span>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Time left</span>
                </div>
                <span className="text-sm font-medium text-text-primary">{s.daysLeft || 0} days</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Tasks</span>
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {s.tasksComplete || 0}/{s.tasksTotal || 0}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onAction?.("review")}
            className="w-full py-2.5 rounded-xl bg-brand-500/10 text-brand-400 text-sm font-medium hover:bg-brand-500/20 transition-colors"
          >
            Review Sprint
          </button>
        </>
      ) : (
        <button
          onClick={() => onAction?.("start")}
          className="w-full py-3 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
        >
          Start a Sprint
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORESIGHT CARD (AI Predictions)
// ═══════════════════════════════════════════════════════════════════════════════

function ForesightCard({ metrics }) {
  const completionForecast = metrics?.completionForecast || 0;
  const risks = metrics?.risks || [];
  const suggestions = metrics?.suggestions || [];

  const forecastStatus = completionForecast >= 80 ? "On Track" : completionForecast >= 60 ? "Monitor" : "At Risk";
  const forecastColor =
    completionForecast >= 80
      ? "text-success-400 bg-success-500/15"
      : completionForecast >= 60
      ? "text-warning-400 bg-warning-500/15"
      : "text-error-400 bg-error-500/15";

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-brand-500/5 to-transparent border border-purple-500/20">
      <div className="flex items-center gap-2 mb-5">
        <Eye className="w-5 h-5 text-purple-400" />
        <h3 className="text-sm font-medium text-text-secondary tracking-wide uppercase">Foresight</h3>
        <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">AI</span>
      </div>

      <div className="space-y-4">
        {/* Forecast */}
        <div className="p-3 rounded-xl bg-surface-0/60">
          <div className="text-xs text-text-tertiary mb-1.5">Sprint completion forecast</div>
          <div className="flex items-center gap-3">
            <span
              className={`text-2xl font-bold ${
                completionForecast >= 80 ? "text-success-400" : completionForecast >= 60 ? "text-warning-400" : "text-error-400"
              }`}
            >
              {completionForecast || "--"}%
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${forecastColor}`}>{forecastStatus}</span>
          </div>
        </div>

        {/* Risk */}
        {risks.length > 0 ? (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-error-500/10 border border-error-500/15">
            <AlertTriangle className="w-4 h-4 text-error-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="text-error-400 font-medium">{risks[0].type}:</span> {risks[0].message}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-success-500/10 border border-success-500/15">
            <CheckCircle2 className="w-4 h-4 text-success-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="text-success-400 font-medium">Looking good!</span> No major risks detected
            </p>
          </div>
        )}

        {/* Suggestion */}
        {suggestions.length > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/15">
            <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="text-brand-400 font-medium">Suggestion:</span> {suggestions[0]}
            </p>
          </div>
        )}
      </div>

      <button className="w-full mt-4 py-2 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
        Run scenario simulation →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE ACTIVITY CARD
// ═══════════════════════════════════════════════════════════════════════════════

function LiveActivityCard({ activities = [] }) {
  const displayActivities = activities.slice(0, 4);

  return (
    <div className="p-6 rounded-2xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-medium text-text-secondary tracking-wide uppercase">Live Activity</h3>
        </div>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-400"></span>
        </span>
      </div>

      <div className="space-y-4">
        {displayActivities.length > 0 ? (
          displayActivities.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-lg flex-shrink-0">
                {item.avatar || item.user?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">
                  <span className="font-medium text-text-primary">{item.user}</span>
                  <span className="text-text-tertiary"> {item.action} </span>
                  <span className="text-brand-400 font-medium">{item.target}</span>
                </p>
                <span className="text-xs text-text-tertiary">{item.time}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-text-tertiary text-sm">No recent activity</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM CAPACITY CARD
// ═══════════════════════════════════════════════════════════════════════════════

function TeamCapacityCard({ metrics }) {
  const team = metrics?.teamCapacity || [];

  const getBarColor = (utilization) => {
    if (utilization > 100) return "bg-error-500";
    if (utilization > 90) return "bg-warning-500";
    if (utilization > 50) return "bg-success-500";
    return "bg-cyan-500";
  };

  const hasImbalance = team.some((m) => m.utilization > 100);

  return (
    <div className="h-full p-6 rounded-2xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-400" />
          <h3 className="text-sm font-medium text-text-secondary tracking-wide uppercase">Team Capacity</h3>
        </div>
        {hasImbalance && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-warning-500/15 text-warning-400">Needs rebalancing</span>
        )}
      </div>

      {team.length > 0 ? (
        <>
          <div className="space-y-4 mb-5">
            {team.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-base flex-shrink-0">
                  {member.avatar || member.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-text-primary truncate">{member.name}</span>
                    <span className={`text-xs font-medium ${member.utilization > 100 ? "text-error-400" : "text-text-tertiary"}`}>
                      {Math.round(member.utilization)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getBarColor(member.utilization)}`}
                      style={{ width: `${Math.min(member.utilization, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full py-2.5 rounded-xl border border-white/[0.08] text-text-secondary text-sm font-medium hover:bg-surface-2 transition-colors">
            Rebalance workload
          </button>
        </>
      ) : (
        <div className="py-8 text-center text-text-tertiary text-sm">No team members assigned</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVE GOALS CARD
// ═══════════════════════════════════════════════════════════════════════════════

function ActiveGoalsCard({ objectives = [], onObjectiveClick }) {
  const display = objectives.slice(0, 3);

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "text-error-400 bg-error-500/10 border-error-500/20";
      case "high":
        return "text-warning-400 bg-warning-500/10 border-warning-500/20";
      case "medium":
        return "text-brand-400 bg-brand-500/10 border-brand-500/20";
      default:
        return "text-text-tertiary bg-surface-2 border-white/[0.06]";
    }
  };

  return (
    <div className="h-full p-6 rounded-2xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-400" />
          <h3 className="text-sm font-medium text-text-secondary tracking-wide uppercase">Active Goals</h3>
        </div>
        <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {display.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {display.map((goal) => (
            <div
              key={goal.id}
              onClick={() => onObjectiveClick?.(goal)}
              className="group p-4 rounded-xl bg-surface-2/50 border border-white/[0.04] hover:border-brand-500/20 hover:bg-surface-2 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border ${getPriorityStyle(goal.priority)}`}>
                  {goal.priority || "Normal"}
                </span>
                {goal.xp > 0 && (
                  <div className="flex items-center gap-1 text-brand-400 text-sm font-medium">
                    <Zap className="w-3.5 h-3.5" />
                    <span>+{goal.xp}</span>
                  </div>
                )}
              </div>

              <h4 className="font-medium text-text-primary mb-3 group-hover:text-brand-400 transition-colors line-clamp-2">
                {goal.title || goal.name}
              </h4>

              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-tertiary">Progress</span>
                  <span className="text-text-secondary font-medium">{Math.round(goal.progress || 0)}%</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${goal.progress || 0}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {goal.tasksComplete || 0}/{goal.tasksTotal || 0} tasks
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Target className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-tertiary text-sm mb-4">No active goals yet</p>
          <button className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors">
            Create First Goal
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ FIX: VALIDATION - Redirect if project ID is missing or invalid
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!id || id === "undefined" || id === "null") {
      console.error("[ProjectHome] Invalid project ID detected:", id);
      toast({
        title: "Project not found",
        description: "The project ID is missing or invalid. Redirecting to projects list.",
        variant: "error",
      });
      navigate("/projects", { replace: true });
    }
  }, [id, navigate]);

  // Early return while redirecting (show loading state briefly)
  if (!id || id === "undefined" || id === "null") {
    return <LoadingState />;
  }

  // View state
  const [activeView, setActiveView] = useState("pulse");

  // Presence
  const { joinProject, leaveProject } = useCursorContext();
  const { flashShip } = useCursorFlash();
  const { projectStats } = usePresence({ autoDetectIdle: true });
  const { triggerPulse } = useGlobalPulse();

  // Realtime
  const { joinProjectRoom, leaveProjectRoom, subscribe } = useSocketContext();

  // Local "live" tasks patched by socket events (keeps hook untouched)
  const [liveTasks, setLiveTasks] = useState([]);
  const [pulseRefreshKey, setPulseRefreshKey] = useState(0);

  // Project data from your existing hook
  const {
    project,
    metrics,
    criticalMoves,
    objectives,
    sprint,
    announcements,
    activity,
    pinnedAnnouncement,
    loading,
    error,
    refresh,
    shipUpdate,
    isHealthy,
    hasWarnings,
    // These may or may not exist in your hook - will use fallbacks
    tasks,
    milestones,
    events,
    threads,
    files,
  } = useProjectOverview(id);

  const baseTasks = useMemo(() => {
    if (Array.isArray(tasks)) return tasks;
    if (Array.isArray(tasks?.items)) return tasks.items;
    return [];
  }, [tasks]);

  useEffect(() => {
    setLiveTasks(baseTasks);
  }, [baseTasks]);

  // Join project room + listen for realtime task updates
  useEffect(() => {
    if (!id) return;

    console.log("[ProjectHome.jsx] joining room (APP):", id);
    joinProjectRoom(id);

    const handler = (payload) => {
      const payloadProjectId = payload?.projectId?.toString?.() || payload?.projectId;
      if (payloadProjectId && payloadProjectId !== id) return;

      // ✅ This mutates liveTasks immediately -> PulseWidget updates immediately
      setLiveTasks((prev) => applyTaskUpdated(prev, payload));

      // ⭐ ADD: Force refresh for any view relying on derived state
      setPulseRefreshKey((k) => k + 1);
    };

    const unsubA = subscribe("taskUpdated", handler);
    const unsubB = subscribe("task:update", handler);

    return () => {
      unsubA?.();
      unsubB?.();
      leaveProjectRoom(id);
    };
  }, [id, joinProjectRoom, leaveProjectRoom, subscribe]);

  // Join/leave project presence
  useEffect(() => {
    if (!id) return;
    joinProject(id);
    return () => leaveProject(id);
  }, [id, joinProject, leaveProject]);

  // Handle ship update
  const handleShipUpdate = useCallback(
    async (description) => {
      try {
        await shipUpdate({ description });
        flashShip();
        triggerPulse();
        toast({ title: "🚀 Update Shipped!", variant: "success" });
      } catch (e) {
        toast({ title: "Ship Failed", description: e?.message || "Unknown error", variant: "error" });
        throw e;
      }
    },
    [shipUpdate, flashShip, triggerPulse]
  );

  // Navigation handlers
  const handleSettings = useCallback(() => {
    navigate(`/projects/${id}/settings`);
  }, [navigate, id]);

  const handleObjectiveClick = useCallback(
    (objective) => {
      navigate(`/projects/${id}/objectives/${objective.id}`);
    },
    [navigate, id]
  );

  const handleSprintAction = useCallback(
    (action) => {
      if (action === "start") {
        console.log("Start sprint");
      } else if (action === "continue") {
        navigate(`/projects/${id}/sprint`);
      } else if (action === "review") {
        console.log("Review sprint");
      }
    },
    [navigate, id]
  );

  // VIEW-SPECIFIC HANDLERS (placeholders)
  const handleMilestoneClick = useCallback((milestone) => {
    console.log("Milestone clicked:", milestone.id);
  }, []);

  const handleAddMilestone = useCallback(() => {
    console.log("Add milestone");
  }, []);

  const handleAddEvent = useCallback(() => {
    console.log("Add event");
  }, []);

  const handleEventClick = useCallback((event) => {
    console.log("Event clicked:", event.id);
  }, []);

  const handleUpload = useCallback(() => {
    console.log("Upload file");
  }, []);

  const handleFileClick = useCallback((file) => {
    console.log("File clicked:", file.id);
  }, []);

  const handleNewFolder = useCallback(() => {
    console.log("Create folder");
  }, []);

  // Loading state
  if (loading) return <LoadingState />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const renderViewContent = () => {
    switch (activeView) {
      case "pulse":
        return (
          <PulseView
            project={project}
            metrics={metrics}
            criticalMoves={criticalMoves}
            objectives={objectives}
            sprint={sprint}
            activity={activity}
            onObjectiveClick={handleObjectiveClick}
            onSprintAction={handleSprintAction}
            // ⭐ ADD: pass liveTasks so Pulse updates instantly on socket
            tasks={liveTasks}
          />
        );

      case "stack":
        return (
          <div className="p-10 max-w-[1600px] mx-auto">
            <StackPanel
              projectId={id}
              // later: assigneeId={user?.id || user?._id}
              limit={10}
            />
          </div>
        );

      case "flow":
        return (
          <div className="p-10 max-w-[1600px] mx-auto">
            <FlowBoard projectId={id} />
          </div>
        );

      case "roadmap":
        return (
          <RoadmapView
            projectId={id}
            milestones={milestones || objectives || []}
            onMilestoneClick={handleMilestoneClick}
            onAddMilestone={handleAddMilestone}
          />
        );

      case "rhythm":
        return <RhythmView events={events || []} onAddEvent={handleAddEvent} onEventClick={handleEventClick} />;

      case "insights":
        return <InsightsView projectId={id} />;

      case "suggestions":
        return <SuggestionsPanel projectId={id} project={project} />;

      case "threads":
        return (
          <ThreadsView
            projectId={id}
            threads={threads || []}
            onOpenFullChat={() => navigate("/messages", { state: { projectId: id } })}
          />
        );

      case "vault":
        return <VaultView files={files || []} onUpload={handleUpload} onFileClick={handleFileClick} onNewFolder={handleNewFolder} />;

      default:
        return <div className="p-10 text-center text-text-tertiary">View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 text-text-primary">
      {/* Header */}
      <ProjectHeader
        project={project}
        metrics={metrics}
        activeUsers={projectStats?.online || 0}
        onShipUpdate={handleShipUpdate}
        onSettings={handleSettings}
      />

      {/* View Navigation */}
      <ViewNavigation activeView={activeView} onViewChange={setActiveView} />

      {/* View Content */}
      {/* ⭐ ADD: key={pulseRefreshKey} so socket updates can force clean re-render of active view */}
      <main key={pulseRefreshKey}>{renderViewContent()}</main>

      {/* Global Pulse Bar */}
      <GlobalPulseBar position="bottom" color="brand" />

      {/* Utilities */}
      <QuickActionsManager />
      <KeyboardShortcuts />
    </div>
  );
}
