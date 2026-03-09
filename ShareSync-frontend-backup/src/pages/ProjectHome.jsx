// src/pages/ProjectHome.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HOME: Mission Control with Premium View Navigation
// ⭐ UPGRADE: Item 9 - Spectator Economy (Public Projects + Follow/Bell System)
// ⭐ UPGRADE: Item 1 - Announcements Tab with Dynamic Unread Badge (Restored)
// ⭐ UPGRADE: Item 2 - Sticky Navigation Bar with Frosted Glass
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
  Megaphone,
  Bell,
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

// API
import { followProject, updateFollowPreferences } from "../api/projects";

// Suggestions
import * as SuggestionsPanelModule from "../components/suggestions/SuggestionsPanel";

// Realtime
import { useSocketContext } from "../context/SocketContext";
import { applyTaskUpdated } from "../utils/taskRealtime";
import { getStatusColor } from "../utils/statusColor";

// Pulse
import PulseWidget from "../components/pulse/PulseWidget";

// View Components
import StackPanel from "../features/stack/StackPanel";
import FlowBoard from "../features/flow/FlowBoard";
import RoadmapPanel from "../components/roadmap/RoadmapPanel";
import RhythmView from "../components/views/RhythmView";
import InsightsTab from "../components/insights/InsightsTab";
import ThreadsView from "../components/views/ThreadsView";
import VaultView from "../components/views/VaultView";
import Announcements from "../components/project/Announcements";

