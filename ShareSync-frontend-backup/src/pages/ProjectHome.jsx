// src/pages/ProjectHome.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HOME: Mission Control with Premium View Navigation
// ⭐ FIX: Bypassing all React wrappers to wire directly to the raw Socket.IO wire!
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/toast";

import { SprintCard, ForesightCard, LiveActivityCard, TeamCapacityCard } from "../components/project/pulse/card";
import AddMilestoneModal from "../components/roadmap/AddMilestoneModal";

import { Gauge, Layers, GitBranch, Map, Calendar, BarChart3, MessageCircle, Archive, Plus, MoreHorizontal, Star, Share2, Settings, Rocket, Activity, Users, Zap, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";

import { useProjectOverview } from "../hooks/useProjectOverview";
import { useIsMobile } from "../hooks/useMobile";
import { useCursorContext } from "../context/CursorContext";
import { useCursorFlash } from "../hooks/useCursor";
import GlobalPulseBar, { useGlobalPulse } from "../components/ui/GlobalPulseBar";
import QuickActionsManager from "../components/quick-actions/QuickActionsManager";
import KeyboardShortcuts from "../components/quick-actions/KeyboardShortcuts";
import * as SuggestionsPanelModule from "../components/suggestions/SuggestionsPanel";
import { useSocketContext } from "../context/SocketContext";
import { applyTaskUpdated } from "../utils/taskRealtime";
import { getStatusColor } from "../utils/statusColor";
import PulseWidget from "../components/pulse/PulseWidget";

import StackPanel from "../features/stack/StackPanel";
import FlowBoard from "../features/flow/FlowBoard";
import RoadmapPanel from "../components/roadmap/RoadmapPanel";
import RhythmView from "../components/views/RhythmView";
import InsightsTab from "../components/insights/InsightsTab";
import ThreadsView from "../components/views/ThreadsView";
import VaultView from "../components/views/VaultView";

const SuggestionsPanel = SuggestionsPanelModule.default || SuggestionsPanelModule.SuggestionsPanel;

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
        <button onClick={onRetry} className="px-6 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );
}

function ProjectHeader({ project, metrics, activeUsers, onShipUpdate, onSettings, onBackToProjects }) {
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
    <header className="px-10 py-6 border-b border-slate-200 bg-white">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <span onClick={onBackToProjects} className="hover:text-slate-700 cursor-pointer transition-colors" role="button" tabIndex={0}>Projects</span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-slate-700">{project?.name || "Project"}</span>
      </nav>
      <div className="flex items-start justify-between gap-8">
        <div className="flex items-start gap-5 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0" style={{ backgroundColor: (project?.color || "#8b5cf6") + "15", color: project?.color || "#8b5cf6" }}>
            {project?.icon || "📁"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-slate-900 truncate">{project?.name || "Untitled Project"}</h1>
              <button onClick={() => setIsStarred(!isStarred)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <Star className={`w-5 h-5 transition-colors ${isStarred ? "fill-amber-400 text-amber-400" : "text-slate-400 hover:text-amber-400"}`} />
              </button>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live: {activeUsers}</span>
              </div>
              <div className={`flex items-center gap-2 text-sm font-medium ${state.color}`}>
                <Zap className="w-4 h-4" />
                <span>{momentum}</span>
                <span className="text-slate-500 font-normal">· {state.label}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => onShipUpdate?.("Shipped an update")} className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-md">
            <Rocket className="w-4 h-4" /><span>Ship Update</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700 text-sm hover:bg-slate-50 transition-all">
            <Activity className="w-4 h-4" /><span>Activity</span>
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <button className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={onSettings} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all">
            <Settings className="w-4 h-4" />
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
    <nav className="px-10 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-1 -mb-px">
        {visibleViews.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          return (
            <button key={view.id} onClick={() => onViewChange(view.id)} className={`relative flex items-center gap-2.5 px-5 py-4 text-sm font-medium transition-all duration-200 ${isActive ? "text-violet-600" : "text-slate-500 hover:text-slate-800"}`} title={view.description}>
              <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-violet-600" : ""}`} />
              <span>{view.label}</span>
              {view.badge && <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-600 text-xs font-medium">{view.badge}</span>}
              {isActive && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-violet-500 rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function MomentumCard({ momentum = 0, weeklyShips = 0, trend }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Momentum</h3>
        <span className="text-xs text-slate-500">Live</span>
      </header>
      <div className="space-y-2 text-sm text-slate-700">
        <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Score</span><span className="text-xs font-medium">{momentum}</span></div>
      </div>
    </section>
  );
}

function PriorityStack({ moves }) {
  const items = Array.isArray(moves) ? moves : [];
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-slate-800">Priority Stack</h3></header>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.slice(0, 5).map((m, i) => <li key={m?._id || i} className={`text-xs text-slate-700 pl-3 py-1.5 rounded-lg ${getStatusColor(m)}`}>{m?.title || "Move"}</li>)}
        </ul>
      ) : <div className="text-xs text-slate-500">No critical moves</div>}
    </section>
  );
}

function ActiveGoalsCard({ objectives, onObjectiveClick }) {
  const items = Array.isArray(objectives) ? objectives : [];
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-slate-800">Active Goals</h3></header>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.slice(0, 5).map((g, i) => <li key={g?._id || i}><button type="button" onClick={() => onObjectiveClick?.(g)} className="text-left w-full text-xs text-slate-700">{g?.title || "Objective"}</button></li>)}
        </ul>
      ) : <div className="text-xs text-slate-500">No active goals</div>}
    </section>
  );
}

