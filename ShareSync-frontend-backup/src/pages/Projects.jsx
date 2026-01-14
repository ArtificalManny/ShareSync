// src/pages/Projects.jsx - PROJECT DECK (METAlab EDITION)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Flame, TrendingUp, Sparkles, Clock, Users, Zap, 
  Target, AlertCircle, Shield, PlayCircle, Grid, List, ChevronRight,
  Filter, LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProjectsCreate from './ProjectsCreate';
import QuietProjectsBanner from '../components/projects/QuietProjectsBanner';
import { SkeletonProjectCard } from '../components/ui/Skeletons';
import api from '../api/client';

// DESIGN SYSTEM
import Card, { CardBody, CardFooter } from '../components/common/Card';
import Button from '../components/common/Button';

/* ─────────────────────────────────────────────────────────────────────────
   REFINED PROJECT CARD: Bento-Style
───────────────────────────────────────────────────────────────────────── */
function EnhancedProjectCard({ project, viewMode, onProjectClick, onStartSprint }) {
  const getSeasonEmoji = (season) => {
    switch(season) {
      case 'shipping': return '🚀';
      case 'exploring': return '🌱';
      case 'maintaining': return '��';
      default: return '📁';
    }
  };

  const progressValue = project.metrics?.onTimePercent?.value || 0;

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onProjectClick(project._id)}
        className="group flex items-center justify-between p-4 mb-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 flex items-center justify-center bg-white/[0.03] rounded-xl text-2xl group-hover:scale-110 transition-transform">
            {getSeasonEmoji(project.season)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{project.name}</h3>
            <p className="text-[11px] text-slate-500 font-medium">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="flex flex-col items-end">
             <div className="flex items-center gap-1.5 text-orange-500 font-black italic text-sm">
                <Flame size={14} fill="currentColor" />
                <span>{project.streak?.value || 0}D</span>
             </div>
             <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Streak</span>
           </div>
           <Button variant="tertiary" size="sm" onClick={(e) => { e.stopPropagation(); onStartSprint(project); }}>
             Launch
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onProjectClick(project._id)}
      className={`bento-elevated p-6 group cursor-pointer transition-all hover:translate-y-[-4px] ${project.isAtRisk ? 'border-red-500/20' : ''}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-3xl group-hover:bg-violet-600/10 transition-colors">
          {getSeasonEmoji(project.season)}
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter flex items-center gap-1.5 ${project.isAtRisk ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
          <Flame size={12} fill="currentColor" />
          {project.streak?.value || 0} DAY STREAK
        </div>
      </div>

      <h3 className="text-xl font-black text-white tracking-metalab mb-2">{project.name}</h3>
      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">{project.description}</p>

      {project.nextMicroStep ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 mb-6">
          <div className="text-[9px] uppercase tracking-[0.2em] text-violet-400 font-black mb-1.5">Next Ship</div>
          <div className="text-sm text-slate-200 font-semibold truncate italic">"{project.nextMicroStep}"</div>
        </div>
      ) : (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-6">
           <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">No Step Defined</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between items-center">
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Velocity</span>
           <span className="text-xs font-black text-white">{progressValue}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${progressValue > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]'}`}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/[0.04]">
         <div className="flex items-center gap-2">
            <Users size={14} className="text-slate-600" />
            <span className="text-[11px] font-bold text-slate-500">{project.metrics?.openTasks?.value || 0} Pending</span>
         </div>
         <button 
           onClick={(e) => { e.stopPropagation(); onStartSprint(project); }}
           className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black rounded-xl transition-all shadow-lg hover:shadow-violet-600/20"
         >
           START SPRINT
         </button>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    fetchProjects();
  }, [selectedFilter, searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects(getMockProjects()); // Fallback to mock on error
    } finally {
      setLoading(false);
    }
  };

  const getMockProjects = () => [
    { _id: '1', name: 'ShareSync v2', description: 'Momentum-based project tracker', streak: { value: 7 }, metrics: { onTimePercent: { value: 92 }, openTasks: { value: 5 } }, season: 'shipping', nextMicroStep: 'Fix login page CSS bug' },
    { _id: '2', name: 'AI Writing Tool', description: 'GPT-powered content platform', streak: { value: 120 }, metrics: { onTimePercent: { value: 88 }, openTasks: { value: 8 } }, season: 'shipping', nextMicroStep: 'Write API documentation' },
    { _id: '3', name: 'Math Homework', description: 'Algebra II problem sets', streak: { value: 3 }, metrics: { onTimePercent: { value: 70 }, openTasks: { value: 12 } }, season: 'exploring', isAtRisk: true }
  ];

  const handleProjectCreated = (newProject) => setProjects(prev => [newProject, ...prev]);
  const handleProjectClick = (projectId) => navigate(`/projects/${projectId}`);
  const handleStartSprint = (project) => setSelectedProject(project);

  const filteredProjects = projects.filter(project => {
    const projectName = (project.name || project.title || '').toLowerCase();
    const matchesSearch = projectName.includes(searchQuery.toLowerCase());
    if (selectedFilter === 'at-risk') return matchesSearch && project.isAtRisk;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-transparent p-8 lg:p-12 max-w-[1600px] mx-auto">
      
      {/* 🚢 HEADER SECTION */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <LayoutGrid className="w-4 h-4 text-violet-500" />
             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Deployment Deck</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-metalab">Projects</h1>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input 
               type="text" 
               placeholder="Search missions..." 
               className="bg-white/[0.03] border border-white/[0.06] rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:border-violet-500/50 outline-none w-64 transition-all focus:w-80"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
           <button 
             onClick={() => setShowCreateModal(true)}
             className="bg-white text-black font-black text-xs px-6 py-3.5 rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2"
           >
             <Plus size={16} strokeWidth={3} /> NEW PROJECT
           </button>
        </div>
      </header>

      <QuietProjectsBanner />

      {/* 🛠 TOOLBAR */}
      <div className="flex items-center justify-between mb-8 mt-12 pb-6 border-b border-white/[0.04]">
        <div className="flex gap-6">
           {['all', 'active', 'at-risk'].map(filter => (
             <button 
               key={filter}
               onClick={() => setSelectedFilter(filter)}
               className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${selectedFilter === filter ? 'text-violet-500' : 'text-slate-500 hover:text-white'}`}
             >
               {filter}
             </button>
           ))}
        </div>
        <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.05]">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500'}`}><Grid size={16}/></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500'}`}><List size={16}/></button>
        </div>
      </div>

      {/* 🍱 PROJECT GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <SkeletonProjectCard key={i} />)}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-4'}>
          {filteredProjects.length > 0 ? (
            filteredProjects.map(project => (
              <EnhancedProjectCard 
                key={project._id}
                project={project}
                viewMode={viewMode}
                onProjectClick={handleProjectClick}
                onStartSprint={handleStartSprint}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bento-elevated">
               <div className="text-4xl mb-4">🌑</div>
               <h3 className="text-white font-bold uppercase tracking-widest text-sm">No Active Missions</h3>
               <p className="text-slate-500 text-xs mt-2">Try adjusting your search or create a new project.</p>
            </div>
          )}
        </div>
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
