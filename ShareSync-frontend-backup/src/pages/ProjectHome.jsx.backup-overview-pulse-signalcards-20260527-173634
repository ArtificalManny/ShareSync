// src/pages/ProjectHome.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HOME: Mission Control with Unified Overview Snapshot
// OVERVIEW SYSTEM PASS
//
// WHAT CHANGED:
// - Overview cards now read from one normalized `overview` object
// - Replaces mixed local derivations with a single hook-owned snapshot
// - Adds silent realtime refresh scheduling for concurrent users
// - Keeps existing views, layout, and architecture intact
// - Keeps current project presence behavior intact
//
// FINISH LINE PASS
// - Adds a local Finish Line card driven by overview.finishLine
// - Makes the header lifecycle-aware (active / ready to close / completed / archived)
// - Adds refresh handling for project completion / reopen events
//
// NO NEW BACKEND CHANGES IN THIS PASS
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/toast";

import {
  SprintCard,
  ForesightCard,
  LiveActivityCard,
  TeamCapacityCard,
} from "../components/project/pulse/card";

import FinishLineCard from "../components/project/pulse/card/FinishLineCard";
import AddMilestoneModal from "../components/roadmap/AddMilestoneModal";
import CompleteProjectModal from "../components/project/CompleteProjectModal";
import ProjectAvatar from "../components/project/ProjectAvatar";
import ProjectCaseStudyCard from "../components/project/ProjectCaseStudyCard";

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
  Route,
  TrendingUp,
  AlertTriangle,
  Play,
  Flame,
  Eye,
  ArrowRight,
  Sparkles,
  Megaphone,
  CheckCircle2,
  Flag,
  RotateCcw,
  Bell,
  BellOff,
  Loader2,
  FileText,
  ListOrdered,
  ArrowUpRight,
  GripVertical,
  CircleDot,
  Signpost,
  TrendingDown,
  GaugeCircle,
  RadioTower,
  PlayCircle,
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
import buildProjectMomentum from "../utils/projectMomentum";
import buildProjectForesight from "../utils/projectForesight";
import buildProjectActiveGoals from "../utils/projectActiveGoals";
import buildProjectTeamCapacity from "../utils/projectTeamCapacity";
import { buildProjectPulse } from "../utils/projectPulse";

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
import { completeProject, reopenProject } from "../api/projects";
import { getFollowStatus } from "../api/follows";
import useFollow from "../hooks/useFollow";


// ─────────────────────────────────────────────────────────────────────────────
// PROJECT LIFECYCLE SUBSCRIPTION REFRESH BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
// Completing a project should release one active-project slot.
// Reopening a completed project should consume one active-project slot again.
// SubscriptionButton already listens for these events and reloads /subscriptions/current.
function notifyProjectLifecycleSubscriptionRefresh(detail = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    resource: "projects",
    source: "ProjectHome",
    timestamp: Date.now(),
    ...detail,
  };

  window.dispatchEvent(new CustomEvent("project:lifecycle-updated", { detail: payload }));
  window.dispatchEvent(new CustomEvent("subscription:refresh", { detail: payload }));
  window.dispatchEvent(new CustomEvent("subscription:changed", { detail: payload }));
  window.dispatchEvent(new CustomEvent("subscription-usage-updated", { detail: payload }));
}

const SuggestionsPanel =
  SuggestionsPanelModule.default || SuggestionsPanelModule.SuggestionsPanel;

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW CONFIGURATION - Clearer top-level language
// ═══════════════════════════════════════════════════════════════════════════════

const PROJECT_VIEWS = [
  {
    id: "overview",
    label: "Overview",
    icon: Eye,
    description: "Status, blockers, next moves",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: Layers,
    description: "Priority queue",
  },
  {
    id: "board",
    label: "Board",
    icon: GitBranch,
    description: "Workflow lanes",
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: Map,
    description: "Timeline view",
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: Calendar,
    description: "Cadence & timing",
  },
  {
    id: "discussion",
    label: "Discussion",
    icon: MessageCircle,
    badge: 3,
    description: "Project-bound conversation",
  },
  {
    id: "files",
    label: "Files",
    icon: Archive,
    description: "Files & assets",
  },
  {
    id: "announcements",
    label: "Announcements",
    icon: Megaphone,
    description: "Broadcasts",
  },
  {
    id: "insights",
    label: "Insights",
    icon: BarChart3,
    description: "Analytics",
  },
  {
    id: "suggestions",
    label: "Next Moves",
    icon: Sparkles,
    description: "AI guidance",
  },
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
// PROJECT HEADER HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getLifecycleMeta(status) {
  const value = String(status || "").toLowerCase();

  if (value === "completed") {
    return {
      label: "Completed",
      dot: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      chip:
        "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
      pulse: false,
    };
  }

  if (value === "ready_to_close") {
    return {
      label: "Ready to Close",
      dot: "bg-teal-500",
      text: "text-teal-600 dark:text-teal-400",
      chip:
        "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
      pulse: false,
    };
  }

  if (value === "archived") {
    return {
      label: "Archived",
      dot: "bg-slate-400",
      text: "text-slate-500 dark:text-zinc-400",
      chip:
        "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:border-white/[0.08]",
      pulse: false,
    };
  }

  if (value === "on_hold" || value === "paused") {
    return {
      label: "On Hold",
      dot: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      chip:
        "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      pulse: false,
    };
  }

  return {
    label: "Live",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    chip:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    pulse: true,
  };
}


function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function readNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getStoredAuthToken() {
  if (typeof window === "undefined") return "";

  const tokenKeys = [
    "authToken",
    "accessToken",
    "token",
    "jwt",
    "openShareToken",
    "shareSyncToken",
  ];

  for (const key of tokenKeys) {
    const value = window.localStorage.getItem(key);
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }

  try {
    const authRaw = window.localStorage.getItem("auth");
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      return (
        parsed?.accessToken ||
        parsed?.authToken ||
        parsed?.token ||
        parsed?.jwt ||
        ""
      );
    }
  } catch {
    // Ignore malformed localStorage auth payloads.
  }

  try {
    const userRaw = window.localStorage.getItem("user");
    if (userRaw) {
      const parsed = JSON.parse(userRaw);
      return (
        parsed?.accessToken ||
        parsed?.authToken ||
        parsed?.token ||
        parsed?.jwt ||
        ""
      );
    }
  } catch {
    // Ignore malformed localStorage user payloads.
  }

  return "";
}

