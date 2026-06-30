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
} from 'lucide-react';

import QuietProjectsBanner from '../components/projects/QuietProjectsBanner';
import ProjectCardV2 from '../components/projects/ProjectCardV2';
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

/* ─────────────────────────────────────────────────────────────────────────
   PROJECT ROW - List View
───────────────────────────────────────────────────────────────────────── */
function ProjectRow({ project, onProjectClick, onStartSprint }) {
  const name = getProjectName(project);
  const description = getProjectDescription(project);
  const emoji = getProjectEmoji(project);
  const color = project?.color || '#8B5CF6';
  const streak = safeNumber(project?.streak?.value ?? project?.streak, 0);
  const isImpressiveStreak = streak >= 7;
  const projectId = getProjectId(project);

  const handleClick = () => {
    if (!projectId) {
      console.error('[Projects] Cannot navigate - ProjectRow missing ID:', project);
      return;
    }
    onProjectClick(projectId);
  };

  const handleStartSprint = (e) => {
    e.stopPropagation();
    onStartSprint(project);
  };

  return (
    <div
      onClick={handleClick}
      className="
        group flex items-center justify-between p-4 rounded-xl cursor-pointer
        bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        hover:border-violet-200 dark:hover:border-violet-500/30
        transition-all duration-200
      "
      style={{
        boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(139, 92, 246, 0.04)';
      }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{
            backgroundColor: `${color}15`,
            color,
          }}
        >
          {emoji}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0">
        {streak > 0 && (
          <div
            className={`
              flex items-center gap-1 text-xs
              ${isImpressiveStreak ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'}
            `}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="font-medium">{streak}d</span>
          </div>
        )}

        <button
          onClick={handleStartSprint}
          className="
            px-3 py-1.5 rounded-lg text-xs font-medium
            bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300
            hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white
            transition-all duration-200
          "
        >
          Start Sprint
        </button>

        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search project names..."
              className="
                bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-lg
                pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-zinc-200
                placeholder:text-slate-400 dark:placeholder:text-zinc-600
                focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/20
                w-56 transition-all focus:w-72
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
