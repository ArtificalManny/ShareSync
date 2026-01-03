import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, Flame, ChevronRight, Plus, TrendingUp, Clock, 
  Target, AlertCircle, Zap 
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const ProjectsOverview = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Mock data - will be replaced with real API
  const [projects, setProjects] = useState([
    {
      _id: '1',
      name: 'ShareSync v2',
      emoji: '🚀',
      progress: 68,
      streak: 7,
      season: 'shipping',
      nextTask: 'Fix login page CSS',
      tasksToday: 3,
      isActive: true,
      color: 'purple'
    },
    {
      _id: '2',
      name: 'AI Writing Tool',
      emoji: '✨',
      progress: 85,
      streak: 120,
      season: 'shipping',
      nextTask: 'Write API docs',
      tasksToday: 5,
      isActive: true,
      color: 'blue'
    },
    {
      _id: '3',
      name: 'Math Homework',
      emoji: '📐',
      progress: 45,
      streak: 3,
      season: 'exploring',
      nextTask: null,
      tasksToday: 0,
      isActive: false,
      color: 'orange',
      isAtRisk: true
    }
  ]);

  const getSeasonBadge = (season) => {
    switch(season) {
      case 'shipping':
        return { text: '🚀 Shipping', color: 'bg-purple-500/20 text-purple-400' };
      case 'exploring':
        return { text: '🌱 Exploring', color: 'bg-green-500/20 text-green-400' };
      case 'maintaining':
        return { text: '🛠 Maintaining', color: 'bg-blue-500/20 text-blue-400' };
      default:
        return { text: '📁 Active', color: 'bg-slate-500/20 text-slate-400' };
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleQuickShip = (e, project) => {
    e.stopPropagation();
    console.log('Quick ship for:', project.name);
    // TODO: Open quick ship modal
  };

  if (isMobile) {
    // Mobile compact view
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Projects</h3>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {projects.slice(0, 3).map(project => (
            <button
              key={project._id}
              onClick={() => handleProjectClick(project._id)}
              className={`w-full text-left bg-slate-900/50 border ${
                project.isAtRisk ? 'border-orange-500/50' : 'border-slate-700'
              } rounded-xl p-3 transition-all active:scale-95`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{project.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{project.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{project.progress}%</span>
                    {project.streak > 0 && (
                      <>
                        <span>•</span>
                        <Flame className="w-3 h-3 text-orange-400" />
                        <span>{project.streak}d</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop full view
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Active Projects</h3>
            <p className="text-xs text-slate-400">Your current focus</p>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="space-y-3">
        {projects.map(project => {
          const badge = getSeasonBadge(project.season);
          
          return (
            <div
              key={project._id}
              onClick={() => handleProjectClick(project._id)}
              className={`
                group cursor-pointer bg-slate-900/50 border rounded-xl p-4 
                hover:border-purple-500/50 transition-all
                ${project.isAtRisk ? 'border-orange-500/30 bg-orange-900/10' : 'border-slate-700'}
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{project.emoji}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                      {project.name}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-white">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          project.progress >= 80 ? 'bg-emerald-500' :
                          project.progress >= 50 ? 'bg-blue-500' :
                          'bg-orange-500'
                        } transition-all duration-500`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Next task or warning */}
                  {project.nextTask ? (
                    <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                      <ChevronRight className="w-4 h-4 text-purple-400" />
                      <span>Next: {project.nextTask}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-orange-300 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>No next step - set one to keep momentum</span>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {project.streak > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" />
                        <span className="text-orange-300 font-semibold">{project.streak}d streak</span>
                      </div>
                    )}
                    {project.tasksToday > 0 && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>{project.tasksToday} today</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick ship button */}
                <button
                  onClick={(e) => handleQuickShip(e, project)}
                  className="opacity-0 group-hover:opacity-100 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold transition-all"
                >
                  Quick Ship
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* View all button */}
      <button
        onClick={() => navigate('/projects')}
        className="w-full mt-4 py-3 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 hover:border-purple-500/50 rounded-xl font-semibold text-sm text-slate-400 hover:text-purple-400 transition-all flex items-center justify-center gap-2"
      >
        View All Projects
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ProjectsOverview;
