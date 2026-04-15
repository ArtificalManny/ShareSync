// src/pages/Projects.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC PROJECTS PAGE v4.3 - "The Gallery Walk" Light Theme (Premium)
// FIXED: Removed all inline background styles. Using pure Tailwind classes
// to guarantee the Purple New Project button renders correctly.
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
import useDocumentTitle from "../hooks/useDocumentTitle";

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
   VELOCITY BAR - Ultra Sleek Premium Bar
───────────────────────────────────────────────────────────────────────── */
const VelocityBar = ({ percentage }) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const isComplete = clampedPercentage >= 100;
  
  return (
    <div className="h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${isComplete ? 'bg-teal-500' : 'bg-blue-500'}`}
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   PROJECT CARD - Grid View (World Class Tactile UI)
───────────────────────────────────────────────────────────────────────── */
function ProjectCard({ project, onProjectClick, onStartSprint }) {
  useDocumentTitle("Projects");
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
  const projectId = getProjectId(project);

  const handleClick = () => {
    if (!projectId) return;
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
        group relative flex flex-col p-6 rounded-2xl cursor-pointer
        bg-white dark:bg-[#1f1f23] border border-slate-200/80 dark:border-white/10
        transition-all duration-300 ease-out h-full overflow-hidden
        ${project.isAtRisk ? 'ring-1 ring-amber-400 dark:ring-amber-500' : ''}
      `}
      style={{
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(139, 92, 246, 0.12), 0 4px 12px -2px rgba(139, 92, 246, 0.08)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Absolute top elegant glow line */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 opacity-90 transition-opacity duration-300 group-hover:opacity-100" 
        style={{ background: project.color || '#8B5CF6' }} 
      />

      <div className="flex justify-between items-start mb-5">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-black/5 dark:border-white/5 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2"
          style={{ backgroundColor: `${project.color || '#8B5CF6'}15`, color: project.color || '#8B5CF6' }}
        >
          {project.icon || project.emoji || getSeasonEmoji(project.season)}
        </div>

        {streak > 0 && (
          <div className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide
            ${isImpressiveStreak
              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50'
              : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200/50'
            }
          `}>
            <Flame className={`w-3.5 h-3.5 ${isImpressiveStreak ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>{streak}d</span>
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-1.5 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
          {project.name}
        </h3>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-6">
          {project.description}
        </p>

        {hasNextStep ? (
          <div className="bg-slate-50/80 dark:bg-[#111113] border border-slate-100 dark:border-white/5 rounded-xl p-3.5 mb-6 group-hover:bg-violet-50/50 transition-colors duration-300">
            <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
              Next micro-step
            </div>
            <div className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate">
              {project.nextMicroStep}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/50 dark:bg-[#111113] rounded-xl p-3.5 mb-6 border border-dashed border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Add a next step</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              Velocity
            </span>
            <span className={`text-xs font-bold ${velocity >= 100 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-zinc-300'}`}>
              {velocity}%
            </span>
          </div>
          <VelocityBar percentage={velocity} />
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 font-medium">
            <Users className="w-4 h-4" />
            <span className="text-xs">
              {project.metrics?.openTasks?.value || 0} tasks
            </span>
          </div>

          <button
            onClick={handleStartSprint}
            className="
              px-4 py-2 rounded-xl text-xs font-bold tracking-wide
              bg-blue-500 hover:bg-blue-600 text-white shadow-sm
              hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-900/40
              transition-all duration-300 ease-out hover:-translate-y-0.5
            "
          >
            Start Sprint
          </button>
        </div>
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
  const projectId = getProjectId(project);

  const handleClick = () => {
    if (!projectId) return;
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
        group relative overflow-hidden flex items-center justify-between p-4 pl-5 rounded-2xl cursor-pointer
        bg-white dark:bg-[#1f1f23] border border-slate-200/80 dark:border-white/10
        transition-all duration-300 ease-out
      "
      style={{
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 opacity-80 group-hover:w-1.5 transition-all duration-300" 
        style={{ background: project.color || '#8B5CF6' }} 
      />

      <div className="flex items-center gap-5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm border border-black/5 transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: `${project.color || '#8B5CF6'}15`, color: project.color || '#8B5CF6' }}
        >
          {project.icon || project.emoji || getSeasonEmoji(project.season)}
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
            {project.name}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            {project.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {streak > 0 && (
          <div className={`
            flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border
            ${isImpressiveStreak ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-slate-500 bg-slate-50 border-slate-100'}
          `}>
            <Flame className="w-3.5 h-3.5" />
            <span className="font-bold">{streak}d</span>
          </div>
        )}

        <button
          onClick={handleStartSprint}
          className="
            px-4 py-2 rounded-xl text-xs font-bold tracking-wide
            bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700
            hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:text-white
            hover:shadow-lg hover:shadow-blue-500/20
            transition-all duration-300 ease-out hover:-translate-y-0.5
          "
        >
          Launch
        </button>

        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-zinc-600 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
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
  }, [selectedFilter, searchQuery]);

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

  const handleProjectCreated = (newProject) => setProjects(prev => [newProject, ...prev]);
  
  const handleProjectClick = (projectId) => {
    if (!projectId) {
      console.error('[Projects] handleProjectClick called with invalid ID:', projectId);
      return;
    }
    navigate(`/projects/${projectId}`);
  };
  
  const handleStartSprint = (project) => setSelectedProject(project);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleCreateProjectFromSearch = (query) => {
    setShowCreateModal(true);
  };

  const filteredProjects = projects.filter(project => {
    const projectName = (project.name || project.title || '').toLowerCase();
    const matchesSearch = projectName.includes(searchQuery.toLowerCase());
    if (selectedFilter === 'at-risk') return matchesSearch && project.isAtRisk;
    if (selectedFilter === 'active') return matchesSearch && !project.isAtRisk;
    return matchesSearch;
  });

  const renderEmptyState = () => {
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
              className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
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
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
              Project Deck
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Projects
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search projects..."
              className="
                bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-xl
                pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-200
                placeholder:text-slate-400 dark:placeholder:text-zinc-600
                focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10
                w-56 transition-all duration-300 focus:w-72 shadow-sm
              "
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* New Project Button - Bulletproof Tailwind Purple */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold
              shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50
              transition-all duration-200 hover:-translate-y-0.5
            "
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </header>

      <QuietProjectsBanner />

      <div className="flex items-center justify-between mb-6 mt-8 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex gap-1">
          {['all', 'active', 'at-risk'].map(filter => (
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
