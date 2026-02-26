// src/pages/ProjectHome.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HOME: Phase 5 - Skeletons & Micro-interactions
// REPLACED: Generic spinner with high-fidelity structural skeleton.
// ADDED: active:scale-[0.98] transition-transform duration-75 to all raw buttons.
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
  MoreHorizontal,
  Star,
  Share2,
  Settings,
  Rocket,
  Activity,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  AlertTriangle
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

// Views
import StackPanel from "../features/stack/StackPanel";
import FlowBoard from "../features/flow/FlowBoard";
import RoadmapPanel from "../components/roadmap/RoadmapPanel";
import RhythmView from "../components/views/RhythmView";
import InsightsTab from "../components/insights/InsightsTab";
import ThreadsView from "../components/views/ThreadsView";
import VaultView from "../components/views/VaultView";

const SuggestionsPanel =
  SuggestionsPanelModule.default || SuggestionsPanelModule.SuggestionsPanel;

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
// HIGH FIDELITY SKELETON (Replaces Spinner)
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectHomeSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <div className="px-10 py-6 border-b border-slate-200 bg-white">
        <div className="w-32 h-4 bg-slate-200 rounded-md animate-pulse mb-6" />
        <div className="flex items-start justify-between gap-8">
          <div className="flex items-start gap-6 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-4 pt-1">
              <div className="w-64 h-8 bg-slate-200 rounded-lg animate-pulse" />
              <div className="flex gap-4">
                <div className="w-20 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-32 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse" />
            <div className="w-24 h-10 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Nav Skeleton */}
      <div className="px-10 border-b border-slate-200 bg-white/80 flex gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-20 h-12 flex items-center">
            <div className="w-full h-4 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Grid Skeleton (Pulse View) */}
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="w-full h-24 bg-slate-200/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-4 h-48 bg-slate-200/50 rounded-2xl animate-pulse" />
          <div className="col-span-8 h-48 bg-slate-200/50 rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="h-64 bg-slate-200/50 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-200/50 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-200/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Failed to load project</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 active:scale-[0.98] transition-all duration-75"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function ProjectHeader({
  project,
  metrics,
  activeUsers,
  onShipUpdate,
  onSettings,
  onBackToProjects,
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
    <header className="px-10 py-6 border-b border-slate-200/60 bg-white">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <button
          onClick={onBackToProjects}
          className="hover:text-slate-700 font-medium active:scale-[0.98] transition-transform duration-75 focus-visible:outline-none"
        >
          Projects
        </button>
        <ArrowRight strokeWidth={1.5} className="w-4 h-4 shrink-0 relative -top-[0.5px]" />
        <span className="text-slate-800 font-medium">{project?.name || "Project"}</span>
      </nav>

      <div className="flex items-start justify-between gap-8">
        <div className="flex items-start gap-6 flex-1 min-w-0">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm flex-shrink-0"
            style={{
              backgroundColor: (project?.color || "#8b5cf6") + "15",
              color: project?.color || "#8b5cf6",
            }}
          >
            {project?.icon || "📁"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-semibold text-slate-900 truncate tracking-tight">
                {project?.name || "Untitled Project"}
              </h1>
              <button
                onClick={() => setIsStarred(!isStarred)}
                className="p-2 rounded-lg hover:bg-slate-50 active:scale-[0.90] transition-all duration-75 focus-visible:outline-none"
              >
                <Star
                  strokeWidth={1.5}
                  className={`w-5 h-5 transition-colors ${
                    isStarred
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-400 hover:text-amber-400"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-6 mt-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[13px] text-emerald-600 font-semibold uppercase tracking-wide">Live</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                <Users strokeWidth={1.5} className="w-4 h-4 shrink-0 relative -top-[0.5px]" />
                <span>{activeUsers || 0} online</span>
              </div>

              <div className={`flex items-center gap-1.5 text-sm font-semibold ${state.color}`}>
                <Zap strokeWidth={1.5} className="w-4 h-4 shrink-0 relative -top-[0.5px]" />
                <span>{momentum}</span>
                <span className="text-slate-400 font-medium">· {state.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => onShipUpdate?.("Shipped an update")}
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-gradient-to-r from-violet-500 to-fuchsia-500
              text-white font-semibold text-sm
              hover:from-violet-600 hover:to-fuchsia-600
              shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(139,92,246,0.2)]
              active:scale-[0.98] active:shadow-none
              transition-all duration-75 focus-visible:outline-none
            "
          >
            <Rocket strokeWidth={1.5} className="w-4 h-4 shrink-0 relative -top-[0.5px]" />
            <span>Ship Update</span>
          </button>

          <button
            className="
            flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-white border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)]
            text-slate-700 font-medium text-sm
            hover:bg-slate-50 hover:border-slate-300
            active:scale-[0.98] active:shadow-none
            transition-all duration-75 focus-visible:outline-none
          "
          >
            <Activity strokeWidth={1.5} className="w-4 h-4 shrink-0 relative -top-[0.5px]" />
            <span>Activity</span>
          </button>

          <div className="w-px h-8 bg-slate-200/60 mx-1" />

          <button className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-[0.95] active:shadow-none transition-all duration-75 focus-visible:outline-none">
            <Share2 strokeWidth={1.5} className="w-4 h-4 shrink-0" />
          </button>

          <button
            onClick={onSettings}
            className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-[0.95] active:shadow-none transition-all duration-75 focus-visible:outline-none"
          >
            <Settings strokeWidth={1.5} className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
}

function ViewNavigation({ activeView, onViewChange, views = PROJECT_VIEWS }) {
  const [showMore, setShowMore] = useState(false);

  const visibleViews = views.slice(0, 6);
  const moreViews = views.slice(6);

  return (
    <nav className="px-10 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2 -mb-px">
        {visibleViews.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;

          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                relative flex items-center gap-2 px-5 py-4
                text-sm font-semibold transition-all duration-75 active:scale-[0.98] focus-visible:outline-none
                ${isActive ? "text-violet-600" : "text-slate-500 hover:text-slate-800"}
              `}
              title={view.description}
            >
              <Icon strokeWidth={1.5} className={`w-4 h-4 shrink-0 relative -top-[0.5px] transition-colors ${isActive ? "text-violet-600" : ""}`} />
              <span>{view.label}</span>

              {view.badge && (
                <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-600 text-[10px] font-bold relative -top-[0.5px]">
                  {view.badge}
                </span>
              )}

              {isActive && <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-violet-600 rounded-t-full" />}
            </button>
          );
        })}

        {moreViews.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500 hover:text-slate-800 transition-all duration-75 active:scale-[0.95] focus-visible:outline-none"
            >
              <MoreHorizontal strokeWidth={1.5} className="w-4 h-4 shrink-0" />
            </button>

            {showMore && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200/60 rounded-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {moreViews.map((view) => {
                    const Icon = view.icon;
                    return (
                      <button
                        key={view.id}
                        onClick={() => {
                          onViewChange(view.id);
                          setShowMore(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus-visible:outline-none"
                      >
                        <Icon strokeWidth={1.5} className="w-4 h-4 shrink-0 text-slate-400" />
                        <span>{view.label}</span>
                        {view.badge && (
                          <span className="ml-auto px-2 py-0.5 rounded-md bg-violet-100 text-violet-600 text-[10px] font-bold">
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

        <button className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500 hover:text-violet-600 transition-all duration-75 active:scale-[0.95] ml-2 focus-visible:outline-none">
          <Plus strokeWidth={2} className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </nav>
  );
}

// SAFE PLACEHOLDER CARDS
function MomentumCard({ momentum = 0, weeklyShips = 0, trend }) {
  return (
    <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Momentum</h3>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live</span>
      </header>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-500">Score</span>
          <span className="text-sm font-bold text-slate-800">{momentum}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-500">Weekly ships</span>
          <span className="text-sm font-bold text-slate-800">{weeklyShips}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-500">Trend</span>
          <span className="text-sm font-bold text-slate-800">{trend ?? "—"}</span>
        </div>
      </div>
    </section>
  );
}

function PriorityStack({ moves }) {
  const items = Array.isArray(moves) ? moves : [];
  return (
    <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Priority Stack</h3>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top moves</span>
      </header>

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.slice(0, 5).map((m, i) => (
            <li key={m?._id || m?.id || i} className="text-[14px] font-medium text-slate-700 leading-tight">
              {m?.title || m?.label || m?.text || "Critical move"}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-[13px] text-slate-500">No critical moves yet (placeholder)</div>
      )}
    </section>
  );
}

function ActiveGoalsCard({ objectives, onObjectiveClick }) {
  const items = Array.isArray(objectives) ? objectives : [];
  return (
    <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Active Goals</h3>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Focus</span>
      </header>

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.slice(0, 5).map((g, i) => (
            <li key={g?._id || g?.id || i}>
              <button
                type="button"
                onClick={() => onObjectiveClick?.(g)}
                className="text-left w-full text-[14px] font-medium text-slate-700 hover:text-violet-600 transition-colors focus-visible:outline-none"
              >
                {g?.title || g?.name || g?.label || "Objective"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-[13px] text-slate-500">No active goals yet (placeholder)</div>
      )}
    </section>
  );
}

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
    <div className="p-8 max-w-[1600px] mx-auto">
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

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const SHOW_DEBUG = import.meta?.env?.DEV === true;

  useEffect(() => {
    console.log("[ProjectHome] mounted id:", id);
  }, [id]);

  const pagePad = isMobile ? "p-4" : "p-8";
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

  // Use our new high-fidelity skeleton instead of a spinner
  if (!id || id === "undefined" || id === "null") {
    return <ProjectHomeSkeleton />;
  }

  const [activeView, setActiveView] = useState("pulse");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);

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

  const handleSettings = useCallback(() => navigate(`/projects/${id}/settings`), [navigate, id]);
  const handleBackToProjects = useCallback(() => navigate("/projects"), [navigate]);
  const handleObjectiveClick = useCallback((objective) => navigate(`/projects/${id}/objectives/${objective.id}`), [navigate, id]);

  const handleSprintAction = useCallback(
    (action) => {
      if (action === "continue") navigate(`/projects/${id}/sprint`);
    },
    [navigate, id]
  );

  const handleMilestoneClick = useCallback((milestone) => console.log("Milestone clicked:", milestone?._id || milestone?.id), []);
  const handleAddMilestone = useCallback(() => setShowAddMilestone(true), []);
  const handleAddEvent = useCallback(() => {}, []);
  const handleEventClick = useCallback((event) => {}, []);
  const handleUpload = useCallback(() => {}, []);
  const handleFileClick = useCallback((file) => {}, []);
  const handleNewFolder = useCallback(() => {}, []);

  // Show our high fidelity skeleton while data fetches
  if (loading) return <ProjectHomeSkeleton />;
  if (error) return <ErrorState error={error?.message || String(error)} onRetry={refresh} />;
  if (!project) return <ErrorState error={"Project data is missing."} onRetry={refresh} />;

  const renderViewContent = () => {
    try {
      switch (activeView) {
        case "pulse":
          return <PulseView project={project} metrics={metrics} criticalMoves={criticalMoves} objectives={objectives} sprint={sprint} activity={activity} onObjectiveClick={handleObjectiveClick} onSprintAction={handleSprintAction} tasks={liveTasks} />;
        case "stack":
          return <div className={pageWrap}><StackPanel projectId={id} limit={10} milestoneIdFilter={selectedMilestoneId} /></div>;
        case "flow":
          return <div className={pageWrap}><FlowBoard projectId={id} milestoneIdFilter={selectedMilestoneId} /></div>;
        case "roadmap":
          return <RoadmapPanel projectId={id} liveTasks={liveTasks} selectedMilestoneId={selectedMilestoneId} onMilestoneClick={(milestoneId, milestone) => { setSelectedMilestoneId(milestoneId); handleMilestoneClick?.(milestone); }} onAddMilestone={handleAddMilestone} />;
        case "rhythm":
          return <RhythmView projectId={id} events={events || []} onAddEvent={handleAddEvent} onEventClick={handleEventClick} />;
        case "insights":
          return <div className={pageWrap}><InsightsTab projectId={id} /></div>;
        case "suggestions":
          return <SuggestionsPanel projectId={id} project={project} />;
        case "threads":
          return <ThreadsView projectId={id} threads={threads || []} onOpenFullChat={() => navigate("/messages", { state: { projectId: id } })} />;
        case "vault":
          return <VaultView projectId={id} files={files || []} onUpload={handleUpload} onFileClick={handleFileClick} onNewFolder={handleNewFolder} />;
        default:
          return <div className="p-8 text-center text-slate-500 font-medium">View not found</div>;
      }
    } catch (e) {
      console.error("[ProjectHome] renderViewContent crash:", e);
      return <ErrorState error={e?.message || "A view crashed during render."} onRetry={refresh} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {SHOW_DEBUG && (
        <div className="px-8 py-3 border-b border-slate-200/60 bg-white/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex flex-wrap gap-4">
          <span>ProjectHome OK</span>
          <span>· id: {String(id)}</span>
          <span>· view: {String(activeView)}</span>
          <span>· tasks: {String(Array.isArray(liveTasks) ? liveTasks.length : 0)}</span>
        </div>
      )}

      <ProjectHeader
        project={project}
        metrics={metrics}
        activeUsers={projectStats?.online || 0}
        onShipUpdate={handleShipUpdate}
        onSettings={handleSettings}
        onBackToProjects={handleBackToProjects}
      />

      <ViewNavigation activeView={activeView} onViewChange={setActiveView} />

      <main key={pulseRefreshKey}>{renderViewContent()}</main>

      <GlobalPulseBar position="bottom" color="brand" />
      <QuickActionsManager />
      <KeyboardShortcuts />

       {showAddMilestone && (
        <AddMilestoneModal
          projectId={id}
          onClose={() => setShowAddMilestone(false)}
        />
      )}
    </div>
  );
}
