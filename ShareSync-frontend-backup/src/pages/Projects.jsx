// src/pages/Projects.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v3.0 - Phase 7: Visual Cohesion + Phase D: Empty States
// ═══════════════════════════════════════════════════════════════════════════════
// UPDATES:
// - ⭐ PHASE D: EmptyProjects when no projects exist
// - ⭐ PHASE D: EmptySearch when search returns no results
// - Progress bars use purple intensity (not traffic lights)
// - Consistent with design token system
// - ⭐ FIX: Added _id || id fallback to prevent /projects/undefined
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

// ⭐ PHASE D: Import empty state components
import EmptyProjects from '../components/empty-states/EmptyProjects';
import EmptySearch from '../components/empty-states/EmptySearch';

// ✅ Use API helpers that already unwrap backend shapes correctly
import { getProjects } from '../api/projects';

/* ─────────────────────────────────────────────────────────────────────────
   HELPER: Safely get project ID (handles both _id and id)
───────────────────────────────────────────────────────────────────────── */
const getProjectId = (project) => {
  const id = project?._id || project?.id;
  if (!id) {
    console.error('[Projects] Project missing ID:', project);
  }
  return id;
};

/* ─────────────────────────────────────────────────────────────────────────
   PROGRESS COLOR - Phase 7: Purple intensity, not traffic lights
───────────────────────────────────────────────────────────────────────── */
const getProgressFillClass = (percentage) => {
  if (percentage >= 100) return 'bg-success';      // Teal celebration
  if (percentage >= 67) return 'bg-brand-400';     // Bright purple
  if (percentage >= 34) return 'bg-brand';         // Standard purple
  return 'bg-brand-700';                           // Darker purple
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

  const velocity = project.metrics?.onTimePercent?.value || 0;
  const streak = project.streak?.value || 0;
  const isImpressiveStreak = streak >= 7;
  const hasNextStep = Boolean(project.nextMicroStep);

  // ⭐ FIX: Safe ID extraction
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
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${project.isAtRisk ? 'border-l-2 border-l-warning' : ''}
      `}
    >
      {/* Header: Emoji + Streak */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-surface-2 rounded-xl flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
          {getSeasonEmoji(project.season)}
        </div>

        {/* Streak - only prominent when earned */}
        {streak > 0 && (
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
            ${isImpressiveStreak
              ? 'bg-brand/10 text-brand'
              : 'bg-surface-2 text-text-tertiary'
            }
          `}>
            <Flame className={`w-3 h-3 ${isImpressiveStreak ? 'text-brand' : 'text-text-tertiary'}`} />
            <span>{streak}d</span>
          </div>
        )}
      </div>

      {/* Title + Description */}
      <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-brand transition-colors">
        {project.name}
      </h3>
      <p className="text-sm text-text-secondary line-clamp-2 mb-4">
        {project.description}
      </p>

      {/* Next Step - gentle nudge, not alarming */}
      {hasNextStep ? (
        <div className="bg-surface-2 rounded-lg p-3 mb-4">
          <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
            Next step
          </div>
          <div className="text-sm text-text-primary truncate">
            {project.nextMicroStep}
          </div>
        </div>
      ) : (
        <div className="bg-surface-2 rounded-lg p-3 mb-4 border border-dashed border-white/[0.08]">
          <div className="flex items-center gap-2 text-text-tertiary">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs">Add a next step</span>
          </div>
        </div>
      )}

      {/* Velocity Progress - PHASE 7: Purple intensity */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
            Velocity
          </span>
          <span className={`text-xs font-medium ${velocity >= 100 ? 'text-success' : 'text-text-primary'}`}>
            {velocity}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressFillClass(velocity)}`}
            style={{ width: `${Math.min(velocity, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs">
            {project.metrics?.openTasks?.value || 0} tasks
          </span>
        </div>

        <button
          onClick={handleStartSprint}
          className="
            px-3 py-1.5 rounded-lg text-xs font-medium
            bg-brand text-white
            hover:bg-brand-600 hover:shadow-glow-brand
            transition-all duration-200
          "
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
      case 'exploring': return '🌱';
      case 'maintaining': return '🛠';
      default: return '📁';
    }
  };

  const streak = project.streak?.value || 0;
  const isImpressiveStreak = streak >= 7;

  // ⭐ FIX: Safe ID extraction
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
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
      "
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-surface-2 rounded-lg flex items-center justify-center text-xl">
          {getSeasonEmoji(project.season)}
        </div>
        <div>
          <h3 className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-text-tertiary">
            {project.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Streak */}
        {streak > 0 && (
          <div className={`
            flex items-center gap-1 text-xs
            ${isImpressiveStreak ? 'text-brand' : 'text-text-tertiary'}
          `}>
            <Flame className="w-3.5 h-3.5" />
            <span className="font-medium">{streak}d</span>
          </div>
        )}

        <button
          onClick={handleStartSprint}
          className="
            px-3 py-1.5 rounded-lg text-xs font-medium
            bg-surface-2 text-text-secondary
            hover:bg-brand hover:text-white
            transition-all duration-200
          "
        >
          Launch
        </button>

        <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
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
  const [recentSearches, setRecentSearches] = useState(['ShareSync', 'API', 'Dashboard']);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const data = await getProjects();

      // getProjects() already unwraps. But backend might still return { projects: [] }
      const list =
        Array.isArray(data) ? data :
        Array.isArray(data?.projects) ? data.projects :
        Array.isArray(data?.items) ? data.items :
        [];

      setProjects(list);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // If API fails, don't fake it—keep empty and show EmptyProjects, but you can swap back to mocks if you want.
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => setProjects(prev => [newProject, ...prev]);
  
  // ⭐ FIX: Navigation handler with validation
  const handleProjectClick = (projectId) => {
    if (!projectId) {
      console.error('[Projects] handleProjectClick called with invalid ID:', projectId);
      return;
    }
    navigate(`/projects/${projectId}`);
  };
  
  const handleStartSprint = (project) => setSelectedProject(project);

  // ⭐ PHASE D: Search handlers
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
  };

  // ⭐ PHASE D: Create project from search
  const handleCreateProjectFromSearch = (query) => {
    setShowCreateModal(true);
    // The modal would be pre-filled with the query as project name
  };

  const filteredProjects = projects.filter(project => {
    const projectName = (project.name || project.title || '').toLowerCase();
    const matchesSearch = projectName.includes(searchQuery.toLowerCase());
    if (selectedFilter === 'at-risk') return matchesSearch && project.isAtRisk;
    if (selectedFilter === 'active') return matchesSearch && !project.isAtRisk;
    return matchesSearch;
  });

  // ⭐ PHASE D: Render appropriate empty state
  const renderEmptyState = () => {
    // If searching and no results
    if (searchQuery && filteredProjects.length === 0) {
      return (
        <EmptySearch
          query={searchQuery}
          suggestions={['ShareSync', 'Dashboard', 'API Integration'].filter(s =>
            s.toLowerCase().includes(searchQuery.toLowerCase().charAt(0))
          )}
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

    // If no projects at all
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

    // If filter returns no results
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
            <p className="text-sm text-text-secondary mb-4">
              No {selectedFilter === 'at-risk' ? 'at-risk' : 'active'} projects found.
            </p>
            <button
              onClick={() => setSelectedFilter('all')}
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
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
    <div className="min-h-screen p-6 lg:p-10 max-w-[1400px] mx-auto">

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="w-4 h-4 text-brand" />
            <span className="text-xs text-text-tertiary uppercase tracking-wider">
              Project Deck
            </span>
          </div>
          <h1 className="text-4xl font-semibold text-text-primary">
            Projects
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search projects..."
              className="
                bg-surface-1 border border-white/[0.06] rounded-lg
                pl-10 pr-4 py-2.5 text-sm text-text-primary
                placeholder:text-text-tertiary
                focus:border-brand/50 focus:outline-none
                w-56 transition-all focus:w-72
              "
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* New Project Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-brand text-white text-sm font-medium
              hover:bg-brand-600 hover:shadow-glow-brand
              transition-all duration-200
            "
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </header>

      <QuietProjectsBanner />

      {/* ═══════════════════════════════════════════════════════════════════
          TOOLBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-6 mt-8 pb-4 border-b border-white/[0.06]">
        {/* Filters */}
        <div className="flex gap-1">
          {['all', 'active', 'at-risk'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium capitalize
                transition-all duration-200
                ${selectedFilter === filter
                  ? 'bg-surface-2 text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              {filter === 'at-risk' ? 'At Risk' : filter}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-surface-1 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => setViewMode('grid')}
            className={`
              p-2 rounded-md transition-all
              ${viewMode === 'grid'
                ? 'bg-surface-2 text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
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
                ? 'bg-surface-2 text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
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
          {[1, 2, 3].map(i => <SkeletonProjectCard key={i} />)}
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard
                key={getProjectId(project) || `project-${project.name}`}
                project={project}
                onProjectClick={handleProjectClick}
                onStartSprint={handleStartSprint}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map(project => (
              <ProjectRow
                key={getProjectId(project) || `project-${project.name}`}
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
