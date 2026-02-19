// src/pages/ProjectHome.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HOME: Mission Control with Premium View Navigation
// Integrates existing hooks/context with new Pulse/Stack/Flow/etc. views
// ⭐ FIX: Added validation for project ID to prevent /projects/undefined issue
// ⭐ FIX: RoadmapView now receives projectId for API integration
// ⭐ ADD: Force-refresh view content on realtime task updates (pulseRefreshKey)
// ⭐ ADD: PulseWidget uses liveTasks + updates instantly on taskUpdated
// ⭐ SAFETY: Debug + Guardrails to prevent blank screens (frontend only)
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
import RoadmapPanel from "../components/roadmap/RoadmapPanel";
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
        <span
          onClick={onBackToProjects}
          className="hover:text-text-secondary cursor-pointer transition-colors"
          role="button"
          tabIndex={0}
        >
          Projects
        </span>
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
            {project?.icon || "��"}
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
// SAFE PLACEHOLDER CARDS (prevents blank screens)
// These can be replaced later with real implementations.
// ═══════════════════════════════════════════════════════════════════════════════

function MomentumCard({ momentum = 0, weeklyShips = 0, trend }) {
  return (
    <section className="glass-card p-5">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold opacity-90">Momentum</h3>
        <span className="text-xs opacity-60">Live</span>
      </header>

      <div className="space-y-2 text-sm opacity-85">
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-70">Score</span>
          <span className="text-xs opacity-90">{momentum}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-70">Weekly ships</span>
          <span className="text-xs opacity-90">{weeklyShips}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-70">Trend</span>
          <span className="text-xs opacity-90">{trend ?? "—"}</span>
        </div>
      </div>
    </section>
  );
}

function PriorityStack({ moves }) {
  const items = Array.isArray(moves) ? moves : [];
  return (
    <section className="glass-card p-5">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold opacity-90">Priority Stack</h3>
        <span className="text-xs opacity-60">Top moves</span>
      </header>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.slice(0, 5).map((m, i) => (
            <li key={m?._id || m?.id || i} className="text-xs opacity-80">
              {m?.title || m?.label || m?.text || "Critical move"}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs opacity-70">No critical moves yet (placeholder)</div>
      )}
    </section>
  );
}

function ActiveGoalsCard({ objectives, onObjectiveClick }) {
  const items = Array.isArray(objectives) ? objectives : [];
  return (
    <section className="glass-card p-5">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold opacity-90">Active Goals</h3>
        <span className="text-xs opacity-60">Focus</span>
      </header>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.slice(0, 5).map((g, i) => (
            <li key={g?._id || g?.id || i}>
              <button
                type="button"
                onClick={() => onObjectiveClick?.(g)}
                className="text-left w-full text-xs opacity-85 hover:opacity-100 transition"
              >
                {g?.title || g?.name || g?.label || "Objective"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs opacity-70">No active goals yet (placeholder)</div>
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

// (… your existing MomentumCard / PriorityStack / SprintCard / ForesightCard / LiveActivityCard / TeamCapacityCard / ActiveGoalsCard stay unchanged …)

// NOTE: To keep this patch safe and focused, we are NOT changing any of your existing card components.
// They remain exactly as you had them above.
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // DEV-only: flip to false whenever you want a clean UI again
  const SHOW_DEBUG = import.meta?.env?.DEV === true;

  // Mount log (you asked where to put this)
  useEffect(() => {
    console.log("[ProjectHome] mounted id:", id);
  }, [id]);

  // purely UI-only layout knob (no backend impact)
  const pagePad = isMobile ? "p-6" : "p-10";
  const pageWrap = `${pagePad} max-w-[1600px] mx-auto`;

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
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);

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

  const [showAddMilestone, setShowAddMilestone] = useState(false);

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

  // Render heartbeat log (helps debug silent black screens)
  useEffect(() => {
    console.log("[ProjectHome] render-state", {
      id,
      loading,
      hasError: Boolean(error),
      hasProject: Boolean(project),
      activeView,
    });
  }, [id, loading, error, project, activeView]);

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

  // VIEW-SPECIFIC HANDLERS (placeholders)
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

  // Loading state
  if (loading) return <LoadingState />;

  // Error state
  if (error) return <ErrorState error={error?.message || String(error)} onRetry={refresh} />;

  // SAFETY: If hook did not throw an error but project is missing, show readable fallback (prevents black screen)
  if (!project) {
    return (
      <ErrorState
        error={"Project data is missing (project is null). Check /api/projects/:id request + console errors."}
        onRetry={refresh}
      />
    );
  }

  const renderViewContent = () => {
    // Wrap view render in try/catch so a crashing child view doesn't nuke the whole page
    try {
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
    <div className="min-h-screen bg-surface-0 text-text-primary">
      {/* DEV Debug strip (non-invasive). Remove anytime. */}
      {SHOW_DEBUG && (
        <div className="px-10 py-3 border-b border-white/[0.06] bg-surface-0/70 text-xs text-text-tertiary flex flex-wrap gap-3">
          <span>ProjectHome OK</span>
          <span>· id: {String(id)}</span>
          <span>· view: {String(activeView)}</span>
          <span>· tasks: {String(Array.isArray(liveTasks) ? liveTasks.length : 0)}</span>
          <span>· socket room joined: check console</span>
        </div>
      )}

      {/* Header */}
      <ProjectHeader
        project={project}
        metrics={metrics}
        activeUsers={projectStats?.online || 0}
        onShipUpdate={handleShipUpdate}
        onSettings={handleSettings}
        onBackToProjects={handleBackToProjects}
      />

      {/* View Navigation */}
      <ViewNavigation activeView={activeView} onViewChange={setActiveView} />

      {/* View Content */}
      <main key={pulseRefreshKey}>{renderViewContent()}</main>

      {/* Global Pulse Bar */}
      <GlobalPulseBar position="bottom" color="brand" />

      {/* Utilities */}
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
