import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Flame, TrendingUp, Sparkles, Clock, Users, Zap, Target, AlertCircle, Shield, PlayCircle, Grid, List, ChevronRight } from 'lucide-react';
import ProjectCard from '../components/discovery/ProjectCard';
import { useAuth } from '../context/AuthContext';
import ProjectsCreate from './ProjectsCreate';

// ⭐ PHASE 1: Import QuietProjectsBanner
import QuietProjectsBanner from '../components/projects/QuietProjectsBanner';

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedProject, setSelectedProject] = useState(null);

  // Simplified stats for compact header
  const stats = {
    active: 3,
    onTrack: 2,
    atRisk: 1
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedFilter, searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      if (useMockData) {
        setProjects(getMockProjects());
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:3000/api/projects', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('Projects API returned non-200:', response.status, '- using mock data');
        setProjects(getMockProjects());
        return;
      }
      
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error, '- using mock data');
      setProjects(getMockProjects());
    } finally {
      setLoading(false);
    }
  };

  const getMockProjects = () => [
    {
      _id: '1',
      name: 'ShareSync v2',
      title: 'ShareSync v2',
      description: 'The momentum-based project tracker that keeps you shipping',
      owner: { _id: user?._id || '1', name: 'You' },
      status: 'active',
      streak: { value: 7 },
      momentum: { value: 85 },
      metrics: { onTimePercent: { value: 92 }, openTasks: { value: 5 }, throughputPerWeek: { value: 12 } },
      members: [{ _id: '1', name: 'You' }],
      updatedAt: new Date().toISOString(),
      season: 'shipping',
      nextMicroStep: 'Fix login page CSS bug',
      timeEstimate: '15 min'
    },
    {
      _id: '2',
      name: 'AI Writing Tool',
      title: 'AI Writing Tool',
      description: 'GPT-powered content generation platform',
      owner: { _id: '2', name: 'Alex' },
      status: 'active',
      streak: { value: 120 },
      momentum: { value: 95 },
      metrics: { onTimePercent: { value: 88 }, openTasks: { value: 8 }, throughputPerWeek: { value: 15 } },
      members: [{ _id: '2', name: 'Alex' }, { _id: '3', name: 'Jordan' }],
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      season: 'shipping',
      nextMicroStep: 'Write API documentation',
      timeEstimate: '25 min'
    },
    {
      _id: '3',
      name: 'Math Homework',
      title: 'Math Homework',
      description: 'Algebra II problem sets and study notes',
      owner: { _id: user?._id || '1', name: 'You' },
      status: 'active',
      streak: { value: 3 },
      momentum: { value: 45 },
      metrics: { onTimePercent: { value: 70 }, openTasks: { value: 12 }, throughputPerWeek: { value: 8 } },
      members: [{ _id: '1', name: 'You' }],
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
      season: 'exploring',
      nextMicroStep: null,
      timeEstimate: null,
      isAtRisk: true
    }
  ];

  const handleProjectCreated = (newProject) => {
    const normalizedProject = {
      ...newProject,
      name: newProject.title || newProject.name,
      title: newProject.title || newProject.name,
      streak: newProject.streak || { value: 0 },
      momentum: newProject.momentum || { value: 0 },
      metrics: newProject.metrics || { 
        onTimePercent: { value: 0 }, 
        openTasks: { value: 0 }, 
        throughputPerWeek: { value: 0 } 
      },
      members: newProject.members || [],
      updatedAt: new Date().toISOString(),
      season: 'exploring',
      nextMicroStep: null,
      timeEstimate: null
    };

    setProjects(prev => [normalizedProject, ...prev]);
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleStartSprint = (project) => {
    setSelectedProject(project);
    console.log('Starting sprint for:', project.name);
  };

  const filteredProjects = projects.filter(project => {
    const projectName = project.name || project.title || '';
    const projectDesc = project.description || '';
    const matchesSearch = projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         projectDesc.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch(selectedFilter) {
      case 'all':
        return matchesSearch;
      case 'my-projects':
        return matchesSearch && project.owner?._id === user?._id;
      case 'at-risk':
        return matchesSearch && project.isAtRisk;
      case 'hot-streaks':
        return matchesSearch && (project.streak?.value || 0) > 30;
      case 'school':
        return matchesSearch && ['Math', 'Science', 'History', 'English'].some(s => 
          projectName.toLowerCase().includes(s.toLowerCase())
        );
      case 'work':
        return matchesSearch && !['Math', 'Science', 'History', 'English'].some(s => 
          projectName.toLowerCase().includes(s.toLowerCase())
        );
      default:
        return matchesSearch;
    }
  });

  const atRiskProjects = projects.filter(p => p.isAtRisk);
  const canProtectStreak = projects.some(p => p.streak?.value > 0 && !p.nextMicroStep);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      
      {/* COMPACT CONTROL BAR */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          
          {/* Top row: Title + Stats */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Projects</h1>
              <p className="text-sm text-slate-400 mt-1">Choose where today's momentum goes</p>
            </div>
            
            {/* Compact stats strip */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-slate-300">Active: <span className="font-semibold text-white">{stats.active}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-slate-300">On track: <span className="font-semibold text-white">{stats.onTrack}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <span className="text-slate-300">At risk: <span className="font-semibold text-white">{stats.atRisk}</span></span>
              </div>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All', icon: Sparkles },
              { id: 'my-projects', label: 'My projects', icon: Users },
              { id: 'at-risk', label: 'At risk', icon: AlertCircle },
              { id: 'school', label: 'School', icon: Target },
              { id: 'work', label: 'Work', icon: Target },
              { id: 'hot-streaks', label: 'Hot streaks', icon: Flame }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap
                  transition-all text-sm font-medium
                  ${selectedFilter === filter.id 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                  }
                `}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ⭐ PHASE 1: Quiet Projects Banner - REPLACES the old at-risk banner */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <QuietProjectsBanner />
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT: Projects Grid (70%) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* View controls + Search */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 
                           text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              
              <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl 
                         transition-all font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/30"
              >
                <Plus className="w-5 h-5" />
                New Project
              </button>
            </div>

            {/* Projects Grid/List */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
                <p className="text-slate-400 mb-6">Start with one thing that matters this week. School, work, or personal — it all counts.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl transition-all"
                >
                  + New Project
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
                {filteredProjects.map(project => (
                  <EnhancedProjectCard 
                    key={project._id}
                    project={project}
                    viewMode={viewMode}
                    onProjectClick={handleProjectClick}
                    onStartSprint={handleStartSprint}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Coach + Momentum (30%) */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            
            {/* Personal Coach Card */}
            <div className="bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 backdrop-blur-sm 
                          border border-purple-500/30 rounded-xl p-6 lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Your Personal Coach</h3>
              </div>
              
              <p className="text-sm text-slate-300">Pick one project. I'll plan the next 25 minutes.</p>

              <button className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 
                              rounded-lg transition-all font-semibold flex items-center justify-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Pick a 25-min mission
              </button>

              {/* Your top project */}
              {projects.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-sm text-slate-300 mb-2">Your top project:</div>
                  <div className="text-white font-semibold">{projects[0].name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-orange-300">{projects[0].streak?.value || 0} day streak</span>
                  </div>
                  {projects[0].season && (
                    <div className="mt-2 inline-block">
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                        {projects[0].season === 'shipping' && '🚀 Shipping'}
                        {projects[0].season === 'exploring' && '🌱 Exploring'}
                        {projects[0].season === 'maintaining' && '🛠 Maintaining'}
                        {projects[0].season === 'shipping' && ' · +20% XP'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Friends online */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="text-sm text-slate-300 mb-3">Friends online:</div>
                <div className="space-y-2">
                  {[
                    { name: 'Alex', status: 'in focus session', color: 'green' },
                    { name: 'Jordan', status: 'shipped 3 tasks', color: 'blue' },
                    { name: 'Sarah', status: 'online', color: 'green' }
                  ].map((friend, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${friend.color}-400`}></div>
                      <span className="text-sm text-white">{friend.name}</span>
                      <span className="text-xs text-slate-400">· {friend.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak Insurance */}
              {canProtectStreak && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-400 font-semibold mb-2">
                    <Shield className="w-4 h-4" />
                    Streak Insurance
                  </div>
                  <div className="text-xs text-slate-300 mb-3">
                    Protect your streak with a 2-minute action today
                  </div>
                  <button className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 
                                   px-3 py-2 rounded text-xs font-medium transition-all">
                    Pick a tiny step
                  </button>
                </div>
              )}
            </div>

            {/* Mini Leaderboard */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Today's Streak Leaders
              </h4>
              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Alex', streak: '120d', xp: 2450, emoji: '🏆' },
                  { rank: 2, name: 'Jordan', streak: '100d', xp: 2200, emoji: '🥈' },
                  { rank: 3, name: 'You', streak: '7d', xp: 1850, emoji: '🥉' }
                ].map(leader => (
                  <div key={leader.rank} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{leader.emoji}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{leader.name}</div>
                        <div className="text-xs text-slate-400">{leader.streak} streak</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-purple-400">{leader.xp} XP</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SIMPLIFIED BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl 
                    border-t border-slate-700/50 py-3 px-6 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-slate-300">
            Today: <span className="text-purple-400 font-bold">380 XP</span>
          </div>
          <div className="flex gap-3">
            <button className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg transition-all text-sm">
              Start sprint
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 
                             hover:to-fuchsia-500 text-white px-5 py-2 rounded-lg transition-all font-semibold text-sm"
            >
              Ship a small win → +50 XP
            </button>
          </div>
        </div>
      </div>

      {/* PROJECT CREATE MODAL */}
      {showCreateModal && (
        <ProjectsCreate 
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};

// Enhanced Project Card Component
const EnhancedProjectCard = ({ project, viewMode, onProjectClick, onStartSprint }) => {
  const getSeasonColor = (season) => {
    switch(season) {
      case 'shipping': return 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30';
      case 'exploring': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'maintaining': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      default: return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
    }
  };

  const getSeasonEmoji = (season) => {
    switch(season) {
      case 'shipping': return '🚀';
      case 'exploring': return '🌱';
      case 'maintaining': return '🛠';
      default: return '📁';
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onProjectClick(project._id)}
        className={`
          group cursor-pointer bg-gradient-to-r ${getSeasonColor(project.season)} 
          backdrop-blur-sm border rounded-xl p-4 hover:scale-[1.02] transition-all
          ${project.isAtRisk ? 'ring-2 ring-orange-500/50' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-3xl">{getSeasonEmoji(project.season)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  {project.name}
                </h3>
                {project.season && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                    {project.season === 'shipping' && '🚀 Shipping · +20% XP'}
                    {project.season === 'exploring' && '🌱 Exploring'}
                    {project.season === 'maintaining' && '🛠 Maintaining'}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1">{project.description}</p>
              
              {project.nextMicroStep ? (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300">
                    Next: <span className="text-white">{project.nextMicroStep}</span>
                  </span>
                  {project.timeEstimate && (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                      {project.timeEstimate}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-sm text-orange-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>No micro-step set. Pick a 5-min action to keep your streak alive.</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center gap-2 text-orange-400">
                <Flame className="w-4 h-4" />
                <span className="font-bold">{project.streak?.value || 0}d</span>
              </div>
              <div className="text-xs text-slate-400">streak</div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartSprint(project);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg 
                       transition-all text-sm font-medium opacity-0 group-hover:opacity-100"
            >
              Start sprint
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div 
      onClick={() => onProjectClick(project._id)}
      className={`
        group cursor-pointer bg-gradient-to-br ${getSeasonColor(project.season)} 
        backdrop-blur-sm border rounded-xl p-6 hover:scale-105 transition-all
        ${project.isAtRisk ? 'ring-2 ring-orange-500/50 ring-offset-2 ring-offset-slate-950' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{getSeasonEmoji(project.season)}</div>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-bold text-orange-300">{project.streak?.value || 0}d</span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors mb-2">
        {project.name}
      </h3>
      <p className="text-sm text-slate-400 mb-4">{project.description}</p>

      {project.season && (
        <div className="mb-4">
          <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
            {project.season === 'shipping' && '🚀 Shipping · +20% XP'}
            {project.season === 'exploring' && '🌱 Exploring'}
            {project.season === 'maintaining' && '🛠 Maintaining'}
          </span>
        </div>
      )}

      {project.nextMicroStep ? (
        <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
          <div className="text-xs text-slate-400 mb-1">Next micro-step:</div>
          <div className="text-sm text-white font-medium">{project.nextMicroStep}</div>
          {project.timeEstimate && (
            <div className="text-xs text-purple-300 mt-1">~{project.timeEstimate}</div>
          )}
        </div>
      ) : (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 mb-4">
          <div className="text-xs text-orange-300 mb-2">No micro-step set</div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="text-xs text-orange-400 hover:text-orange-300 underline"
          >
            Set a 5-min action →
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
        <span>On-time: {project.metrics?.onTimePercent?.value || 0}%</span>
        <span>Tasks: {project.metrics?.openTasks?.value || 0}</span>
        <span>Throughput: {project.metrics?.throughputPerWeek?.value || 0}/wk</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onStartSprint(project);
        }}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg 
                 transition-all text-sm font-medium"
      >
        Start 25-min sprint
      </button>
    </div>
  );
};

export default Projects;