function buildJsonHeaders() {
  const token = getStoredAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readApiJson(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function buildDefaultSprintPayload(projectId, projectName) {
  const now = new Date();
  const end = addDays(now, 14);
  const goal = `Build momentum on ${projectName || "this project"}`;

  return {
    projectId,
    name: "Sprint 1",
    title: "Sprint 1",
    goal,
    goals: [
      {
        title: goal,
        description: "Default kickoff goal created from the Project Overview sprint card.",
        status: "active",
      },
    ],
    startDate: toIsoDateOnly(now),
    endDate: toIsoDateOnly(end),
    status: "active",
  };
}

async function createProjectSprint(projectId, payload) {
  const response = await fetch("/api/sprints", {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify({
      ...payload,
      projectId,
    }),
  });

  const data = await readApiJson(response);

  if (!response.ok) {
    const message =
      data?.normalizedMessage ||
      data?.message ||
      data?.error ||
      `Sprint request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

function humanSprintError(error) {
  if (error?.status === 401) {
    return "You may need to sign in again before starting a sprint.";
  }

  if (error?.status === 403) {
    return "You do not appear to have permission to start a sprint for this project.";
  }

  if (error?.status === 404) {
    return "The sprint backend route is not available yet: POST /api/sprints.";
  }

  if (error?.status === 409) {
    return "This project already has an active sprint. Refreshing the overview should show it.";
  }

  return error?.message || "Unknown sprint error.";
}

function humanizeEnum(value) {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value?._id || value?.id || value?.userId || value?.toString?.() || "").trim();
  }
  return String(value).trim();
}

function getCurrentUserIds(user) {
  return new Set(
    [
      user?._id,
      user?.id,
      user?.userId,
      user?.sub,
    ]
      .map(normalizeId)
      .filter(Boolean)
  );
}

function getProjectOwnerIds(project) {
  return [
    project?.ownerId,
    project?.owner,
    project?.createdBy,
    project?.createdById,
  ]
    .map(normalizeId)
    .filter(Boolean);
}


function isLikelyMongoId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value.trim());
}

function getCleanUserName(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || isLikelyMongoId(trimmed)) return "";
    return trimmed;
  }

  if (typeof value !== "object" || Array.isArray(value)) return "";

  const fullName = [value.firstName, value.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    value.displayName ||
    value.name ||
    value.username ||
    value.email ||
    ""
  );
}

function getProjectOwnerDisplayName(project, summary) {
  const ownerSummary = summary?.ownerSummary || {};

  const candidates = [
    project?.ownerId,
    project?.createdById,
    project?.ownerUser,
    project?.createdByUser,
    project?.owner,
    project?.createdBy,
    ownerSummary?.primaryOwner,
    ownerSummary?.owner,
    ownerSummary?.user,
    ownerSummary?.primaryOwnerName,
  ];

  for (const candidate of candidates) {
    const name = getCleanUserName(candidate);
    if (name) return name;
  }

  return "Owner not set";
}

function getProjectMemberIds(project) {
  const members = Array.isArray(project?.members) ? project.members : [];

  return members
    .map((member) =>
      normalizeId(
        member?.userId ||
          member?.user ||
          member?._id ||
          member?.id ||
          member
      )
    )
    .filter(Boolean);
}

function isProjectPubliclyViewable(project) {
  const visibility = String(project?.visibility || project?.privacy || "").toLowerCase();
  const settings = project?.settings || {};

  return (
    visibility === "public" ||
    visibility === "listed" ||
    project?.isPublic === true ||
    project?.public === true ||
    settings?.isPublic === true
  );
}

function getProjectPublicAccessMode(project) {
  const settings = project?.settings || {};
  const raw = String(
    project?.publicAccessMode ||
      project?.spectatorMode ||
      settings?.publicAccessMode ||
      settings?.spectatorMode ||
      ""
  ).toLowerCase();

  if (raw === "suggest" || raw === "suggestions") return "suggestions";
  if (raw === "view" || raw === "view_only") return "view_only";
  return isProjectPubliclyViewable(project) ? "view_only" : "none";
}

function getProjectViewerAccess(project, user) {
  const currentUserIds = getCurrentUserIds(user);
  const isLoggedIn = currentUserIds.size > 0;
  const isPublic = isProjectPubliclyViewable(project);

  const ownerIds = getProjectOwnerIds(project);
  const memberIds = getProjectMemberIds(project);

  const isOwner = ownerIds.some((id) => currentUserIds.has(id));
  const isMember = isOwner || memberIds.some((id) => currentUserIds.has(id));
  const publicAccessMode = getProjectPublicAccessMode(project);
  const suggestionsEnabled =
    publicAccessMode === "suggestions" ||
    project?.suggestionsEnabled === true ||
    project?.settings?.suggestionsEnabled === true;

  const isSpectator = Boolean(project && isPublic && !isMember);
  const showFollowButton = Boolean(project && isLoggedIn && isSpectator);

  return {
    isLoggedIn,
    isPublic,
    isOwner,
    isMember,
    isSpectator,
    isReadOnlySpectator: isSpectator && publicAccessMode !== "suggestions",
    canSuggest: isSpectator && suggestionsEnabled,
    canUseMemberActions: !isSpectator,
    showFollowButton,
    publicAccessMode,
    suggestionsEnabled,
  };
}


function SpectatorAccessBanner({ viewerAccess, following, followersCount }) {
  if (!viewerAccess?.isSpectator) return null;

  return (
    <section className="mx-10 mt-6 rounded-[24px] border border-violet-200 dark:border-violet-500/20 bg-white dark:bg-[#111113] shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-5 md:px-6 py-4 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-violet-500/10 dark:via-violet-500/[0.03] dark:to-cyan-500/[0.06]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20">
                <Eye className="w-3.5 h-3.5" />
                Public Spectator Mode
              </span>

              {following ? (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                  <Bell className="w-3.5 h-3.5" />
                  Following
                </span>
              ) : null}
            </div>

            <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
              You are viewing this public project as a spectator. Members can edit and ship work;
              spectators can follow updates{viewerAccess.canSuggest ? " and submit suggestions when enabled." : "."}
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-zinc-400 shrink-0">
            {Number(followersCount || 0)} follower{Number(followersCount || 0) === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT HEADER
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT HOME BANNER BRANDING BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
const RAW_PROJECT_HOME_ASSET_BASE =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  "http://localhost:5050/api";

const PROJECT_HOME_ASSET_ORIGIN = String(RAW_PROJECT_HOME_ASSET_BASE)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function resolveProjectHomeAssetUrl(value) {
  if (!value || typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    return `${PROJECT_HOME_ASSET_ORIGIN}/${trimmed.replace(/^\/+/, "")}`;
  }

  return trimmed;
}

function getProjectBannerUrl(project) {
  return resolveProjectHomeAssetUrl(
    project?.bannerUrl ||
      project?.banner ||
      project?.coverUrl ||
      project?.coverImageUrl ||
      ""
  );
}

function ProjectHeader({
  project,
  metrics,
  activeUsers,
  onShipUpdate,
  onSettings,
  onBackToProjects,
  onMembersClick,
  onLifecycleAction,
  isLifecycleBusy = false,
  viewerAccess,
  following = false,
  followLoading = false,
  followersCount = 0,
  onFollowToggle,
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
  const canUseMemberActions = viewerAccess?.canUseMemberActions !== false;
  const showFollowButton = viewerAccess?.showFollowButton === true;
  const lifecycle = getLifecycleMeta(project?.status);
  const lifecycleState = String(project?.status || "").toLowerCase();
  const isCompleted = lifecycleState === "completed";
  const isReadyToClose = lifecycleState === "ready_to_close";

  const PrimaryActionIcon = isCompleted
    ? RotateCcw
    : isReadyToClose
      ? Flag
      : Rocket;

  const primaryActionLabel = isCompleted
    ? (isLifecycleBusy ? "Reopening…" : "Reopen Project")
    : isReadyToClose
      ? (isLifecycleBusy ? "Opening…" : "Complete Project")
      : "Ship Update";

  const handlePrimaryAction = () => {
    if (!canUseMemberActions) return;
    if (isLifecycleBusy) return;

    if (isCompleted || isReadyToClose) {
      onLifecycleAction?.();
      return;
    }

    onShipUpdate?.("Shipped an update");
  };

  return (
    <header className="relative overflow-hidden px-6 md:px-10 py-6 border-b border-slate-200/70 bg-white/85 backdrop-blur-2xl shadow-[0_1px_0_rgba(226,232,240,0.75)] dark:border-white/10 dark:bg-[#07111f]/90 dark:shadow-none">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 opacity-80" />
      <div className="pointer-events-none absolute -top-28 right-16 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      <div className="pointer-events-none absolute -bottom-32 left-32 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
      {getProjectBannerUrl(project) ? (
        <div className="mb-6 h-36 md:h-44 overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-100 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
          <img
            src={getProjectBannerUrl(project)}
            alt={`${project?.name || "Project"} banner`}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

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
        <span className="text-slate-700 dark:text-slate-300">
          {project?.name || "Project"}
        </span>
      </nav>

      <div className="flex items-start justify-between gap-8">
        <div className="flex items-start gap-5 flex-1 min-w-0">
          <ProjectAvatar
            project={project}
            size="lg"
            className="flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white truncate">
                {project?.name || "Untitled Project"}
              </h1>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${lifecycle.chip}`}
              >
                <span className={`w-2 h-2 rounded-full ${lifecycle.dot}`} />
                {lifecycle.label}
              </span>

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

            <div className="flex items-center gap-5 flex-wrap">
              <div className={`flex items-center gap-2 text-sm font-medium ${lifecycle.text}`}>
                {lifecycle.pulse ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className={`inline-flex rounded-full h-2 w-2 ${lifecycle.dot}`} />
                )}
                <span>{lifecycle.label}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
                <Users className="w-4 h-4" />
                <span>{activeUsers || 0} online</span>
              </div>

              <div className={`flex items-center gap-2 text-sm font-medium ${state.color}`}>
                <Zap className="w-4 h-4" />
                <span>{momentum}</span>
                <span className="text-slate-500 dark:text-zinc-400 font-normal">
                  · {state.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {canUseMemberActions && (isCompleted || isReadyToClose) ? (
            <button
              onClick={handlePrimaryAction}
              disabled={isLifecycleBusy}
            className={`
              flex items-center gap-2.5 px-5 py-2.5 rounded-xl
              text-white font-medium text-sm
              transition-all duration-200
              hover:-translate-y-0.5 active:translate-y-0
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
              ${
                isCompleted
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30"
                  : isReadyToClose
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30"
                    : "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30"
              }
            `}
          >
            <PrimaryActionIcon className="w-4 h-4" />
            <span>{primaryActionLabel}</span>
            </button>
          ) : null}

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

          {showFollowButton ? (
            <button
              type="button"
              onClick={onFollowToggle}
              disabled={followLoading}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm
                text-sm font-medium transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  following
                    ? "bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]"
                    : "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                }
              `}
              title={`${Number(followersCount || 0)} follower${Number(followersCount || 0) === 1 ? "" : "s"}`}
            >
              {followLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : following ? (
                <BellOff className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              <span>{following ? "Following" : "Follow"}</span>
            </button>
          ) : null}

          <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />

          <button
            type="button"
            className="p-2.5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {canUseMemberActions ? (
            <button
              type="button"
              onClick={onSettings}
              className="p-2.5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

function ViewNavigation({ activeView, onViewChange, views = PROJECT_VIEWS }) {
  return (
    <nav
      className="
        px-10
        border-b border-slate-200/90 dark:border-white/10
        bg-white/82 dark:bg-[#07111f]/88
        backdrop-blur-2xl
        sticky top-0 z-[100]
        transition-colors duration-300
        shadow-[0_1px_0_rgba(226,232,240,0.85),0_12px_30px_rgba(15,23,42,0.04)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]
      "
    >
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex items-center gap-1 sm:gap-2 -mb-px overflow-x-auto hide-scroll w-full scroll-smooth">
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
                ${
                  isActive
                    ? "text-violet-700 dark:text-white bg-violet-50 dark:bg-transparent"
                    : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5"
                }
              `}
              title={view.description}
            >
              <Icon
                className={`
                  w-4 h-4 transition-colors
                  ${
                    isActive
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-slate-500 group-hover:text-slate-700 dark:text-zinc-400 dark:group-hover:text-zinc-200"
                  }
                `}
              />
              <span>{view.label}</span>

              {view.badge ? (
                <span
                  className={`
                    px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors
                    ${
                      isActive
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400"
                        : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }
                  `}
                >
                  {view.badge}
                </span>
              ) : null}

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
  const score = Math.max(0, Math.min(100, Number(momentum) || 0));
  const safeWeeklyShips = Math.max(0, Number(weeklyShips) || 0);
  const safeTrend = Number.isFinite(Number(trend)) ? Number(trend) : 0;

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const isBuilding = safeTrend > 0;
  const isCooling = safeTrend < 0;

  const statusLabel =
    score >= 75
      ? "High momentum"
      : score >= 45
        ? "Building"
        : score > 0
          ? "Warming up"
          : "Needs signal";

  const trendLabel = isBuilding ? `+${safeTrend}` : String(safeTrend);

  const trendTone = isBuilding
    ? "text-emerald-600 dark:text-emerald-300"
    : isCooling
      ? "text-rose-600 dark:text-rose-300"
      : "text-slate-500 dark:text-zinc-400";

  const TrendIcon = isBuilding ? TrendingUp : isCooling ? TrendingDown : GaugeCircle;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(139,92,246,0.14),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(45,212,191,0.12),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

      <header className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
            <TrendingUp className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Momentum
              </h3>
              <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                Pace Signal
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Shipping pace, trend, and execution energy.
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          Live
        </span>
      </header>

      <div className="relative z-10 grid gap-5 md:grid-cols-[150px_1fr]">
        <div className="flex items-center justify-center">
          <div className="relative h-[132px] w-[132px]">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                className="text-slate-100 dark:text-white/[0.06]"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="url(#momentumGradient)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="momentumGradient" x1="0" y1="0" x2="120" y2="120">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="55%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-950 dark:text-white">
                {score}
              </span>
              <span className="mt-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                Score
              </span>
            </div>
          </div>
        </div>

        <div className="grid content-center gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                Current State
              </p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 dark:bg-white/[0.06] dark:text-zinc-300">
                {statusLabel}
              </span>
            </div>

            <p className="text-sm leading-6 text-slate-600 dark:text-zinc-300">
              {isBuilding
                ? "Momentum is rising. Keep shipping the next visible move."
                : isCooling
                  ? "Momentum is cooling. Ship one focused task to rebuild pace."
                  : "Momentum is stable. One shipped task can move this project forward."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035]">
              <div className="mb-2 flex items-center gap-2">
                <RadioTower className="h-3.5 w-3.5 text-cyan-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                  Weekly Ships
                </p>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {safeWeeklyShips}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035]">
              <div className="mb-2 flex items-center gap-2">
                <TrendIcon className={`h-3.5 w-3.5 ${trendTone}`} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                  Trend
                </p>
              </div>
              <p className={`text-xl font-black ${trendTone}`}>
                {trendLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function PriorityStack({ moves = [] }) {
  const safeMoves = Array.isArray(moves) ? moves.filter(Boolean) : [];
  const topMoves = safeMoves.slice(0, 4);

  const getMoveTitle = (move) => {
    if (typeof move === "string") return move;

    return (
      move?.title ||
      move?.name ||
      move?.taskTitle ||
      move?.label ||
      move?.text ||
      move?.summary ||
      "Untitled priority"
    );
  };

  const getMoveMeta = (move, index) => {
    if (typeof move === "string") {
      return index === 0 ? "Highest leverage move" : "Ranked move";
    }

    return (
      move?.projectName ||
      move?.project?.name ||
      move?.source ||
      move?.status ||
      (index === 0 ? "Highest leverage move" : "Ranked move")
    );
  };

  const getMoveSignal = (move, index) => {
    if (typeof move === "string") {
      return index === 0 ? "Top move" : `Priority ${index + 1}`;
    }

    const rawScore =
      move?.priorityScore ??
      move?.score ??
      move?.impactScore ??
      move?.leverageScore ??
      move?.points;

    if (Number.isFinite(Number(rawScore))) {
      return `${Math.round(Number(rawScore))} signal`;
    }

    return index === 0 ? "Top move" : `Priority ${index + 1}`;
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-violet-500 to-cyan-400" />

      <header className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shadow-sm">
            <ListOrdered className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Priority Stack
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Ranked execution queue
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 dark:text-zinc-500">
          Top moves
        </span>
      </header>

      {topMoves.length > 0 ? (
        <div className="space-y-3">
          {topMoves.map((move, index) => {
            const title = getMoveTitle(move);
            const meta = getMoveMeta(move, index);
            const signal = getMoveSignal(move, index);

            return (
              <article
                key={move?._id || move?.id || `${title}-${index}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.05] transition shadow-sm"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 via-violet-500 to-cyan-400" />

                <div className="flex items-center gap-4 px-4 py-3 pl-5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <GripVertical className="w-4 h-4 opacity-60" />
                    <span className="w-9 h-9 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-xs font-bold text-rose-500">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {title}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                      <span>{meta}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-violet-600 dark:text-violet-300 font-semibold">
                        {signal}
                      </span>
                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 group-hover:text-violet-600 transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.03] px-5 py-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400">
            <Signpost className="w-5 h-5" />
          </div>

          <div>
            <p className="font-semibold text-slate-800 dark:text-white">
              No priority surfaced yet
            </p>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Add tasks, unblock work, or ship updates to generate a ranked stack.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}



function OverviewPulseCard({ pulse = {} }) {
  const today = Math.max(
    0,
    Number(
      pulse?.todayCompleted ??
        pulse?.today ??
        pulse?.completedToday ??
        pulse?.shipsToday ??
        0
    ) || 0
  );

  const inMotion = Math.max(
    0,
    Number(pulse?.inMotion ?? pulse?.active ?? pulse?.inProgress ?? 0) || 0
  );

  const blocked = Math.max(
    0,
    Number(pulse?.blocked ?? pulse?.blockedCount ?? pulse?.blockers ?? 0) || 0
  );

  const ready = Math.max(
    0,
    Number(pulse?.ready ?? pulse?.readyCount ?? pulse?.readyTasks ?? 0) || 0
  );

  const totalSignals = today + inMotion + blocked + ready;

  const pulseState =
    blocked > 0
      ? "Blockers active"
      : inMotion > 0
        ? "Work moving"
        : ready > 0
          ? "Ready to ship"
          : today > 0
            ? "Shipped today"
            : "Quiet";

  const pulseMessage =
    blocked > 0
      ? "Execution has friction. Clear blockers before opening more work."
      : inMotion > 0
        ? "Work is currently moving. Keep the next handoff visible."
        : ready > 0
          ? "A task is ready. Push it forward to create momentum."
          : today > 0
            ? "Shipping happened today. Keep the project warm."
            : "No active execution signal yet. Start one clear move.";

  const signalCards = [
    {
      label: "Today",
      value: today,
      icon: Flame,
      tone: "text-orange-500",
      glow: "bg-orange-50 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20",
      bar: "from-orange-400 to-amber-300",
    },
    {
      label: "In motion",
      value: inMotion,
      icon: Zap,
      tone: "text-violet-500",
      glow: "bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20",
      bar: "from-violet-500 to-fuchsia-400",
    },
    {
      label: "Blocked",
      value: blocked,
      icon: AlertTriangle,
      tone: blocked > 0 ? "text-rose-500" : "text-slate-400",
      glow:
        blocked > 0
          ? "bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20"
          : "bg-slate-50 border-slate-200 dark:bg-white/[0.035] dark:border-white/[0.07]",
      bar: blocked > 0 ? "from-rose-500 to-orange-400" : "from-slate-300 to-slate-200",
    },
    {
      label: "Ready",
      value: ready,
      icon: Play,
      tone: "text-emerald-500",
      glow: "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
      bar: "from-emerald-500 to-cyan-400",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(20,184,166,0.12),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(139,92,246,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400" />

      <header className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
            <Activity className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Pulse
              </h3>
              <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                Live Signals
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Unified snapshot of execution signals.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            Live
          </span>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
            {totalSignals} signals
          </p>
        </div>
      </header>

      <div className="relative z-10 mb-5 rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
              Current Readout
            </p>
            <h4 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
              {pulseState}
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
              {pulseMessage}
            </p>
          </div>

          <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-600 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 sm:flex">
            <RadioTower className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="relative z-10 grid gap-3 md:grid-cols-4">
        {signalCards.map((card) => {
          const Icon = card.icon;
          const isActive = Number(card.value) > 0;

          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:shadow-none ${card.glow}`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.bar} ${isActive ? "opacity-100" : "opacity-35"}`} />

              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.tone}`} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    {card.label}
                  </span>
                </div>

                {isActive ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
                ) : null}
              </div>

              <p className="text-3xl font-black text-slate-950 dark:text-white">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW HELPERS
// ═══════════════════════════════════════════════════════════════════════════════


function NextMoveSignalCard({
  title,
  caption,
  activeGoalCount = 0,
  onOpenNextMoves,
}) {
  const safeTitle = String(title || "").trim() || "No priority surfaced yet";
  const hasPriority = safeTitle.toLowerCase() !== "no priority surfaced yet";

  const statusLabel = hasPriority ? "Ready" : "Scanning";
  const executionCue = hasPriority
    ? "This is the highest-leverage move surfaced from the project signal."
    : "Open tasks, blockers, or goals will surface the next move.";

  return (
    <section className="group relative overflow-hidden rounded-[28px] border border-violet-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 dark:border-violet-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
              <Flag className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                  What’s next
                </p>

                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                  Next move
                </span>

                <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                  {statusLabel}
                </span>
              </div>

              <h3 className="max-w-[560px] truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">
                {safeTitle}
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {caption}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm dark:bg-black/20 dark:text-violet-300">
                <Sparkles className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
                  Execution cue
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-700 dark:text-zinc-200">
                  {executionCue}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenNextMoves}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-black text-violet-700 shadow-sm transition-all hover:-translate-y-[1px] hover:bg-violet-50 hover:shadow-md dark:border-violet-500/20 dark:bg-white/[0.04] dark:text-violet-300 dark:hover:bg-violet-500/10"
            >
              <span>Open Next Moves</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}




// ═══════════════════════════════════════════════════════════════════════
// PROJECTHOME OWNER AVATAR URL HELPER v2
// Finds the owner's real profile image from the project/summary payload.
// Keeps initials as fallback when the backend does not provide an image.
// ═══════════════════════════════════════════════════════════════════════

function getProjectOwnerAvatarUrl(projectLike, summary = null) {
  const avatarKeys = [
    "profilePicture",
    "profilePictureUrl",
    "avatarUrl",
    "avatar",
    "photoUrl",
    "imageUrl",
    "picture",
    "profileImage",
  ];

  const readAvatar = (value) => {
    if (!value || typeof value !== "object") return "";

    for (const key of avatarKeys) {
      const candidate = value?.[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }

    return "";
  };

  const candidates = [
    summary?.owner,
    summary?.ownerSummary,
    summary?.ownerSummary?.owner,
    summary?.ownerSummary?.user,
    summary?.ownerSummary?.userId,

    projectLike?.owner,
    projectLike?.ownerId,
    projectLike?.createdBy,
    projectLike?.createdById,
    projectLike?.user,
    projectLike?.userId,
  ];

  if (Array.isArray(projectLike?.members)) {
    for (const member of projectLike.members) {
      const role = String(member?.role || member?.projectRole || "").toLowerCase();
      const isOwner =
        role === "owner" ||
        role === "admin" ||
        member?.isOwner === true ||
        member?.owner === true;

      if (!isOwner) continue;

      candidates.push(
        member?.user,
        member?.userId,
        member?.member,
        member
      );
    }
  }

  for (const candidate of candidates) {
    const avatar = readAvatar(candidate);
    if (avatar) return avatar;
  }

  return "";
}


function OwnerSignalCard({ ownerName, ownerAvatarUrl, caption }) {
  const safeOwnerName = String(ownerName || "").trim() || "Project owner";
  const safeOwnerAvatarUrl = String(ownerAvatarUrl || "").trim();
  const initials =
    safeOwnerName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PO";

  return (
    <section className="group relative overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-emerald-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>

              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                  Who owns it
                </p>

                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Owner
                </span>
              </div>

              <h3 className="max-w-[360px] truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">
                {safeOwnerName}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {caption}
              </p>
            </div>
          </div>

          <div
            className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm font-black text-emerald-700 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-emerald-300 sm:flex"
            title={safeOwnerName}
            aria-label={`${safeOwnerName} profile picture`}
          >
            {safeOwnerAvatarUrl ? (
              <>
                <img
                  src={safeOwnerAvatarUrl}
                  alt={`${safeOwnerName} profile`}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <span className="hidden">{initials}</span>
              </>
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
                Ownership signal
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-zinc-200">
                Clear project accountability is assigned.
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m3 11 4-8 4 8" />
                <path d="m13 11 4-8 4 8" />
                <path d="M7 11v10" />
                <path d="M17 11v10" />
                <path d="M3 21h18" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



function BlockedSignalCard({ blockedLabel, caption }) {
  const safeBlockedLabel = String(blockedLabel || "0 blockers").trim();
  const match = safeBlockedLabel.match(/\d+/);
  const blockerCount = match ? Number(match[0]) : 0;

  const severity =
    blockerCount >= 10 ? "Critical" : blockerCount > 0 ? "Needs review" : "Clear";

  const severityClasses =
    blockerCount >= 10
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
      : blockerCount > 0
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";

  const cardTint =
    blockerCount >= 10
      ? "from-rose-500 via-orange-400 to-amber-300"
      : blockerCount > 0
        ? "from-amber-400 via-orange-400 to-rose-400"
        : "from-emerald-400 via-cyan-400 to-violet-500";

  const readout =
    blockerCount > 0
      ? "Execution friction is constraining momentum."
      : "No active blockers are currently constraining execution.";

  return (
    <section className="group relative overflow-hidden rounded-[28px] border border-amber-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 dark:border-amber-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cardTint}`} />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-rose-400/10 blur-3xl" />

      <div className="relative p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>

              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-amber-400 dark:border-[#111113]" />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                  What’s blocked
                </p>

                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${severityClasses}`}>
                  {severity}
                </span>
              </div>

              <h3 className="max-w-[360px] truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">
                {safeBlockedLabel}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {caption}
              </p>
            </div>
          </div>

          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-white text-lg font-black text-amber-700 shadow-sm dark:border-amber-500/20 dark:bg-white/[0.03] dark:text-amber-300 sm:flex">
            {blockerCount}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
                Blocker signal
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-zinc-200">
                {readout}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function OverviewSignalCard({
  icon: Icon,
  label,
  value,
  caption,
  tone = "neutral",
}) {
  const toneClasses = {
    neutral: {
      shell: "bg-white dark:bg-[#111113] border-slate-200 dark:border-white/[0.06]",
      icon: "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300",
      value: "text-slate-900 dark:text-zinc-100",
    },
    violet: {
      shell: "bg-white dark:bg-[#111113] border-violet-200 dark:border-violet-500/20",
      icon: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
      value: "text-slate-900 dark:text-zinc-100",
    },
    amber: {
      shell: "bg-white dark:bg-[#111113] border-amber-200 dark:border-amber-500/20",
      icon: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
      value: "text-slate-900 dark:text-zinc-100",
    },
    teal: {
      shell: "bg-white dark:bg-[#111113] border-teal-200 dark:border-teal-500/20",
      icon: "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400",
      value: "text-slate-900 dark:text-zinc-100",
    },
  };

  const styles = toneClasses[tone] || toneClasses.neutral;

  return (
    <section className={`rounded-2xl border p-5 shadow-sm dark:shadow-none ${styles.shell}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-medium text-slate-500 dark:text-zinc-400">
            {label}
          </p>
          <p className={`mt-2 text-lg font-semibold leading-tight ${styles.value}`}>
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
            {caption}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
}


function CompletedSnapshotPanel({
  finishLine,
  onReopenProject,
  isReopeningProject = false,
  onViewCaseStudy,
}) {
  const snapshot = finishLine?.completionSnapshot || {};
  const closureSummary =
    finishLine?.closureSummary ||
    snapshot?.summary ||
    "";
  const completedAt = formatDateTime(
    finishLine?.completedAt || snapshot?.completedAt
  );
  const outcomeStatus = humanizeEnum(
    finishLine?.outcomeStatus || snapshot?.outcomeStatus
  );
  const leftoverDecision = humanizeEnum(snapshot?.leftoverDecision);

  const completedTaskCount = readNumber(snapshot?.completedTaskCount, 0);
  const openTaskCount = readNumber(snapshot?.openTaskCount, 0);
  const blockedTaskCount = readNumber(snapshot?.blockedTaskCount, 0);
  const goalsAchievedCount = readNumber(snapshot?.goalsAchievedCount, 0);
  const goalsTotalCount = readNumber(snapshot?.goalsTotalCount, 0);
  const deferredCount = Array.isArray(snapshot?.deferredTaskIds)
    ? snapshot.deferredTaskIds.length
    : 0;
  const canceledCount = Array.isArray(snapshot?.canceledTaskIds)
    ? snapshot.canceledTaskIds.length
    : 0;

  return (
    <section className="rounded-[28px] border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-[#111113] shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-5 md:px-6 py-5 border-b border-emerald-100 dark:border-emerald-500/10 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-500/10 dark:via-emerald-500/[0.03] dark:to-teal-500/[0.06]">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Closeout Snapshot
              </span>

              {completedAt ? (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium bg-white/80 text-slate-600 border border-slate-200 dark:bg-white/[0.05] dark:text-zinc-300 dark:border-white/[0.08]">
                  <Clock className="w-3.5 h-3.5" />
                  {completedAt}
                </span>
              ) : null}
            </div>

            <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-zinc-100">
              This project has crossed the finish line.
            </h3>

            <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-slate-600 dark:text-zinc-300 max-w-3xl">
              Treat this as the historical record of what was delivered, what was deferred,
              and how the mission ended.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onViewCaseStudy}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-sm transition-all dark:bg-white/[0.05] dark:text-emerald-300 dark:border-emerald-500/20 dark:hover:bg-emerald-500/10"
            >
              <FileText className="w-4 h-4" />
              <span>View Case Study</span>
            </button>

            <button
              type="button"
              onClick={onReopenProject}
              disabled={isReopeningProject}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isReopeningProject ? "Reopening…" : "Reopen Project"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-3 mb-5">
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">Outcome</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {outcomeStatus || "Completed"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">Done</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">
              {completedTaskCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">Open at close</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">
              {openTaskCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">Blocked</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">
              {blockedTaskCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">Goals</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">
              {goalsAchievedCount}/{goalsTotalCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">Leftovers</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {leftoverDecision || "Recorded"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4">
          <div className="rounded-[24px] border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                Closure summary
              </h4>
            </div>

            <p className="text-sm leading-relaxed text-slate-700 dark:text-zinc-200">
              {closureSummary || "No written closure summary was recorded for this closeout."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Archive className="w-4 h-4 text-violet-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                  Leftover handling
                </h4>
              </div>

              <div className="space-y-2 text-sm text-slate-700 dark:text-zinc-200">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-zinc-400">Decision</span>
                  <span className="font-medium">{leftoverDecision || "Not recorded"}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-zinc-400">Deferred tasks</span>
                  <span className="font-medium">{deferredCount}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-zinc-400">Canceled tasks</span>
                  <span className="font-medium">{canceledCount}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/8 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Historical mode
                </h4>
              </div>

              <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
                This project is now being presented as a completed mission. Reopen it only if the work truly needs to resume.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HistoricalModeBanner({
  project,
  onReopenProject,
  isReopeningProject = false,
  onViewCaseStudy,
}) {
  const completedAt = formatDateTime(project?.completedAt);
  const outcomeStatus = humanizeEnum(project?.outcomeStatus);

  return (
    <section className="mx-10 mt-6 rounded-[24px] border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-[#111113] shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-5 md:px-6 py-5 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-500/10 dark:via-emerald-500/[0.03] dark:to-teal-500/[0.06]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                <Archive className="w-3.5 h-3.5" />
                Historical Mode
              </span>

              {completedAt ? (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium bg-white/80 text-slate-600 border border-slate-200 dark:bg-white/[0.05] dark:text-zinc-300 dark:border-white/[0.08]">
                  <Clock className="w-3.5 h-3.5" />
                  Completed {completedAt}
                </span>
              ) : null}

              {outcomeStatus ? (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium bg-white/80 text-slate-600 border border-slate-200 dark:bg-white/[0.05] dark:text-zinc-300 dark:border-white/[0.08]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {outcomeStatus}
                </span>
              ) : null}
            </div>

            <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-zinc-100">
              You are viewing a completed project.
            </h3>

            <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-slate-600 dark:text-zinc-300 max-w-3xl">
              This workspace is now functioning as a historical record of what was built,
              what was deferred, and how the mission ended. Reopen it only if the work truly needs to resume.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onViewCaseStudy}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-sm transition-all dark:bg-white/[0.05] dark:text-emerald-300 dark:border-emerald-500/20 dark:hover:bg-emerald-500/10"
            >
              <FileText className="w-4 h-4" />
              <span>View Case Study</span>
            </button>

            <button
              type="button"
              onClick={onReopenProject}
              disabled={isReopeningProject}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isReopeningProject ? "Reopening…" : "Reopen Project"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


function getLiveActivityMeta(activity) {
  const rawType = String(
    activity?.type ||
      activity?.eventType ||
      activity?.action ||
      activity?.kind ||
      ""
  ).toLowerCase();

  if (rawType.includes("completed") || rawType.includes("done")) {
    return {
      label: "Completed",
      Icon: CheckCircle2,
      dotClass: "bg-emerald-400",
      iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
      chipClass: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    };
  }

  if (rawType.includes("ship") || rawType.includes("update")) {
    return {
      label: "Shipped",
      Icon: Rocket,
      dotClass: "bg-violet-400",
      iconClass: "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
      chipClass: "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
    };
  }

  if (rawType.includes("block") || rawType.includes("risk")) {
    return {
      label: "Blocked",
      Icon: AlertTriangle,
      dotClass: "bg-amber-400",
      iconClass: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      chipClass: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    };
  }

  if (rawType.includes("goal")) {
    return {
      label: "Goal",
      Icon: Target,
      dotClass: "bg-cyan-400",
      iconClass: "bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20",
      chipClass: "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20",
    };
  }

  return {
    label: humanizeEnum(rawType) || "Activity",
    Icon: Activity,
    dotClass: "bg-teal-400",
    iconClass: "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
    chipClass: "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
  };
}

function getActivityActor(activity) {
  const candidates = [
    activity?.actorName,
    activity?.userName,
    activity?.createdByName,
    activity?.authorName,
    activity?.actor?.name,
    activity?.actor?.username,
    activity?.user?.name,
    activity?.user?.username,
    activity?.createdBy?.name,
    activity?.createdBy?.username,
  ];

  const found = candidates.find((value) => value && String(value).trim());
  return found ? String(found).trim() : "Someone";
}

function getActivityTarget(activity) {
  const candidates = [
    activity?.targetTitle,
    activity?.taskTitle,
    activity?.projectTitle,
    activity?.entityTitle,
    activity?.title,
    activity?.label,
    activity?.text,
    activity?.message,
    activity?.description,
  ];

  const found = candidates.find((value) => value && String(value).trim());
  return found ? String(found).trim() : "";
}

function formatLiveActivityTime(activity) {
  const raw =
    activity?.createdAt ||
    activity?.updatedAt ||
    activity?.timestamp ||
    activity?.time ||
    activity?.date;

  if (!raw) return "Just now";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Recent";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// PROJECT LIVE ACTIVITY ACTOR BRIDGE
function projectPulseNormalizeAvatarSrc(value) {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

function projectPulseIsGenericActorName(value) {
  const text = String(value || "").trim().toLowerCase();

  return (
    !text ||
    text === "someone" ||
    text === "team member" ||
    text === "project member" ||
    text === "unknown" ||
    text === "user"
  );
}

function projectPulseGetPersonName(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed || /^[a-f\d]{24}$/i.test(trimmed)) {
      return "";
    }

    return trimmed;
  }

  if (typeof value !== "object") return "";

  const nested =
    value.user ||
    value.member ||
    value.profile ||
    value.account ||
    null;

  const fullName = [value.firstName, value.lastName].filter(Boolean).join(" ").trim();

  return (
    value.name ||
    value.fullName ||
    value.displayName ||
    fullName ||
    value.username ||
    value.email ||
    projectPulseGetPersonName(nested) ||
    ""
  );
}

function projectPulseGetPersonAvatar(value) {
  if (!value || typeof value !== "object") return null;

  const nested =
    value.user ||
    value.member ||
    value.profile ||
    value.account ||
    null;

  return projectPulseNormalizeAvatarSrc(
    value.avatarUrl ||
      value.profilePicture ||
      value.profileImage ||
      value.photoUrl ||
      value.imageUrl ||
      value.avatar ||
      value.picture ||
      value.image ||
      projectPulseGetPersonAvatar(nested)
  );
}

function projectPulseGetEntityId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value !== "object") return "";

  const direct =
    value._id ||
    value.id ||
    value.userId ||
    value.user ||
    value.memberId ||
    value.member ||
    value.actorId ||
    value.actor ||
    value.createdBy ||
    value.updatedBy ||
    value.completedBy ||
    "";

  if (typeof direct === "string") return direct.trim();

  if (direct && typeof direct === "object" && direct !== value) {
    return projectPulseGetEntityId(direct);
  }

  return "";
}

function projectPulseNormalizeMemberRecord(member) {
  if (!member) return null;

  const nested =
    typeof member.userId === "object"
      ? member.userId
      : typeof member.user === "object"
        ? member.user
        : typeof member.memberId === "object"
          ? member.memberId
          : typeof member.member === "object"
            ? member.member
            : typeof member.profile === "object"
              ? member.profile
              : null;

  const id =
    projectPulseGetEntityId(nested) ||
    projectPulseGetEntityId(member) ||
    "";

  const firstName = member.firstName || nested?.firstName || "";
  const lastName = member.lastName || nested?.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    ...(nested || {}),
    ...(typeof member === "object" ? member : {}),
    _id: id || nested?._id || member?._id,
    id: id || nested?.id || member?.id,
    firstName,
    lastName,
    name:
      member.name ||
      nested?.name ||
      member.fullName ||
      nested?.fullName ||
      member.displayName ||
      nested?.displayName ||
      fullName ||
      member.username ||
      nested?.username ||
      member.email ||
      nested?.email ||
      "",
    fullName:
      member.fullName ||
      nested?.fullName ||
      member.displayName ||
      nested?.displayName ||
      fullName ||
      "",
    email: member.email || nested?.email || "",
    username: member.username || nested?.username || "",
    avatarUrl:
      member.avatarUrl ||
      nested?.avatarUrl ||
      member.profilePicture ||
      nested?.profilePicture ||
      member.profileImage ||
      nested?.profileImage ||
      member.photoUrl ||
      nested?.photoUrl ||
      member.avatar ||
      nested?.avatar ||
      "",
    profilePicture:
      member.profilePicture ||
      nested?.profilePicture ||
      member.avatarUrl ||
      nested?.avatarUrl ||
      "",
  };
}

function projectPulseGetProjectMembers(project) {
  const rawMembers = Array.isArray(project?.members) ? project.members : [];

  const ownerCandidates = [
    project?.ownerId,
    project?.owner,
    project?.createdById,
    project?.createdBy,
  ].filter(Boolean);

  const normalized = [
    ...rawMembers.map(projectPulseNormalizeMemberRecord),
    ...ownerCandidates.map(projectPulseNormalizeMemberRecord),
  ].filter(Boolean);

  const seen = new Set();

  return normalized.filter((member) => {
    const key =
      projectPulseGetEntityId(member) ||
      String(member.email || "").toLowerCase() ||
      String(member.username || "").toLowerCase() ||
      String(member.name || "").toLowerCase();

    if (!key) return true;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}


function projectPulseResolveActor(activity, project) {
  const projectMembers = projectPulseGetProjectMembers(project);

  const directActor =
    activity?.actor ||
    activity?.actorUser ||
    activity?.user ||
    activity?.member ||
    activity?.author ||
    activity?.createdBy ||
    activity?.updatedBy ||
    activity?.completedBy ||
    activity?.raw?.actor ||
    activity?.raw?.user ||
    activity?.details?.actor ||
    activity?.details?.user ||
    activity?.metadata?.actor ||
    activity?.metadata?.user ||
    null;

  const directId = projectPulseGetEntityId(directActor);

  const candidateIds = [
    directId,
    activity?.actorId,
    activity?.userId,
    activity?.memberId,
    activity?.authorId,
    activity?.createdById,
    activity?.updatedById,
    activity?.completedById,
    activity?.createdBy,
    activity?.updatedBy,
    activity?.completedBy,
    activity?.raw?.actorId,
    activity?.raw?.userId,
    activity?.raw?.memberId,
    activity?.details?.actorId,
    activity?.details?.userId,
    activity?.details?.memberId,
    activity?.metadata?.actorId,
    activity?.metadata?.userId,
    activity?.metadata?.memberId,
  ]
    .map(projectPulseGetEntityId)
    .filter(Boolean);

  const candidateEmails = [
    activity?.actorEmail,
    activity?.userEmail,
    activity?.email,
    activity?.raw?.actorEmail,
    activity?.raw?.userEmail,
    activity?.details?.actorEmail,
    activity?.details?.userEmail,
    activity?.metadata?.actorEmail,
    activity?.metadata?.userEmail,
    directActor?.email,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  const matchedMember = projectMembers.find((member) => {
    const memberId = projectPulseGetEntityId(member);
    const memberEmail = String(member?.email || "").trim().toLowerCase();

    return (
      (memberId && candidateIds.includes(memberId)) ||
      (memberEmail && candidateEmails.includes(memberEmail))
    );
  });

  if (matchedMember) {
    return {
      ...(typeof directActor === "object" && directActor ? directActor : {}),
      ...matchedMember,
    };
  }

  if (directActor && typeof directActor === "object") {
    return directActor;
  }

  if (projectMembers.length === 1) {
    return projectMembers[0];
  }

  return null;
}


function projectPulseGetActorName(activity, project) {
  const directNameCandidates = [
    activity?.actorName,
    activity?.userName,
    activity?.username,
    activity?.displayName,
    activity?.authorName,
    activity?.createdByName,
    activity?.updatedByName,
    activity?.completedByName,
    activity?.raw?.actorName,
    activity?.raw?.userName,
    activity?.details?.actorName,
    activity?.details?.userName,
    activity?.metadata?.actorName,
    activity?.metadata?.userName,
  ];

  const directName = directNameCandidates.find(
    (value) => !projectPulseIsGenericActorName(value)
  );

  if (directName) return String(directName).trim();

  const actor = projectPulseResolveActor(activity, project);
  const actorName = projectPulseGetPersonName(actor);

  if (!projectPulseIsGenericActorName(actorName)) {
    return actorName;
  }

  return "Project member";
}


function projectPulseGetActorAvatar(activity, project) {
  const activityAvatar = projectPulseNormalizeAvatarSrc(
    activity?.avatarUrl ||
      activity?.profilePicture ||
      activity?.profileImage ||
      activity?.photoUrl ||
      activity?.imageUrl ||
      activity?.actorAvatar ||
      activity?.userAvatar ||
      activity?.raw?.avatarUrl ||
      activity?.raw?.profilePicture ||
      activity?.details?.avatarUrl ||
      activity?.metadata?.avatarUrl
  );

  if (activityAvatar) return activityAvatar;

  return projectPulseGetPersonAvatar(projectPulseResolveActor(activity, project));
}

function projectPulseGetInitials(name) {
  const parts = String(name || "Project member")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "PM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function projectPulseGetActivityText(activity) {
  return String(
    activity?.text ||
      activity?.message ||
      activity?.title ||
      activity?.description ||
      activity?.details?.description ||
      activity?.metadata?.description ||
      ""
  ).trim();
}

function projectPulseGetActionLabel(activity) {
  const raw = [
    activity?.action,
    activity?.type,
    activity?.status,
    projectPulseGetActivityText(activity),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (raw.includes("complete") || raw.includes("done")) return "completed";
  if (raw.includes("ship")) return "shipped";
  if (raw.includes("move")) return "moved";
  if (raw.includes("create") || raw.includes("new task")) return "created";
  if (raw.includes("start") || raw.includes("progress")) return "started";
  if (raw.includes("block")) return "blocked";

  return "updated";
}

function projectPulseCleanTargetFromText(text, actorName) {
  let cleaned = String(text || "").trim();

  if (!cleaned) return "";

  const safeActor = String(actorName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (safeActor) {
    cleaned = cleaned.replace(new RegExp(`^${safeActor}\\s+`, "i"), "");
  }

  cleaned = cleaned
    .replace(/^Someone moved\s+/i, "")
    .replace(/^Someone\s+(moved|updated|completed|created|shipped|started|blocked)\s+/i, "")
    .replace(/^Someone\s+/i, "")
    .replace(/^Project member\s+/i, "")
    .replace(/^Team member\s+/i, "")
    .replace(/^(moved|updated|completed|created|shipped|started|blocked)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function projectPulseGetTargetLabel(activity, actorName) {
  const explicitTarget =
    activity?.target ||
    activity?.targetName ||
    activity?.taskTitle ||
    activity?.taskName ||
    activity?.itemTitle ||
    activity?.projectTitle ||
    activity?.task?.title ||
    activity?.project?.name ||
    activity?.raw?.taskTitle ||
    activity?.raw?.taskName ||
    activity?.raw?.title ||
    activity?.details?.taskTitle ||
    activity?.details?.taskName ||
    activity?.details?.title ||
    activity?.metadata?.taskTitle ||
    activity?.metadata?.taskName ||
    activity?.metadata?.title ||
    "";

  if (explicitTarget) {
    return String(explicitTarget).trim();
  }

  return projectPulseCleanTargetFromText(
    projectPulseGetActivityText(activity),
    actorName
  ) || "an item";
}

function projectPulseGetStatusLabel(activity) {
  const action = projectPulseGetActionLabel(activity);

  if (action === "completed") return "Completed";
  if (action === "shipped") return "Shipped";
  if (action === "blocked") return "Blocked";
  if (action === "started") return "In progress";
  if (action === "created") return "Created";
  if (action === "moved") return "Moved";

  return "Updated";
}

function projectPulseFormatTimeAgo(value) {
  if (!value) return "Now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ProjectActivityActorAvatar({ activity, actorName, project }) {
  const [failed, setFailed] = useState(false);
  const avatar = projectPulseGetActorAvatar(activity, project);

  if (avatar && !failed) {
    return (
      <img
        src={avatar}
        alt={`${actorName} avatar`}
        onError={() => setFailed(true)}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-[#111113]"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-[11px] font-black text-violet-700 ring-2 ring-white shadow-sm dark:bg-violet-500/10 dark:text-violet-200 dark:ring-[#111113]">
      {projectPulseGetInitials(actorName)}
    </div>
  );
}


function ProjectLiveActivityRow({ item, index, project }) {
  const actorName = projectPulseGetActorName(item, project);
  const action = projectPulseGetActionLabel(item);
  const target = projectPulseGetTargetLabel(item, actorName);
  const status = projectPulseGetStatusLabel(item);
  const timestamp =
    item?.createdAt ||
    item?.updatedAt ||
    item?.timestamp ||
    item?.time ||
    item?.date ||
    item?.ts ||
    null;

  const statusKey = String(status || "").toLowerCase();

  const tone =
    statusKey.includes("completed") || statusKey.includes("shipped")
      ? {
          rail: "from-emerald-400 to-cyan-400",
          dot: "bg-emerald-400",
          badge:
            "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        }
      : statusKey.includes("blocked")
        ? {
            rail: "from-rose-400 to-orange-400",
            dot: "bg-rose-400",
            badge:
              "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
          }
        : {
            rail: "from-violet-400 to-cyan-400",
            dot: "bg-violet-400",
            badge:
              "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
          };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-violet-500/25">
      <div className={`absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b ${tone.rail}`} />

      <div className="flex items-start gap-3 pl-2">
        <ProjectActivityActorAvatar
          activity={item}
          actorName={actorName}
          project={project}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${tone.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {status}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
              {projectPulseFormatTimeAgo(timestamp)}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-zinc-200">
            <span className="font-black text-slate-950 dark:text-white">
              {actorName}
            </span>{" "}
            <span>{action}</span>{" "}
            <span className="font-black text-slate-950 dark:text-white">
              {target}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}

function ProjectLiveActivityCard({ activities = [], project = null }) {
  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];
  const hasItems = items.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white shadow-sm dark:border-emerald-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.08),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400" />

      <header className="relative z-10 flex items-start justify-between gap-4 border-b border-slate-100/90 px-5 py-4 dark:border-white/[0.06]">
        <div className="flex items-start gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Activity className="h-6 w-6" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Live Activity
              </h3>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                Realtime
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Real-time execution signals from this project
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Now
        </span>
      </header>

      <div className="relative z-10 p-4">
        {hasItems ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <ProjectLiveActivityRow
                key={item?._id || item?.id || item?.createdAt || index}
                item={item}
                index={index}
                project={project}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400">
            No live activity yet. Ship an update, complete a task, or resolve a blocker to create the first signal.
          </div>
        )}
      </div>
    </section>
  );
}



function ProjectActiveGoalsCard({ goals = [], loading = false, onGoalClick }) {
  const items = Array.isArray(goals) ? goals.filter(Boolean) : [];

  const activeCount = items.filter((goal) => !goal.done).length;
  const blockedCount = items.filter((goal) => goal.blocked).length;

  const avgProgress =
    items.length > 0
      ? Math.round(
          items.reduce((sum, goal) => sum + Number(goal.progress || 0), 0) /
            items.length
        )
      : 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-teal-100/80 bg-white p-5 shadow-sm dark:border-teal-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(45,212,191,0.14),transparent_34%),radial-gradient(circle_at_92%_12%,rgba(124,58,237,0.09),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500" />

      <header className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-600 shadow-sm dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Active Goals
              </h3>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                Focus
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Live objectives shaping this project’s next execution moves.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
          {loading ? "Syncing" : "Live"}
        </span>
      </header>

      <div className="relative z-10 mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Active
          </p>
          <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Progress
          </p>
          <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">
            {avgProgress}%
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Blocked
          </p>
          <p className={`mt-1 text-xl font-black ${blockedCount > 0 ? "text-rose-500" : "text-slate-950 dark:text-white"}`}>
            {blockedCount}
          </p>
        </div>
      </div>

      <div className="relative z-10">
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((goal, index) => {
              const progress = Math.max(0, Math.min(100, Number(goal.progress || 0)));

              const tone = goal.blocked
                ? "border-rose-100 bg-rose-50/70 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                : goal.done
                  ? "border-emerald-100 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-violet-100 bg-violet-50/70 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300";

              return (
                <article
                  key={goal.id || index}
                  onClick={() => onGoalClick?.(goal.raw || goal)}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600 dark:bg-white/[0.06] dark:text-zinc-300">
                          #{index + 1}
                        </span>

                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone}`}>
                          {goal.status || "Active"}
                        </span>

                        {goal.source ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400">
                            {goal.source}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="mt-3 text-sm font-black text-slate-950 dark:text-white">
                        {goal.title}
                      </h4>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-zinc-400">
                        {goal.subtitle || "Keep this moving to protect project momentum."}
                      </p>

                      {goal.ownerName ? (
                        <p className="mt-2 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                          Owner: {goal.ownerName}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-black text-slate-950 dark:text-white">
                        {progress}%
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Done
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">
              <Target className="h-6 w-6" />
            </div>

            <h4 className="mt-4 text-sm font-black text-slate-950 dark:text-white">
              No active goals yet
            </h4>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500 dark:text-zinc-400">
              Add a high-priority task, sprint goal, objective, or milestone. Once it exists, this panel becomes the project’s live focus board.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}


function OverviewView({
  project,
  overview,
  metrics,
  sprint,
  loading,
  onObjectiveClick,
  onSprintAction,
  onOpenNextMoves,
  onFinishLineAction,
  onReopenProject,
  onViewCaseStudy,
  isReopeningProject,
  isStartingSprint = false,
  projectOnlineCount = 0,
  liveTasks = [],
  tasks = [],
  blockers = [],
  projectMomentum = null,
}) {
  const summary = overview?.summary || {};
  const serverPulse = overview?.pulse || {};

  const derivedPulse = useMemo(() => {
    return buildProjectPulse(project || overview?.project || {}, {
      tasks,
      blockers,
    });
  }, [project, overview?.project, tasks, blockers]);

  const pulse = useMemo(() => {
    const finishLineBlocked = readNumber(
      overview?.finishLine?.blockerCount ??
        overview?.finishLine?.blockersCount ??
        overview?.finishLine?.unresolvedBlockers ??
        overview?.finishLine?.unresolvedBlockerCount ??
        (Array.isArray(overview?.finishLine?.blockers)
          ? overview.finishLine.blockers.length
          : 0),
      0
    );

    const today = readNumber(derivedPulse?.today, 0);
    const inMotion = readNumber(derivedPulse?.inMotion, 0);
    const blocked = Math.max(readNumber(derivedPulse?.blocked, 0), finishLineBlocked);
    const ready = readNumber(derivedPulse?.ready, 0);

    return {
      todayCompleted: today,
      today,
      completedToday: today,
      shipsToday: today,
      inMotion,
      blocked,
      ready,
    };
  }, [derivedPulse, overview?.finishLine]);

  const serverMomentum = overview?.momentum || {};
  const momentum = projectMomentum || serverMomentum;
  const finishLine = overview?.finishLine || null;
  const priorityStack = Array.isArray(overview?.priorityStack) ? overview.priorityStack : [];
  const liveActivity = Array.isArray(overview?.liveActivity) ? overview.liveActivity : [];
  const rawActiveGoals = Array.isArray(overview?.activeGoals) ? overview.activeGoals : [];

  const activeGoals = useMemo(() => {
    const built = buildProjectActiveGoals({
      project,
      tasks: liveTasks,
      overview,
      priorityStack,
      foresight: overview?.foresight || metrics?.foresight,
    });

    return built.length > 0 ? built : rawActiveGoals;
  }, [
    project,
    liveTasks,
    overview,
    priorityStack,
    metrics?.foresight,
    rawActiveGoals,
  ]);
  const rawTeamCapacity =
    Array.isArray(overview?.teamCapacity) || typeof overview?.teamCapacity === "object"
      ? overview?.teamCapacity
      : metrics?.teamCapacity || null;

  const projectTasksForTeamCapacity =
    typeof liveTasks !== "undefined" && Array.isArray(liveTasks)
      ? liveTasks
      : typeof tasks !== "undefined" && Array.isArray(tasks)
        ? tasks
        : [];

  const teamCapacity = useMemo(() => {
    return buildProjectTeamCapacity({
      project,
      tasks: projectTasksForTeamCapacity,
      overview,
      fallback: rawTeamCapacity,
    });
  }, [project, projectTasksForTeamCapacity, overview, rawTeamCapacity]);

  const projectForesight = useMemo(() => {
    return buildProjectForesight({
      project: project || overview?.project || {},
      tasks,
      blockers,
      priorityStack,
      pulse,
      momentum,
      finishLine,
    });
  }, [project, overview?.project, tasks, blockers, priorityStack, pulse, momentum, finishLine]);

  const nextActionTitle =
    summary?.nextAction?.title ||
    "No priority surfaced yet";

  const blockedCount =
    Number.isFinite(Number(summary?.blockedCount))
      ? Number(summary.blockedCount)
      : 0;

  const ownerName = getProjectOwnerDisplayName(
    (typeof project !== "undefined" && project) ||
      (typeof activeProject !== "undefined" && activeProject) ||
      (typeof currentProject !== "undefined" && currentProject) ||
      overview?.project ||
      overview?.rawProject ||
      null,
    summary
  );

  const ownerAvatarUrl = getProjectOwnerAvatarUrl(
    (typeof project !== "undefined" && project) ||
      (typeof activeProject !== "undefined" && activeProject) ||
      (typeof currentProject !== "undefined" && currentProject) ||
      overview?.project ||
      overview?.rawProject ||
      null,
    summary
  );

  const memberCount =
    Number.isFinite(Number(summary?.ownerSummary?.memberCount))
      ? Number(summary.ownerSummary.memberCount)
      : 0;

  const onlineCount =
    Number.isFinite(Number(projectOnlineCount))
      ? Number(projectOnlineCount)
      : Number.isFinite(Number(summary?.ownerSummary?.onlineCount))
        ? Number(summary.ownerSummary.onlineCount)
        : 0;

  const activeGoalCount = activeGoals.length;

  const foresightMetrics = {
    ...metrics,
    foresight: projectForesight || overview?.foresight || metrics?.foresight,
  };

  const teamMetrics = {
    ...metrics,
    teamCapacity,
  };

  const isCompletedProject = Boolean(
    finishLine?.isCompleted ||
      String(project?.status || "").toLowerCase() === "completed" ||
      project?.completedAt
  );

  const caseStudyProject = {
    ...project,
    completedAt:
      finishLine?.completedAt ||
      finishLine?.completionSnapshot?.completedAt ||
      project?.completedAt,
    completionSummary:
      finishLine?.closureSummary ||
      finishLine?.completionSnapshot?.summary ||
      project?.completionSummary,
    outcomeStatus:
      finishLine?.outcomeStatus ||
      finishLine?.completionSnapshot?.outcomeStatus ||
      project?.outcomeStatus,
    completedTasks:
      finishLine?.completionSnapshot?.completedTaskCount ??
      project?.completedTasks,
    taskCount:
      finishLine?.completionSnapshot?.totalTaskCount ??
      project?.taskCount,
  };

  return (
    <div className="relative z-10 p-6 md:p-10 max-w-[1640px] mx-auto">
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-5">
          <NextMoveSignalCard
            title={nextActionTitle}
            activeGoalCount={activeGoalCount}
            caption={
              activeGoalCount > 0
                ? `${activeGoalCount} active goal${activeGoalCount === 1 ? "" : "s"} shaping priorities`
                : "Surface the next action before opening deeper views"
            }
            onOpenNextMoves={onOpenNextMoves}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <BlockedSignalCard
            blockedLabel={blockedCount === 0 ? "No blockers" : `${blockedCount} blocker${blockedCount === 1 ? "" : "s"}`}
            caption={
              blockedCount === 0
                ? "Nothing critical is blocked right now"
                : "Resolve blockers fast to protect momentum"
            }
          />
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <OwnerSignalCard
            ownerName={ownerName}
            ownerAvatarUrl={ownerAvatarUrl}
            caption={`${memberCount} member${memberCount === 1 ? "" : "s"} · ${onlineCount} online now`}
          />
        </div>
      </div>

      <div className="mb-8">
        <FinishLineCard
          finishLine={finishLine}
          onPrimaryAction={onFinishLineAction}
        />
      </div>

      {isCompletedProject ? (
        <>
          <div className="mb-8">
            <CompletedSnapshotPanel
              finishLine={finishLine}
              onReopenProject={onReopenProject}
              isReopeningProject={isReopeningProject}
              onViewCaseStudy={onViewCaseStudy}
            />
          </div>

          <div className="mb-8">
            <ProjectCaseStudyCard project={caseStudyProject} />
          </div>
        </>
      ) : null}

      <div className="mb-8">
        <OverviewPulseCard pulse={pulse} />
      </div>

      <div className="grid grid-cols-12 gap-8 mb-8">
        <div className="col-span-12 lg:col-span-4">
          <MomentumCard
            momentum={momentum?.score || 0}
            weeklyShips={momentum?.weeklyShips || 0}
            trend={momentum?.trend}
          />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <PriorityStack moves={priorityStack} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <SprintCard
          sprint={overview?.sprint || sprint}
          project={project}
          overview={overview}
          loading={loading}
          onAction={onSprintAction}
          isStarting={isStartingSprint}
        />
        <ForesightCard metrics={foresightMetrics} />
        <ProjectLiveActivityCard activities={liveActivity} project={project} />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-5">
          <TeamCapacityCard metrics={teamMetrics} />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <ProjectActiveGoalsCard
            goals={activeGoals}
            loading={loading}
            onGoalClick={onObjectiveClick}
          />
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

  const [activeView, setActiveView] = useState("overview");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false);

  const { joinProject, leaveProject } = useCursorContext();
  const { flashShip } = useCursorFlash();
  const currentUserId = user?.id || user?._id || user?.userId || "";

  const { projectStats } = usePresence({
    projectId: id,
    currentUserId,
    autoDetectIdle: true,
  });

  const { triggerPulse } = useGlobalPulse();
  const { joinProjectRoom, leaveProjectRoom, subscribe } = useSocketContext();

  const refreshOverviewTimerRef = useRef(null);

  const [liveTasks, setLiveTasks] = useState([]);
  const [pulseRefreshKey, setPulseRefreshKey] = useState(0);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showCompleteProjectModal, setShowCompleteProjectModal] = useState(false);
  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [isReopeningProject, setIsReopeningProject] = useState(false);
  const [isStartingSprint, setIsStartingSprint] = useState(false);
  const [spectatorInitialFollowing, setSpectatorInitialFollowing] = useState(false);

  const {
    project,
    overview,
    metrics,
    criticalMoves,
    objectives,
    activeGoals,
    finishLine,
    sprint,
    announcements,
    activity,
    pinnedAnnouncement,
    loading,
    error,
    refresh,
    refreshSilently,
    shipUpdate,
    isHealthy,
    hasWarnings,
    tasks,
    milestones,
    events,
    threads,
    files,
    overviewMemberCount,
  } = useProjectOverview(id);

  const viewerAccess = useMemo(
    () => getProjectViewerAccess(project, user),
    [project, user]
  );

  const {
    following: spectatorFollowing,
    loading: isSpectatorFollowLoading,
    followersCount: spectatorFollowersCount,
    error: spectatorFollowError,
    toggle: toggleSpectatorFollow,
  } = useFollow(
    id,
    spectatorInitialFollowing,
    readNumber(project?.followersCount, 0)
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSpectatorFollowStatus() {
      if (!id || !viewerAccess.showFollowButton) {
        setSpectatorInitialFollowing(false);
        return;
      }

      const following = await getFollowStatus(id);
      if (!cancelled) {
        setSpectatorInitialFollowing(Boolean(following));
      }
    }

    loadSpectatorFollowStatus();

    return () => {
      cancelled = true;
    };
  }, [id, viewerAccess.showFollowButton]);

  useEffect(() => {
    if (!spectatorFollowError) return;

    toast({
      title: "Follow action failed",
      description: spectatorFollowError?.message || "Unable to update follow status.",
      variant: "error",
    });
  }, [spectatorFollowError]);

  const handleSpectatorFollowToggle = useCallback(async () => {
    await toggleSpectatorFollow();
  }, [toggleSpectatorFollow]);

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

  const scheduleOverviewRefresh = useCallback(() => {
    if (refreshOverviewTimerRef.current) {
      window.clearTimeout(refreshOverviewTimerRef.current);
    }

    refreshOverviewTimerRef.current = window.setTimeout(() => {
      refreshSilently?.();
    }, 250);
  }, [refreshSilently]);

  const forceLifecycleRefresh = useCallback(async () => {
    if (refreshOverviewTimerRef.current) {
      window.clearTimeout(refreshOverviewTimerRef.current);
      refreshOverviewTimerRef.current = null;
    }

    await refresh?.();
    await refreshSilently?.();

    setPulseRefreshKey((k) => k + 1);
  }, [refresh, refreshSilently]);

  useEffect(() => {
    return () => {
      if (refreshOverviewTimerRef.current) {
        window.clearTimeout(refreshOverviewTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    console.log("[ProjectHome.jsx] joining room (APP):", id);
    joinProjectRoom(id);

    const matchesProject = (payload) => {
      const payloadProjectId = payload?.projectId?.toString?.() || payload?.projectId;
      if (!payloadProjectId) return true;
      return String(payloadProjectId) === String(id);
    };

    const handleTaskPatch = (payload) => {
      if (!matchesProject(payload)) return;

      setLiveTasks((prev) => applyTaskUpdated(prev, payload));
      setPulseRefreshKey((k) => k + 1);
      scheduleOverviewRefresh();
    };

    const handleOverviewRefreshSignal = (payload) => {
      if (!matchesProject(payload)) return;
      setPulseRefreshKey((k) => k + 1);
      scheduleOverviewRefresh();
    };

    const eventMap = [
      ["taskUpdated", handleTaskPatch],
      ["task:update", handleTaskPatch],
      ["taskStatusChanged", handleTaskPatch],
      ["task:statusChanged", handleTaskPatch],
      ["taskMoved", handleTaskPatch],
      ["task:moved", handleTaskPatch],
      ["taskCompleted", handleOverviewRefreshSignal],
      ["task:completed", handleOverviewRefreshSignal],
      ["taskCreated", handleOverviewRefreshSignal],
      ["task:created", handleOverviewRefreshSignal],
      ["taskDeleted", handleOverviewRefreshSignal],
      ["task:deleted", handleOverviewRefreshSignal],
      ["activityCreated", handleOverviewRefreshSignal],
      ["activity:created", handleOverviewRefreshSignal],
      ["blockerCreated", handleOverviewRefreshSignal],
      ["blocker:created", handleOverviewRefreshSignal],
      ["blockerUpdated", handleOverviewRefreshSignal],
      ["blocker:updated", handleOverviewRefreshSignal],
      ["blockerResolved", handleOverviewRefreshSignal],
      ["blocker:resolved", handleOverviewRefreshSignal],
      ["goalCreated", handleOverviewRefreshSignal],
      ["goal:created", handleOverviewRefreshSignal],
      ["goalUpdated", handleOverviewRefreshSignal],
      ["goal:updated", handleOverviewRefreshSignal],
      ["sprintUpdated", handleOverviewRefreshSignal],
      ["sprint:updated", handleOverviewRefreshSignal],
      ["memberJoinedProject", handleOverviewRefreshSignal],
      ["memberLeftProject", handleOverviewRefreshSignal],
      ["projectCompleted", handleOverviewRefreshSignal],
      ["project.completed", handleOverviewRefreshSignal],
      ["projectReopened", handleOverviewRefreshSignal],
      ["project.reopened", handleOverviewRefreshSignal],
      ["project:overviewUpdated", handleOverviewRefreshSignal],
      ["project:metricsUpdated", handleOverviewRefreshSignal],
    ];

    const unsubs = eventMap.map(([eventName, handler]) => subscribe(eventName, handler));

    return () => {
      unsubs.forEach((unsub) => unsub?.());
      leaveProjectRoom(id);

      if (refreshOverviewTimerRef.current) {
        window.clearTimeout(refreshOverviewTimerRef.current);
      }
    };
  }, [id, joinProjectRoom, leaveProjectRoom, subscribe, scheduleOverviewRefresh]);

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
        await refreshSilently?.();
        toast({ title: "🚀 Update Shipped!", variant: "success" });
      } catch (e) {
        toast({
          title: "Ship Failed",
          description: e?.message || "Unknown error",
          variant: "error",
        });
        throw e;
      }
    },
    [shipUpdate, flashShip, triggerPulse, refreshSilently]
  );

  const handleSettings = useCallback(() => {
    navigate(`/projects/${id}/settings`);
  }, [navigate, id]);

  const handleBackToProjects = useCallback(() => {
    navigate("/projects");
  }, [navigate]);

  const handleObjectiveClick = useCallback(
    (objective) => {
      const objectiveId = objective?.id || objective?._id;
      if (!objectiveId) return;
      navigate(`/projects/${id}/objectives/${objectiveId}`);
    },
    [navigate, id]
  );

  const handleSprintAction = useCallback(
    async (action) => {
      if (!id) return;

      if (action === "start") {
        if (isStartingSprint) return;

        try {
          setIsStartingSprint(true);

          const payload = buildDefaultSprintPayload(id, project?.name);
          await createProjectSprint(id, payload);

          await refresh?.();
          await refreshSilently?.();

          setPulseRefreshKey((k) => k + 1);

          toast({
            title: "Sprint started",
            description: "Your 2-week execution cycle is now active.",
            variant: "success",
          });
        } catch (e) {
          const description = humanSprintError(e);

          toast({
            title: "Sprint could not start",
            description,
            variant: "error",
          });

          console.warn("[ProjectHome] start sprint failed:", e);
        } finally {
          setIsStartingSprint(false);
        }

        return;
      }

      if (action === "continue") {
        navigate(`/projects/${id}/sprint`);
        return;
      }

      if (action === "review") {
        navigate(`/projects/${id}/sprint`);
      }
    },
    [
      id,
      isStartingSprint,
      navigate,
      project?.name,
      refresh,
      refreshSilently,
    ]
  );

  const handleCompleteProjectSubmit = useCallback(
    async (payload) => {
      if (!id) return;

      try {
        setIsCompletingProject(true);
        await completeProject(id, payload);
        notifyProjectLifecycleSubscriptionRefresh({
          projectId: id,
          action: "completed",
        });
        setShowCompleteProjectModal(false);
        await forceLifecycleRefresh();

        toast({
          title: "Project completed",
          description: "The project has been formally closed and the overview has been refreshed.",
          variant: "success",
        });
      } catch (e) {
        toast({
          title: "Complete project failed",
          description: e?.normalizedMessage || e?.message || "Unknown error",
          variant: "error",
        });
        throw e;
      } finally {
        setIsCompletingProject(false);
      }
    },
    [id, forceLifecycleRefresh]
  );

  const handleReopenProject = useCallback(
    async () => {
      if (!id || isReopeningProject) return;

      const confirmed = window.confirm("Reopen this project and return it to active work?");
      if (!confirmed) return;

      try {
        setIsReopeningProject(true);
        await reopenProject(id, { reason: "Reopened from ProjectHome finish line" });
        notifyProjectLifecycleSubscriptionRefresh({
          projectId: id,
          action: "reopened",
        });
        await forceLifecycleRefresh();

        toast({
          title: "Project reopened",
          description: "The project is active again and ready for more work.",
          variant: "success",
        });
      } catch (e) {
        toast({
          title: "Reopen failed",
          description: e?.normalizedMessage || e?.message || "Unknown error",
          variant: "error",
        });
      } finally {
        setIsReopeningProject(false);
      }
    },
    [id, isReopeningProject, forceLifecycleRefresh]
  );

  const handleFinishLineAction = useCallback(() => {
    const line = finishLine || overview?.finishLine || null;

    if (!line) {
      toast({
        title: "Finish Line",
        description: "Closure readiness is still syncing for this project.",
      });
      return;
    }

    if (isCompletingProject || isReopeningProject) {
      return;
    }

    if (line.isCompleted) {
      handleReopenProject();
      return;
    }

    setShowCompleteProjectModal(true);
  }, [
    finishLine,
    overview,
    isCompletingProject,
    isReopeningProject,
    handleReopenProject,
  ]);

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

  const projectViews = useMemo(() => {
    const discussionCount = Array.isArray(threads) ? threads.length : 0;

    return PROJECT_VIEWS.map((view) => {
      if (view.id === "discussion") {
        return {
          ...view,
          badge: discussionCount > 0 ? discussionCount : undefined,
        };
      }
      return view;
    });
  }, [threads]);

  const overviewOnlineCount = Number.isFinite(Number(overview?.summary?.ownerSummary?.onlineCount))
    ? Number(overview.summary.ownerSummary.onlineCount)
    : 0;

  const projectOnlineCount = Math.max(
    Number.isFinite(Number(projectStats?.online)) ? Number(projectStats.online) : 0,
    overviewOnlineCount
  );

  const projectMomentum = useMemo(() => {
    const activitySource = Array.isArray(activity)
      ? activity
      : Array.isArray(activity?.items)
        ? activity.items
        : Array.isArray(overview?.liveActivity)
          ? overview.liveActivity
          : [];

    return buildProjectMomentum({
      project,
      tasks: liveTasks,
      activities: activitySource,
    });
  }, [project, liveTasks, activity, overview?.liveActivity, pulseRefreshKey]);

  const headerMetrics = {
    ...metrics,
    momentum:
      Number.isFinite(Number(projectMomentum?.score))
        ? Number(projectMomentum.score)
        : Number.isFinite(Number(overview?.momentum?.score))
          ? Number(overview.momentum.score)
          : metrics?.momentum || 0,
  };

  const projectLifecycleState = String(project?.status || "").toLowerCase();
  const isHistoricalProject = projectLifecycleState === "completed";
  const showHistoricalBanner = isHistoricalProject && activeView !== "overview";

  const handleViewCaseStudy = useCallback(() => {
    if (activeView !== "overview") {
      setActiveView("overview");
    }

    if (typeof window === "undefined") return;

    window.setTimeout(() => {
      const target = document.getElementById("project-case-study");
      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }, [activeView]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <ErrorState
        error={error?.message || String(error)}
        onRetry={refresh}
      />
    );
  }

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
        case "overview":
          return (
            <OverviewView
              project={project}
              overview={overview}
              metrics={metrics}
              sprint={sprint}
              loading={loading}
              onObjectiveClick={handleObjectiveClick}
              onSprintAction={handleSprintAction}
              onOpenNextMoves={() => setActiveView("suggestions")}
              onFinishLineAction={handleFinishLineAction}
              onReopenProject={handleReopenProject}
              onViewCaseStudy={handleViewCaseStudy}
              isReopeningProject={isReopeningProject}
              isStartingSprint={isStartingSprint}
              projectOnlineCount={projectOnlineCount}
              liveTasks={liveTasks}
              projectMomentum={projectMomentum}
              tasks={liveTasks}
              blockers={overview?.blockers || overview?.blockingReasons || overview?.finishLine?.blockers || []}
            />
          );

        case "tasks":
          return (
            <div className={pageWrap}>
              <StackPanel
                projectId={id}
                limit={10}
                milestoneIdFilter={selectedMilestoneId}
              />
            </div>
          );

        case "board":
          return (
            <div className={pageWrap}>
              <FlowBoard
                projectId={id}
                milestoneIdFilter={selectedMilestoneId}
              />
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

        case "schedule":
          return (
            <RhythmView
              projectId={id}
              events={events || []}
              onAddEvent={handleAddEvent}
              onEventClick={handleEventClick}
            />
          );

        case "discussion":
          return (
            <ThreadsView
              projectId={id}
              project={project}
              threads={threads || []}
              onOpenFullChat={() =>
                navigate("/messages", { state: { projectId: id } })
              }
            />
          );

        case "files":
          return (
            <VaultView
              projectId={id}
              files={files || []}
              onUpload={handleUpload}
              onFileClick={handleFileClick}
              onNewFolder={handleNewFolder}
            />
          );

        case "announcements":
          return (
            <div className={pageWrap}>
              <AnnouncementsView
                projectId={id}
                announcements={announcements || []}
              />
            </div>
          );

        case "insights":
          return (
            <div className={pageWrap}>
              <InsightsTab projectId={id} />
            </div>
          );

        case "suggestions":
          return (
            <SuggestionsPanel projectId={id} project={project} />
          );

        default:
          return (
            <div className="p-10 text-center text-slate-500">
              View not found
            </div>
          );
      }
    } catch (e) {
      console.error("[ProjectHome] renderViewContent crash:", e);
      return (
        <ErrorState
          error={
            e?.message ||
            "A view crashed during render. Check console stack trace for file + line."
          }
          onRetry={refresh}
        />
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.10),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-800 dark:bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.16),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#111827_100%)] dark:text-zinc-100" data-project-home-polish="safe-v5">

      <style className="project-home-safe-visual-polish-v5-style">{`
        /*
          ProjectHome Safe Visual Polish v5

          Rules:
          - No layout changes.
          - No margin/padding changes.
          - No height/min-height changes.
          - No fixed/absolute positioning.
          - No broad child repositioning.
          - Visual-only: background, shadow, border, text contrast, glow.
        */

        [data-project-home-polish="safe-v5"] {
          background:
            radial-gradient(circle at 10% 8%, rgba(139, 92, 246, 0.10), transparent 30%),
            radial-gradient(circle at 92% 10%, rgba(45, 212, 191, 0.12), transparent 34%),
            linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(239, 246, 255, 0.92)) !important;
        }

        .dark [data-project-home-polish="safe-v5"] {
          background:
            radial-gradient(circle at 10% 8%, rgba(139, 92, 246, 0.18), transparent 32%),
            radial-gradient(circle at 92% 10%, rgba(45, 212, 191, 0.14), transparent 34%),
            linear-gradient(180deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.96)) !important;
        }

        [data-project-home-polish="safe-v5"] header {
          background-image:
            linear-gradient(135deg, rgba(255, 255, 255, 0.76), rgba(248, 250, 252, 0.62)),
            radial-gradient(circle at 92% 12%, rgba(34, 211, 238, 0.14), transparent 36%),
            radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.13), transparent 34%) !important;
          border-color: rgba(148, 163, 184, 0.30) !important;
          box-shadow:
            0 18px 48px rgba(15, 23, 42, 0.08),
            inset 0 -1px 0 rgba(255, 255, 255, 0.58) !important;
          backdrop-filter: blur(18px) saturate(1.12);
        }

        .dark [data-project-home-polish="safe-v5"] header {
          background-image:
            linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.82)),
            radial-gradient(circle at 92% 12%, rgba(34, 211, 238, 0.13), transparent 36%),
            radial-gradient(circle at 8% 10%, rgba(139, 92, 246, 0.18), transparent 34%) !important;
          border-color: rgba(148, 163, 184, 0.22) !important;
          box-shadow:
            0 18px 48px rgba(0, 0, 0, 0.28),
            inset 0 -1px 0 rgba(255, 255, 255, 0.06) !important;
        }

        [data-project-home-polish="safe-v5"] header h1,
        [data-project-home-polish="safe-v5"] header h2 {
          text-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
        }

        [data-project-home-polish="safe-v5"] nav {
          background-image:
            linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(241, 245, 249, 0.58)) !important;
          border-color: rgba(148, 163, 184, 0.28) !important;
          box-shadow:
            0 14px 34px rgba(15, 23, 42, 0.065),
            inset 0 1px 0 rgba(255, 255, 255, 0.58) !important;
          backdrop-filter: blur(18px) saturate(1.12);
        }

        .dark [data-project-home-polish="safe-v5"] nav {
          background-image:
            linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(2, 6, 23, 0.76)) !important;
          border-color: rgba(148, 163, 184, 0.20) !important;
          box-shadow:
            0 14px 34px rgba(0, 0, 0, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
        }

        [data-project-home-polish="safe-v5"] nav button,
        [data-project-home-polish="safe-v5"] nav a {
          transition:
            color 180ms ease,
            background-color 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease,
            filter 180ms ease;
        }

        [data-project-home-polish="safe-v5"] nav button:hover,
        [data-project-home-polish="safe-v5"] nav a:hover {
          filter: saturate(1.12);
          text-shadow: 0 8px 22px rgba(124, 58, 237, 0.16);
        }

        [data-project-home-polish="safe-v5"] nav button[aria-selected="true"],
        [data-project-home-polish="safe-v5"] nav button[aria-current="page"],
        [data-project-home-polish="safe-v5"] nav a[aria-current="page"] {
          background-image:
            linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(34, 211, 238, 0.08)) !important;
          border-color: rgba(167, 139, 250, 0.52) !important;
          box-shadow:
            0 12px 30px rgba(124, 58, 237, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
        }

        [data-project-home-polish="safe-v5"] [class*="from-violet"],
        [data-project-home-polish="safe-v5"] [class*="from-purple"] {
          box-shadow:
            0 14px 34px rgba(124, 58, 237, 0.20),
            inset 0 1px 0 rgba(255, 255, 255, 0.26);
        }

        [data-project-home-polish="safe-v5"] [class*="border-purple"],
        [data-project-home-polish="safe-v5"] [class*="border-violet"] {
          box-shadow:
            0 0 0 1px rgba(196, 181, 253, 0.18),
            0 12px 30px rgba(124, 58, 237, 0.08);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 opacity-70 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:64px_64px] dark:opacity-30" />
      <div className="pointer-events-none fixed -top-32 right-12 z-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      <div className="pointer-events-none fixed bottom-10 left-20 z-0 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />
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
        metrics={headerMetrics}
        activeUsers={projectOnlineCount}
        onShipUpdate={handleShipUpdate}
        onSettings={handleSettings}
        onBackToProjects={handleBackToProjects}
        onMembersClick={() => setIsMembersPanelOpen(true)}
        onLifecycleAction={handleFinishLineAction}
        isLifecycleBusy={isCompletingProject || isReopeningProject}
        viewerAccess={viewerAccess}
        following={spectatorFollowing}
        followLoading={isSpectatorFollowLoading}
        followersCount={spectatorFollowersCount}
        onFollowToggle={handleSpectatorFollowToggle}
      />

      <SpectatorAccessBanner
        viewerAccess={viewerAccess}
        following={spectatorFollowing}
        followersCount={spectatorFollowersCount}
      />

      <ViewNavigation
        activeView={activeView}
        onViewChange={setActiveView}
        views={projectViews}
      />

      {showHistoricalBanner ? (
        <HistoricalModeBanner
          project={{
            ...project,
            completedAt: finishLine?.completedAt || project?.completedAt,
            outcomeStatus: finishLine?.outcomeStatus || project?.outcomeStatus,
          }}
          onReopenProject={handleReopenProject}
          isReopeningProject={isReopeningProject}
          onViewCaseStudy={handleViewCaseStudy}
        />
      ) : null}

      <main key={pulseRefreshKey} className="relative z-10">{renderViewContent()}</main>

      <CompleteProjectModal
        isOpen={showCompleteProjectModal}
        onClose={() => {
          if (!isCompletingProject) {
            setShowCompleteProjectModal(false);
          }
        }}
        onSubmit={handleCompleteProjectSubmit}
        finishLine={finishLine || overview?.finishLine || null}
        projectName={project?.name || "Project"}
        isSubmitting={isCompletingProject}
        allowForceComplete
      />

      <GlobalPulseBar position="bottom" color="brand" />

      <QuickActionsManager projectId={id} />
      <KeyboardShortcuts />

      {showAddMilestone && (
        <AddMilestoneModal
          projectId={id}
          onClose={() => setShowAddMilestone(false)}
        />
      )}

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
