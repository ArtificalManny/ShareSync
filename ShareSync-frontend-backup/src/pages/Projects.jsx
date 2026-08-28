// src/pages/Projects.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROJECTS PAGE v4.4 - Canonical Grid Card Wiring
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT CHANGED IN v4.4:
// - Makes ProjectCardV2 the single source of truth for grid cards
// - Keeps list view intact
// - Keeps current Projects page structure and modal flow intact
// - Preserves the stronger visible purple "New Project" CTA
// - Fetches projects once on mount instead of on every filter/search keystroke
// - Removes seeded fake recent searches from page-owned state
//
// NO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Flame,
  Grid,
  List,
  LayoutGrid,
  ChevronRight,
  Clock3,
  Play,
  ShieldAlert,
  Users,
  Zap,
} from 'lucide-react';

import QuietProjectsBanner from '../components/projects/QuietProjectsBanner';
import ProjectCardV2 from '../components/projects/ProjectCardV2';
import ProjectAvatar from '../components/project/ProjectAvatar';
import { SkeletonProjectCard } from '../components/ui/Skeletons';
import EmptyProjects from '../components/empty-states/EmptyProjects';
import EmptySearch from '../components/empty-states/EmptySearch';
import { getProjects } from '../api/projects';

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────── */
const getProjectId = (project) => {
  const id = project?._id || project?.id;
  if (!id) {
    console.error('[Projects] Project missing ID:', project);
  }
  return id;
};

const getProjectName = (project) => {
  const raw = project?.name || project?.title || '';
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  return trimmed || 'Untitled project';
};

const getProjectDescription = (project) => {
  const raw = project?.description || project?.subtitle || '';
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  return trimmed || 'No description provided.';
};

