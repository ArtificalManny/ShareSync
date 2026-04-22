// src/pages/Projects.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROJECTS PAGE v4.3 - Force visible New Project CTA
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT CHANGED IN v4.3:
// - Keeps your current Projects page structure intact
// - NO backend changes
// - Hard-forces the top-right "New Project" button to render as a visible
//   purple primary CTA
// - Uses explicit backgroundColor, backgroundImage, color, opacity, shadow,
//   and z-index to avoid washed-out rendering
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Flame, Users, Grid, List, LayoutGrid,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProjectsCreate from './ProjectsCreate';
import QuietProjectsBanner from '../components/projects/QuietProjectsBanner';
import { SkeletonProjectCard } from '../components/ui/Skeletons';

// PHASE D: Import empty state components
import EmptyProjects from '../components/empty-states/EmptyProjects';
import EmptySearch from '../components/empty-states/EmptySearch';

// Use API helpers that already unwrap backend shapes correctly
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

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getProjectName = (project) => {
  const raw = project?.name || project?.title || '';
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  return trimmed || 'Untitled project';
};

const getProjectDescription = (project) => {
  const raw = project?.description || project?.subtitle || '';
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  return trimmed || 'No description yet';
};

const getProjectVelocity = (project) => {
  return safeNumber(project?.metrics?.onTimePercent?.value, 0);
};

const getOpenTaskCount = (project) => {
  return safeNumber(project?.metrics?.openTasks?.value, 0);
};

