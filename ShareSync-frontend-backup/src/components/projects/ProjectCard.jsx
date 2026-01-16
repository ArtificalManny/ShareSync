// src/components/projects/ProjectCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Each card has: 1) Title + client  2) Progress bar  3) Status badge
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import Card, { CardBadge } from '../common/Card';
import { Calendar } from 'lucide-react';

const ProjectCard = ({ project }) => {
  const { name, client, progress = 0, dueDate, status } = project;
  const isComplete = progress === 100;
  
  return (
    <Card 
      variant={isComplete ? 'ambient' : 'elevated'}
      status={isComplete ? 'success' : null}
      interactive 
      animated
      padding="md"
      className="h-full group"
    >
      {/* Header: Title + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {/* Element 1: Title */}
          <h3 className="text-base font-semibold text-text-primary group-hover:text-brand transition-colors truncate">
            {name}
          </h3>
          {/* Sub-element: Client (part of title block) */}
          {client && (
            <p className="text-xs text-text-tertiary mt-0.5 truncate">{client}</p>
          )}
        </div>
        
        {/* Element 3: Status Badge */}
        <CardBadge variant={isComplete ? 'success' : 'default'}>
          {status || (isComplete ? 'Completed' : 'Active')}
        </CardBadge>
      </div>

      {/* Element 2: Progress Bar (the ONE visual metric) */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-text-tertiary">Progress</span>
          <span className="text-xs font-medium text-text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? 'bg-success' : 'bg-brand'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer: Due Date (minimal) */}
      {dueDate && (
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Calendar className="w-3 h-3" />
          <span className="text-xs">{dueDate}</span>
        </div>
      )}
    </Card>
  );
};

export default ProjectCard;