function PulseView({ project, metrics, criticalMoves, objectives, sprint, activity, onObjectiveClick, onSprintAction, tasks = [] }) {
  return (
    <div className="p-10 max-w-[1600px] mx-auto">
      <div className="mb-8"><PulseWidget tasks={tasks} /></div>
      <div className="grid grid-cols-12 gap-8 mb-8">
        <div className="col-span-4"><MomentumCard momentum={metrics?.momentum || 0} weeklyShips={metrics?.weeklyShips || 0} trend={metrics?.momentumTrend} /></div>
        <div className="col-span-8"><PriorityStack moves={criticalMoves} /></div>
      </div>
      <div className="grid grid-cols-3 gap-8 mb-8">
        <SprintCard sprint={sprint} onAction={onSprintAction} />
        <ForesightCard metrics={metrics} />
        <LiveActivityCard activities={activity} />
      </div>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-5"><TeamCapacityCard metrics={metrics} /></div>
        <div className="col-span-7"><ActiveGoalsCard objectives={objectives} onObjectiveClick={onObjectiveClick} /></div>
      </div>
    </div>
  );
}

export default function ProjectHome() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const pageWrap = `${isMobile ? "p-6" : "p-10"} max-w-[1600px] mx-auto`;

  useEffect(() => {
    if (!id || id === "undefined" || id === "null") navigate("/projects", { replace: true });
  }, [id, navigate]);

  if (!id || id === "undefined" || id === "null") return <LoadingState />;

  const [activeView, setActiveView] = useState("pulse");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  
  // Existing hooks
  const { joinProject, leaveProject } = useCursorContext();
  const { flashShip } = useCursorFlash();
  const { triggerPulse } = useGlobalPulse();

  // ⭐ THE BARE METAL SOCKET EXTRACTION
  const { socket, isConnected, joinProjectRoom, leaveProjectRoom, subscribe } = useSocketContext();
  
  const [liveUsersMap, setLiveUsersMap] = useState({});
  const [liveTasks, setLiveTasks] = useState([]);
  const [pulseRefreshKey, setPulseRefreshKey] = useState(0);

  const { project, metrics, criticalMoves, objectives, sprint, activity, loading, error, refresh, shipUpdate, tasks, events, threads, files } = useProjectOverview(id);
  const baseTasks = useMemo(() => Array.isArray(tasks) ? tasks : Array.isArray(tasks?.items) ? tasks.items : [], [tasks]);

  useEffect(() => { setLiveTasks(baseTasks); }, [baseTasks]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ⭐ BARE METAL CONNECTION: Bypassing everything directly to Socket.io
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !id || !isConnected) return;

    console.log("🔌 [BareMetal] Connected directly to Socket.IO. Sending handshake...");

    // 1. Direct Handshake via socket.emit
    socket.emit("joinProject", { projectId: id });

    // 2. Direct Event Listeners
    const onRoomUsers = (users) => {
      console.log("🔥 [BareMetal] Received room:users ->", users);
      setLiveUsersMap(prev => {
        const next = { ...prev };
        (users || []).forEach(u => {
          const key = u.sessionId || u.id;
          if (key) next[key] = u;
        });
        return next;
      });
    };

    const onUserJoined = (user) => {
      console.log("🔥 [BareMetal] Received userJoined ->", user);
      setLiveUsersMap(prev => {
        const key = user.sessionId || user.id;
        if (!key) return prev;
        return { ...prev, [key]: user };
      });
    };

    const onUserLeft = (data) => {
      console.log("🔥 [BareMetal] Received userLeft ->", data);
      setLiveUsersMap(prev => {
        const key = data.sessionId || data.id;
        if (!key) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

    // Bind strictly to the raw socket object
    socket.on('room:users', onRoomUsers);
    socket.on('userJoined', onUserJoined);
    socket.on('userLeft', onUserLeft);

    return () => {
      console.log("👋 [BareMetal] Tearing down connection.");
      socket.off('room:users', onRoomUsers);
      socket.off('userJoined', onUserJoined);
      socket.off('userLeft', onUserLeft);
      socket.emit("leaveProject", { projectId: id });
    };
  }, [socket, isConnected, id]);


  // General task subscription logic
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
    return () => { unsubA?.(); unsubB?.(); leaveProjectRoom(id); };
  }, [id, joinProjectRoom, leaveProjectRoom, subscribe]);

  useEffect(() => {
    if (!id) return;
    joinProject(id);
    return () => leaveProject(id);
  }, [id, joinProject, leaveProject]);

  const handleShipUpdate = useCallback(async (description) => {
    try {
      await shipUpdate({ description });
      flashShip(); triggerPulse();
      toast({ title: "🚀 Update Shipped!", variant: "success" });
    } catch (e) {}
  }, [shipUpdate, flashShip, triggerPulse]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error?.message || String(error)} onRetry={refresh} />;
  if (!project) return <ErrorState error={"Project data is missing."} onRetry={refresh} />;

  const renderViewContent = () => {
    switch (activeView) {
      case "pulse": return <PulseView project={project} metrics={metrics} criticalMoves={criticalMoves} objectives={objectives} sprint={sprint} activity={activity} tasks={liveTasks} />;
      case "stack": return <div className={pageWrap}><StackPanel projectId={id} limit={10} milestoneIdFilter={selectedMilestoneId} /></div>;
      case "flow": return <div className={pageWrap}><FlowBoard projectId={id} milestoneIdFilter={selectedMilestoneId} /></div>;
      case "roadmap": return <RoadmapPanel projectId={id} liveTasks={liveTasks} selectedMilestoneId={selectedMilestoneId} />;
      case "rhythm": return <RhythmView projectId={id} events={events || []} />;
      case "insights": return <div className={pageWrap}><InsightsTab projectId={id} /></div>;
      case "suggestions": return <SuggestionsPanel projectId={id} project={project} />;
      case "threads": return <ThreadsView projectId={id} threads={threads || []} />;
      case "vault": return <VaultView projectId={id} files={files || []} />;
      default: return <div className="p-10 text-center text-slate-500">View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <ProjectHeader
        project={project}
        metrics={metrics}
        // ⭐ Dynamically calculate the active users based purely on the raw socket map
        activeUsers={Math.max(1, Object.keys(liveUsersMap).length)} 
        onShipUpdate={handleShipUpdate}
        onSettings={() => navigate(`/projects/${id}/settings`)}
        onBackToProjects={() => navigate("/projects")}
      />
      <ViewNavigation activeView={activeView} onViewChange={setActiveView} />
      <main key={pulseRefreshKey}>{renderViewContent()}</main>
      <GlobalPulseBar position="bottom" color="brand" />
      <QuickActionsManager />
      <KeyboardShortcuts />
    </div>
  );
}