/* ─────────────────────────────────────────────────────────────────────────
   VELOCITY BAR - Ocean Gradient
───────────────────────────────────────────────────────────────────────── */
const VelocityBar = ({ percentage }) => {
  const clampedPercentage = Math.min(Math.max(safeNumber(percentage, 0), 0), 100);
  const isComplete = clampedPercentage >= 100;

  return (
    <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${clampedPercentage}%`,
          background: isComplete
            ? 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 100%)'
            : 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%)'
        }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   PROJECT CARD - Grid View
───────────────────────────────────────────────────────────────────────── */
function ProjectCard({ project, onProjectClick, onStartSprint }) {
  const getSeasonEmoji = (season) => {
    switch (season) {
      case 'shipping': return '🚀';
      case 'exploring': return '🌱';
      case 'maintaining': return '🛠';
      default: return '📁';
    }
  };

  const name = getProjectName(project);
  const description = getProjectDescription(project);
  const velocity = getProjectVelocity(project);
  const openTaskCount = getOpenTaskCount(project);
  const streak = safeNumber(project?.streak?.value, 0);
  const isImpressiveStreak = streak >= 7;
  const hasNextStep = Boolean(project?.nextMicroStep);

  const projectId = getProjectId(project);

  const handleClick = () => {
    if (!projectId) {
      console.error('[Projects] Cannot navigate - ProjectCard missing ID:', project);
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
      className={`
        group p-5 rounded-xl cursor-pointer
        bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        hover:border-violet-200 dark:hover:border-violet-500/30
        transition-all duration-200
        ${project?.isAtRisk ? 'border-l-4 border-l-amber-400 dark:border-l-amber-500' : ''}
      `}
      style={{
        boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)',
        borderTop: `3px solid ${project?.color || '#8B5CF6'}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(139, 92, 246, 0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header: Emoji + Streak */}
      <div className="flex justify-between items-start mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-105 transition-transform"
          style={{
            backgroundColor: `${project?.color || '#8B5CF6'}15`,
            color: project?.color || '#8B5CF6'
          }}
        >
          {project?.icon || project?.emoji || getSeasonEmoji(project?.season)}
        </div>

        {streak > 0 && (
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
            ${isImpressiveStreak
              ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
            }
          `}>
            <Flame className={`w-3 h-3 ${isImpressiveStreak ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'}`} />
            <span>{streak}d</span>
          </div>
        )}
      </div>

      {/* Title + Description */}
      <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-100 mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
        {name}
      </h3>
      <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 mb-4">
        {description}
      </p>

      {/* Next Step */}
      {hasNextStep ? (
        <div className="bg-slate-50 dark:bg-[#111113] border border-slate-100 dark:border-white/5 rounded-lg p-3 mb-4">
          <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
            Next step
          </div>
          <div className="text-sm text-slate-700 dark:text-zinc-300 truncate">
            {project.nextMicroStep}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-[#111113] rounded-lg p-3 mb-4 border border-dashed border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs">Add next step</span>
          </div>
        </div>
      )}

      {/* Velocity Progress - Ocean Gradient */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Velocity
          </span>
          <span className={`text-xs font-medium ${velocity >= 100 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-zinc-300'}`}>
            {velocity}%
          </span>
        </div>
        <VelocityBar percentage={velocity} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs">
            {openTaskCount} open task{openTaskCount === 1 ? '' : 's'}
          </span>
        </div>

        <button
          onClick={handleStartSprint}
          className="
            px-3 py-1.5 rounded-lg text-xs font-medium
            text-white
            hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900/20
            transition-all duration-200
          "
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
          }}
        >
          Start Sprint
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PROJECT ROW - List View
───────────────────────────────────────────────────────────────────────── */
function ProjectRow({ project, onProjectClick, onStartSprint }) {
  const getSeasonEmoji = (season) => {
    switch (season) {
      case 'shipping': return '🚀';
      case 'exploring': return '��';
      case 'maintaining': return '🛠';
      default: return '📁';
    }
  };

  const name = getProjectName(project);
  const description = getProjectDescription(project);
  const streak = safeNumber(project?.streak?.value, 0);
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
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{
            backgroundColor: `${project?.color || '#8B5CF6'}15`,
            color: project?.color || '#8B5CF6'
          }}
        >
          {project?.icon || project?.emoji || getSeasonEmoji(project?.season)}
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {streak > 0 && (
          <div className={`
            flex items-center gap-1 text-xs
            ${isImpressiveStreak ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'}
          `}>
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProject, setSelectedProject] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const data = await getProjects();

      const list =
        Array.isArray(data) ? data :
        Array.isArray(data?.projects) ? data.projects :
        Array.isArray(data?.items) ? data.items :
        [];

      setProjects(list);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleProjectClick = (projectId) => {
    if (!projectId) {
      console.error('[Projects] handleProjectClick called with invalid ID:', projectId);
      return;
    }
    navigate(`/projects/${projectId}`);
  };

  const handleStartSprint = (project) => {
    setSelectedProject(project);
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
    setShowCreateModal(true);
  };

  const filteredProjects = projects.filter((project) => {
    const projectName = getProjectName(project).toLowerCase();
    const projectDescription = getProjectDescription(project).toLowerCase();
    const normalizedSearch = searchQuery.toLowerCase();

    const matchesSearch =
      projectName.includes(normalizedSearch) ||
      projectDescription.includes(normalizedSearch);

    if (selectedFilter === 'at-risk') return matchesSearch && project?.isAtRisk;
    if (selectedFilter === 'active') return matchesSearch && !project?.isAtRisk;
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
          onCreateProject={() => setShowCreateModal(true)}
          onSelectTemplate={(template) => {
            console.log('Selected template:', template);
            setShowCreateModal(true);
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
        background: 'var(--bg-page, linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%))'
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
            onClick={() => setShowCreateModal(true)}
            className="
              relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl shrink-0 whitespace-nowrap
              text-sm font-semibold
              transition-all duration-200
            "
            style={{
              backgroundColor: '#7C3AED',
              backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #A855F7 100%)',
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
              e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 55%, #9333EA 100%)';
              e.currentTarget.style.boxShadow = '0 16px 34px rgba(124, 58, 237, 0.42)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#7C3AED';
              e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #A855F7 100%)';
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
              <ProjectCard
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

      {showCreateModal && (
        <ProjectsCreate
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};

export default Projects;
