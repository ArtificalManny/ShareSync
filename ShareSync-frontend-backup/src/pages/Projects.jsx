import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Flame, TrendingUp, Sparkles, Clock, Users, Zap, Target, AlertCircle, Shield, PlayCircle, Grid, List, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProjectsCreate from './ProjectsCreate';
import QuietProjectsBanner from '../components/projects/QuietProjectsBanner';
import { SkeletonProjectCard } from '../components/ui/Skeletons';
import api from '../api/client';

// FIXED DESIGN SYSTEM IMPORTS
import Card, { CardBody, CardFooter } from '../components/common/Card';
import Button from '../components/common/Button';

// ⭐ Updated Enhanced Project Card - Integrated with Design System
function EnhancedProjectCard({ project, viewMode, onProjectClick, onStartSprint }) {
  const getSeasonEmoji = (season) => {
    switch(season) {
      case 'shipping': return '🚀';
      case 'exploring': return '🌱';
      case 'maintaining': return '🛠';
      default: return '📁';
    }
  };

  const progressValue = project.metrics?.onTimePercent?.value || 0;

  if (viewMode === 'list') {
    return (
      <Card 
        interactive 
        onClick={() => onProjectClick(project._id)}
        className={`mb-4 ${project.isAtRisk ? 'border-danger-500/50' : ''}`}
      >
        <CardBody className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-2xl p-2 bg-slate-900 rounded-lg">{getSeasonEmoji(project.season)}</div>
            <div className="flex-1">
              <h3 className="font-bold text-white group-hover:text-brand-400 transition-colors">{project.name}</h3>
              <p className="text-xs text-neutral-500 line-clamp-1">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-1 text-warning-500 font-bold">
                <Flame size={14} />
                <span className="text-sm">{project.streak?.value || 0}d</span>
             </div>
             <Button variant="tertiary" size="sm" onClick={(e) => { e.stopPropagation(); onStartSprint(project); }}>
               Start
             </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card 
      interactive 
      variant="elevated"
      onClick={() => onProjectClick(project._id)}
      className={project.isAtRisk ? 'border-danger-500/30' : ''}
    >
      <CardBody>
        <div className="flex justify-between items-start mb-4">
          <div className="text-3xl p-2 bg-slate-900 rounded-xl">{getSeasonEmoji(project.season)}</div>
          <div className="flex items-center gap-1 px-2 py-1 bg-warning-500/10 text-warning-500 rounded-lg">
            <Flame size={14} />
            <span className="text-xs font-bold">{project.streak?.value || 0}d</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
        <p className="text-sm text-neutral-500 mb-6 line-clamp-2 h-10">{project.description}</p>

        {project.nextMicroStep ? (
          <div className="bg-brand-500/5 border border-brand-500/10 rounded-lg p-3 mb-4">
            <div className="text-[10px] uppercase tracking-wider text-brand-400 font-bold mb-1">Next Step</div>
            <div className="text-sm text-white font-medium truncate">{project.nextMicroStep}</div>
          </div>
        ) : (
          <div className="bg-danger-500/5 border border-danger-500/10 rounded-lg p-3 mb-4 text-danger-400 text-xs">
            No micro-step set. Keep your streak alive!
          </div>
        )}

        <div className="space-y-1.5 mt-4">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            <span>On-Time Velocity</span>
            <span className="text-white">{progressValue}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${progressValue > 80 ? 'bg-success-500' : 'bg-brand-500'}`}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </CardBody>
      
      <CardFooter className="bg-slate-900/30 flex justify-between items-center py-3">
         <span className="text-[10px] font-bold text-neutral-500 uppercase">Tasks: {project.metrics?.openTasks?.value || 0}</span>
         <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onStartSprint(project); }}>
           Start Sprint
         </Button>
      </CardFooter>
    </Card>
  );
}

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProject, setSelectedProject] = useState(null);

  const stats = { active: 3, onTrack: 2, atRisk: 1 };

  useEffect(() => {
    fetchProjects();
  }, [selectedFilter, searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      if (useMockData) {
        setProjects(getMockProjects());
        return;
      }
      const response = await api.get('/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects(getMockProjects());
    } finally {
      setLoading(false);
    }
  };

  const getMockProjects = () => [
    {
      _id: '1', name: 'OpenShare v2', description: 'Momentum-based project tracker',
      streak: { value: 7 }, metrics: { onTimePercent: { value: 92 }, openTasks: { value: 5 } },
      season: 'shipping', nextMicroStep: 'Fix login page CSS bug'
    },
    {
      _id: '2', name: 'AI Writing Tool', description: 'GPT-powered content platform',
      streak: { value: 120 }, metrics: { onTimePercent: { value: 88 }, openTasks: { value: 8 } },
      season: 'shipping', nextMicroStep: 'Write API documentation'
    },
    {
      _id: '3', name: 'Math Homework', description: 'Algebra II problem sets',
      streak: { value: 3 }, metrics: { onTimePercent: { value: 70 }, openTasks: { value: 12 } },
      season: 'exploring', isAtRisk: true
    }
  ];

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
  };

  const handleProjectClick = (projectId) => navigate(`/projects/${projectId}`);
  const handleStartSprint = (project) => setSelectedProject(project);

  const filteredProjects = projects.filter(project => {
    const projectName = project.name || project.title || '';
    const matchesSearch = projectName.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'at-risk') return matchesSearch && project.isAtRisk;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      <div className="bg-slate-900/50 border-b border-white/5 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Projects</h1>
            <p className="text-neutral-400 text-sm mt-1">Manage your active missions</p>
          </div>
          <div className="flex gap-2">
             <Button variant="primary" onClick={() => setShowCreateModal(true)}>
               <Plus size={18} className="mr-2"/> New Project
             </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <QuietProjectsBanner />
        
        <div className="flex flex-col md:flex-row gap-4 my-8 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-white focus:border-brand-500/50 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-white/5">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-neutral-500'}`}><Grid size={16}/></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-neutral-500'}`}><List size={16}/></button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <SkeletonProjectCard key={i} />)}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
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
