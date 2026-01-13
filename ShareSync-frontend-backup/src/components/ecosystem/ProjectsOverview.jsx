import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, Flame, ChevronRight, Plus, Target, AlertCircle, Zap 
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';
import Card, { CardHeader, CardBody } from '../common/Card';
import Button from '../common/Button';

const ProjectsOverview = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [projects] = useState([
    {
      _id: '1',
      name: 'OpenShare v2',
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
        return { text: '🚀 Shipping', color: 'bg-purple-500/20 text-purple-400 border-purple-500/20' };
      case 'exploring':
        return { text: '🌱 Exploring', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' };
      case 'maintaining':
        return { text: '🛠 Maintaining', color: 'bg-blue-500/20 text-blue-400 border-blue-500/20' };
      default:
        return { text: '📁 Active', color: 'bg-slate-500/20 text-slate-400 border-slate-500/20' };
    }
  };

  const handleQuickShip = (e, project) => {
    e.stopPropagation();
    console.log('Quick ship for:', project.name);
  };

  return (
    <Card className="h-full border-white/5 bg-slate-900/40 backdrop-blur-md">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">Active Projects</h3>
            {!isMobile && <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Your current focus</p>}
          </div>
        </div>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => navigate('/projects')}
          icon={<Plus className="w-4 h-4" />}
        >
          {isMobile ? "" : "New"}
        </Button>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="space-y-3">
          {projects.map(project => {
            const badge = getSeasonBadge(project.season);
            
            return (
              <div
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                className={`
                  group cursor-pointer bg-white/5 border rounded-xl p-4 
                  hover:border-purple-500/50 hover:bg-white/[0.08] transition-all
                  ${project.isAtRisk ? 'border-orange-500/30' : 'border-white/5'}
                `}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl drop-shadow-sm">{project.emoji}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-100 group-hover:text-purple-400 transition-colors truncate">
                        {project.name}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${
                            project.progress >= 80 ? 'bg-emerald-500' :
                            project.progress >= 50 ? 'bg-purple-500' :
                            'bg-orange-500'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Context Line */}
                    {project.nextTask ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <ChevronRight className="w-3 h-3 text-purple-500" />
                        <span className="truncate">Next: <span className="text-slate-200">{project.nextTask}</span></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-orange-400/80 mb-2 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        <span>Needs next step</span>
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center gap-3">
                      {project.streak > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/10">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="text-[10px] font-bold text-orange-400">{project.streak}d</span>
                        </div>
                      )}
                      {project.tasksToday > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/10">
                          <Zap className="w-3 h-3 text-blue-400" />
                          <span className="text-[10px] font-bold text-blue-300">{project.tasksToday} today</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 hidden md:flex"
                    onClick={(e) => handleQuickShip(e, project)}
                  >
                    Ship
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button 
          variant="ghost" 
          className="w-full text-slate-500 hover:text-purple-400 border border-dashed border-white/5 mt-2" 
          onClick={() => navigate('/projects')}
        >
          View All Projects
        </Button>
      </CardBody>
    </Card>
  );
};

export default ProjectsOverview;