const SuggestionsPanel =
  SuggestionsPanelModule.default || SuggestionsPanelModule.SuggestionsPanel;

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const PROJECT_VIEWS = [
  { id: "pulse", label: "Pulse", icon: Gauge, description: "Project heartbeat" },
  { id: "stack", label: "Stack", icon: Layers, description: "Your work queue" },
  { id: "flow", label: "Flow", icon: GitBranch, description: "Workflow lanes" },
  { id: "roadmap", label: "Roadmap", icon: Map, description: "Timeline view" },
  { id: "rhythm", label: "Rhythm", icon: Calendar, description: "Schedule & tempo" },
  { id: "insights", label: "Insights", icon: BarChart3, description: "AI analytics" },
  { id: "announcements", label: "Announcements", icon: Megaphone, description: "Broadcasts" },
  { id: "suggestions", label: "Suggestions", icon: Sparkles, description: "AI next moves" },
  { id: "threads", label: "Threads", icon: MessageCircle, badge: 3, description: "Conversations" },
  { id: "vault", label: "Vault", icon: Archive, description: "Files & assets" },
];

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
// PROJECT HEADER 
// ⭐ UPGRADE: Role-based dynamic actions (Follow/Bell vs Ship/Settings)
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectHeader({
  project,
  metrics,
  activeUsers,
  isSpectator,
  isFollowing,
  onToggleFollow,
  onNotificationPref,
  onShipUpdate,
  onSettings,
  onBackToProjects,
}) {
  const [isStarred, setIsStarred] = useState(false);
  const [showBellMenu, setShowBellMenu] = useState(false);
  const momentum = metrics?.momentum || 0;

  const getMomentumState = () => {
    if (momentum >= 80) return { label: "On Fire", color: "text-amber-500" };
    if (momentum >= 60) return { label: "Flowing", color: "text-emerald-500" };
    if (momentum >= 30) return { label: "Building", color: "text-violet-500" };
    return { label: "Warming Up", color: "text-slate-500" };
  };

  const state = getMomentumState();

  return (
    <header className="px-10 py-6 border-b border-slate-200 bg-white">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <span
          onClick={onBackToProjects}
          className="hover:text-slate-700 cursor-pointer transition-colors"
          role="button"
          tabIndex={0}
        >
          Projects
        </span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-slate-700">{project?.name || "Project"}</span>
        
        {/* Visibility Badge */}
        {project?.visibility === "public" && (
          <span className="ml-3 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Public
          </span>
        )}
      </nav>

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
              <h1 className="text-2xl font-semibold text-slate-900 truncate">
                {project?.name || "Untitled Project"}
              </h1>
              <button
                onClick={() => setIsStarred(!isStarred)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
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

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="w-4 h-4" />
                <span>{activeUsers || 0} online</span>
              </div>

              <div className={`flex items-center gap-2 text-sm font-medium ${state.color}`}>
                <Zap className="w-4 h-4" />
                <span>{momentum}</span>
                <span className="text-slate-500 font-normal">· {state.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Actions: Spectator vs Member */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isSpectator ? (
            <>
              {/* Follow Button */}
              <button
                onClick={onToggleFollow}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm ${
                  isFollowing
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    : "bg-violet-600 text-white hover:bg-violet-700 shadow-violet-500/20"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>

              {/* Notification Bell (Only shown if following) */}
              {isFollowing && (
                <div className="relative">
                  <button
                    onClick={() => setShowBellMenu(!showBellMenu)}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all focus:outline-none"
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  {showBellMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowBellMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Notifications</div>
                        <button 
                          onClick={() => { onNotificationPref('all'); setShowBellMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          All activity
                        </button>
                        <button 
                          onClick={() => { onNotificationPref('milestones'); setShowBellMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Milestones only
                        </button>
                        <button 
                          onClick={() => { onNotificationPref('off'); setShowBellMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Off
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="w-px h-6 bg-slate-200 mx-1" />
              <button className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all">
                <Share2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Member Actions */}
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

              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700 text-sm hover:bg-slate-50 transition-all duration-200">
                <Activity className="w-4 h-4" />
                <span>Activity</span>
              </button>

              <div className="w-px h-6 bg-slate-200" />

              <button className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all">
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={onSettings}
                className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
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

  const visibleViews = views.slice(0, 7);
  const moreViews = views.slice(7);

  return (
    <nav className="sticky top-0 z-40 px-10 border-b border-slate-200 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-lg transition-all shadow-sm">
      <div className="flex items-center gap-1 -mb-px overflow-x-auto no-scrollbar">
        {visibleViews.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;

          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                relative flex items-center gap-2.5 px-5 py-4
                text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive ? "text-violet-600" : "text-slate-500 hover:text-slate-800"}
              `}
              title={view.description}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-violet-600" : ""}`} />
              <span>{view.label}</span>

              {view.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-600 text-xs font-medium">
                  {view.badge}
                </span>
              )}

              {isActive && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-violet-500 rounded-full" />}
            </button>
          );
        })}

        {moreViews.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1.5 px-4 py-4 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMore && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)} />
                <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  {moreViews.map((view) => {
                    const Icon = view.icon;
                    return (
                      <button
                        key={view.id}
                        onClick={() => {
                          onViewChange(view.id);
                          setShowMore(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-slate-500" />
                        <span>{view.label}</span>
                        {view.badge > 0 && (
                          <span className="ml-auto px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-600 text-xs">
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

        <button className="flex items-center gap-1.5 px-3 py-4 text-sm text-slate-500 hover:text-violet-600 transition-colors ml-1">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE PLACEHOLDER CARDS 
// ═══════════════════════════════════════════════════════════════════════════════

function MomentumCard({ momentum = 0, weeklyShips = 0, trend }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Momentum</h3>
        <span className="text-xs text-slate-500">Live</span>
      </header>

      <div className="space-y-2 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Score</span>
          <span className="text-xs font-medium">{momentum}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Weekly ships</span>
          <span className="text-xs font-medium">{weeklyShips}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Trend</span>
          <span className="text-xs font-medium">{trend ?? "—"}</span>
        </div>
      </div>
    </section>
  );
}

function PriorityStack({ moves }) {
  const items = Array.isArray(moves) ? moves : [];
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Priority Stack</h3>
        <span className="text-xs text-slate-500">Top moves</span>
      </header>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.slice(0, 5).map((m, i) => (
            <li key={m?._id || m?.id || i} className={`text-xs text-slate-700 pl-3 py-1.5 rounded-lg ${getStatusColor(m)}`}>
              {m?.title || m?.label || m?.text || "Critical move"}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-slate-500">No critical moves yet — add your first priority above</div>
      )}
    </section>
  );
}

function ActiveGoalsCard({ objectives, onObjectiveClick }) {
  const items = Array.isArray(objectives) ? objectives : [];
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Active Goals</h3>
        <span className="text-xs text-slate-500">Focus</span>
      </header>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.slice(0, 5).map((g, i) => (
            <li key={g?._id || g?.id || i}>
              <button
                type="button"
                onClick={() => onObjectiveClick?.(g)}
                className="text-left w-full text-xs text-slate-700 hover:text-slate-900 transition"
              >
                {g?.title || g?.name || g?.label || "Objective"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-slate-500">No active goals yet — create one to focus your team</div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PULSE VIEW
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
    isSpectator,
    isFollowing,
    tasks,
    milestones,
    events,
    threads,
    files,
  } = useProjectOverview(id);

  // Optimistic UI state for following
  const [optimisticFollowing, setOptimisticFollowing] = useState(false);

  useEffect(() => {
    setOptimisticFollowing(isFollowing);
  }, [isFollowing]);

  const handleToggleFollow = async () => {
    const prev = optimisticFollowing;
    setOptimisticFollowing(!prev);
    
    if (!prev) {
      toast({ title: "Following project", description: "You will now receive updates.", variant: "success" });
    } else {
      toast({ title: "Unfollowed project", variant: "default" });
    }

    try {
      await followProject(id);
      refresh(); // Hydrate real state from backend
    } catch (err) {
      setOptimisticFollowing(prev); // Revert optimistic update
      toast({ title: "Failed to update follow status", variant: "error" });
    }
  };

  const handleNotificationPref = async (pref) => {
    try {
      await updateFollowPreferences(id, { notifications: pref });
      toast({ title: `Notifications set to: ${pref}`, variant: "success" });
    } catch (err) {
      toast({ title: "Failed to update preferences", variant: "error" });
    }
  };

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

  // Calculate unread announcements safely
  const unreadAnnouncementsCount = useMemo(() => {
    if (!Array.isArray(announcements)) return 0;
    const userId = user?.id || user?._id;
    if (!userId) return 0;
    
    return announcements.filter(a => {
      const readers = a.readBy || [];
      return !readers.includes(userId);
    }).length;
  }, [announcements, user]);

  // Inject dynamic badges into the static PROJECT_VIEWS array
  const dynamicViews = useMemo(() => {
    return PROJECT_VIEWS.map(view => {
      if (view.id === "announcements" && unreadAnnouncementsCount > 0) {
        return { ...view, badge: unreadAnnouncementsCount };
      }
      return view;
    });
  }, [unreadAnnouncementsCount]);

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

        case "announcements":
          return (
            <div className={pageWrap}>
              <Announcements projectId={id} announcements={announcements} />
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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {SHOW_DEBUG && (
        <div className="px-10 py-3 border-b border-slate-200 bg-white/70 text-xs text-slate-500 flex flex-wrap gap-3">
          <span>ProjectHome OK</span>
          <span>· id: {String(id)}</span>
          <span>· view: {String(activeView)}</span>
          <span>· tasks: {String(Array.isArray(liveTasks) ? liveTasks.length : 0)}</span>
          <span>· spectator: {String(isSpectator)}</span>
          <span>· socket room joined: check console</span>
        </div>
      )}

      <ProjectHeader
        project={project}
        metrics={metrics}
        activeUsers={projectStats?.online || 0}
        isSpectator={isSpectator}
        isFollowing={optimisticFollowing}
        onToggleFollow={handleToggleFollow}
        onNotificationPref={handleNotificationPref}
        onShipUpdate={handleShipUpdate}
        onSettings={handleSettings}
        onBackToProjects={handleBackToProjects}
      />

      <ViewNavigation activeView={activeView} onViewChange={setActiveView} views={dynamicViews} />

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
