// src/components/ecosystem/ProjectsOverview.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Each project row has: 1) Title  2) Next task OR progress  3) Status badge
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ChevronRight, Plus, Target, AlertCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';
import Card, { CardBadge } from '../common/Card';
import Button from '../common/Button';

const ProjectsOverview = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [projects] = useState([
    {
      _id: '1',
      name: 'ShareSync v2',
      emoji: '🚀',
      progress: 68,
      streak: 7,
      nextTask: 'Fix login page CSS',
      isAtRisk: false
    },
    {
      _id: '2',
      name: 'AI Writing Tool',
      emoji: '✨',
      progress: 85,
      streak: 120,
      nextTask: 'Write API docs',
      isAtRisk: false
    },
    {
      _id: '3',
      name: 'Math Homework',
      emoji: '📐',
      progress: 45,
      streak: 3,
      nextTask: null,
      isAtRisk: true
    }
  ]);

  return (
    <Card variant="ambient" padding="none" className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Active Projects</h3>
            {!isMobile && (
              <p className="text-xs text-text-tertiary">Your current focus</p>
            )}
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
      </div>

      {/* Project List */}
      <div className="p-3 space-y-2">
        {projects.map(project => {
          const isImpressiveStreak = project.streak >= 7;
          
          return (
            <Card
              key={project._id}
              variant={project.isAtRisk ? 'highlight' : 'ambient'}
              status={project.isAtRisk ? 'warning' : null}
              interactive
              animated
              padding="sm"
              onClick={() => navigate(`/projects/${project._id}`)}
              className="group"
            >
              <div className="flex items-center gap-3">
                {/* Element 1: Icon + Title */}
                <span className="text-xl">{project.emoji}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors truncate">
                      {project.name}
                    </h4>
                    
                    {/* Element 3: Status Badge (streak OR at-risk) */}
                    {project.isAtRisk ? (
                      <CardBadge variant="warning">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Needs step
                      </CardBadge>
                    ) : isImpressiveStreak ? (
                      <CardBadge variant="brand">
                        <Flame className="w-3 h-3 mr-1" />
                        {project.streak}d
                      </CardBadge>
                    ) : null}
                  </div>
                  
                  {/* Element 2: Next Task (the ONE metric that matters) */}
                  {project.nextTask && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <ChevronRight className="w-3 h-3 text-text-tertiary" />
                      <span className="text-xs text-text-secondary truncate">
                        {project.nextTask}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 pt-0">
        <button 
          onClick={() => navigate('/projects')}
          className="
            w-full py-2.5 rounded-lg text-sm
            text-text-tertiary hover:text-text-primary
            border border-dashed border-white/[0.06]
            hover:border-white/[0.1] hover:bg-surface-2
            transition-all
          "
        >
          View All Projects
        </button>
      </div>
    </Card>
  );
};

export default ProjectsOverview;
