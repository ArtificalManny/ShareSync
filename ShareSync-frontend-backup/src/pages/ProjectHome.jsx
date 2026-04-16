// src/pages/ProjectHome.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HOME: Mission Control with Premium View Navigation
// Integrates existing hooks/context with new Pulse/Stack/Flow/etc. views
// ⭐ FIX: Navigation Bar flattened to a single continuous row (No Dropdowns)
// ⭐ FIX: Announcements moved to the very front of the array
// ⭐ FIX: Z-Index increased to [100] to brutally override Vault & Insights
// ⭐ FIX: Stripped bg-white. Nav and Header perfectly sync with bg-slate-50
// ⭐ FIX: Project subnav now uses a SOLID light surface (not translucent glass)
//     so it no longer renders as a muddy gray strip against the gallery gradient.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/toast";

import {
  SprintCard,
  ForesightCard,
  LiveActivityCard,
  TeamCapacityCard,
} from "../components/project/pulse/card";

import AddMilestoneModal from "../components/roadmap/AddMilestoneModal";

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
  Megaphone, // Added for Announcements
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
import { getStatusColor } from "../utils/statusColor";

// Pulse
import PulseWidget from "../components/pulse/PulseWidget";

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
import StackPanel from "../features/stack/StackPanel";
import FlowBoard from "../features/flow/FlowBoard";
import RoadmapPanel from "../components/roadmap/RoadmapPanel";
import RhythmView from "../components/views/RhythmView";
import InsightsTab from "../components/insights/InsightsTab";
import ThreadsView from "../components/views/ThreadsView";
import VaultView from "../components/views/VaultView";
import AnnouncementsView from "../components/views/AnnouncementsView";
import useDocumentTitle from "../hooks/useDocumentTitle";
import MembersPanel from "../components/members/MembersPanel";

const SuggestionsPanel =
  SuggestionsPanelModule.default || SuggestionsPanelModule.SuggestionsPanel;

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW CONFIGURATION - Completely Flattened, Announcements First
// ═══════════════════════════════════════════════════════════════════════════════

