// src/components/home/YourWorld.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Each task card has: 1) Title  2) Project name  3) Status/time
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import Card, { CardBadge } from '../common/Card';
import { CheckCircle2, Clock } from 'lucide-react';

const YourWorld = ({ tasks = [
  { id: 1, title: 'Refactor Dashboard CSS', projectName: 'ShareSync v2', completed: false, dueDate: 'Today' },
  { id: 2, title: 'API Integration', projectName: 'AI Engine', completed: true, dueDate: 'Done' },
  { id: 3, title: 'User Testing', projectName: 'Mobile App', completed: false, dueDate: 'Tomorrow' }
] }) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Your World</h2>
          <p className="text-xs text-text-tertiary mt-0.5">Active tasks across projects</p>
        </div>
        <button className="text-xs text-text-tertiary hover:text-brand transition-colors">
          View All
        </button>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tasks.map((task) => (
          <Card 
            key={task.id} 
            variant={task.completed ? 'ambient' : 'elevated'}
            status={task.completed ? 'success' : null}
            interactive 
            animated
            padding="md"
            className="group"
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className={`mt-0.5 ${task.completed ? 'text-success' : 'text-text-tertiary'}`}>
                {task.completed ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Element 1: Title */}
                <h4 className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors line-clamp-2">
                  {task.title}
                </h4>
                
                {/* Element 2: Project Name */}
                <p className="text-xs text-text-tertiary mt-1">
                  {task.projectName}
                </p>
                
                {/* Element 3: Status Badge */}
                <div className="mt-3">
                  <CardBadge variant={task.completed ? 'success' : 'default'}>
                    {task.completed ? 'Done' : task.dueDate}
                  </CardBadge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default YourWorld;