const getProjectEmoji = (project) => {
  if (project?.icon) return project.icon;
  if (project?.emoji) return project.emoji;

  switch (project?.season) {
    case 'shipping':
      return '🚀';
    case 'exploring':
      return '🌱';
    case 'maintaining':
      return '🛠';
    default:
      return '📁';
  }
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pluralize = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural}`;

const timeAgo = (date) => {
  if (!date) return null;

  const then = new Date(date);
  const diffMs = Date.now() - then.getTime();

  if (!Number.isFinite(diffMs) || diffMs < 0) return null;

  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);

  if (weeks < 5) return `${weeks}w ago`;

  return `${Math.floor(days / 30)}mo ago`;
};

/* ─────────────────────────────────────────────────────────────────────────
   PROJECT ROW - List View
───────────────────────────────────────────────────────────────────────── */
function ProjectRow({ project, onProjectClick, onStartSprint }) {
  const name = getProjectName(project);
  const rawDescription = project?.description || project?.subtitle || '';
  const description =
    typeof rawDescription === 'string' && rawDescription.trim()
      ? rawDescription.trim()
      : 'Add a project description';

  const color = project?.color || '#8B5CF6';
  const projectId = getProjectId(project);

  const totalTasks = safeNumber(
    project?.taskCount ?? project?.totalTasks ?? project?.tasks?.length,
    0
  );

  const completedTasks = safeNumber(
    project?.completedTasks ?? project?.doneCount,
    0
  );

  const openTasks = safeNumber(
    project?.metrics?.openTasks?.value,
    Math.max(totalTasks - completedTasks, 0)
  );

  const rawProgress = safeNumber(
    project?.progressSummary?.percent ??
      project?.computedProgress ??
      project?.progress,
    0
  );

  const progress = Math.min(Math.max(Math.round(rawProgress), 0), 100);

  const rawMembers = Array.isArray(project?.members)
    ? project.members
    : Array.isArray(project?.team)
      ? project.team
      : [];

  const memberCount = Math.max(
    safeNumber(
      project?.memberCount ??
        project?.membersCount ??
        project?.metrics?.memberCount?.value ??
        project?.metrics?.memberCount,
      0
    ),
    rawMembers.length
  );

  const onlineCount = safeNumber(
    project?.onlineCount ??
      project?.onlineUsers ??
      project?.onlineUsersCount ??
      project?.membersOnline ??
      project?.presence?.online ??
      project?.metrics?.online?.value,
    0
  );

  const blockers = Array.isArray(project?.blockers)
    ? project.blockers.filter(Boolean)
    : [];

  const blockerCount = Math.max(
    safeNumber(project?.blockerCount, blockers.length),
    blockers.length
  );

  const status =
    project?.status || (project?.isAtRisk ? 'at-risk' : 'active');

  const isComplete =
    progress >= 100 ||
    status === 'completed' ||
    Boolean(project?.completedAt);

  const isBlocked = Boolean(project?.isBlocked) || blockerCount > 0;

  const isAtRisk =
    !isComplete &&
    (project?.isAtRisk ||
      status === 'at-risk' ||
      status === 'overdue');

  const lastActivity =
    project?.lastActivity ||
    project?.lastShipAt ||
    project?.lastShippedAt ||
    project?.updatedAt ||
    null;

  const lastActivityText = timeAgo(lastActivity);

  const streak = safeNumber(
    project?.streak?.value ?? project?.streak,
    0
  );

  const stateMeta = (() => {
    if (isComplete) {
      return {
        label: 'Completed',
        tone: 'emerald',
        momentum: 'Complete',
        risk: 'Clear',
      };
    }

    if (isBlocked) {
      return {
        label: 'Blocked',
        tone: 'red',
        momentum: 'Stalled',
        risk:
          blockerCount > 0
            ? pluralize(blockerCount, 'blocker', 'blockers')
            : 'Blocked',
      };
    }

    if (isAtRisk) {
      return {
        label: 'Needs attention',
        tone: 'amber',
        momentum: progress > 0 ? 'Building' : 'Quiet',
        risk: 'Needs attention',
      };
    }

    if (progress >= 80) {
      return {
        label: 'Strong',
        tone: 'emerald',
        momentum: 'Strong',
        risk: 'Clear',
      };
    }

    if (progress > 0) {
      return {
        label: 'Building',
        tone: 'violet',
        momentum: 'Building',
        risk: 'Clear',
      };
    }

    if (openTasks > 0) {
      return {
        label: 'Ready',
        tone: 'blue',
        momentum: 'Ready',
        risk: 'Clear',
      };
    }

    return {
      label: 'Planning',
      tone: 'blue',
      momentum: 'Planning',
      risk: 'Clear',
    };
  })();

  const stateBadgeClasses = {
    violet:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300',
    blue:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300',
    emerald:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300',
    red:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300',
  };

  const action = (() => {
    if (isComplete) {
      return { label: 'View', kind: 'open' };
    }

    if (isBlocked) {
      return { label: 'Resolve', kind: 'open' };
    }

    if (isAtRisk) {
      return { label: 'Review', kind: 'open' };
    }

    if (openTasks > 0 && onStartSprint) {
      return { label: 'Sprint', kind: 'sprint' };
    }

    return { label: 'Open', kind: 'open' };
  })();

  const handleClick = () => {
    if (!projectId) {
      console.error(
        '[Projects] Cannot navigate - ProjectRow missing ID:',
        project
      );
      return;
    }

    onProjectClick(projectId);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const handleAction = (event) => {
    event.stopPropagation();

    if (action.kind === 'sprint') {
      onStartSprint?.(project);
      return;
    }

    handleClick();
  };

  const progressBackground = isComplete
    ? 'linear-gradient(90deg, #059669 0%, #10B981 55%, #34D399 100%)'
    : isBlocked
      ? 'linear-gradient(90deg, #DC2626 0%, #EF4444 55%, #F87171 100%)'
      : 'linear-gradient(90deg, #6D28D9 0%, #7C3AED 50%, #A855F7 100%)';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${name}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="
        group relative grid cursor-pointer grid-cols-1 gap-4 overflow-hidden
        rounded-2xl border border-slate-200 bg-white px-4 py-4
        transition-all duration-200
        hover:border-violet-200 hover:bg-violet-50/20
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40
        dark:border-white/10 dark:bg-[#1f1f23]
        dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.04]
        md:grid-cols-2
        lg:grid-cols-[minmax(0,2.2fr)_minmax(145px,0.8fr)_minmax(170px,1fr)_minmax(155px,0.8fr)_auto]
        lg:items-center
      "
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: color,
        boxShadow: '0 3px 16px rgba(15, 23, 42, 0.045)',
      }}
    >
      {/* Project identity */}
      <div className="flex min-w-0 items-center gap-3 md:col-span-2 lg:col-span-1">
        <ProjectAvatar
          project={project}
          size="sm"
          className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        />

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-violet-700 dark:text-zinc-100 dark:group-hover:text-violet-300">
              {name}
            </h3>

            {streak > 0 && (
              <span className="hidden shrink-0 items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-300 sm:inline-flex">
                <Flame className="h-3.5 w-3.5" />
                {streak}d
              </span>
            )}
          </div>

          <p
            className={`
              mt-1 truncate text-xs
              ${rawDescription
                ? 'text-slate-500 dark:text-zinc-400'
                : 'italic text-slate-400 dark:text-zinc-500'
              }
            `}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Health */}
      <div className="min-w-0">
        <div
          className={`
            inline-flex max-w-full items-center rounded-full border
            px-2.5 py-1 text-[11px] font-semibold
            ${stateBadgeClasses[stateMeta.tone]}
          `}
        >
          <span className="truncate">{stateMeta.label}</span>
        </div>

        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{stateMeta.momentum}</span>

          <span aria-hidden="true">·</span>

          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{stateMeta.risk}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
            Progress
          </span>

          <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-zinc-200">
            {progress}%
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200/90 shadow-inner dark:bg-white/10"
          role="progressbar"
          aria-label={`${name} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${progress}%`,
              minWidth: progress > 0 ? '6px' : '0',
              background: progressBackground,
            }}
          />
        </div>
      </div>

      {/* Team and activity */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
          style={{
            backgroundColor: `${color}10`,
            borderColor: `${color}24`,
            color,
          }}
        >
          <Users className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-slate-700 dark:text-zinc-200">
            {memberCount > 0
              ? pluralize(memberCount, 'member', 'members')
              : 'No members yet'}
            {onlineCount > 0
              ? ` · ${pluralize(onlineCount, 'online', 'online')}`
              : ''}
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
            <Clock3 className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {lastActivityText
                ? `Updated ${lastActivityText}`
                : 'Waiting for activity'}
            </span>
          </div>
        </div>
      </div>

      {/* Contextual action */}
      <div className="flex items-center md:justify-end">
        <button
          type="button"
          onClick={handleAction}
          className={`
            inline-flex min-w-[92px] items-center justify-center gap-1.5
            rounded-lg border px-3 py-2 text-xs font-semibold
            transition-colors
            ${action.kind === 'sprint'
              ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20'
              : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:text-violet-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-violet-400/30 dark:hover:text-violet-300'
            }
          `}
        >
          {action.kind === 'sprint' && (
            <Play className="h-3.5 w-3.5" />
          )}

          <span>{action.label}</span>

          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────── */
const Projects = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const data = await getProjects();

      const list =
        Array.isArray(data) ? data
          : Array.isArray(data?.projects) ? data.projects
            : Array.isArray(data?.items) ? data.items
              : [];

      setProjects(list);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };


  const handleProjectClick = (projectId) => {
    if (!projectId) {
      console.error('[Projects] handleProjectClick called with invalid ID:', projectId);
      return;
    }
    navigate(`/projects/${projectId}`);
  };

  const handleStartSprint = (project) => {
    console.log('[Projects] Start sprint clicked for:', project?.name || project?.title || project?._id || project?.id);
  };

  const openCreateProjectModal = () => {
    window.dispatchEvent(new Event("ss:open-create-project"));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);

    const normalized = typeof query === 'string' ? query.trim() : '';
    if (normalized && !recentSearches.includes(normalized)) {
      setRecentSearches((prev) => [normalized, ...prev.slice(0, 4)]);
    }
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleCreateProjectFromSearch = () => {
    openCreateProjectModal();
  };

  const filteredProjects = projects.filter((project) => {
    const projectName = getProjectName(project).toLowerCase();
    const projectDescription = getProjectDescription(project).toLowerCase();
    const normalizedSearch = searchQuery.toLowerCase();

    const matchesSearch =
      projectName.includes(normalizedSearch) ||
      projectDescription.includes(normalizedSearch);

    if (selectedFilter === 'at-risk') {
      return matchesSearch && Boolean(project?.isAtRisk);
    }

    if (selectedFilter === 'active') {
      return matchesSearch && !Boolean(project?.isAtRisk);
    }

    return matchesSearch;
  });

  const renderEmptyState = () => {
    if (searchQuery && filteredProjects.length === 0) {
      return (
        <EmptySearch
          query={searchQuery}
          suggestions={[]}
          recentSearches={recentSearches}
          onSearch={handleSearch}
          onCreateProject={handleCreateProjectFromSearch}
          onClearRecent={handleClearRecentSearches}
          showCreate={true}
          showRecent={true}
          variant="illustrated"
        />
      );
    }

    if (projects.length === 0) {
      return (
        <EmptyProjects
          onCreateProject={() => openCreateProjectModal()}
          onSelectTemplate={(template) => {
            console.log('Selected template:', template);
            openCreateProjectModal();
          }}
          showTemplates={true}
          variant="animated"
        />
      );
    }

    if (filteredProjects.length === 0 && selectedFilter !== 'all') {
      return (
        <EmptySearch
          query=""
          onSearch={() => setSelectedFilter('all')}
          showCreate={false}
          showRecent={false}
          variant="minimal"
        >
          <div className="text-center mt-4">
            <p className="text-sm text-slate-500 dark:text-zinc-500 mb-4">
              No {selectedFilter === 'at-risk' ? 'at-risk' : 'active'} projects found.
            </p>
            <button
              onClick={() => setSelectedFilter('all')}
              className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              View all projects
            </button>
          </div>
        </EmptySearch>
      );
    }

    return null;
  };

  return (
    <div
      className="min-h-screen p-6 lg:p-10 max-w-[1400px] mx-auto"
      style={{
        background: 'var(--bg-page, linear-gradient(180deg, #F8FAFC 0%, #FFFFFF Available))',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-xs text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Projects workspace
            </span>
          </div>
          <h1 className="text-4xl font-semibold text-slate-800 dark:text-white">
            Projects
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative min-w-0 flex-1 max-w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search project names..."
              style={{ fontSize: "16px" }}
              className="
                bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-lg
                pl-10 pr-4 py-2.5 text-[16px] text-slate-700 dark:text-zinc-200
                placeholder:text-slate-400 dark:placeholder:text-zinc-600
                focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none focus:ring-0 focus:shadow-none
                w-full transition-colors
              "
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* New Project Button */}
          <button
            type="button"
            onClick={() => openCreateProjectModal()}
            className="
              relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl shrink-0 whitespace-nowrap
              text-sm font-semibold
              transition-all duration-200
            "
            style={{
              backgroundColor: '#7C3AED',
              backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #A855F7 Available)',
              color: '#FFFFFF',
              opacity: 1,
              boxShadow: '0 12px 28px rgba(124, 58, 237, 0.35)',
              border: '1px solid rgba(139, 92, 246, 0.28)',
              WebkitAppearance: 'none',
              appearance: 'none',
              filter: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6D28D9';
              e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 55%, #9333EA Available)';
              e.currentTarget.style.boxShadow = '0 16px 34px rgba(124, 58, 237, 0.42)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#7C3AED';
              e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #A855F7 Available)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(124, 58, 237, 0.35)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus className="w-4 h-4 shrink-0" style={{ color: '#FFFFFF' }} />
            <span className="hidden sm:inline" style={{ color: '#FFFFFF' }}>
              New Project
            </span>
          </button>
        </div>
      </header>

      <QuietProjectsBanner />

      {/* ═══════════════════════════════════════════════════════════════════
          TOOLBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-6 mt-8 pb-4 border-b border-slate-200 dark:border-white/10">
        {/* Filters */}
        <div className="flex gap-1">
          {['all', 'active', 'at-risk'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium capitalize
                transition-all duration-200
                ${selectedFilter === filter
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5'
                }
              `}
            >
              {filter === 'at-risk' ? 'At Risk' : filter}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-transparent dark:border-white/5">
          <button
            onClick={() => setViewMode('grid')}
            className={`
              p-2 rounded-md transition-all
              ${viewMode === 'grid'
                ? 'bg-white dark:bg-[#1f1f23] text-slate-800 dark:text-zinc-200 shadow-sm border border-slate-200/50 dark:border-white/10'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
              }
            `}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`
              p-2 rounded-md transition-all
              ${viewMode === 'list'
                ? 'bg-white dark:bg-[#1f1f23] text-slate-800 dark:text-zinc-200 shadow-sm border border-slate-200/50 dark:border-white/10'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
              }
            `}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PROJECT GRID / LIST
      ═══════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <SkeletonProjectCard key={i} />)}
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCardV2
                key={getProjectId(project) || `project-${getProjectName(project)}`}
                project={project}
                onProjectClick={handleProjectClick}
                onStartSprint={handleStartSprint}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="
                hidden
                lg:grid
                lg:grid-cols-[minmax(0,2.2fr)_minmax(145px,0.8fr)_minmax(170px,1fr)_minmax(155px,0.8fr)_auto]
                lg:items-center
                gap-4 px-5 pb-1
                text-[10px] font-semibold uppercase tracking-[0.16em]
                text-slate-400 dark:text-zinc-500
              "
              aria-hidden="true"
            >
              <span>Project</span>
              <span>Health</span>
              <span>Progress</span>
              <span>Team</span>
              <span className="min-w-[92px] text-center">Action</span>
            </div>

            {filteredProjects.map((project) => (
              <ProjectRow
                key={getProjectId(project) || `project-${getProjectName(project)}`}
                project={project}
                onProjectClick={handleProjectClick}
                onStartSprint={handleStartSprint}
              />
            ))}
          </div>
        )
      ) : (
        renderEmptyState()
      )}

    </div>
  );
};

export default Projects;