const PROJECT_VIEWS = [
  { id: "announcements", label: "Announcements", icon: Megaphone, description: "Broadcasts" },
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading project...</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR STATE
// ═══════════════════════════════════════════════════════════════════════════════

function ErrorState({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Failed to load project</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HEADER (Perfectly synced to bg-slate-50)
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectHeader({
  project,
  metrics,
  activeUsers,
  onShipUpdate,
  onSettings,
  onBackToProjects,
  onMembersClick,
}) {
  const [isStarred, setIsStarred] = useState(false);
  const momentum = metrics?.momentum || 0;

  const getMomentumState = () => {
    if (momentum >= 80) return { label: "On Fire", color: "text-amber-500" };
    if (momentum >= 60) return { label: "Flowing", color: "text-emerald-500" };
    if (momentum >= 30) return { label: "Building", color: "text-violet-500" };
    return { label: "Warming Up", color: "text-slate-500" };
  };

  const state = getMomentumState();

  return (
    <header className="px-10 py-6 border-b border-slate-200/60 bg-slate-50 dark:bg-[#0f172a] dark:border-white/10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <span
          onClick={onBackToProjects}
          className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition-colors"
          role="button"
          tabIndex={0}
        >
          Projects
        </span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-slate-700 dark:text-slate-300">{project?.name || "Project"}</span>
      </nav>

      {/* Main header */}
      <div className="flex items-start justify-between gap-8">
        <div className="flex items-start gap-5 flex-1 min-w-0">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0"
            style={{
              backgroundColor: (project?.color || "#8b5cf6") + "15",
              color: project?.color || "#8b5cf6",
            }}
          >
            {project?.icon || "📁"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white truncate">
                {project?.name || "Untitled Project"}
              </h1>
              <button
                onClick={() => setIsStarred(!isStarred)}
                className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    isStarred
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-400 hover:text-amber-400"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-sm text-emerald-600 font-medium">Live</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
                <Users className="w-4 h-4" />
                <span>{activeUsers || 0} online</span>
              </div>

              <div className={`flex items-center gap-2 text-sm font-medium ${state.color}`}>
                <Zap className="w-4 h-4" />
                <span>{momentum}</span>
                <span className="text-slate-500 dark:text-zinc-400 font-normal">· {state.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => onShipUpdate?.("Shipped an update")}
            className="
              flex items-center gap-2.5 px-5 py-2.5 rounded-xl
              bg-gradient-to-r from-violet-500 to-fuchsia-500
              text-white font-medium text-sm
              hover:from-violet-600 hover:to-fuchsia-600
              transition-all duration-200
              shadow-md shadow-violet-500/20
              hover:shadow-lg hover:shadow-violet-500/30
              hover:-translate-y-0.5 active:translate-y-0
            "
          >
            <Rocket className="w-4 h-4" />
            <span>Ship Update</span>
          </button>

          <button
            type="button"
            onClick={onMembersClick}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm
              text-slate-700 dark:text-zinc-300 text-sm font-medium
              hover:bg-slate-50 dark:hover:bg-zinc-800
              transition-all duration-200
            "
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />

          <button
            type="button"
            className="p-2.5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onSettings}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW NAVIGATION (SOLID LIGHT SURFACE - NO MUDDY TRANSPARENCY)
// ═══════════════════════════════════════════════════════════════════════════════

function ViewNavigation({ activeView, onViewChange, views = PROJECT_VIEWS }) {
  return (
    <nav
      className="
        px-10
        border-b border-slate-200/90 dark:border-white/10
        bg-white dark:bg-[#0f172a]
        sticky top-0 z-[100]
        transition-colors duration-300
        shadow-[0_1px_0_rgba(226,232,240,0.85)] dark:shadow-none
      "
    >
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="flex items-center gap-2 -mb-px overflow-x-auto hide-scroll w-full">
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;

          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                relative flex items-center gap-2.5 px-4 py-4 whitespace-nowrap
                text-sm font-medium transition-all duration-200 rounded-t-lg
                ${isActive
                  ? "text-violet-700 dark:text-white bg-violet-50 dark:bg-transparent"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5"
                }
              `}
              title={view.description}
            >
              <Icon
                className={`
                  w-4 h-4 transition-colors
                  ${isActive
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-slate-500 group-hover:text-slate-700 dark:text-zinc-400 dark:group-hover:text-zinc-200"
                  }
                `}
              />
              <span>{view.label}</span>

              {view.badge && (
                <span
                  className={`
                    px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors
                    ${isActive
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }
                  `}
                >
                  {view.badge}
                </span>
              )}

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-500 rounded-t-sm" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE PLACEHOLDER CARDS
// ═══════════════════════════════════════════════════════════════════════════════

function MomentumCard({ momentum = 0, weeklyShips = 0, trend }) {
  const pct = Math.min(100, momentum);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-violet-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Momentum</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Live</span>
      </header>

      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-zinc-800" />
            <circle cx="44" cy="44" r={radius} fill="none" stroke="url(#momentum-grad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-700" />
            <defs>
              <linearGradient id="momentum-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#2DD4BF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-slate-800 dark:text-zinc-100">{momentum}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-zinc-400">Weekly ships</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{weeklyShips}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-zinc-400">Trend</span>
            <span className={`text-sm font-semibold ${
              trend > 0 ? "text-emerald-600 dark:text-emerald-400" :
              trend < 0 ? "text-red-500" :
              "text-slate-500 dark:text-zinc-400"
            }`}>
              {trend > 0 ? `+${trend}` : trend ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PriorityStack({ moves }) {
  const items = Array.isArray(moves) ? moves : [];
  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Priority Stack</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Top moves</span>
      </header>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.slice(0, 5).map((m, i) => (
            <li key={m?._id || m?.id || i} className={`text-xs text-slate-700 dark:text-zinc-300 pl-3 py-2 rounded-lg border-l-2 border-violet-400 bg-slate-50 dark:bg-zinc-800/50 ${getStatusColor(m)}`}>
              {m?.title || m?.label || m?.text || "Critical move"}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-3">
            No critical moves yet. Tasks you create will surface here by priority.
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Switch to Stack or Flow to add your first task.
          </p>
        </div>
      )}
    </section>
  );
}

function ActiveGoalsCard({ objectives, onObjectiveClick }) {
  const items = Array.isArray(objectives) ? objectives : [];
  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Active Goals</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Focus</span>
      </header>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.slice(0, 5).map((g, i) => (
            <li key={g?._id || g?.id || i}>
              <button
                type="button"
                onClick={() => onObjectiveClick?.(g)}
                className="text-left w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                {g?.title || g?.name || g?.label || "Objective"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-500/10 mx-auto mb-3 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1">
            No active goals yet
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Goals focus your team on what matters most this sprint.
          </p>
        </div>
      )}
    </section>
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
      <div className="mb-8">
        <PulseWidget tasks={tasks} />
      </div>

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

      <div className="grid grid-cols-3 gap-8 mb-8">
        <SprintCard sprint={sprint} onAction={onSprintAction} />
        <ForesightCard metrics={metrics} />
        <LiveActivityCard activities={activity} />
      </div>

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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const SHOW_DEBUG = import.meta?.env?.DEV === true;

  useEffect(() => {
    console.log("[ProjectHome] mounted id:", id);
  }, [id]);

  const pagePad = isMobile ? "p-6" : "p-10";
  const pageWrap = `${pagePad} max-w-[1600px] mx-auto`;

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

  if (!id || id === "undefined" || id === "null") {
    return <LoadingState />;
  }

  const [activeView, setActiveView] = useState("announcements");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false);

  const { joinProject, leaveProject } = useCursorContext();
  const { flashShip } = useCursorFlash();
  const { projectStats } = usePresence({ autoDetectIdle: true });
  const { triggerPulse } = useGlobalPulse();

  const { joinProjectRoom, leaveProjectRoom, subscribe } = useSocketContext();

  const [liveTasks, setLiveTasks] = useState([]);
  const [pulseRefreshKey, setPulseRefreshKey] = useState(0);

  const [showAddMilestone, setShowAddMilestone] = useState(false);

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
    tasks,
    milestones,
    events,
    threads,
    files,
  } = useProjectOverview(id);

  useEffect(() => {
    console.log("[ProjectHome] render-state", {
      id,
      loading,
      hasError: Boolean(error),
      hasProject: Boolean(project),
      activeView,
    });
  }, [id, loading, error, project, activeView]);

  useDocumentTitle(project?.name || "Project");

  const baseTasks = useMemo(() => {
    if (Array.isArray(tasks)) return tasks;
    if (Array.isArray(tasks?.items)) return tasks.items;
    return [];
  }, [tasks]);

  useEffect(() => {
    setLiveTasks(baseTasks);
  }, [baseTasks]);

  useEffect(() => {
    if (!id) return;

    console.log("[ProjectHome.jsx] joining room (APP):", id);
    joinProjectRoom(id);

    const handler = (payload) => {
      const payloadProjectId = payload?.projectId?.toString?.() || payload?.projectId;
      if (payloadProjectId && payloadProjectId !== id) return;

      setLiveTasks((prev) => applyTaskUpdated(prev, payload));
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

  useEffect(() => {
    if (!id) return;
    joinProject(id);
    return () => leaveProject(id);
  }, [id, joinProject, leaveProject]);

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

  const handleSettings = useCallback(() => {
    navigate(`/projects/${id}/settings`);
  }, [navigate, id]);

  const handleBackToProjects = useCallback(() => {
    navigate("/projects");
  }, [navigate]);

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

  const handleMilestoneClick = useCallback((milestone) => {
    console.log("Milestone clicked:", milestone?._id || milestone?.id);
  }, []);

  const handleAddMilestone = useCallback(() => {
    console.log("Add milestone");
    setShowAddMilestone(true);
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

  if (loading) return <LoadingState />;

  if (error) return <ErrorState error={error?.message || String(error)} onRetry={refresh} />;

  if (!project) {
    return (
      <ErrorState
        error={"Project data is missing (project is null). Check /api/projects/:id request + console errors."}
        onRetry={refresh}
      />
    );
  }

  const renderViewContent = () => {
    try {
      switch (activeView) {
        case "announcements":
          return (
            <div className={pageWrap}>
              <AnnouncementsView projectId={id} announcements={announcements || []} />
            </div>
          );

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
              tasks={liveTasks}
            />
          );

        case "stack":
          return (
            <div className={pageWrap}>
              <StackPanel projectId={id} limit={10} milestoneIdFilter={selectedMilestoneId} />
            </div>
          );

        case "flow":
          return (
            <div className={pageWrap}>
              <FlowBoard projectId={id} milestoneIdFilter={selectedMilestoneId} />
            </div>
          );

        case "roadmap":
          return (
            <RoadmapPanel
              projectId={id}
              liveTasks={liveTasks}
              selectedMilestoneId={selectedMilestoneId}
              onMilestoneClick={(milestoneId, milestone) => {
                console.log("Milestone clicked:", milestoneId, milestone);
                setSelectedMilestoneId(milestoneId);
                handleMilestoneClick?.(milestone);
              }}
              onAddMilestone={handleAddMilestone}
            />
          );

        case "rhythm":
          return <RhythmView projectId={id} events={events || []} onAddEvent={handleAddEvent} onEventClick={handleEventClick} />;

        case "insights":
          return (
            <div className={pageWrap}>
              <InsightsTab projectId={id} />
            </div>
          );

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
          return <VaultView projectId={id} files={files || []} onUpload={handleUpload} onFileClick={handleFileClick} onNewFolder={handleNewFolder} />;

        default:
          return <div className="p-10 text-center text-slate-500">View not found</div>;
      }
    } catch (e) {
      console.error("[ProjectHome] renderViewContent crash:", e);
      return (
        <ErrorState
          error={e?.message || "A view crashed during render. Check console stack trace for file + line."}
          onRetry={refresh}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-zinc-100">
      {SHOW_DEBUG && (
        <div className="px-10 py-3 border-b border-slate-200/60 bg-white/40 text-xs text-slate-500 flex flex-wrap gap-3">
          <span>ProjectHome OK</span>
          <span>· id: {String(id)}</span>
          <span>· view: {String(activeView)}</span>
          <span>· tasks: {String(Array.isArray(liveTasks) ? liveTasks.length : 0)}</span>
          <span>· socket room joined: check console</span>
        </div>
      )}

      <ProjectHeader
        project={project}
        metrics={metrics}
        activeUsers={projectStats?.online || 0}
        onShipUpdate={handleShipUpdate}
        onSettings={handleSettings}
        onBackToProjects={handleBackToProjects}
        onMembersClick={() => setIsMembersPanelOpen(true)}
      />

      <ViewNavigation activeView={activeView} onViewChange={setActiveView} />

      <main key={pulseRefreshKey}>{renderViewContent()}</main>

      <GlobalPulseBar position="bottom" color="brand" />

      <QuickActionsManager projectId={id} />
      <KeyboardShortcuts />

      {showAddMilestone && (
        <AddMilestoneModal
          projectId={id}
          onClose={() => setShowAddMilestone(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MEMBERS POPUP
      ═══════════════════════════════════════════════════════════════════ */}
      {isMembersPanelOpen && (
        <MembersPanel 
          projectId={id} 
          project={project}
          onClose={() => setIsMembersPanelOpen(false)} 
        />
      )}
    </div>
  );
}
